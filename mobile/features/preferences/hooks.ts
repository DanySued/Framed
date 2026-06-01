import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import type { Preferences } from '@/types'

export function usePreferences() {
  return useQuery<Preferences | null>({
    queryKey: ['preferences'],
    queryFn: async () => {
      const res = await apiFetch('/api/preferences')
      if (!res.ok) throw new Error('Failed to load preferences')
      return res.json()
    },
  })
}

export function useUpsertPreferences() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (patch: Partial<Omit<Preferences, 'id' | 'user_id'>>) => {
      const res = await apiFetch('/api/preferences', {
        method: 'PUT',
        body: JSON.stringify(patch),
      })
      if (!res.ok) throw new Error('Failed to save preferences')
      return res.json() as Promise<Preferences>
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['preferences'] }),
  })
}
