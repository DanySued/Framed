import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ReelGenerationProvider } from '@/lib/ReelGenerationContext';
import '../global.css';

export default function RootLayout() {
  return (
    <ReelGenerationProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#18181b' },
          headerTintColor: '#f4f4f5',
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: '#18181b' },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="reels" options={{ title: 'Framed', headerLargeTitle: true }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      </Stack>
    </ReelGenerationProvider>
  );
}
