import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import type { Clip, PexelsVideo } from '@/types'
import { bestFile } from '@/services/pexels'

// ── Pexels search ─────────────────────────────────────────────────────────────

export function usePexelsSearch(query: string) {
  return useInfiniteQuery({
    queryKey: ['pexels', query],
    queryFn: async ({ pageParam = 1 }) => {
      if (!query.trim()) return { videos: [], total_results: 0 }
      const res = await apiFetch(
        `/api/pexels/search?q=${encodeURIComponent(query)}&page=${pageParam}&per_page=12`
      )
      if (!res.ok) throw new Error('Pexels search failed')
      return res.json() as Promise<{ videos: PexelsVideo[]; total_results: number }>
    },
    initialPageParam: 1,
    getNextPageParam: (last, all) =>
      last.videos.length === 12 ? all.length + 1 : undefined,
    enabled: query.trim().length > 0,
  })
}

// ── Clips ─────────────────────────────────────────────────────────────────────

export function useClips(projectId: string | undefined) {
  return useQuery<Clip[]>({
    queryKey: ['clips', projectId],
    queryFn: async () => {
      const res = await apiFetch(`/api/clips?project_id=${projectId}`)
      if (!res.ok) throw new Error('Failed to load clips')
      return res.json()
    },
    enabled: !!projectId,
  })
}

export function useAddPexelsClip(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (video: PexelsVideo) => {
      const file = bestFile(video)
      const res = await apiFetch('/api/clips', {
        method: 'POST',
        body: JSON.stringify({
          project_id:        projectId,
          source:            'pexels',
          pexels_id:         video.id,
          preview_url:       video.image,
          width:             file?.width ?? video.width,
          height:            file?.height ?? video.height,
          original_duration: video.duration,
        }),
      })
      if (!res.ok) throw new Error('Failed to add clip')
      return res.json() as Promise<Clip>
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clips', projectId] }),
  })
}

export function useUploadClip(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      uri, filename, contentType, duration, width, height,
    }: {
      uri: string
      filename: string
      contentType: string
      duration: number
      width?: number
      height?: number
    }) => {
      // 1. Get signed upload URL
      const urlRes = await apiFetch('/api/upload-url', {
        method: 'POST',
        body: JSON.stringify({ filename, content_type: contentType, project_id: projectId }),
      })
      if (!urlRes.ok) throw new Error('Could not get upload URL')
      const { path, signedUrl } = await urlRes.json()

      // 2. Upload the file via PUT to the signed URL
      const fileRes = await fetch(uri)
      const blob = await fileRes.blob()
      const uploadRes = await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        body: blob,
      })
      if (!uploadRes.ok) throw new Error('Upload failed')

      // 3. Register clip in DB
      const clipRes = await apiFetch('/api/clips', {
        method: 'POST',
        body: JSON.stringify({
          project_id:        projectId,
          source:            'upload',
          storage_path:      path,
          preview_url:       '',
          width:             width ?? 1920,
          height:            height ?? 1080,
          original_duration: duration,
        }),
      })
      if (!clipRes.ok) throw new Error('Failed to register clip')
      return clipRes.json() as Promise<Clip>
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clips', projectId] }),
  })
}

export function useRemoveClip(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (clipId: string) => {
      const res = await apiFetch(`/api/clips/${clipId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to remove clip')
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clips', projectId] }),
  })
}
