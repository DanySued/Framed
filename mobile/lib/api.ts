import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

export async function apiFetch(path: string, init?: RequestInit) {
  const token = await AsyncStorage.getItem('__framed_session');
  const existingHeaders = (init?.headers as Record<string, string>) ?? {};
  const headers: Record<string, string> = { ...existingHeaders };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(`${API_BASE}${path}`, { ...init, headers });
}
