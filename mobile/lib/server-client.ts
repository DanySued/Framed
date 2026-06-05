import { createClient } from '@supabase/supabase-js'

// Single-user app — no auth. All API routes use the service-role client which
// bypasses RLS. The fixed SINGLE_USER_ID is used to populate `user_id` columns
// on tables that still require them (preferences, projects).
export const SINGLE_USER_ID =
  process.env.SINGLE_USER_ID ?? '00000000-0000-0000-0000-000000000000'

export function createServerClient() {
  return createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// Back-compat alias
export const createAdminClient = createServerClient

export function badRequest(message: string) {
  return Response.json({ error: message }, { status: 400 })
}

export function serverError(message: string) {
  return Response.json({ error: message }, { status: 500 })
}
