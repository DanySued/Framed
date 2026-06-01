import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { useEditorStore } from '@/state/editor'
import type { Clip } from '@/types'

// Persist the current Zustand editor state (clips) back to the server
export function useSaveTimeline(projectId: string) {
  const qc = useQueryClient()
  const { clips, reset: markClean } = useEditorStore()

  return useMutation({
    mutationFn: async () => {
      // PATCH each clip with its current trim + order_index
      await Promise.all(
        clips.map((clip) =>
          apiFetch(`/api/clips/${clip.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
              trim_start:  clip.trim_start,
              trim_end:    clip.trim_end,
              order_index: clip.order_index,
            }),
          })
        )
      )
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clips', projectId] })
      qc.invalidateQueries({ queryKey: ['projects', projectId] })
    },
  })
}

// Hydrate the Zustand store from fetched clips (call once on project load)
export function useHydrateEditor() {
  const { setClips, setProject } = useEditorStore()
  return (projectId: string, clips: Clip[]) => {
    setProject(projectId)
    setClips(clips)
  }
}
