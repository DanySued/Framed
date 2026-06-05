import { createServerClient, SINGLE_USER_ID, serverError } from '@/lib/server-client'

export async function GET() {
  const db = createServerClient()

  const { data, error } = await db
    .from('preferences')
    .select('*')
    .eq('user_id', SINGLE_USER_ID)
    .maybeSingle()

  if (error) return serverError(error.message)
  return Response.json(data ?? null)
}

export async function PUT(request: Request) {
  const db = createServerClient()

  const body = await request.json().catch(() => ({}))
  const allowed = ['tags', 'tempo', 'mood', 'clip_duration', 'total_duration']
  const patch: Record<string, unknown> = { user_id: SINGLE_USER_ID }
  for (const key of allowed) {
    if (key in body) patch[key] = body[key]
  }

  const { data, error } = await db
    .from('preferences')
    .upsert(patch, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) return serverError(error.message)
  return Response.json(data)
}
