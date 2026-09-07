import { sql } from '@/lib/db'
import type { Attachment, Prompt, Tag } from '@/lib/types'

export type Viewer = { userId: number; isAdmin: boolean }

function canSee(ownerId: number, visibility: string, viewer: Viewer): boolean {
  return visibility === 'shared' || ownerId === viewer.userId || viewer.isAdmin
}

export async function getPromptById(id: number, viewer: Viewer): Promise<Prompt | null> {
  const [row] = await sql`
    SELECT p.id, p.title, p.description, p.content, p.purpose,
           p.when_to_use AS "whenToUse", p.favorite, p.visibility,
           p.owner_id AS "ownerId", u.name AS owner
    FROM prompts p
    JOIN users u ON u.id = p.owner_id
    WHERE p.id = ${id}
  `
  if (!row) return null
  if (!canSee(row.ownerId, row.visibility, viewer)) return null

  const tagRows = await sql`
    SELECT t.id, t.name FROM prompt_tags pt JOIN tags t ON t.id = pt.tag_id
    WHERE pt.prompt_id = ${id} ORDER BY t.name
  `
  const attachmentRows = await sql`
    SELECT name, size, url FROM prompt_attachments WHERE prompt_id = ${id}
  `

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    tags: tagRows as Tag[],
    content: row.content,
    purpose: row.purpose,
    whenToUse: row.whenToUse,
    owner: row.owner,
    ownerId: row.ownerId,
    favorite: row.favorite,
    visibility: row.visibility,
    attachments: (attachmentRows as (Attachment & { url: string | null })[]).map((a) => ({
      name: a.name,
      size: a.size,
      url: a.url ?? undefined,
    })),
  }
}
