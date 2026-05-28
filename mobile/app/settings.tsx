import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { API_BASE } from '@/lib/api';

export default function SettingsScreen() {
  const [pexelsKey, setPexelsKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const testPexels = async () => {
    if (!pexelsKey.trim()) {
      setStatus('error');
      setErrorMsg('Paste your API key first.');
      return;
    }
    setStatus('checking');
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE}/health/pexels`, {
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

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6">
      <Text className="text-sm font-semibold text-foreground mb-1">API Connections</Text>
      <Text className="text-xs text-muted-foreground mb-5">
        Keys are stored on the backend and never leave your server.
      </Text>

      {/* Pexels card */}
      <View className="bg-card rounded-2xl p-5 border border-border">
        <View className="flex-row items-start justify-between mb-1">
          <Text className="text-sm font-semibold text-foreground">Pexels</Text>
          {status === 'ok' && (
            <View className="px-2 py-0.5 rounded-full border border-emerald-400/30 bg-emerald-400/10">
              <Text className="text-[10px] text-emerald-400">Connected</Text>
            </View>
          )}
          {status === 'error' && (
            <View className="px-2 py-0.5 rounded-full border border-red-400/30 bg-red-400/10">
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
            placeholderTextColor="#71717a"
            secureTextEntry
            className="flex-1 h-10 px-3 rounded-lg bg-secondary border border-border text-foreground text-xs font-mono"
          />
          <Pressable
            onPress={testPexels}
            disabled={status === 'checking'}
            className="h-10 px-4 rounded-lg bg-primary items-center justify-center disabled:opacity-50"
          >
            {status === 'checking'
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text className="text-primary-foreground text-xs font-medium">Test</Text>
            }
          </Pressable>
        </View>

        {errorMsg ? (
          <Text className="text-xs text-destructive">{errorMsg}</Text>
        ) : null}
        {status === 'ok' ? (
          <Text className="text-xs text-emerald-400">Connected — key saved to backend</Text>
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
    </ScrollView>
  );
}
