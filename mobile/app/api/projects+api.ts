import { createServerClient, SINGLE_USER_ID, serverError } from '@/lib/server-client'

export async function GET() {
  const db = createServerClient()

  const { data, error } = await db
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return serverError(error.message)
  return Response.json(data)
}

export async function POST(request: Request) {
  const db = createServerClient()

  const body = await request.json().catch(() => ({}))
  const title: string = body.title?.trim() || 'Untitled'

  const { data, error } = await db
    .from('projects')
    .insert({ user_id: SINGLE_USER_ID, title })
    .select()
    .single()

  if (error) return serverError(error.message)
  return Response.json(data, { status: 201 })
}
