const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? ''

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string>),
  }
  if (!(init?.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }
  return fetch(`${API_BASE}${path}`, { ...init, headers })
}
