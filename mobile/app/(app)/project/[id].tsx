import { useState, useEffect, useRef } from 'react'
import {
  View, Text, Pressable, Modal,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native'
import { useLocalSearchParams, Stack } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import * as DocumentPicker from 'expo-document-picker'
import * as FileSystem from 'expo-file-system'
import * as MediaLibrary from 'expo-media-library'
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av'
import { useProject, useUpdateProject } from '@/features/projects/hooks'
import { useClips, useUploadClip, useRemoveClip } from '@/features/library/hooks'
import { PexelsBrowser } from '@/features/library/PexelsBrowser'
import { useStartRender, useRenderJob, useLatestRender } from '@/features/render/hooks'
import { useHydrateEditor, useSaveTimeline } from '@/features/editor/hooks'
import { Timeline } from '@/features/editor/Timeline'
import { TransportBar } from '@/features/editor/TransportBar'
import { ClipInspector } from '@/features/editor/ClipInspector'
import { useEditorStore } from '@/state/editor'
import type { Clip } from '@/types'
import { FR_GOLD } from '@/lib/theme'

export default function ProjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [showLibrary, setShowLibrary] = useState(false)
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [cursorSec, setCursorSec] = useState(0)
  const videoRef = useRef<Video>(null)

  const { data: project, isLoading: projectLoading } = useProject(id)
  const { data: serverClips = [], isLoading: clipsLoading } = useClips(id)
  const uploadClip = useUploadClip(id!)
  const removeClip = useRemoveClip(id!)
  const startRender = useStartRender()
  const { data: job } = useRenderJob(activeJobId)
  const saveTimeline = useSaveTimeline(id!)
  const hydrateEditor = useHydrateEditor()

  const { clips, selectedClipId, isDirty, removeClip: storeRemoveClip } = useEditorStore()

  // Hydrate editor store from server data
  useEffect(() => {
    if (id && serverClips.length > 0) {
      hydrateEditor(id, serverClips)
    }
  }, [id, serverClips])

  const selectedClip = clips.find((c) => c.id === selectedClipId)
  const selectedIndex = clips.findIndex((c) => c.id === selectedClipId)

  const totalDuration = clips.reduce((s, c) => s + (c.trim_end - c.trim_start), 0)

  // Build a simple preview URL: use the selected clip's Pexels preview
  // (Real preview would concatenate; for MVP we just show selected clip)
  const previewUri = selectedClip?.preview_url || clips[0]?.preview_url

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
    if (isDirty) {
      // Save unsaved edits first
      try { await saveTimeline.mutateAsync() } catch { /* continue */ }
    }
    try {
      const { job_id } = await startRender.mutateAsync(id!)
      setActiveJobId(job_id)
    } catch (err: any) {
      Alert.alert('Render failed', err.message)
    }
  }

  const handleRemoveSelected = () => {
    if (!selectedClip) return
    Alert.alert('Remove clip', 'Remove this clip?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: () => {
          storeRemoveClip(selectedClip.id)
          removeClip.mutate(selectedClip.id)
        },
      },
    ])
  }

  const handlePlayPause = async () => {
    if (!videoRef.current) return
    if (isPlaying) {
      await videoRef.current.pauseAsync()
    } else {
      await videoRef.current.playAsync()
    }
    setIsPlaying(!isPlaying)
  }

  const handleRewind = async () => {
    if (videoRef.current) {
      await videoRef.current.setPositionAsync(0)
      setCursorSec(0)
    }
  }

  const isRendering =
    project?.status === 'rendering' ||
    job?.status === 'processing' ||
    job?.status === 'pending'

  if (projectLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color={FR_GOLD} />
      </View>
    )
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title: project?.title ?? 'Editor',
          headerRight: () => (
            <View className="flex-row items-center gap-2 mr-2">
              {isDirty && (
                <Pressable
                  onPress={() => saveTimeline.mutate()}
                  disabled={saveTimeline.isPending}
                  className="px-3 py-1.5 rounded-xl border border-border"
                >
                  {saveTimeline.isPending
                    ? <ActivityIndicator color={FR_GOLD} size="small" />
                    : <Text className="text-xs text-foreground">Save</Text>
                  }
                </Pressable>
              )}
              <Pressable
                onPress={handleRender}
                disabled={isRendering || startRender.isPending || !clips.length}
                className="px-3 py-1.5 rounded-xl bg-primary disabled:opacity-40"
              >
                {isRendering
                  ? <ActivityIndicator color="#0a0800" size="small" />
                  : <Text className="text-primary-foreground text-xs font-semibold">Render</Text>
                }
              </Pressable>
            </View>
          ),
        }}
      />

      <View className="flex-1 bg-background">
        {/* Video preview */}
        <View className="bg-black aspect-[9/16] w-full max-h-52 overflow-hidden">
          {previewUri ? (
            <Video
              ref={videoRef}
              source={{ uri: previewUri }}
              style={{ flex: 1 }}
              resizeMode={ResizeMode.CONTAIN}
              onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
                if (status.isLoaded) {
                  setCursorSec((status.positionMillis ?? 0) / 1000)
                  if (status.didJustFinish) {
                    setIsPlaying(false)
                    setCursorSec(0)
                  }
                }
              }}
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Text className="text-muted-foreground text-sm">No clips yet</Text>
            </View>
          )}
        </View>

        {/* Transport bar */}
        <View className="pt-3">
          <TransportBar
            isPlaying={isPlaying}
            currentSec={cursorSec}
            totalSec={totalDuration}
            onPlayPause={handlePlayPause}
            onRewind={handleRewind}
          />
        </View>

        {/* Render banners */}
        {isRendering && (
          <View className="mx-5 mb-2 bg-fr-surface-3 rounded-xl border border-fr-yellow/30 p-3">
            <View className="flex-row items-center justify-between mb-1.5">
              <Text className="text-[10px] font-semibold text-fr-yellow">Rendering…</Text>
              <Text className="text-[10px] text-muted-foreground">{job?.progress ?? 0}%</Text>
            </View>
            <View className="h-1 bg-secondary rounded-full overflow-hidden">
              <View className="h-full bg-fr-yellow rounded-full" style={{ width: `${Math.max(job?.progress ?? 0, 2)}%` }} />
            </View>
          </View>
        )}
        {job?.status === 'done' && (
          <View className="mx-5 mb-2 bg-fr-surface-3 rounded-xl border border-fr-green/30 p-3">
            <Text className="text-[10px] font-semibold text-fr-green">Render complete!</Text>
          </View>
        )}
        {job?.status === 'failed' && (
          <View className="mx-5 mb-2 bg-fr-surface-3 rounded-xl border border-destructive/30 p-3">
            <Text className="text-[10px] font-semibold text-destructive">Render failed: {job.error}</Text>
          </View>
        )}

        {/* Timeline */}
        <View className="mb-2">
          <Timeline
            cursorSec={cursorSec}
            onSeek={(sec) => {
              setCursorSec(sec)
              videoRef.current?.setPositionAsync(sec * 1000)
            }}
          />
        </View>

        {/* Add clips toolbar */}
        <View className="flex-row items-center gap-2 px-5 mb-3">
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

        {/* Clip inspector (selected clip) */}
        {selectedClip && (
          <ClipInspector
            clip={selectedClip}
            index={selectedIndex}
            totalClips={clips.length}
            onRemove={handleRemoveSelected}
          />
        )}

        {/* Empty state */}
        {!clipsLoading && clips.length === 0 && (
          <View className="flex-1 items-center justify-center p-6">
            <Text className="text-3xl mb-3">🎞</Text>
            <Text className="text-sm text-muted-foreground text-center">
              Add clips from Pexels or upload your own footage
            </Text>
          </View>
        )}
      </View>

      {/* Pexels modal */}
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
    </GestureHandlerRootView>
  )
}
