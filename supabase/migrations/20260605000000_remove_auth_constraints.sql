-- ── Remove auth.users FK constraints ─────────────────────────────────────────
-- projects.user_id references auth.users(id) ON DELETE CASCADE
ALTER TABLE projects    DROP CONSTRAINT IF EXISTS projects_user_id_fkey;
-- preferences.user_id references auth.users(id) ON DELETE CASCADE UNIQUE
ALTER TABLE preferences DROP CONSTRAINT IF EXISTS preferences_user_id_fkey;

-- ── Make user_id columns nullable ─────────────────────────────────────────────
ALTER TABLE projects    ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE preferences ALTER COLUMN user_id DROP NOT NULL;

-- ── Drop all RLS policies that reference auth.uid() ───────────────────────────
DROP POLICY IF EXISTS "owner_all"     ON projects;
DROP POLICY IF EXISTS "owner_clips"   ON clips;
DROP POLICY IF EXISTS "owner_renders" ON renders;
DROP POLICY IF EXISTS "owner_prefs"   ON preferences;
DROP POLICY IF EXISTS "owner_jobs"    ON render_jobs;

-- ── Drop storage policies that reference auth.uid() ──────────────────────────
DROP POLICY IF EXISTS "owner_clips_storage"   ON storage.objects;
DROP POLICY IF EXISTS "owner_renders_storage" ON storage.objects;

-- ── Disable RLS on all tables (single-user app, service-role client) ──────────
ALTER TABLE projects    DISABLE ROW LEVEL SECURITY;
ALTER TABLE clips       DISABLE ROW LEVEL SECURITY;
ALTER TABLE renders     DISABLE ROW LEVEL SECURITY;
ALTER TABLE preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE render_jobs DISABLE ROW LEVEL SECURITY;
