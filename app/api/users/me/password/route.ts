import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const current = body.current as string | undefined
  const next = body.next as string | undefined
  const confirm = body.confirm as string | undefined

  if (!current || !next || !confirm) {
    return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
  }
  if (next.length < 6 || next !== confirm) {
    return NextResponse.json({ error: 'Nova senha inválida' }, { status: 400 })
  }

  const userId = Number(session.user.id)
  const [user] = await sql`SELECT password_hash FROM users WHERE id = ${userId}`
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  const valid = await bcrypt.compare(current, user.password_hash as string)
  if (!valid) return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 401 })

  const newHash = await bcrypt.hash(next, 10)
  await sql`UPDATE users SET password_hash = ${newHash} WHERE id = ${userId}`

  return NextResponse.json({ ok: true })
}
