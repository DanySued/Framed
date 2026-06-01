import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import type { Project } from '@/types'
import { FR_GOLD } from '@/lib/theme'

async function fetchProjects(): Promise<Project[]> {
  const res = await apiFetch('/api/projects')
  if (!res.ok) throw new Error('Failed to load projects')
  return res.json()
}

export default function ProjectsScreen() {
  const router = useRouter()
  const { data: projects, isLoading, error, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  })

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="p-5"
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-6">
        <Text className="text-xl font-bold text-foreground">Projects</Text>
        <Pressable onPress={handleSignOut} className="px-3 py-1.5 rounded-xl border border-border">
          <Text className="text-xs text-muted-foreground">Sign out</Text>
        </Pressable>
      </View>

      {/* New project */}
      <Pressable
        onPress={() => router.push('/project/new')}
        className="w-full py-3.5 rounded-xl bg-primary items-center justify-center mb-6"
      >
        <Text className="text-primary-foreground font-semibold">+ New project</Text>
      </Pressable>

      {/* List */}
      {isLoading && (
        <View className="items-center py-10">
          <ActivityIndicator color={FR_GOLD} />
        </View>
      )}

      {error && (
        <View className="items-center py-10 gap-3">
          <Text className="text-sm text-muted-foreground">Could not load projects</Text>
          <Pressable
            onPress={() => refetch()}
            className="px-4 py-2 rounded-xl border border-border bg-secondary"
          >
            <Text className="text-sm text-foreground">Retry</Text>
          </Pressable>
        </View>
      )}

      {projects?.length === 0 && (
        <View className="items-center py-10">
          <Text className="text-4xl mb-3">🎬</Text>
          <Text className="text-sm text-muted-foreground">No projects yet — create your first one</Text>
        </View>
      )}

      {projects?.map((project) => (
        <Pressable
          key={project.id}
          onPress={() => router.push(`/project/${project.id}`)}
          className="bg-card rounded-2xl p-4 border border-border mb-3"
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1 min-w-0">
              <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
                {project.title}
              </Text>
              <Text className="text-xs text-muted-foreground mt-0.5">
                {new Date(project.created_at).toLocaleDateString()}
              </Text>
            </View>
            <StatusBadge status={project.status} />
          </View>
        </Pressable>
      ))}
    </ScrollView>
  )
}

function StatusBadge({ status }: { status: Project['status'] }) {
  const config: Record<Project['status'], { label: string; color: string; bg: string }> = {
    draft:     { label: 'Draft',      color: 'rgba(245,240,232,0.42)', bg: 'rgba(255,255,255,0.06)' },
    rendering: { label: 'Rendering',  color: '#fbbf24',                bg: 'rgba(251,191,36,0.12)'  },
    done:      { label: 'Done',       color: '#4ade80',                bg: 'rgba(74,222,128,0.12)'  },
    failed:    { label: 'Failed',     color: '#f87171',                bg: 'rgba(248,113,113,0.12)' },
  }
  const { label, color, bg } = config[status]
  return (
    <View className="px-2 py-0.5 rounded-full ml-3" style={{ backgroundColor: bg }}>
      <Text className="text-[10px] font-medium" style={{ color }}>{label}</Text>
    </View>
  )
}
