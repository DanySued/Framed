import { View, ActivityIndicator } from 'react-native'
import { Redirect, Stack } from 'expo-router'
import { useAuth } from '@/lib/auth-context'
import { FR_GOLD } from '@/lib/theme'

export default function AppLayout() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color={FR_GOLD} size="large" />
      </View>
    )
  }

  if (!session) return <Redirect href="/login" />

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#090909' },
        headerTintColor: 'rgba(245,240,232,0.88)',
        headerTitleStyle: { fontWeight: '600', color: 'rgba(245,240,232,0.88)' },
        contentStyle: { backgroundColor: '#090909' },
        headerShadowVisible: false,
      }}
    />
  )
}
