import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'
import { getPromptById } from '@/lib/prompts'
import PromptDetailView from '@/components/PromptDetailView'
import SignOutButton from '@/components/SignOutButton'
import type { Category } from '@/lib/types'

export default async function PromptPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const { id } = await params
  const isAdmin = session.user.role === 'Administrador'

  const categoriesPromise: Promise<Category[]> = isAdmin
    ? (sql`SELECT id, name FROM categories ORDER BY name` as unknown as Promise<Category[]>)
    : Promise.resolve([])
  const [prompt, categories] = await Promise.all([getPromptById(Number(id)), categoriesPromise])

  const canManage = isAdmin || (session.user.role === 'Editor' && prompt?.ownerId === Number(session.user.id))

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
            <PromptDetailView key={prompt.id} prompt={prompt} categories={categories} canManage={canManage} canActuallyEdit={isAdmin} />
          ) : (
            <div className="hint">Prompt não encontrado.</div>
          )}
        </main>
      </div>
    </div>
  )
}
