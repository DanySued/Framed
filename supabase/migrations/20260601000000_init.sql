-- ── Extensions ────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Tables ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS projects (
  id            uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         text        NOT NULL DEFAULT 'Untitled',
  status        text        NOT NULL DEFAULT 'draft'
                            CHECK (status IN ('draft','rendering','done','failed')),
  thumbnail_url text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clips (
  id                uuid         PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id        uuid         NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  source            text         NOT NULL CHECK (source IN ('pexels','upload')),
  pexels_id         bigint,
  storage_path      text,
  preview_url       text         NOT NULL DEFAULT '',
  width             int          NOT NULL DEFAULT 1920,
  height            int          NOT NULL DEFAULT 1080,
  original_duration numeric(7,3) NOT NULL DEFAULT 0,
  trim_start        numeric(7,3) NOT NULL DEFAULT 0,
  trim_end          numeric(7,3) NOT NULL DEFAULT 0,
  order_index       int          NOT NULL DEFAULT 0,
  created_at        timestamptz  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS renders (
  id           uuid         PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id   uuid         NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  storage_path text         NOT NULL DEFAULT '',
  public_url   text         NOT NULL DEFAULT '',
  duration     numeric(7,3) NOT NULL DEFAULT 0,
  created_at   timestamptz  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS preferences (
  id             uuid         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  tags           text[]       NOT NULL DEFAULT '{}',
  tempo          text         NOT NULL DEFAULT 'medium'
                              CHECK (tempo IN ('slow','medium','fast')),
  mood           text[]       NOT NULL DEFAULT '{}',
  clip_duration  numeric(5,1) NOT NULL DEFAULT 5.0,
  total_duration numeric(6,1) NOT NULL DEFAULT 30.0,
  updated_at     timestamptz  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS render_jobs (
  id           uuid         PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id   uuid         NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  status       text         NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','processing','done','failed')),
  progress     int          NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  error        text,
  created_at   timestamptz  NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS projects_user_id_idx    ON projects(user_id);
CREATE INDEX IF NOT EXISTS clips_project_id_idx    ON clips(project_id, order_index);
CREATE INDEX IF NOT EXISTS renders_project_id_idx  ON renders(project_id);
CREATE INDEX IF NOT EXISTS jobs_project_id_idx     ON render_jobs(project_id);
CREATE INDEX IF NOT EXISTS jobs_status_idx         ON render_jobs(status) WHERE status IN ('pending','processing');

-- ── Auto-update updated_at ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

CREATE TRIGGER preferences_updated_at
  BEFORE UPDATE ON preferences
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE projects     ENABLE ROW LEVEL SECURITY;
ALTER TABLE clips        ENABLE ROW LEVEL SECURITY;
ALTER TABLE renders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferences  ENABLE ROW LEVEL SECURITY;
ALTER TABLE render_jobs  ENABLE ROW LEVEL SECURITY;

-- Projects: owner full access
CREATE POLICY "owner_all" ON projects
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Clips: access via project ownership
CREATE POLICY "owner_clips" ON clips
  USING (
    EXISTS (SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid())
  );

-- Renders: read via project ownership
CREATE POLICY "owner_renders" ON renders
  USING (
    EXISTS (SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid())
  );

-- Preferences: owner full access
CREATE POLICY "owner_prefs" ON preferences
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Render jobs: read via project ownership
CREATE POLICY "owner_jobs" ON render_jobs
  USING (
    EXISTS (SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid())
  );

-- ── Supabase Storage buckets ──────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('framed-clips',   'framed-clips',   false),
  ('framed-renders', 'framed-renders', false)
ON CONFLICT (id) DO NOTHING;

-- Clips bucket: owner upload/read/delete
CREATE POLICY "owner_clips_storage" ON storage.objects
  FOR ALL USING (
    bucket_id = 'framed-clips'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'framed-clips'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Renders bucket: owner read
CREATE POLICY "owner_renders_storage" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'framed-renders'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
