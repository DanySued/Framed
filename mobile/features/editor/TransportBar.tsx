import { View, Text, Pressable } from 'react-native'
import { FR_GOLD } from '@/lib/theme'

interface Props {
  isPlaying: boolean
  currentSec: number
  totalSec: number
  onPlayPause: () => void
  onRewind: () => void
}

function pad(n: number) {
  return String(Math.floor(n)).padStart(2, '0')
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${pad(m)}:${pad(s)}`
}

export function TransportBar({ isPlaying, currentSec, totalSec, onPlayPause, onRewind }: Props) {
  const progress = totalSec > 0 ? currentSec / totalSec : 0

  return (
    <View className="px-5 pb-4">
      {/* Progress bar */}
      <View className="h-1 bg-secondary rounded-full mb-3 overflow-hidden">
        <View
          className="h-full bg-primary rounded-full"
          style={{ width: `${Math.min(progress * 100, 100)}%` }}
        />
      </View>

      {/* Controls */}
      <View className="flex-row items-center justify-between">
        <Text className="text-xs text-muted-foreground font-mono">
          {formatTime(currentSec)}
        </Text>

        <View className="flex-row items-center gap-6">
          {/* Rewind */}
          <Pressable onPress={onRewind} hitSlop={12}>
            <Text className="text-foreground text-lg">⟨⟨</Text>
          </Pressable>

          {/* Play/Pause */}
          <Pressable
            onPress={onPlayPause}
            className="w-12 h-12 rounded-full bg-primary items-center justify-center"
          >
            <Text className="text-primary-foreground text-xl">
              {isPlaying ? '⏸' : '▶'}
            </Text>
          </Pressable>

          {/* Spacer to balance layout */}
          <View style={{ width: 32 }} />
        </View>

        <Text className="text-xs text-muted-foreground font-mono">
          {formatTime(totalSec)}
        </Text>
      </View>
    </View>
  )
}
