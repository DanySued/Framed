import { serverError } from '@/lib/server-client'
import { searchVideos } from '@/services/pexels'

// Proxy — hides the Pexels API key from the client bundle
// GET /api/pexels/search?q=<query>&page=1&per_page=12

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const query = params.get('q')?.trim() ?? ''
  if (!query) return Response.json({ videos: [], total_results: 0 })

  const page = Math.max(1, Number(params.get('page') ?? 1))
  const perPage = Math.min(30, Math.max(1, Number(params.get('per_page') ?? 12)))

  try {
    const result = await searchVideos(query, page, perPage)
    return Response.json(result)
  } catch (err: any) {
    return serverError(err.message ?? 'Pexels search failed')
  }
}
