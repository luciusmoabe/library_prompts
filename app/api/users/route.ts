import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'
import type { Role } from '@/lib/types'

const VALID_ROLES: Role[] = ['Administrador', 'Editor', 'Leitor']

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'Administrador') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const users = await sql`SELECT id, name, email, role FROM users ORDER BY name`
  return NextResponse.json(users)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'Administrador') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const name = (body.name as string | undefined)?.trim()
  const email = (body.email as string | undefined)?.trim()
  const role = body.role as Role | undefined
  const password = body.password as string | undefined

  if (!name || !email || !role || !VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Campos obrigatórios ausentes ou inválidos' }, { status: 400 })
  }
  if (!password || password.length < 6) {
    return NextResponse.json({ error: 'Senha deve ter ao menos 6 caracteres' }, { status: 400 })
  }

  const existing = await sql`SELECT id FROM users WHERE email = ${email}`
  if (existing.length) {
    return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const [user] = await sql`
    INSERT INTO users (name, email, role, password_hash)
    VALUES (${name}, ${email}, ${role}, ${passwordHash})
    RETURNING id, name, email, role
  `
  return NextResponse.json(user, { status: 201 })
}
