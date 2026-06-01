import { View, Text, Pressable } from 'react-native'
import { useEditorStore } from '@/state/editor'
import type { Clip } from '@/types'

interface Props {
  clip: Clip
  index: number
  totalClips: number
  onRemove: () => void
}

export function ClipInspector({ clip, index, totalClips, onRemove }: Props) {
  const { reorderClips, trimClip } = useEditorStore()

  const duration = clip.trim_end - clip.trim_start

  const nudgeTrimStart = (delta: number) => {
    const newStart = Math.max(0, Math.min(clip.trim_start + delta, clip.trim_end - 0.1))
    trimClip(clip.id, newStart, clip.trim_end)
  }

  const nudgeTrimEnd = (delta: number) => {
    const newEnd = Math.max(
      clip.trim_start + 0.1,
      Math.min(clip.trim_end + delta, clip.original_duration)
    )
    trimClip(clip.id, clip.trim_start, newEnd)
  }

  return (
    <View className="mx-5 bg-card rounded-2xl border border-border p-4">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-sm font-semibold text-foreground">
          {clip.source === 'pexels' ? `Pexels #${clip.pexels_id}` : `Upload ${index + 1}`}
        </Text>
        <Pressable
          onPress={onRemove}
          className="px-2 py-1 rounded-lg border border-destructive/30 bg-destructive/10"
        >
          <Text className="text-[10px] text-destructive">Remove</Text>
        </Pressable>
      </View>

      {/* Duration info */}
      <View className="flex-row gap-4 mb-4">
        <View className="flex-1">
          <Text className="text-[10px] text-muted-foreground mb-0.5">Duration</Text>
          <Text className="text-sm font-mono text-foreground">{duration.toFixed(2)}s</Text>
        </View>
        <View className="flex-1">
          <Text className="text-[10px] text-muted-foreground mb-0.5">Original</Text>
          <Text className="text-sm font-mono text-muted-foreground">{clip.original_duration.toFixed(2)}s</Text>
        </View>
        <View className="flex-1">
          <Text className="text-[10px] text-muted-foreground mb-0.5">Resolution</Text>
          <Text className="text-sm font-mono text-muted-foreground">{clip.width}×{clip.height}</Text>
        </View>
      </View>

      {/* Trim controls */}
      <View className="mb-3">
        <Text className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Trim</Text>
        <View className="flex-row items-center gap-3">
          <Text className="text-xs text-muted-foreground w-12 text-right">In</Text>
          <NudgeRow
            value={clip.trim_start}
            onNudge={nudgeTrimStart}
          />
        </View>
        <View className="flex-row items-center gap-3 mt-1.5">
          <Text className="text-xs text-muted-foreground w-12 text-right">Out</Text>
          <NudgeRow
            value={clip.trim_end}
            onNudge={nudgeTrimEnd}
          />
        </View>
      </View>

      {/* Reorder */}
      <View className="flex-row gap-2">
        <Text className="text-[10px] text-muted-foreground flex-1 self-center">
          Position {index + 1} of {totalClips}
        </Text>
        <Pressable
          onPress={() => index > 0 && reorderClips(index, index - 1)}
          disabled={index === 0}
          className="px-3 py-1.5 rounded-lg border border-border bg-secondary disabled:opacity-30"
        >
          <Text className="text-xs text-foreground">← Move left</Text>
        </Pressable>
        <Pressable
          onPress={() => index < totalClips - 1 && reorderClips(index, index + 1)}
          disabled={index === totalClips - 1}
          className="px-3 py-1.5 rounded-lg border border-border bg-secondary disabled:opacity-30"
        >
          <Text className="text-xs text-foreground">Move right →</Text>
        </Pressable>
      </View>
    </View>
  )
}

function NudgeRow({ value, onNudge }: { value: number; onNudge: (d: number) => void }) {
  return (
    <View className="flex-row items-center flex-1 gap-2">
      {[-0.5, -0.1].map((d) => (
        <Pressable
          key={d}
          onPress={() => onNudge(d)}
          className="px-2 py-1 rounded-lg bg-secondary border border-border"
        >
          <Text className="text-xs text-foreground font-mono">{d}s</Text>
        </Pressable>
      ))}
      <Text className="text-sm font-mono text-foreground mx-2">{value.toFixed(2)}s</Text>
      {[0.1, 0.5].map((d) => (
        <Pressable
          key={d}
          onPress={() => onNudge(d)}
          className="px-2 py-1 rounded-lg bg-secondary border border-border"
        >
          <Text className="text-xs text-foreground font-mono">+{d}s</Text>
        </Pressable>
      ))}
    </View>
  )
}
