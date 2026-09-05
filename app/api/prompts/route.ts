import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'
import type { Attachment, Prompt } from '@/lib/types'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await sql`
    SELECT p.id, p.title, p.description, p.category, p.content, p.favorite,
           p.owner_id AS "ownerId", u.name AS owner
    FROM prompts p
    JOIN users u ON u.id = p.owner_id
    ORDER BY p.created_at DESC
  `
  const attachmentRows = await sql`
    SELECT prompt_id AS "promptId", name, size FROM prompt_attachments
  `
  const attachmentsByPrompt = new Map<number, Attachment[]>()
  for (const row of attachmentRows) {
    const list = attachmentsByPrompt.get(row.promptId) ?? []
    list.push({ name: row.name, size: row.size })
    attachmentsByPrompt.set(row.promptId, list)
  }

  const prompts: Prompt[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    content: row.content,
    owner: row.owner,
    ownerId: row.ownerId,
    favorite: row.favorite,
    attachments: attachmentsByPrompt.get(row.id) ?? [],
  }))

  return NextResponse.json(prompts)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role === 'Leitor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { title, description, category, content, attachments } = body as {
    title?: string
    description?: string
    category?: string
    content?: string
    attachments?: Attachment[]
  }

  if (!title?.trim() || !description?.trim() || !category?.trim() || !content?.trim()) {
    return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
  }

  const ownerId = Number(session.user.id)
  const [prompt] = await sql`
    INSERT INTO prompts (title, description, category, content, owner_id, favorite)
    VALUES (${title}, ${description}, ${category}, ${content}, ${ownerId}, false)
    RETURNING id, title, description, category, content, favorite, owner_id AS "ownerId"
  `

  const savedAttachments: Attachment[] = []
  for (const attachment of attachments ?? []) {
    await sql`
      INSERT INTO prompt_attachments (prompt_id, name, size)
      VALUES (${prompt.id}, ${attachment.name}, ${attachment.size})
    `
    savedAttachments.push(attachment)
  }

  const result: Prompt = {
    id: prompt.id,
    title: prompt.title,
    description: prompt.description,
    category: prompt.category,
    content: prompt.content,
    owner: session.user.name,
    ownerId: prompt.ownerId,
    favorite: prompt.favorite,
    attachments: savedAttachments,
  }

  return NextResponse.json(result, { status: 201 })
}
