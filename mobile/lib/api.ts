import { supabase } from './supabase'

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? ''

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession()
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string>),
  }
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }
  if (!(init?.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }
  return fetch(`${API_BASE}${path}`, { ...init, headers })
}
