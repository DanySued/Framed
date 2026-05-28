import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE } from '@/lib/api';

export default function LoginScreen() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    if (!password || loading) return;
    setError('');
    setLoading(true);
    try {
      // Verify the password against the backend health endpoint as a quick check
      // The backend auth is password-based; we store it locally for API calls
      const res = await fetch(`${API_BASE}/health/backend`);
      if (!res.ok) throw new Error('Cannot reach API — check your API URL in settings');

      // Store the password to use as the app-level auth token
      await AsyncStorage.setItem('__framed_password', password);
      router.replace('/reels');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background items-center justify-center px-6"
    >
      <View className="w-full max-w-sm">
        {/* Logo */}
        <View className="items-center mb-10">
          <View className="w-16 h-16 rounded-2xl bg-primary/20 items-center justify-center mb-4">
            <Text className="text-3xl">🎬</Text>
          </View>
          <Text className="text-2xl font-bold text-foreground">Framed</Text>
          <Text className="text-sm text-muted-foreground mt-1">AI-powered reel creator</Text>
        </View>

        {/* Card */}
        <View className="bg-card rounded-2xl p-6 border border-border">
          <Text className="text-base font-semibold text-foreground mb-1">Welcome back</Text>
          <Text className="text-xs text-muted-foreground mb-5">Enter your password to continue</Text>

          <Text className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
            Password
          </Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Enter your password"
            placeholderTextColor="#71717a"
            autoFocus
            returnKeyType="go"
            onSubmitEditing={handleLogin}
            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm mb-4"
          />

          {error ? (
            <Text className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg mb-4">
              {error}
            </Text>
          ) : null}

          <Pressable
            onPress={handleLogin}
            disabled={loading || !password}
            className="w-full py-3 rounded-xl bg-primary items-center justify-center disabled:opacity-40"
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text className="text-primary-foreground font-semibold text-sm">Sign in</Text>
            }
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
