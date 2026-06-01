import { useRef, useCallback } from 'react'
import { View, Text, Pressable, ScrollView, Dimensions } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  withSpring,
} from 'react-native-reanimated'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { useEditorStore } from '@/state/editor'
import type { Clip } from '@/types'

const TRACK_H = 56
const PX_PER_SEC = 40
const MIN_CLIP_W = 20
const { width: SCREEN_W } = Dimensions.get('window')
const TRACK_W = SCREEN_W - 40 // px-5 * 2

// ── Single clip track item ────────────────────────────────────────────────────

function ClipTrackItem({
  clip,
  index,
  isSelected,
  onSelect,
  onTrimStart,
  onTrimEnd,
}: {
  clip: Clip
  index: number
  isSelected: boolean
  onSelect: () => void
  onTrimStart: (delta: number) => void
  onTrimEnd: (delta: number) => void
}) {
  const duration = clip.trim_end - clip.trim_start
  const clipW = Math.max(duration * PX_PER_SEC, MIN_CLIP_W)

  const handleGestureStart = Gesture.Pan()
    .minDistance(4)
    .onUpdate((e) => {
      runOnJS(onTrimStart)(e.translationX / PX_PER_SEC)
    })
    .runOnJS(true)

  const handleGestureEnd = Gesture.Pan()
    .minDistance(4)
    .onUpdate((e) => {
      runOnJS(onTrimEnd)(e.translationX / PX_PER_SEC)
    })
    .runOnJS(true)

  return (
    <Pressable onPress={onSelect}>
      <View
        style={{ width: clipW, height: TRACK_H }}
        className={`rounded-lg mr-1.5 overflow-hidden border ${
          isSelected ? 'border-primary' : 'border-border'
        }`}
      >
        {/* Background */}
        <View className="absolute inset-0 bg-fr-surface-3" />

        {/* Label */}
        <View className="absolute inset-0 items-center justify-center px-2">
          <Text className="text-[10px] text-muted-foreground font-mono" numberOfLines={1}>
            {clip.source === 'pexels' ? `P#${clip.pexels_id}` : `${index + 1}`}
          </Text>
          <Text className="text-[9px] text-muted-foreground">
            {duration.toFixed(1)}s
          </Text>
        </View>

        {/* Left trim handle */}
        <GestureDetector gesture={handleGestureStart}>
          <View className="absolute left-0 top-0 bottom-0 w-3 items-center justify-center">
            <View className="w-1 h-8 rounded-full bg-primary/70" />
          </View>
        </GestureDetector>

        {/* Right trim handle */}
        <GestureDetector gesture={handleGestureEnd}>
          <View className="absolute right-0 top-0 bottom-0 w-3 items-center justify-center">
            <View className="w-1 h-8 rounded-full bg-primary/70" />
          </View>
        </GestureDetector>
      </View>
    </Pressable>
  )
}

// ── Playhead ──────────────────────────────────────────────────────────────────

function Playhead({ positionX }: { positionX: number }) {
  return (
    <View
      className="absolute top-0 bottom-0 w-px bg-primary"
      style={{ left: positionX + 20 }} // offset for padding
      pointerEvents="none"
    >
      <View className="w-3 h-3 bg-primary rounded-full -ml-1.5 -mt-1" />
    </View>
  )
}

// ── Main Timeline ─────────────────────────────────────────────────────────────

export function Timeline({
  onSeek,
  cursorSec,
}: {
  onSeek: (sec: number) => void
  cursorSec: number
}) {
  const { clips, selectedClipId, selectClip, reorderClips, trimClip } = useEditorStore()

  const handleTrimStart = useCallback(
    (clip: Clip, delta: number) => {
      const newStart = Math.max(0, Math.min(clip.trim_start + delta, clip.trim_end - 0.1))
      trimClip(clip.id, newStart, clip.trim_end)
    },
    [trimClip]
  )

  const handleTrimEnd = useCallback(
    (clip: Clip, delta: number) => {
      const newEnd = Math.max(
        clip.trim_start + 0.1,
        Math.min(clip.trim_start + delta + (clip.trim_end - clip.trim_start), clip.original_duration)
      )
      trimClip(clip.id, clip.trim_start, newEnd)
    },
    [trimClip]
  )

  const totalDuration = clips.reduce((s, c) => s + (c.trim_end - c.trim_start), 0)
  const playheadX = cursorSec * PX_PER_SEC

  if (clips.length === 0) {
    return (
      <View className="h-20 items-center justify-center border border-dashed border-border rounded-xl mx-5">
        <Text className="text-xs text-muted-foreground">No clips — add from Pexels or upload</Text>
      </View>
    )
  }

  return (
    <View>
      {/* Time ruler */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-5">
        <View className="relative" style={{ height: TRACK_H + 20 }}>
          {/* Time ticks */}
          <View className="flex-row mb-1">
            {Array.from({ length: Math.ceil(totalDuration) + 1 }, (_, i) => (
              <View key={i} style={{ width: PX_PER_SEC }} className="items-start">
                <Text className="text-[8px] text-muted-foreground font-mono">{i}s</Text>
              </View>
            ))}
          </View>

          {/* Clip tracks */}
          <View className="flex-row">
            {clips.map((clip, i) => (
              <ClipTrackItem
                key={clip.id}
                clip={clip}
                index={i}
                isSelected={selectedClipId === clip.id}
                onSelect={() => selectClip(clip.id === selectedClipId ? null : clip.id)}
                onTrimStart={(delta) => handleTrimStart(clip, delta)}
                onTrimEnd={(delta) => handleTrimEnd(clip, delta)}
              />
            ))}
          </View>

          {/* Playhead */}
          <Playhead positionX={playheadX} />
        </View>
      </ScrollView>

      {/* Total duration */}
      <View className="px-5 mt-1">
        <Text className="text-[10px] text-muted-foreground">
          Total: {totalDuration.toFixed(1)}s
        </Text>
      </View>
    </View>
  )
}
