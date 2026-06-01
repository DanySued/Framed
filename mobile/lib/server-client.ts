import { createClient } from '@supabase/supabase-js'

// Creates a per-request Supabase client that passes the user's JWT in the
// Authorization header. RLS policies keyed on auth.uid() apply automatically.
export function createRequestClient(request: Request) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
  return createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL!,
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    }
  )
}

// Admin client — bypasses RLS. Only used by the render worker (Phase 4).
export function createAdminClient() {
  return createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export function unauthorized() {
  return Response.json({ error: 'Unauthorized' }, { status: 401 })
}

export function badRequest(message: string) {
  return Response.json({ error: message }, { status: 400 })
}

export function serverError(message: string) {
  return Response.json({ error: message }, { status: 500 })
}
