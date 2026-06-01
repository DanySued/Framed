import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import type { Project, Clip, Render } from '@/types'

export interface ProjectDetail extends Project {
  clips: Clip[]
  renders: Render[]
}

// ── Queries ───────────────────────────────────────────────────────────────────

export function useProjects() {
  return useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await apiFetch('/api/projects')
      if (!res.ok) throw new Error('Failed to load projects')
      return res.json()
    },
  })
}

export function useProject(id: string | undefined) {
  return useQuery<ProjectDetail>({
    queryKey: ['projects', id],
    queryFn: async () => {
      const res = await apiFetch(`/api/projects/${id}`)
      if (!res.ok) throw new Error('Failed to load project')
      return res.json()
    },
    enabled: !!id && id !== 'new',
  })
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (title: string) => {
      const res = await apiFetch('/api/projects', {
        method: 'POST',
        body: JSON.stringify({ title }),
      })
      if (!res.ok) throw new Error('Failed to create project')
      return res.json() as Promise<Project>
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })
}

export function useUpdateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Project> & { id: string }) => {
      const res = await apiFetch(`/api/projects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      })
      if (!res.ok) throw new Error('Failed to update project')
      return res.json() as Promise<Project>
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      qc.invalidateQueries({ queryKey: ['projects', data.id] })
    },
  })
}

export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/api/projects/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete project')
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })
}
