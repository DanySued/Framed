import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE } from './api';

const SESSION_KEY = '__framed_session';

export async function login(password: string): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? 'Invalid password');
  }
  const { token } = await res.json();
  await AsyncStorage.setItem(SESSION_KEY, token);
}

export async function logout(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY);
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(SESSION_KEY);
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getToken();
  return token !== null;
}
