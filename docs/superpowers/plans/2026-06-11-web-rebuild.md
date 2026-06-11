# Framed Web Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the entire `web/` UI with a cinematic-dark, studio-canvas reel creator (3 screens: Login, Studio, Films) and add honest stage-level progress to the FastAPI job status.

**Architecture:** Next.js 16 App Router. All old pages/components deleted. New design system (`--fr-*` tokens, Fraunces + Inter). One persistent Studio screen with live 9:16 preview; generation/approval happens inline. Existing Next→FastAPI proxy routes under `web/app/api/` are KEPT (auth, reels, dashboard proxies) — only the UI layer is rebuilt. Backend (`api/`) gets a `stage` string in the job payload.

**Tech Stack:** Next.js 16, React 19, Tailwind 4, motion (framer), lucide-react, sonner. FastAPI + Peewee + APScheduler (unchanged infra).

**Verification:** No local-dev preference, but `start-framed.bat` runs `web/` locally against the prod API for UI checks. `cd web && npm run build` must pass before any push. Push to GitHub → Vercel deploys.

**Spec:** `docs/superpowers/specs/2026-06-11-web-rebuild-design.md`

---

### Task 1: Backend — stage labels in job status

**Files:**
- Modify: `api/services/job_queue.py`
- Modify: `api/models/schemas.py` (add `stage` to `ReelJobResponse` if it's a strict model)

- [ ] **Step 1: Add stage tracking.** In `job_queue.py`, add a module-level helper and call it at every progress checkpoint:

```python
def _set_stage(job, job_id: str, progress: int, stage: str, status: str = "processing") -> None:
    job.progress = progress
    job.save()
    mem = JOBS.get(job_id) or {}
    mem.update({"status": status, "progress": progress, "stage": stage, "error": None})
    JOBS[job_id] = mem
```

Replace the existing inline `job.progress = X; job.save(); JOBS[...] = ...` blocks with `_set_stage` calls using these labels:
- phase 1: `"searching scenes"` (10), `"downloading clips"` (20), `"cutting clips"` (40), `"awaiting your approval"` (50, status `awaiting_clip_approval`)
- phase 2: `"assembling sequence"` (60), `"framing 9:16"` (75), `"mixing audio"` (90), `"burning titles"` (95), `"transcribing subtitles"` (96), `"burning subtitles"` (98), `"done"` (100, status `done`)

- [ ] **Step 2: Expose stage in `get_job_status`.** Add `"stage": JOBS.get(job_id, {}).get("stage")` to both return dicts (DB path and memory-fallback path). If `ReelJobResponse` in `api/models/schemas.py` is strict, add `stage: str | None = None`.

- [ ] **Step 3: Verify.** `cd api && python -c "import services.job_queue"` (imports clean). Run any existing tests if present.

- [ ] **Step 4: Commit** `feat(api): stage labels in reel job status`

---

### Task 2: Design system + shell + login

**Files:**
- Delete: `web/app/(dashboard)/` (whole dir), `web/app/lab/`, `web/components/dashboard/`, `web/components/reels/`, `web/components/layout/`
- Keep: `web/app/api/**` (all proxy routes), `web/components/ui/` (shadcn primitives), `web/lib/utils.ts`, `web/lib/download.ts`
- Rewrite: `web/app/globals.css`, `web/app/layout.tsx`
- Create: `web/app/page.tsx` (login), `web/app/(studio)/layout.tsx`, `web/lib/fonts.ts`, `web/components/fx/Grain.tsx`

- [ ] **Step 1: Check auth flow before deleting.** Read `web/app/api/auth/*` (or wherever login POST lives — grep for `APP_PASSWORD`/`__session`) and `web/middleware.ts` if present. Preserve whatever middleware/route guards `/studio`. If middleware doesn't exist, the login page posts to the existing auth route and redirects.
- [ ] **Step 2: Delete old UI dirs** listed above. `git rm -r` them.
- [ ] **Step 3: New tokens in `globals.css`** (Tailwind 4 `@theme`): warm near-black `--fr-black: #0d0b08`, surface `#15120d`, ivory `#f2ede3`, muted `#8a8276`, gold `#c9a45c`, gold-bright `#e6c47f`, hairline `#2a251c`. Radius 10px. Selection gold-on-black. Keep `tw-animate-css` import.
- [ ] **Step 4: Fonts** — `web/lib/fonts.ts` with `next/font/google`: Fraunces (display, weights 400/600, `--font-display`) + Inter (`--font-sans`). Wire into `layout.tsx` html className.
- [ ] **Step 5: `Grain.tsx`** — fixed full-viewport SVG `feTurbulence` noise overlay at ~3% opacity, `pointer-events-none`, rendered once in root layout.
- [ ] **Step 6: Login page `web/app/page.tsx`** — centered "FRAMED" Fraunces wordmark with letterboxed framing rules above/below, single password input (borderless, bottom hairline that turns gold on focus), submit on Enter, error shakes subtly (motion, 4px, 2 cycles). If already authed (session cookie valid), redirect to `/studio`.
- [ ] **Step 7: Build passes.** `cd web && npm run build`. Fix any imports referencing deleted files (e.g. `web/lib/ReelGenerationContext.tsx`, `web/lib/dashboard-data.ts` — delete them too if only used by old UI).
- [ ] **Step 8: Commit** `feat(web): cinematic design system, shell, login`

---

### Task 3: Studio canvas (layout + left/right panels, no generation yet)

**Files:**
- Create: `web/app/(studio)/studio/page.tsx`
- Create: `web/components/studio/StudioContext.tsx` — all studio form state (audio id/name/startTime, keywords[], duration, subtitles, bulkCount, overlays[]), plus `phase: "compose" | "generating" | "approval" | "rendering" | "done"`
- Create: `web/components/studio/PreviewFrame.tsx` — center 9:16 frame
- Create: `web/components/studio/AudioPanel.tsx`
- Create: `web/components/studio/ScenesPanel.tsx`
- Create: `web/components/studio/TextPanel.tsx`
- Create: `web/components/studio/ControlBar.tsx`
- Create: `web/components/studio/Waveform.tsx`

**Behavior contracts:**
- [ ] **Step 1: Layout.** Three-column CSS grid (`minmax(260px,320px) 1fr minmax(260px,320px)`), preview column centers a 9:16 box (max-height ~70vh). Top bar: small FRAMED wordmark left, "Films" link right. Bottom: ControlBar. Collapses to stacked single column under `lg`.
- [ ] **Step 2: AudioPanel.** Lists tracks from `GET /api/reels/audio`; upload via `POST /api/reels/upload-audio` (multipart, field `file`); selecting a track loads `<audio src="/api/reels/audio/{id}">`, renders Waveform (decode via WebAudio `decodeAudioData`, draw bars on canvas), drag on waveform sets `songStartTime`, plays 15s preview from that point. Delete via `DELETE /api/reels/audio/{id}`.
- [ ] **Step 3: ScenesPanel.** Keyword input → Enter adds a Scene chip. Each chip immediately fetches `GET /api/reels/pexels?keywords={kw}&per_page=1` and shows the first thumbnail as a 16:9 mini-card (kw label overlaid, remove ×). Chips animate in with motion layout. The PreviewFrame, when idle, cycles through scene thumbnails with a slow Ken Burns crossfade — this is the "live preview" before generation.
- [ ] **Step 4: TextPanel + draggable overlay.** Text input + size + position; the overlay text renders ON the PreviewFrame and is draggable (pointer events, position stored as x/y percentages matching the existing `overlays` schema in `ReelGenerateRequest` — read `api/models/schemas.py` to match field names exactly).
- [ ] **Step 5: ControlBar.** Duration slider 15–60s (gold filled track), subtitles toggle, bulk count stepper (1–5), Generate button (disabled until audio + ≥1 keyword; magnetic hover: translates ≤4px toward cursor).
- [ ] **Step 6: Build + visual check.** `npm run build` passes; `start-framed.bat` for a quick look if needed.
- [ ] **Step 7: Commit** `feat(web): studio canvas — audio, scenes, text, controls`

---

### Task 4: Generation flow + clip approval + Films library

**Files:**
- Create: `web/components/studio/GenerationOverlay.tsx` — in-preview progress UI
- Create: `web/components/studio/ClipRail.tsx` — approval rail
- Create: `web/app/(studio)/films/page.tsx`
- Modify: `web/components/studio/StudioContext.tsx` — add job polling

**Existing proxy endpoints to use (all under `web/app/api/reels/*` → FastAPI):**
- `POST /api/reels/generate` → `{ job_id }` (body = `ReelGenerateRequest`: title, keywords[], duration, audio_file_id, song_start_time, overlays[], subtitles_enabled — verify exact fields in `api/models/schemas.py`)
- `GET /api/reels/job/{job_id}` → status/progress/phase/phase_progress/**stage** (from Task 1)
- `GET /api/reels/clips/{job_id}` (list) and `/api/reels/clips/{job_id}/{index}` (stream)
- `POST /api/reels/clips/{job_id}/approve`, `POST /api/reels/clips/{job_id}/replace/{index}`
- `GET /api/reels/list`, `GET /api/reels/download/{reel_id}`

- [ ] **Step 1: Generate + poll.** Generate → phase `"generating"`: PreviewFrame dims, GenerationOverlay shows the stage label (serif, lowercase, e.g. "downloading clips") + a thin gold progress line + film-counter style numerals. Poll job every 1.5s.
- [ ] **Step 2: Approval.** On `awaiting_clip_approval`: ClipRail slides in beside the preview with each clip as a hover-to-play video card; clicking a clip plays it in the main PreviewFrame; per-clip "swap" button calls replace (card shows shimmer while swapping); "Approve all" resumes phase 2.
- [ ] **Step 3: Done state.** On `done`: final video plays in PreviewFrame with a one-time soft gold flash (no confetti), Download + "New film" buttons.
- [ ] **Step 4: Films page.** `GET /api/reels/list` → poster-wall grid (2/3/4 cols responsive), each card a 9:16 video poster, hover plays muted preview (stream from download URL), click → focused view with Download (+ SRT if present) and Delete if endpoint exists (check router — if no delete endpoint, omit).
- [ ] **Step 5: Bulk handling.** If bulkCount > 1, fire N generate calls and show a compact multi-job tracker in the overlay (stacked thin progress lines). Verify against how the old UI handled bulk (grep old git history only if needed; otherwise N independent jobs is correct).
- [ ] **Step 6: Build + e2e smoke vs prod API** via `start-framed.bat`: login → add audio → add scene → generate → approve → download.
- [ ] **Step 7: Commit** `feat(web): generation flow, clip approval rail, films library`

---

### Task 5: Polish pass + deploy verification

- [ ] **Step 1: Micro-interaction audit.** All transitions 150–250ms ease-out; AnimatePresence on phase changes; focus-visible rings in gold; reduced-motion media query respected.
- [ ] **Step 2: Responsiveness audit.** 360px, 768px, 1280px, 1920px. Studio stacks gracefully on mobile (preview first, panels below as accordions).
- [ ] **Step 3: Not-AI-made audit.** No default shadcn look anywhere visible: no generic gray cards, no `rounded-xl shadow-md` clichés, no emoji, no purple gradients. Typography does the talking.
- [ ] **Step 4: `npm run lint` + `npm run build` clean. Push.** Verify on Vercel deployment URL + Render API health.
- [ ] **Step 5: Commit/push** `feat(web): polish pass — motion, responsive, a11y`
