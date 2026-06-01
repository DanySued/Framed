import { Slot } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { QueryClientProvider } from '@tanstack/react-query'
import * as Sentry from '@sentry/react-native'
import { queryClient } from '@/lib/query-client'
import { AuthProvider } from '@/lib/auth-context'
import '../global.css'

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enabled: !__DEV__,
  tracesSampleRate: 0.2,
})

function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StatusBar style="light" />
        <Slot />
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default Sentry.wrap(RootLayout)
