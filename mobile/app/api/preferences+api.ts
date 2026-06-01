import { createRequestClient, unauthorized, serverError } from '@/lib/server-client'

export async function GET(request: Request) {
  const db = createRequestClient(request)
  const { data: { user } } = await db.auth.getUser()
  if (!user) return unauthorized()

  const { data, error } = await db
    .from('preferences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) return serverError(error.message)
  return Response.json(data ?? null)
}

export async function PUT(request: Request) {
  const db = createRequestClient(request)
  const { data: { user } } = await db.auth.getUser()
  if (!user) return unauthorized()

  const body = await request.json().catch(() => ({}))
  const allowed = ['tags', 'tempo', 'mood', 'clip_duration', 'total_duration']
  const patch: Record<string, unknown> = { user_id: user.id }
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
