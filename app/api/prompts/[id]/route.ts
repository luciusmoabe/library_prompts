import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'
import { getPromptById } from '@/lib/prompts'
import type { Attachment, Prompt } from '@/lib/types'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const prompt = await getPromptById(Number(id))
  if (!prompt) return NextResponse.json({ error: 'Prompt não encontrado' }, { status: 404 })

  return NextResponse.json(prompt)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'Administrador') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const { title, description, category, content, purpose, whenToUse } = body as {
    title?: string
    description?: string
    category?: string
    content?: string
    purpose?: string
    whenToUse?: string
  }

  if (
    !title?.trim() ||
    !description?.trim() ||
    !category?.trim() ||
    !content?.trim() ||
    !purpose?.trim() ||
    !whenToUse?.trim()
  ) {
    return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
  }

  const [row] = await sql`
    UPDATE prompts
    SET title = ${title}, description = ${description}, category = ${category},
        content = ${content}, purpose = ${purpose}, when_to_use = ${whenToUse}
    WHERE id = ${Number(id)}
    RETURNING id, title, description, category, content, purpose, when_to_use AS "whenToUse",
              favorite, owner_id AS "ownerId"
  `
  if (!row) return NextResponse.json({ error: 'Prompt não encontrado' }, { status: 404 })

  const [ownerRow] = await sql`SELECT name FROM users WHERE id = ${row.ownerId}`
  const attachmentRows = await sql`
    SELECT name, size FROM prompt_attachments WHERE prompt_id = ${row.id}
  `

  const result: Prompt = {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    content: row.content,
    purpose: row.purpose,
    whenToUse: row.whenToUse,
    owner: ownerRow?.name ?? '',
    ownerId: row.ownerId,
    favorite: row.favorite,
    attachments: attachmentRows as Attachment[],
  }

  return NextResponse.json(result)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role === 'Leitor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const prompt = await getPromptById(Number(id))
  if (!prompt) return NextResponse.json({ error: 'Prompt não encontrado' }, { status: 404 })

  const isOwner = prompt.ownerId === Number(session.user.id)
  if (session.user.role !== 'Administrador' && !isOwner) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await sql`DELETE FROM prompts WHERE id = ${Number(id)}`
  return new NextResponse(null, { status: 204 })
}
