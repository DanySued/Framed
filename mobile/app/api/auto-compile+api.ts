import { createServerClient, SINGLE_USER_ID, serverError, badRequest } from '@/lib/server-client'
import { searchVideos, bestFile } from '@/services/pexels'
import type { Preferences } from '@/types'

// POST /api/auto-compile
// Body: { project_id: string }

export async function POST(request: Request) {
  const db = createServerClient()

  const body = await request.json().catch(() => ({}))
  if (!body.project_id) return badRequest('project_id required')

  // Load preferences
  const { data: prefs, error: prefsErr } = await db
    .from('preferences')
    .select('*')
    .eq('user_id', SINGLE_USER_ID)
    .maybeSingle()

  if (prefsErr) return serverError(prefsErr.message)
  if (!prefs) return badRequest('Set your preferences first')

  const p = prefs as Preferences
  const targetDuration = p.total_duration ?? 30
  const clipDuration = p.clip_duration ?? 3
  const clipsNeeded = Math.ceil(targetDuration / clipDuration) + 2 // +2 buffer

  const queryTerms = [...(p.tags ?? []), ...(p.mood ?? [])]
  if (!queryTerms.length) return badRequest('Add at least one tag or mood to preferences')

  const query = queryTerms.slice(0, 3).join(' ')

  const { count: existingCount } = await db
    .from('clips')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', body.project_id)

  const searchResult = await searchVideos(query, 1, Math.min(clipsNeeded * 2, 30))
  const videos = searchResult.videos

  if (!videos.length) {
    return serverError(`No Pexels results for query "${query}"`)
  }

  const scored = videos
    .map((v) => {
      const isPortrait = v.height >= v.width
      const durationDelta = Math.abs(v.duration - clipDuration)
      const score = (isPortrait ? 10 : 0) - durationDelta
      return { video: v, score }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, clipsNeeded)

  let addedCount = 0
  let accDuration = 0

  for (let i = 0; i < scored.length && accDuration < targetDuration; i++) {
    const { video } = scored[i]
    const file = bestFile(video)
    const trimEnd = Math.min(video.duration, clipDuration * 1.5)

    const { error } = await db.from('clips').insert({
      project_id:        body.project_id,
      source:            'pexels',
      pexels_id:         video.id,
      preview_url:       video.image,
      width:             file?.width ?? video.width,
      height:            file?.height ?? video.height,
      original_duration: video.duration,
      trim_start:        0,
      trim_end:          trimEnd,
      order_index:       (existingCount ?? 0) + i,
    })

    if (!error) {
      addedCount++
      accDuration += trimEnd
    }
  }

  return Response.json({
    clips_added: addedCount,
    total_duration: accDuration,
    query,
  })
}
