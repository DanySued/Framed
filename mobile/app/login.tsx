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
import { login } from '@/lib/auth';

export default function LoginScreen() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!password || loading) return;
    setError('');
    setLoading(true);
    try {
      await login(password);
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
          <View
            className="w-16 h-16 rounded-2xl bg-primary/20 items-center justify-center mb-4"
            style={{ borderWidth: 1, borderColor: 'rgba(170,168,255,0.3)' }}
          >
            <Text className="text-3xl">🎬</Text>
          </View>
          <Text className="text-2xl font-bold text-foreground">Framed</Text>
          <Text className="text-sm text-muted-foreground mt-1">Your personal reels creation tool</Text>
        </View>

        {/* Card */}
        <View className="bg-card rounded-2xl p-6 border border-border">
          <Text className="text-base font-semibold text-foreground mb-1">Welcome back</Text>
          <Text className="text-xs text-muted-foreground mb-5">Enter your password to continue</Text>

          <Text className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
            Password
          </Text>
          <View className="flex-row items-center bg-secondary border border-border rounded-xl mb-4">
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholder="Enter your password"
              placeholderTextColor="rgba(255,255,255,0.28)"
              autoFocus
              returnKeyType="go"
              onSubmitEditing={handleLogin}
              className="flex-1 px-4 py-3 text-foreground text-sm"
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} className="px-3 py-3">
              <Text className="text-muted-foreground text-xs">{showPassword ? '🙈' : '👁'}</Text>
            </Pressable>
          </View>

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
              ? <ActivityIndicator color="#030203" />
              : <Text className="text-primary-foreground font-semibold text-sm">Sign in</Text>
            }
          </Pressable>
        </View>

        {/* First-time guide */}
        <Pressable onPress={() => setShowGuide(!showGuide)} className="mt-4 items-center">
          <Text className="text-xs text-muted-foreground">
            First time here? {showGuide ? '▲' : '▼'}
          </Text>
        </Pressable>

        {showGuide && (
          <View className="mt-3 bg-card rounded-xl p-4 border border-border">
            {[
              'Deploy the Framed API to Render',
              'Set your APP_PASSWORD environment variable',
              'Set EXPO_PUBLIC_API_URL to your API URL',
              'Enter that password above',
            ].map((step, i) => (
              <Text key={i} className="text-xs text-muted-foreground mb-1.5">
                <Text className="text-primary font-semibold">{i + 1}. </Text>{step}
              </Text>
            ))}
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
