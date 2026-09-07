import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'
import { getPromptById } from '@/lib/prompts'
import PromptDetailView from '@/components/PromptDetailView'
import SignOutButton from '@/components/SignOutButton'
import type { Tag } from '@/lib/types'

export default async function PromptPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const { id } = await params
  const isAdmin = session.user.role === 'Administrador'
  const userId = Number(session.user.id)
  const viewer = { userId, isAdmin }

  const [prompt, tags] = await Promise.all([
    getPromptById(Number(id), viewer),
    sql`SELECT id, name FROM tags ORDER BY name` as unknown as Promise<Tag[]>,
  ])

  const isOwner = prompt?.ownerId === userId
  const canManage = isAdmin || (session.user.role === 'Editor' && isOwner)
  const canToggleVisibility = isAdmin || isOwner
  const canDuplicate = session.user.role !== 'Leitor'

  return (
    <div className="app-shell">
      <div className="main-content" style={{ width: '100%' }}>
        <header className="topbar">
          <span>
            <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>
              Workspace / <b>Biblioteca</b>
            </Link>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span className="role-badge">{session.user.role}</span>
            <SignOutButton />
          </span>
        </header>
        <main className="prompt-page">
          <Link href="/" className="back-link">
            ← Voltar para a biblioteca
          </Link>
          {prompt ? (
            <PromptDetailView
              key={prompt.id}
              prompt={prompt}
              tags={tags}
              canManage={canManage}
              canActuallyEdit={isAdmin}
              canToggleVisibility={canToggleVisibility}
              canDuplicate={canDuplicate}
              isAdmin={isAdmin}
            />
          ) : (
            <div className="hint">Prompt não encontrado.</div>
          )}
        </main>
      </div>
    </div>
  )
}
