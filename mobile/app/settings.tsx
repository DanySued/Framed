import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { apiFetch, API_BASE } from '@/lib/api';
import { logout } from '@/lib/auth';
import { FP_ACCENT } from '@/lib/theme';

export default function SettingsScreen() {
  const [pexelsKey, setPexelsKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const testPexels = async () => {
    if (!pexelsKey.trim()) {
      setStatus('error');
      setErrorMsg('Paste your API key first.');
      return;
    }
    setStatus('checking');
    setErrorMsg('');
    try {
      const res = await apiFetch('/health/pexels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: pexelsKey }),
      });
      if (res.ok) {
        setStatus('ok');
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus('error');
        setErrorMsg(data.detail ?? 'Connection failed.');
      }
    } catch {
      setStatus('error');
      setErrorMsg('Cannot reach API — check your network or API URL.');
    }
  };

  const handleSignOut = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 gap-5">

      {/* API Connections */}
      <View>
        <Text className="text-sm font-semibold text-foreground mb-1">API Connections</Text>
        <Text className="text-xs text-muted-foreground mb-4">
          Keys are stored on the backend and never leave your server.
        </Text>

        {/* Pexels card */}
        <View className="bg-card rounded-2xl p-5 border border-border">
          <View className="flex-row items-start justify-between mb-1">
            <Text className="text-sm font-semibold text-foreground">Pexels</Text>
            {status === 'ok' && (
              <View className="px-2 py-0.5 rounded-full border border-fp-lime/30 bg-fp-lime/10">
                <Text className="text-[10px] text-fp-lime">Connected</Text>
              </View>
            )}
            {status === 'error' && (
              <View className="px-2 py-0.5 rounded-full border border-destructive/30 bg-destructive/10">
                <Text className="text-[10px] text-destructive">Error</Text>
              </View>
            )}
          </View>
          <Text className="text-xs text-muted-foreground mb-4">
            Stock footage for reel generation
          </Text>

          <View className="flex-row gap-2 mb-3">
            <TextInput
              value={pexelsKey}
              onChangeText={setPexelsKey}
              placeholder="563492ad6f..."
              placeholderTextColor="rgba(255,255,255,0.28)"
              secureTextEntry
              className="flex-1 h-10 px-3 rounded-lg bg-secondary border border-border text-foreground text-xs font-mono"
            />
            <Pressable
              onPress={testPexels}
              disabled={status === 'checking'}
              className="h-10 px-4 rounded-lg bg-primary items-center justify-center disabled:opacity-50"
            >
              {status === 'checking'
                ? <ActivityIndicator color="#030203" size="small" />
                : <Text className="text-primary-foreground text-xs font-medium">Test</Text>
              }
            </Pressable>
          </View>

          {errorMsg ? (
            <Text className="text-xs text-destructive">{errorMsg}</Text>
          ) : null}
          {status === 'ok' ? (
            <Text className="text-xs text-fp-lime">Connected — key saved to backend</Text>
          ) : null}

          <View className="mt-4 pt-4 border-t border-border">
            <Text className="text-xs font-medium text-foreground mb-2">How to get a Pexels key</Text>
            {[
              'Go to pexels.com and create a free account',
              'Navigate to pexels.com/api',
              "Click 'Your API key'",
              'Copy and paste it above, then tap Test',
            ].map((step, i) => (
              <Text key={i} className="text-xs text-muted-foreground mb-1">
                <Text className="text-primary font-medium">{i + 1}. </Text>
                {step}
              </Text>
            ))}
          </View>
        </View>
      </View>

      {/* Account */}
      <View>
        <Text className="text-sm font-semibold text-foreground mb-4">Account</Text>
        <View className="bg-card rounded-2xl p-5 border border-border gap-4">
          <View>
            <Text className="text-xs text-muted-foreground mb-1">API Server</Text>
            <Text className="text-xs text-foreground font-mono" numberOfLines={1}>{API_BASE}</Text>
          </View>
          <Pressable
            onPress={handleSignOut}
            className="py-2.5 rounded-xl border border-destructive/30 bg-destructive/10 items-center"
          >
            <Text className="text-destructive text-sm font-medium">Sign out</Text>
          </Pressable>
        </View>
      </View>

    </ScrollView>
  );
}
