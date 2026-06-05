import { createServerClient, serverError, badRequest } from '@/lib/server-client'

// GET  /api/clips?project_id=<id>   — list clips for a project (ordered)
// POST /api/clips                   — add a clip to a project
// DELETE /api/clips/:id is handled in clips/[id]+api.ts

export async function GET(request: Request) {
  const db = createServerClient()

  const projectId = new URL(request.url).searchParams.get('project_id')
  if (!projectId) return badRequest('project_id required')

  const { data, error } = await db
    .from('clips')
    .select('*')
    .eq('project_id', projectId)
    .order('order_index', { ascending: true })

  if (error) return serverError(error.message)
  return Response.json(data)
}

export async function POST(request: Request) {
  const db = createServerClient()

  const body = await request.json().catch(() => ({}))
  const required = ['project_id', 'source', 'preview_url', 'original_duration'] as const
  for (const key of required) {
    if (!body[key] && body[key] !== 0) return badRequest(`${key} required`)
  }

  // Resolve next order_index
  const { count } = await db
    .from('clips')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', body.project_id)

  const { data, error } = await db
    .from('clips')
    .insert({
      project_id:        body.project_id,
      source:            body.source,
      pexels_id:         body.pexels_id ?? null,
      storage_path:      body.storage_path ?? null,
      preview_url:       body.preview_url,
      width:             body.width ?? 1920,
      height:            body.height ?? 1080,
      original_duration: body.original_duration,
      trim_start:        0,
      trim_end:          body.original_duration,
      order_index:       count ?? 0,
    })
    .select()
    .single()

  if (error) return serverError(error.message)
  return Response.json(data, { status: 201 })
}
