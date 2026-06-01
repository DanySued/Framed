import { useState } from 'react'
import {
  View, Text, Pressable, ScrollView, ActivityIndicator, TextInput, Modal,
} from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useProjects, useCreateProject, useDeleteProject } from '@/features/projects/hooks'
import type { Project } from '@/types'
import { FR_GOLD } from '@/lib/theme'

export default function ProjectsScreen() {
  const router = useRouter()
  const { data: projects, isLoading, error, refetch } = useProjects()
  const createProject = useCreateProject()
  const deleteProject = useDeleteProject()
  const [newTitle, setNewTitle] = useState('')
  const [showModal, setShowModal] = useState(false)

  const handleCreate = async () => {
    if (!newTitle.trim()) return
    const project = await createProject.mutateAsync(newTitle.trim())
    setNewTitle('')
    setShowModal(false)
    router.push(`/project/${project.id}`)
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-5">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-6">
        <Text className="text-xl font-bold text-foreground">Projects</Text>
        <Pressable
          onPress={() => supabase.auth.signOut()}
          className="px-3 py-1.5 rounded-xl border border-border"
        >
          <Text className="text-xs text-muted-foreground">Sign out</Text>
        </Pressable>
      </View>

      {/* New project button */}
      <Pressable
        onPress={() => setShowModal(true)}
        className="w-full py-3.5 rounded-xl bg-primary items-center justify-center mb-6"
      >
        <Text className="text-primary-foreground font-semibold">+ New project</Text>
      </Pressable>

      {/* Loading */}
      {isLoading && (
        <View className="items-center py-10">
          <ActivityIndicator color={FR_GOLD} />
        </View>
      )}

      {/* Error */}
      {error && !isLoading && (
        <View className="items-center py-10 gap-3">
          <Text className="text-sm text-muted-foreground">Could not load projects</Text>
          <Pressable onPress={() => refetch()} className="px-4 py-2 rounded-xl border border-border bg-secondary">
            <Text className="text-sm text-foreground">Retry</Text>
          </Pressable>
        </View>
      )}

      {/* Empty state */}
      {!isLoading && !error && projects?.length === 0 && (
        <View className="items-center py-10">
          <Text className="text-4xl mb-3">🎬</Text>
          <Text className="text-sm text-muted-foreground text-center">
            No projects yet — create your first one
          </Text>
        </View>
      )}

      {/* Project list */}
      {projects?.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onOpen={() => router.push(`/project/${project.id}`)}
          onDelete={() => deleteProject.mutate(project.id)}
        />
      ))}

      {/* New project modal */}
      <Modal visible={showModal} transparent animationType="fade">
        <View className="flex-1 bg-black/60 items-center justify-center px-6">
          <View className="w-full max-w-sm bg-card rounded-2xl p-6 border border-border">
            <Text className="text-base font-semibold text-foreground mb-4">New project</Text>
            <TextInput
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Project title"
              placeholderTextColor="rgba(245,240,232,0.22)"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleCreate}
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm mb-4"
            />
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => { setShowModal(false); setNewTitle('') }}
                className="flex-1 py-2.5 rounded-xl border border-border items-center"
              >
                <Text className="text-sm text-muted-foreground">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleCreate}
                disabled={!newTitle.trim() || createProject.isPending}
                className="flex-1 py-2.5 rounded-xl bg-primary items-center disabled:opacity-40"
              >
                {createProject.isPending
                  ? <ActivityIndicator color="#0a0800" size="small" />
                  : <Text className="text-primary-foreground font-semibold text-sm">Create</Text>
                }
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

function ProjectCard({
  project, onOpen, onDelete,
}: {
  project: Project
  onOpen: () => void
  onDelete: () => void
}) {
  const statusConfig: Record<Project['status'], { label: string; color: string; bg: string }> = {
    draft:     { label: 'Draft',     color: 'rgba(245,240,232,0.42)', bg: 'rgba(255,255,255,0.06)' },
    rendering: { label: 'Rendering', color: '#fbbf24',                bg: 'rgba(251,191,36,0.12)'  },
    done:      { label: 'Done',      color: '#4ade80',                bg: 'rgba(74,222,128,0.12)'  },
    failed:    { label: 'Failed',    color: '#f87171',                bg: 'rgba(248,113,113,0.12)' },
  }
  const { label, color, bg } = statusConfig[project.status]

  return (
    <Pressable
      onPress={onOpen}
      className="bg-card rounded-2xl p-4 border border-border mb-3"
    >
      <View className="flex-row items-center">
        <View className="flex-1 min-w-0">
          <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
            {project.title}
          </Text>
          <Text className="text-xs text-muted-foreground mt-0.5">
            {new Date(project.created_at).toLocaleDateString()}
          </Text>
        </View>
        <View className="px-2 py-0.5 rounded-full ml-3" style={{ backgroundColor: bg }}>
          <Text className="text-[10px] font-medium" style={{ color }}>{label}</Text>
        </View>
      </View>
    </Pressable>
  )
}
