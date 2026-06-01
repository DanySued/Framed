import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { supabase } from '@/lib/supabase'
import { FR_GOLD } from '@/lib/theme'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'sign_in' | 'sign_up'>('sign_in')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handle = async () => {
    if (!email.trim() || !password || loading) return
    setError('')
    setLoading(true)
    try {
      const { error } =
        mode === 'sign_in'
          ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
          : await supabase.auth.signUp({ email: email.trim(), password })
      if (error) throw error
      // Session update triggers AuthProvider → (app) layout lets user through
    } catch (err: any) {
      setError(err.message ?? 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background items-center justify-center px-6"
    >
      <View className="w-full max-w-sm">
        {/* Logo */}
        <View className="items-center mb-10">
          <View
            className="w-16 h-16 rounded-2xl bg-primary/15 items-center justify-center mb-4"
            style={{ borderWidth: 1, borderColor: 'rgba(212,168,75,0.25)' }}
          >
            <Text className="text-3xl">🎬</Text>
          </View>
          <Text className="text-2xl font-bold text-foreground">Framed</Text>
          <Text className="text-sm text-muted-foreground mt-1">Compile your story</Text>
        </View>

        {/* Card */}
        <View className="bg-card rounded-2xl p-6 border border-border">
          <Text className="text-base font-semibold text-foreground mb-1">
            {mode === 'sign_in' ? 'Welcome back' : 'Create account'}
          </Text>
          <Text className="text-xs text-muted-foreground mb-5">
            {mode === 'sign_in' ? 'Sign in to continue' : 'Get started with Framed'}
          </Text>

          <Text className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
            Email
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor="rgba(245,240,232,0.22)"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm mb-4"
          />

          <Text className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
            Password
          </Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="rgba(245,240,232,0.22)"
            secureTextEntry
            returnKeyType="go"
            onSubmitEditing={handle}
            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm mb-4"
          />

          {error ? (
            <Text className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg mb-4">
              {error}
            </Text>
          ) : null}

          <Pressable
            onPress={handle}
            disabled={loading || !email || !password}
            className="w-full py-3 rounded-xl bg-primary items-center justify-center disabled:opacity-40"
          >
            {loading
              ? <ActivityIndicator color="#0a0800" />
              : <Text className="text-primary-foreground font-semibold text-sm">
                  {mode === 'sign_in' ? 'Sign in' : 'Create account'}
                </Text>
            }
          </Pressable>
        </View>

        <Pressable
          onPress={() => { setMode(mode === 'sign_in' ? 'sign_up' : 'sign_in'); setError('') }}
          className="mt-4 items-center"
        >
          <Text className="text-xs text-muted-foreground">
            {mode === 'sign_in' ? "Don't have an account? " : 'Already have an account? '}
            <Text className="text-primary">
              {mode === 'sign_in' ? 'Sign up' : 'Sign in'}
            </Text>
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}
