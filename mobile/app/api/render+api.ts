import { createRequestClient, createAdminClient, unauthorized, serverError, badRequest } from '@/lib/server-client'

// POST /api/render — enqueue a render job for a project
// Body: { project_id: string }
// The API reads the project's current clips, builds the timeline, and enqueues
// the job via pg-boss. The worker is notified via the pg-boss Postgres queue.

export async function POST(request: Request) {
  const db = createRequestClient(request)
  const { data: { user } } = await db.auth.getUser()
  if (!user) return unauthorized()

  const body = await request.json().catch(() => ({}))
  if (!body.project_id) return badRequest('project_id required')

  // Fetch project + clips
  const { data: project, error: projErr } = await db
    .from('projects')
    .select('id, status')
    .eq('id', body.project_id)
    .single()

  if (projErr || !project) return Response.json({ error: 'Project not found' }, { status: 404 })
  if (project.status === 'rendering') {
    return Response.json({ error: 'A render is already in progress' }, { status: 409 })
  }

  const { data: clips, error: clipsErr } = await db
    .from('clips')
    .select('*')
    .eq('project_id', body.project_id)
    .order('order_index', { ascending: true })

  if (clipsErr) return serverError(clipsErr.message)
  if (!clips?.length) return badRequest('No clips to render')

  // Build timeline segments — for Pexels clips, resolve download URL from Pexels
  const timeline = await Promise.all(
    clips.map(async (clip) => {
      let pexelsDownloadUrl: string | null = null
      if (clip.source === 'pexels' && clip.pexels_id) {
        // Fetch best MP4 from Pexels (server-side, key is safe here)
        try {
          const res = await fetch(
            `https://api.pexels.com/videos/videos/${clip.pexels_id}`,
            { headers: { Authorization: process.env.PEXELS_API_KEY! } }
          )
          if (res.ok) {
            const data = await res.json() as any
            const files: any[] = data.video_files ?? []
            const best = files
              .filter((f) => f.file_type === 'video/mp4' && f.width <= 1080)
              .sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]
            pexelsDownloadUrl = best?.link ?? null
          }
        } catch { /* fall through — worker will retry */ }
      }
      return {
        clip_id:              clip.id,
        storage_path:         clip.storage_path ?? null,
        pexels_download_url:  pexelsDownloadUrl,
        trim_start:           clip.trim_start,
        trim_end:             clip.trim_end,
        order_index:          clip.order_index,
        width:                clip.width,
        height:               clip.height,
      }
    })
  )

  // Create render_jobs row
  const admin = createAdminClient()
  const { data: jobRow, error: jobErr } = await admin
    .from('render_jobs')
    .insert({ project_id: body.project_id, status: 'pending', progress: 0 })
    .select()
    .single()

  if (jobErr) return serverError(jobErr.message)

  // Enqueue via pg-boss using Supabase's pg-boss schema (queued via INSERT into pgboss.job)
  // We insert directly into the pgboss.job table so no extra worker connection is needed here
  const { error: qErr } = await admin.rpc('pgboss_send', {
    queue_name: 'render',
    payload: JSON.stringify({
      job_id:     jobRow.id,
      project_id: body.project_id,
      timeline,
    }),
  })

  // If pg-boss RPC not available, fall back to a simple status flag the worker polls
  if (qErr) {
    console.warn('[render API] pgboss_send RPC not available, worker will poll directly')
  }

  // Mark project as rendering
  await admin.from('projects').update({ status: 'rendering' }).eq('id', body.project_id)

  return Response.json({ job_id: jobRow.id }, { status: 202 })
}
