import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'
import { getPromptById } from '@/lib/prompts'
import type { Visibility } from '@/lib/types'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const viewer = { userId: Number(session.user.id), isAdmin: session.user.role === 'Administrador' }
  const prompt = await getPromptById(Number(id), viewer)
  if (!prompt) return NextResponse.json({ error: 'Prompt não encontrado' }, { status: 404 })

  if (prompt.ownerId !== viewer.userId && !viewer.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const visibility = body.visibility as Visibility | undefined
  if (visibility !== 'shared' && visibility !== 'private') {
    return NextResponse.json({ error: 'Visibilidade inválida' }, { status: 400 })
  }

  const [row] = await sql`
    UPDATE prompts SET visibility = ${visibility} WHERE id = ${Number(id)}
    RETURNING id, visibility
  `
  return NextResponse.json(row)
}
