# Framed — Web Rebuild Design (2026-06-11)

Fresh rebuild of `web/`. Approved by Dany 2026-06-11.

## Goals
- Beautiful, cinematic, handcrafted-feeling UI (explicitly not "AI-made" looking).
- High interactivity and responsiveness; measured micro-interactions.
- Fast perceived backend: honest stage-level progress, parallel downloads.

## Erase / Keep
- **Erase:** all of `web/app` (pages/components) and `web/components` — old wizard, dashboard, lab.
- **Keep:** `APP_PASSWORD` + HMAC `__session` cookie auth, Next.js→FastAPI proxy pattern (`API_URL` server-only), `api/` backend (improved surgically), Vercel + Render deploys. `mobile/` and `worker/` untouched.

## Design system — "Cinematic dark"
- Warm near-black canvas (~#0c0b09), ivory text, warm gold accent. Rebuilt `--fr-*` tokens in `globals.css`.
- Type: serif display (Fraunces or Instrument Serif) for headings; clean grotesk (e.g. Inter/Geist) for UI.
- Filmic texture: subtle grain overlay, soft vignettes on media, letterbox framing details.
- Micro-interactions: 150–250ms ease-out; hover lifts on clips; magnetic Generate button; waveform scrub; render progress as a "developing film" metaphor with stage labels. No confetti, no gradient blobs.

## App structure — 3 screens
1. `/` **Login** — single password field, cinematic title treatment.
2. `/studio` **The Studio** — live 9:16 preview center stage.
   - Left panel: Audio — upload/pick, waveform, 15s start-time scrub.
   - Right panel: Scenes — keywords as visual chips, each fetches a Pexels thumbnail instantly; Text overlay editable by dragging directly on the preview.
   - Bottom bar: duration slider, subtitles toggle, bulk count, Generate.
   - Clip approval happens inline: at 50% clips slide into a rail beside the preview; approve/swap without leaving the screen.
3. `/films` **Library** — poster-wall grid of past renders, hover-to-preview, download/delete.

## Backend improvements (api/)
- Parallelize Pexels clip downloads in phase 1 (currently sequential).
- Job status payload gains stage detail: `downloading 3/6`, `mixing audio`, `burning captions`.
- New endpoint `GET /reels/preview-thumb?keyword=` → Pexels thumbnail URL for Scene chips.

## Execution
Orchestrated build: Opus architect dispatches Sonnet subagents per phase —
① tokens + shell + login, ② studio canvas, ③ generation flow + library, ④ backend improvements.
Haiku agent records a build log to project memory after each phase.
Verification after each phase via deployed Vercel URL (no local dev preference; `start-framed.bat` available for local UI checks).
