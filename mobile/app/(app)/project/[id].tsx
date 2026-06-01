import { useState } from 'react'
import {
  View, Text, Pressable, ScrollView, Image, Modal,
  ActivityIndicator, Alert,
} from 'react-native'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import * as DocumentPicker from 'expo-document-picker'
import { useProject } from '@/features/projects/hooks'
import { useClips, useUploadClip, useRemoveClip } from '@/features/library/hooks'
import { PexelsBrowser } from '@/features/library/PexelsBrowser'
import { useStartRender, useRenderJob } from '@/features/render/hooks'
import type { Clip } from '@/types'
import { FR_GOLD } from '@/lib/theme'

export default function ProjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [showLibrary, setShowLibrary] = useState(false)
  const [activeJobId, setActiveJobId] = useState<string | null>(null)

  const { data: project, isLoading: projectLoading, refetch: refetchProject } = useProject(id)
  const { data: clips = [], isLoading: clipsLoading } = useClips(id)
  const uploadClip = useUploadClip(id!)
  const removeClip = useRemoveClip(id!)
  const startRender = useStartRender()
  const { data: job } = useRenderJob(activeJobId)

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['video/mp4', 'video/quicktime', 'video/x-m4v'],
        copyToCacheDirectory: true,
      })
      if (result.canceled || !result.assets.length) return
      const file = result.assets[0]
      await uploadClip.mutateAsync({
        uri: file.uri,
        filename: file.name,
        contentType: file.mimeType ?? 'video/mp4',
        duration: 0,
      })
    } catch (err: any) {
      Alert.alert('Upload failed', err.message ?? 'Could not upload video')
    }
  }

  const handleRender = async () => {
    if (!clips.length) {
      Alert.alert('No clips', 'Add at least one clip before rendering.')
      return
    }
    try {
      const { job_id } = await startRender.mutateAsync(id!)
      setActiveJobId(job_id)
    } catch (err: any) {
      Alert.alert('Render failed', err.message)
    }
  }

  const confirmRemove = (clip: Clip) => {
    Alert.alert('Remove clip', 'Remove this clip from the project?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: () => removeClip.mutate(clip.id),
      },
    ])
  }

  const isRendering = project?.status === 'rendering' || job?.status === 'processing' || job?.status === 'pending'
  const renderProgress = job?.progress ?? 0

  if (projectLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color={FR_GOLD} />
      </View>
    )
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: project?.title ?? 'Project',
          headerRight: () => (
            <Pressable
              onPress={handleRender}
              disabled={isRendering || startRender.isPending || !clips.length}
              className="px-3 py-1.5 rounded-xl bg-primary mr-2 disabled:opacity-40"
            >
              {isRendering
                ? <ActivityIndicator color="#0a0800" size="small" />
                : <Text className="text-primary-foreground text-xs font-semibold">Render</Text>
              }
            </Pressable>
          ),
        }}
      />

      <ScrollView className="flex-1 bg-background" contentContainerClassName="p-5">

        {/* Render progress banner */}
        {isRendering && (
          <View className="bg-fr-surface-3 rounded-xl border border-fr-yellow/30 p-4 mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs font-semibold text-fr-yellow">Rendering…</Text>
              <Text className="text-xs text-muted-foreground">{renderProgress}%</Text>
            </View>
            <View className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <View
                className="h-full bg-fr-yellow rounded-full"
                style={{ width: `${Math.max(renderProgress, 2)}%` }}
              />
            </View>
          </View>
        )}

        {/* Done banner */}
        {job?.status === 'done' && (
          <View className="bg-fr-surface-3 rounded-xl border border-fr-green/30 p-4 mb-4">
            <Text className="text-xs font-semibold text-fr-green mb-1">Render complete!</Text>
            <Text className="text-xs text-muted-foreground">
              Your video is ready. Go to the project renders to download.
            </Text>
          </View>
        )}

        {/* Failed banner */}
        {job?.status === 'failed' && (
          <View className="bg-fr-surface-3 rounded-xl border border-destructive/30 p-4 mb-4">
            <Text className="text-xs font-semibold text-destructive mb-1">Render failed</Text>
            <Text className="text-xs text-muted-foreground">{job.error ?? 'Unknown error'}</Text>
          </View>
        )}

        {/* Clips header */}
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-sm font-semibold text-foreground">
              Clips {clips.length > 0 ? `(${clips.length})` : ''}
            </Text>
            <Text className="text-xs text-muted-foreground mt-0.5">
              {clips.length === 0
                ? 'Add footage to get started'
                : `${clips.reduce((s, c) => s + (c.trim_end - c.trim_start), 0).toFixed(1)}s total`}
            </Text>
          </View>
          <View className="flex-row gap-2">
            <Pressable
              onPress={handleUpload}
              disabled={uploadClip.isPending}
              className="flex-row items-center gap-1 px-3 py-1.5 rounded-xl border border-border bg-secondary"
            >
              {uploadClip.isPending
                ? <ActivityIndicator size="small" color={FR_GOLD} />
                : <Text className="text-foreground text-xs">↑ Upload</Text>
              }
            </Pressable>
            <Pressable
              onPress={() => setShowLibrary(true)}
              className="px-3 py-1.5 rounded-xl bg-primary"
            >
              <Text className="text-primary-foreground text-xs font-semibold">+ Pexels</Text>
            </Pressable>
          </View>
        </View>

        {clipsLoading && (
          <View className="items-center py-8">
            <ActivityIndicator color={FR_GOLD} />
          </View>
        )}

        {!clipsLoading && clips.length === 0 && (
          <View className="items-center py-10 gap-3">
            <Text className="text-3xl">🎞</Text>
            <Text className="text-sm text-muted-foreground text-center">
              No clips yet — search Pexels or upload from your device
            </Text>
          </View>
        )}

        {clips.map((clip, i) => (
          <ClipRow
            key={clip.id}
            clip={clip}
            index={i}
            onRemove={() => confirmRemove(clip)}
          />
        ))}
      </ScrollView>

      {/* Pexels library modal */}
      <Modal visible={showLibrary} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-background">
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-border">
            <Text className="text-base font-semibold text-foreground">Add from Pexels</Text>
            <Pressable onPress={() => setShowLibrary(false)}>
              <Text className="text-muted-foreground text-sm">Close</Text>
            </Pressable>
          </View>
          <PexelsBrowser projectId={id!} onDone={() => setShowLibrary(false)} />
        </View>
      </Modal>
    </>
  )
}

function ClipRow({ clip, index, onRemove }: { clip: Clip; index: number; onRemove: () => void }) {
  const duration = (clip.trim_end - clip.trim_start).toFixed(1)
  return (
    <View className="flex-row items-center bg-card rounded-xl border border-border p-3 mb-2">
      {clip.preview_url
        ? (
          <Image
            source={{ uri: clip.preview_url }}
            className="w-16 h-10 rounded-lg mr-3"
            resizeMode="cover"
          />
        )
        : (
          <View className="w-16 h-10 rounded-lg bg-secondary mr-3 items-center justify-center">
            <Text className="text-muted-foreground text-xs">{index + 1}</Text>
          </View>
        )
      }
      <View className="flex-1 min-w-0">
        <Text className="text-xs font-medium text-foreground" numberOfLines={1}>
          {clip.source === 'pexels' ? `Pexels #${clip.pexels_id}` : 'Upload'}
        </Text>
        <Text className="text-[10px] text-muted-foreground mt-0.5">
          {duration}s · {clip.width}×{clip.height}
        </Text>
      </View>
      <Pressable onPress={onRemove} className="p-2 ml-2">
        <Text className="text-muted-foreground text-xs">✕</Text>
      </Pressable>
    </View>
  )
}
