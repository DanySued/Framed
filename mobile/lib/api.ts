// Base URL for the Framed API — set this to your Render service URL in production
export const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

export async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, init);
  return res;
}
