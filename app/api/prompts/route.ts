import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'
import type { Attachment, Prompt, Tag, Visibility } from '@/lib/types'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = Number(session.user.id)
  const isAdmin = session.user.role === 'Administrador'

  const rows = await sql`
    SELECT p.id, p.title, p.description, p.content, p.purpose,
           p.when_to_use AS "whenToUse", p.favorite, p.visibility,
           p.owner_id AS "ownerId", u.name AS owner
    FROM prompts p
    JOIN users u ON u.id = p.owner_id
    WHERE p.visibility = 'shared' OR p.owner_id = ${userId} OR ${isAdmin}
    ORDER BY p.created_at DESC
  `
  const tagRows = await sql`
    SELECT pt.prompt_id AS "promptId", t.id, t.name
    FROM prompt_tags pt JOIN tags t ON t.id = pt.tag_id
  `
  const tagsByPrompt = new Map<number, Tag[]>()
  for (const row of tagRows) {
    const list = tagsByPrompt.get(row.promptId) ?? []
    list.push({ id: row.id, name: row.name })
    tagsByPrompt.set(row.promptId, list)
  }

  const attachmentRows = await sql`
    SELECT prompt_id AS "promptId", name, size, url FROM prompt_attachments
  `
  const attachmentsByPrompt = new Map<number, Attachment[]>()
  for (const row of attachmentRows) {
    const list = attachmentsByPrompt.get(row.promptId) ?? []
    list.push({ name: row.name, size: row.size, url: row.url ?? undefined })
    attachmentsByPrompt.set(row.promptId, list)
  }

  const prompts: Prompt[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    tags: (tagsByPrompt.get(row.id) ?? []).sort((a, b) => a.name.localeCompare(b.name)),
    content: row.content,
    purpose: row.purpose,
    whenToUse: row.whenToUse,
    owner: row.owner,
    ownerId: row.ownerId,
    favorite: row.favorite,
    visibility: row.visibility,
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
  const { title, description, tagIds, content, purpose, whenToUse, attachments, visibility } = body as {
    title?: string
    description?: string
    tagIds?: number[]
    content?: string
    purpose?: string
    whenToUse?: string
    attachments?: Attachment[]
    visibility?: Visibility
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

  const finalVisibility: Visibility = visibility === 'private' ? 'private' : 'shared'
  const ownerId = Number(session.user.id)
  const [prompt] = await sql`
    INSERT INTO prompts (title, description, content, purpose, when_to_use, owner_id, favorite, visibility)
    VALUES (${title}, ${description}, ${content}, ${purpose}, ${whenToUse}, ${ownerId}, false, ${finalVisibility})
    RETURNING id, title, description, content, purpose, when_to_use AS "whenToUse", favorite, visibility, owner_id AS "ownerId"
  `

  const tags: Tag[] = []
  for (const tagId of tagIds) {
    const [tag] = await sql`SELECT id, name FROM tags WHERE id = ${tagId}`
    if (!tag) continue
    await sql`INSERT INTO prompt_tags (prompt_id, tag_id) VALUES (${prompt.id}, ${tagId})`
    tags.push({ id: tag.id, name: tag.name })
  }

  const savedAttachments: Attachment[] = []
  for (const attachment of attachments ?? []) {
    await sql`
      INSERT INTO prompt_attachments (prompt_id, name, size, url)
      VALUES (${prompt.id}, ${attachment.name}, ${attachment.size}, ${attachment.url ?? null})
    `
    savedAttachments.push(attachment)
  }

  const result: Prompt = {
    id: prompt.id,
    title: prompt.title,
    description: prompt.description,
    tags: tags.sort((a, b) => a.name.localeCompare(b.name)),
    content: prompt.content,
    purpose: prompt.purpose,
    whenToUse: prompt.whenToUse,
    owner: session.user.name,
    ownerId: prompt.ownerId,
    favorite: prompt.favorite,
    visibility: prompt.visibility,
    attachments: savedAttachments,
  }

  return NextResponse.json(result, { status: 201 })
}
