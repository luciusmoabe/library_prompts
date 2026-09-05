import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'
import type { Role } from '@/lib/types'

const VALID_ROLES: Role[] = ['Administrador', 'Editor', 'Leitor']

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'Administrador') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const name = (body.name as string | undefined)?.trim()
  const email = (body.email as string | undefined)?.trim()
  const role = body.role as Role | undefined

  if (!name || !email || !role || !VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Campos obrigatórios ausentes ou inválidos' }, { status: 400 })
  }

  const existing = await sql`SELECT id FROM users WHERE email = ${email} AND id != ${Number(id)}`
  if (existing.length) {
    return NextResponse.json({ error: 'E-mail já cadastrado para outro usuário' }, { status: 409 })
  }

  const [user] = await sql`
    UPDATE users SET name = ${name}, email = ${email}, role = ${role}
    WHERE id = ${Number(id)}
    RETURNING id, name, email, role
  `
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  return NextResponse.json(user)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'Administrador') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  if (Number(id) === Number(session.user.id)) {
    return NextResponse.json({ error: 'Você não pode excluir seu próprio usuário' }, { status: 403 })
  }

  try {
    await sql`DELETE FROM users WHERE id = ${Number(id)}`
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && err.code === '23503') {
      return NextResponse.json(
        { error: 'Não é possível excluir: usuário possui prompts associados' },
        { status: 409 },
      )
    }
    throw err
  }

  return new NextResponse(null, { status: 204 })
}
