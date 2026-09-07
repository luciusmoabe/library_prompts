import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'
import { getPromptById } from '@/lib/prompts'
import type { Attachment, Prompt, Tag } from '@/lib/types'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const viewer = { userId: Number(session.user.id), isAdmin: session.user.role === 'Administrador' }
  const prompt = await getPromptById(Number(id), viewer)
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
  const promptId = Number(id)
  const body = await request.json()
  const { title, description, tagIds, content, purpose, whenToUse } = body as {
    title?: string
    description?: string
    tagIds?: number[]
    content?: string
    purpose?: string
    whenToUse?: string
  }

  if (
    !title?.trim() ||
    !description?.trim() ||
    !content?.trim() ||
    !purpose?.trim() ||
    !whenToUse?.trim() ||
    !tagIds?.length
  ) {
    return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
  }

  const [current] = await sql`
    SELECT title, description, content, purpose, when_to_use AS "whenToUse"
    FROM prompts WHERE id = ${promptId}
  `
  if (!current) return NextResponse.json({ error: 'Prompt não encontrado' }, { status: 404 })

  await sql`
    INSERT INTO prompt_versions (prompt_id, title, description, content, purpose, when_to_use, edited_by)
    VALUES (${promptId}, ${current.title}, ${current.description}, ${current.content}, ${current.purpose}, ${current.whenToUse}, ${Number(session.user.id)})
  `

  const [row] = await sql`
    UPDATE prompts
    SET title = ${title}, description = ${description},
        content = ${content}, purpose = ${purpose}, when_to_use = ${whenToUse}
    WHERE id = ${promptId}
    RETURNING id, title, description, content, purpose, when_to_use AS "whenToUse",
              favorite, visibility, owner_id AS "ownerId"
  `

  await sql`DELETE FROM prompt_tags WHERE prompt_id = ${promptId}`
  const tags: Tag[] = []
  for (const tagId of tagIds) {
    const [tag] = await sql`SELECT id, name FROM tags WHERE id = ${tagId}`
    if (!tag) continue
    await sql`INSERT INTO prompt_tags (prompt_id, tag_id) VALUES (${promptId}, ${tagId})`
    tags.push({ id: tag.id, name: tag.name })
  }

  const [ownerRow] = await sql`SELECT name FROM users WHERE id = ${row.ownerId}`
  const attachmentRows = await sql`
    SELECT name, size, url FROM prompt_attachments WHERE prompt_id = ${row.id}
  `

  const result: Prompt = {
    id: row.id,
    title: row.title,
    description: row.description,
    tags: tags.sort((a, b) => a.name.localeCompare(b.name)),
    content: row.content,
    purpose: row.purpose,
    whenToUse: row.whenToUse,
    owner: ownerRow?.name ?? '',
    ownerId: row.ownerId,
    favorite: row.favorite,
    visibility: row.visibility,
    attachments: (attachmentRows as (Attachment & { url: string | null })[]).map((a) => ({
      name: a.name,
      size: a.size,
      url: a.url ?? undefined,
    })),
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
  const viewer = { userId: Number(session.user.id), isAdmin: session.user.role === 'Administrador' }
  const prompt = await getPromptById(Number(id), viewer)
  if (!prompt) return NextResponse.json({ error: 'Prompt não encontrado' }, { status: 404 })

  const isOwner = prompt.ownerId === viewer.userId
  if (!viewer.isAdmin && !isOwner) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await sql`DELETE FROM prompts WHERE id = ${Number(id)}`
  return new NextResponse(null, { status: 204 })
}
