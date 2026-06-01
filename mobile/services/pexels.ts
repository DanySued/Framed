import type { PexelsVideo } from '@/types'

const BASE = 'https://api.pexels.com/videos'

export interface PexelsSearchResult {
  videos: PexelsVideo[]
  total_results: number
  next_page?: string
}

export async function searchVideos(
  query: string,
  page = 1,
  perPage = 12
): Promise<PexelsSearchResult> {
  const params = new URLSearchParams({
    query,
    page: String(page),
    per_page: String(perPage),
    orientation: 'portrait',
    size: 'medium',
  })
  const res = await fetch(`${BASE}/search?${params}`, {
    headers: { Authorization: process.env.PEXELS_API_KEY! },
  })
  if (!res.ok) throw new Error(`Pexels search failed: ${res.status}`)
  return res.json()
}

export function bestFile(video: PexelsVideo, maxWidth = 1080) {
  const sorted = [...video.video_files]
    .filter((f) => f.width && f.width <= maxWidth && f.file_type === 'video/mp4')
    .sort((a, b) => (b.width ?? 0) - (a.width ?? 0))
  return sorted[0] ?? video.video_files[0]
}
