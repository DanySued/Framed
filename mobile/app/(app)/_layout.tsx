import { Stack } from 'expo-router'

export default function AppLayout() {
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
