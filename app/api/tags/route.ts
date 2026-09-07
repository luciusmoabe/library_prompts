import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tags = await sql`SELECT id, name FROM tags ORDER BY name`
  return NextResponse.json(tags)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'Administrador') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const name = (body.name as string | undefined)?.trim()
  if (!name) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })

  const existing = await sql`SELECT id FROM tags WHERE name = ${name}`
  if (existing.length) {
    return NextResponse.json({ error: 'Tag já existe' }, { status: 409 })
  }

  const [tag] = await sql`
    INSERT INTO tags (name) VALUES (${name})
    RETURNING id, name
  `
  return NextResponse.json(tag, { status: 201 })
}
