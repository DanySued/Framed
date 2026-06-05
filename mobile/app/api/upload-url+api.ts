import { createServerClient, SINGLE_USER_ID, serverError, badRequest } from '@/lib/server-client'

// POST /api/upload-url
// Body: { filename: string, content_type: string, project_id: string }
// Returns: { path: string, signedUrl: string }

export async function POST(request: Request) {
  const db = createServerClient()

  const body = await request.json().catch(() => ({}))
  if (!body.filename || !body.content_type || !body.project_id) {
    return badRequest('filename, content_type, and project_id required')
  }

  const ext = body.filename.split('.').pop() ?? 'mp4'
  const path = `${SINGLE_USER_ID}/${body.project_id}/${Date.now()}.${ext}`

  const { data, error } = await db.storage
    .from('framed-clips')
    .createSignedUploadUrl(path)

  if (error) return serverError(error.message)
  return Response.json({ path, signedUrl: data.signedUrl })
}
