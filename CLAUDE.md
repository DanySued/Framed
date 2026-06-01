# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo layout

```
framed/
  api/       FastAPI backend (Python 3.12, Peewee ORM)
  web/       Next.js 16 frontend (React 19, Tailwind 4, shadcn)
  mobile/    Expo 52 / React Native 0.76 app (Supabase Auth)
  worker/    Node.js 22 FFmpeg render worker (pg-boss queue)
  supabase/  Migrations and local config
  render.yaml  Deploys framed-api + framed-worker to Render
```

## Commands

### API
```bash
cd api
uvicorn main:app --reload   # dev (SQLite)
# Production uses DATABASE_URL (Postgres) set by Render
```

### Web
```bash
cd web
npm run dev      # Next.js dev server (port 3000)
npm run build
npm run lint
```

### Mobile
```bash
cd mobile
npm start        # Expo Metro (pick Android/iOS/web interactively)
npm run android
npm run ios
```

### Worker
```bash
cd worker
npm run dev      # tsx watch
npm run build    # tsc → dist/
npm start        # node dist/index.js
```

### Database
```bash
supabase start              # local stack (ports 54321-54327)
supabase migration new <name>
supabase db push            # apply migrations to remote
```

## Architecture

### Two separate auth systems
- **Web** (`api/` + `web/`): Single-password auth (`APP_PASSWORD`). Web route `/api/auth/login` validates password, signs an HMAC token into a `__session` cookie (`AUTH_SECRET`). All `/api/reels/*` routes on the web proxy to the FastAPI backend using server-side `API_URL`.
- **Mobile** (`mobile/`): Supabase Auth (magic link / OAuth). API routes in `mobile/app/api/` use `createRequestClient()` to extract the Bearer token, then Supabase RLS enforces row-level ownership. No shared auth between the two stacks.

### Job queue — two implementations
- **FastAPI/APScheduler** (legacy, `api/`): Two-phase reel generation. Phase 1 (0→50%) downloads Pexels clips; pauses for clip approval. Phase 2 (50→100%) concatenates, scales to 1080×1920, mixes audio, burns captions via openai-whisper SRT.
- **pg-boss** (current, `worker/`): Mobile renders. Supabase RPC `pgboss_send('render', payload)` enqueues jobs. Worker (`worker/src/index.ts`) picks them up, calls `renderTimeline()` (fluent-ffmpeg), uploads the MP4 to Supabase Storage (`framed-renders` bucket), writes a 7-day signed URL back to the `render_jobs` table.

### Database
- **Supabase Postgres** is the production database for mobile + worker.
- **FastAPI** uses Peewee ORM; dev runs SQLite (`DATA_DIR`), prod switches to `PooledPostgresqlDatabase` via `DATABASE_URL`.
- Migrations live in `supabase/migrations/`. Schema: `projects`, `clips`, `renders`, `preferences`, `render_jobs`. RLS policies are on every table.
- Worker needs `DATABASE_URL` pointing at Supabase **Transaction mode** (port 6543), not the Session mode port, because pg-boss uses prepared statements.

### Storage
- `framed-clips` bucket: private, for user video uploads.
- `framed-renders` bucket: private, output MP4s served via signed URLs (7-day expiry).

### API proxying (web)
All `/api/*` routes in `web/app/api/` are Next.js Route Handlers that forward to FastAPI. `API_URL` is server-only — never exposed to the browser.

## Deployment
| Component | Platform | Trigger |
|-----------|----------|---------|
| `api/` + `worker/` | Render (via `render.yaml`) | push to GitHub |
| `web/` | Vercel | push to GitHub |
| `mobile/` | EAS builds + EAS Hosting | push to `master` (mobile/** paths, `.eas/workflows/`) |

## Key env vars

**api/** (Render):
- `DATABASE_URL` — injected by Render from `framed-db`
- `PEXELS_API_KEY`, `APP_PASSWORD`, `AUTH_SECRET`, `ALLOWED_ORIGINS`

**web/** (Vercel):
- `API_URL` — URL of framed-api on Render (server-side only)
- `APP_PASSWORD`, `AUTH_SECRET` — must match api values

**mobile/** (EAS):
- `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY` — used only in API routes (not exposed to client)
- `PEXELS_API_KEY`, `EXPO_PUBLIC_SENTRY_DSN`

**worker/** (Render):
- `DATABASE_URL` — Supabase Transaction mode (port 6543)
- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `PEXELS_API_KEY`

## Design tokens
Web uses CSS variables with `--fr-*` prefix (e.g. `--fr-gold`, `--fr-black`). Never hardcode colors.
