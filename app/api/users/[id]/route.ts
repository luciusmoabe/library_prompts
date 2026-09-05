import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'

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
