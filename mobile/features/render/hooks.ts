import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import type { RenderJob } from '@/types'

export function useStartRender() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (projectId: string) => {
      const res = await apiFetch('/api/render', {
        method: 'POST',
        body: JSON.stringify({ project_id: projectId }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Failed to start render')
      }
      return res.json() as Promise<{ job_id: string }>
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useRenderJob(jobId: string | null) {
  return useQuery<RenderJob>({
    queryKey: ['job', jobId],
    queryFn: async () => {
      const res = await apiFetch(`/api/jobs/${jobId}`)
      if (!res.ok) throw new Error('Failed to fetch job')
      return res.json()
    },
    enabled: !!jobId,
    // Poll every 2s while job is active
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === 'pending' || status === 'processing' ? 2000 : false
    },
  })
}
