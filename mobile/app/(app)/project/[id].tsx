import { View, Text } from 'react-native'
import { useLocalSearchParams } from 'expo-router'

export default function ProjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return (
    <View className="flex-1 bg-background items-center justify-center p-6">
      <Text className="text-4xl mb-4">🎬</Text>
      <Text className="text-base font-semibold text-foreground mb-2">
        {id === 'new' ? 'New project' : 'Project editor'}
      </Text>
      <Text className="text-sm text-muted-foreground text-center">
        Editor coming in Phase 5 — clip library in Phase 3
      </Text>
    </View>
  )
}
