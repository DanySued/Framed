import * as Sentry from '@sentry/node'
import PgBoss from 'pg-boss'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { supabase } from './supabase.js'
import { renderTimeline } from './ffmpeg.js'
import type { RenderJobPayload } from './types.js'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: !!process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
})

const QUEUE_NAME = 'render'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set')
}

const boss = new PgBoss(process.env.DATABASE_URL)

boss.on('error', (err) => console.error('[pg-boss] error', err))

async function updateJob(
  jobId: string,
  status: 'processing' | 'done' | 'failed',
  progress: number,
  error?: string
) {
  const patch: Record<string, unknown> = { status, progress }
  if (error) patch.error = error
  if (status === 'done' || status === 'failed') patch.completed_at = new Date().toISOString()
  const { error } = await supabase.from('render_jobs').update(patch).eq('id', jobId)
  if (error) console.error(`[worker] updateJob ${jobId} failed:`, error.message)
}

async function handleRender(job: PgBoss.Job<RenderJobPayload>) {
  const { job_id, project_id, timeline } = job.data
  console.log(`[worker] starting job ${job_id}`)

  await updateJob(job_id, 'processing', 0)

  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'framed-'))
  const outputPath = path.join(workDir, 'output.mp4')

  try {
    await renderTimeline(timeline, workDir, outputPath, async (pct) => {
      await updateJob(job_id, 'processing', pct)
    })

    // Upload result to Supabase Storage
    const renderPath = `${project_id}/${job_id}.mp4`
    const fileBuffer = fs.readFileSync(outputPath)

    const { error: uploadErr } = await supabase.storage
      .from('framed-renders')
      .upload(renderPath, fileBuffer, { contentType: 'video/mp4', upsert: true })

    if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`)

    // Create a signed URL (7 days)
    const { data: urlData, error: urlErr } = await supabase.storage
      .from('framed-renders')
      .createSignedUrl(renderPath, 60 * 60 * 24 * 7)

    if (urlErr) throw new Error(`Signed URL failed: ${urlErr.message}`)

    // Save render row
    const { error: insertErr } = await supabase.from('renders').insert({
      project_id,
      storage_path: renderPath,
      public_url:   urlData.signedUrl,
      duration:     timeline.reduce((s, seg) => s + (seg.trim_end - seg.trim_start), 0),
    })
    if (insertErr) throw new Error(`renders.insert failed: ${insertErr.message}`)

    // Update project status to done
    await supabase.from('projects').update({ status: 'done' }).eq('id', project_id)
    await updateJob(job_id, 'done', 100)

    console.log(`[worker] job ${job_id} complete`)
  } catch (err: any) {
    const msg = err?.message ?? 'Unknown error'
    console.error(`[worker] job ${job_id} failed: ${msg}`)
    await supabase.from('projects').update({ status: 'failed' }).eq('id', project_id)
    await updateJob(job_id, 'failed', 0, msg)
    throw err // tell pg-boss to mark the job failed
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true })
  }
}

async function main() {
  await boss.start()
  console.log('[worker] pg-boss started, listening on queue:', QUEUE_NAME)

  await boss.work<RenderJobPayload>(QUEUE_NAME, { teamSize: 1, teamConcurrency: 1 }, handleRender)

  process.on('SIGTERM', async () => {
    console.log('[worker] SIGTERM — shutting down')
    await boss.stop()
    process.exit(0)
  })
}

main().catch((err) => {
  console.error('[worker] fatal:', err)
  process.exit(1)
})
