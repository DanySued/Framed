import { createRequestClient, unauthorized, serverError, badRequest } from '@/lib/server-client'

function clipId(request: Request) {
  return new URL(request.url).pathname.split('/').pop() ?? ''
}

export async function PATCH(request: Request) {
  const db = createRequestClient(request)
  const { data: { user } } = await db.auth.getUser()
  if (!user) return unauthorized()

  const body = await request.json().catch(() => ({}))
  const allowed = ['trim_start', 'trim_end', 'order_index', 'preview_url']
  const patch: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) patch[key] = body[key]
  }
  if (!Object.keys(patch).length) return badRequest('No valid fields')

  const { data, error } = await db
    .from('clips')
    .update(patch)
    .eq('id', clipId(request))
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
    .from('clips')
    .delete()
    .eq('id', clipId(request))

  if (error) return serverError(error.message)
  return new Response(null, { status: 204 })
}
