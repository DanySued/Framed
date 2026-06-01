import { createRequestClient, unauthorized, serverError } from '@/lib/server-client'

// GET /api/jobs/:id — poll render job status
export async function GET(request: Request) {
  const db = createRequestClient(request)
  const { data: { user } } = await db.auth.getUser()
  if (!user) return unauthorized()

  const jobId = new URL(request.url).pathname.split('/').pop() ?? ''

  const { data, error } = await db
    .from('render_jobs')
    .select('*')
    .eq('id', jobId)
    .single()

  if (error) return serverError(error.message)
  if (!data) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(data)
}
