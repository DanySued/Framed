import { create } from 'zustand'
import type { Clip } from '@/types'

interface EditorState {
  projectId: string | null
  clips: Clip[]
  selectedClipId: string | null
  cursor: number
  isDirty: boolean
  setProject: (id: string) => void
  setClips: (clips: Clip[]) => void
  selectClip: (id: string | null) => void
  reorderClips: (from: number, to: number) => void
  trimClip: (id: string, trimStart: number, trimEnd: number) => void
  removeClip: (id: string) => void
  reset: () => void
}

const initial = {
  projectId: null,
  clips: [],
  selectedClipId: null,
  cursor: 0,
  isDirty: false,
}

export const useEditorStore = create<EditorState>((set) => ({
  ...initial,

  setProject: (id) => set({ projectId: id, isDirty: false }),

  setClips: (clips) => set({ clips }),

  selectClip: (id) => set({ selectedClipId: id }),

  reorderClips: (from, to) =>
    set((s) => {
      const clips = [...s.clips]
      const [item] = clips.splice(from, 1)
      clips.splice(to, 0, item)
      return { clips: clips.map((c, i) => ({ ...c, order_index: i })), isDirty: true }
    }),

  trimClip: (id, trimStart, trimEnd) =>
    set((s) => ({
      clips: s.clips.map((c) =>
        c.id === id ? { ...c, trim_start: trimStart, trim_end: trimEnd } : c
      ),
      isDirty: true,
    })),

  removeClip: (id) =>
    set((s) => ({
      clips: s.clips
        .filter((c) => c.id !== id)
        .map((c, i) => ({ ...c, order_index: i })),
      isDirty: true,
    })),

  reset: () => set(initial),
}))
