import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'
import type { PromptVersion } from '@/lib/types'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'Administrador') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const rows = await sql`
    SELECT pv.id, pv.title, pv.description, pv.content, pv.purpose,
           pv.when_to_use AS "whenToUse", pv.created_at AS "createdAt", u.name AS "editedBy"
    FROM prompt_versions pv
    LEFT JOIN users u ON u.id = pv.edited_by
    WHERE pv.prompt_id = ${Number(id)}
    ORDER BY pv.created_at DESC
  `

  const versions: PromptVersion[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    content: row.content,
    purpose: row.purpose,
    whenToUse: row.whenToUse,
    editedBy: row.editedBy ?? null,
    createdAt: row.createdAt,
  }))

  return NextResponse.json(versions)
}
