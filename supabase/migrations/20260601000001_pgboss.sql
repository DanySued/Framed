-- pg-boss creates its own schema on first start, but we create the helper RPC
-- so the API route can enqueue jobs without a direct DB connection.

-- This function is called by the Expo API route to enqueue a render job.
-- pg-boss will have created the pgboss.job table on first worker startup.
-- If pg-boss tables don't exist yet, the function returns NULL and the worker
-- polls the render_jobs table directly as fallback.

CREATE OR REPLACE FUNCTION pgboss_send(queue_name text, payload text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  job_id text;
BEGIN
  -- Only works after pg-boss has initialised its schema (first worker boot)
  BEGIN
    INSERT INTO pgboss.job (name, data)
    VALUES (queue_name, payload::jsonb)
    RETURNING id::text INTO job_id;
  EXCEPTION WHEN undefined_schema OR undefined_table THEN
    -- pg-boss not yet initialised; worker will poll render_jobs instead
    RETURN NULL;
  END;
  RETURN job_id;
END;
$$;

-- Allow authenticated users (API routes run as service key, but keep explicit)
REVOKE ALL ON FUNCTION pgboss_send(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION pgboss_send(text, text) TO service_role;
