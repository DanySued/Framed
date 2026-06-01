import { createRequestClient, unauthorized, serverError } from '@/lib/server-client'

export async function GET(request: Request) {
  const db = createRequestClient(request)
  const { data: { user } } = await db.auth.getUser()
  if (!user) return unauthorized()

  const { data, error } = await db
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return serverError(error.message)
  return Response.json(data)
}

export async function POST(request: Request) {
  const db = createRequestClient(request)
  const { data: { user } } = await db.auth.getUser()
  if (!user) return unauthorized()

  const body = await request.json().catch(() => ({}))
  const title: string = body.title?.trim() || 'Untitled'

  const { data, error } = await db
    .from('projects')
    .insert({ user_id: user.id, title })
    .select()
    .single()

  if (error) return serverError(error.message)
  return Response.json(data, { status: 201 })
}
