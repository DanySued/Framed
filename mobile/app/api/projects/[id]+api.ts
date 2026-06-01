import { createRequestClient, unauthorized, serverError, badRequest } from '@/lib/server-client'

function projectId(request: Request): string {
  return new URL(request.url).pathname.split('/').pop() ?? ''
}

export async function GET(request: Request) {
  const db = createRequestClient(request)
  const { data: { user } } = await db.auth.getUser()
  if (!user) return unauthorized()

  const { data, error } = await db
    .from('projects')
    .select('*, clips(*), renders(*)')
    .eq('id', projectId(request))
    .single()

  if (error) return serverError(error.message)
  if (!data) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(data)
}

export async function PATCH(request: Request) {
  const db = createRequestClient(request)
  const { data: { user } } = await db.auth.getUser()
  if (!user) return unauthorized()

  const body = await request.json().catch(() => ({}))
  const allowed = ['title', 'status', 'thumbnail_url']
  const patch: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) patch[key] = body[key]
  }
  if (!Object.keys(patch).length) return badRequest('No valid fields to update')

  const { data, error } = await db
    .from('projects')
    .update(patch)
    .eq('id', projectId(request))
    .select()
    .single()

  if (error) return serverError(error.message)
  return Response.json(data)
}

export async function DELETE(request: Request) {
  const db = createRequestClient(request)
  const { data: { user } } = await db.auth.getUser()
  if (!user) return unauthorized()

  const { error } = await db
    .from('projects')
    .delete()
    .eq('id', projectId(request))

  if (error) return serverError(error.message)
  return new Response(null, { status: 204 })
}
