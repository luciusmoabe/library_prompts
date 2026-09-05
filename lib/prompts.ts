import { sql } from '@/lib/db'
import type { Attachment, Prompt } from '@/lib/types'

export async function getPromptById(id: number): Promise<Prompt | null> {
  const [row] = await sql`
    SELECT p.id, p.title, p.description, p.category, p.content, p.purpose,
           p.when_to_use AS "whenToUse", p.favorite, p.owner_id AS "ownerId", u.name AS owner
    FROM prompts p
    JOIN users u ON u.id = p.owner_id
    WHERE p.id = ${id}
  `
  if (!row) return null

  const attachmentRows = await sql`
    SELECT name, size FROM prompt_attachments WHERE prompt_id = ${id}
  `

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    content: row.content,
    purpose: row.purpose,
    whenToUse: row.whenToUse,
    owner: row.owner,
    ownerId: row.ownerId,
    favorite: row.favorite,
    attachments: attachmentRows as Attachment[],
  }
}
