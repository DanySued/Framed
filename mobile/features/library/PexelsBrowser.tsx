import { useState, useCallback } from 'react'
import {
  View, Text, TextInput, Pressable, FlatList,
  Image, ActivityIndicator, Dimensions,
} from 'react-native'
import { usePexelsSearch, useAddPexelsClip } from './hooks'
import type { PexelsVideo } from '@/types'
import { FR_GOLD } from '@/lib/theme'

const { width: SCREEN_W } = Dimensions.get('window')
const THUMB_SIZE = (SCREEN_W - 20 * 2 - 8) / 2

interface Props {
  projectId: string
  onDone?: () => void
}

export function PexelsBrowser({ projectId, onDone }: Props) {
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState('')
  const addClip = useAddPexelsClip(projectId)
  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } =
    usePexelsSearch(submitted)

  const videos = data?.pages.flatMap((p) => p.videos) ?? []

  const handleSubmit = useCallback(() => {
    setSubmitted(query.trim())
  }, [query])

  const handleAdd = async (video: PexelsVideo) => {
    try {
      await addClip.mutateAsync(video)
    } catch {
      // silently ignore — UI stays open so user can try again
    }
  }

  return (
    <View className="flex-1 bg-background">
      {/* Search bar */}
      <View className="flex-row items-center gap-2 px-5 py-3 border-b border-border">
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search Pexels videos…"
          placeholderTextColor="rgba(245,240,232,0.22)"
          returnKeyType="search"
          onSubmitEditing={handleSubmit}
          className="flex-1 px-3 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm"
        />
        <Pressable
          onPress={handleSubmit}
          className="px-4 py-2.5 rounded-xl bg-primary items-center"
        >
          <Text className="text-primary-foreground text-sm font-semibold">Search</Text>
        </Pressable>
      </View>

      {/* Results grid */}
      {isLoading && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={FR_GOLD} />
        </View>
      )}

      {!isLoading && submitted && videos.length === 0 && (
        <View className="flex-1 items-center justify-center">
          <Text className="text-sm text-muted-foreground">No results for "{submitted}"</Text>
        </View>
      )}

      {!isLoading && !submitted && (
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-4xl mb-3">🔍</Text>
          <Text className="text-sm text-muted-foreground text-center">
            Search for stock footage to add to your project
          </Text>
        </View>
      )}

      <FlatList
        data={videos}
        numColumns={2}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 20, gap: 8 }}
        columnWrapperStyle={{ gap: 8 }}
        renderItem={({ item }) => (
          <VideoThumb
            video={item}
            onAdd={() => handleAdd(item)}
            isAdding={addClip.isPending && addClip.variables?.id === item.id}
          />
        )}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage()
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View className="py-4 items-center">
              <ActivityIndicator color={FR_GOLD} size="small" />
            </View>
          ) : null
        }
      />

      {onDone && (
        <View className="px-5 py-4 border-t border-border">
          <Pressable onPress={onDone} className="w-full py-3 rounded-xl bg-primary items-center">
            <Text className="text-primary-foreground font-semibold">Done</Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}

function VideoThumb({
  video, onAdd, isAdding,
}: {
  video: PexelsVideo
  onAdd: () => void
  isAdding: boolean
}) {
  return (
    <Pressable
      onPress={onAdd}
      style={{ width: THUMB_SIZE }}
      className="rounded-xl overflow-hidden border border-border"
    >
      <Image
        source={{ uri: video.image }}
        style={{ width: THUMB_SIZE, height: THUMB_SIZE * (16 / 9) }}
        resizeMode="cover"
      />
      <View className="absolute inset-0 bg-black/30 items-center justify-center">
        {isAdding
          ? <ActivityIndicator color="#fff" />
          : (
            <View className="w-9 h-9 rounded-full bg-black/50 items-center justify-center border border-white/30">
              <Text className="text-white text-lg">+</Text>
            </View>
          )
        }
      </View>
      <View className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/60">
        <Text className="text-white text-[10px]">{video.duration}s</Text>
      </View>
    </Pressable>
  )
}
