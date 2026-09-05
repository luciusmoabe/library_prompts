import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const favorite = Boolean(body.favorite)

  const [prompt] = await sql`
    UPDATE prompts SET favorite = ${favorite}
    WHERE id = ${Number(id)}
    RETURNING id, favorite
  `
  if (!prompt) return NextResponse.json({ error: 'Prompt não encontrado' }, { status: 404 })

  return NextResponse.json(prompt)
}
