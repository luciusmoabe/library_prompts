'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import PromptDetailView from '@/components/PromptDetailView'
import { getCategories, getPrompt } from '@/lib/api'
import type { Category, Prompt } from '@/lib/types'

export default function PromptPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = Number(params.id)

  const [prompt, setPrompt] = useState<Prompt | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [promptRes, categoriesRes] = await Promise.all([getPrompt(id), getCategories()])
      setPrompt(promptRes)
      setCategories(categoriesRes)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar o prompt')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (status !== 'authenticated') return
    loadData()
  }, [status, loadData])

  if (status === 'loading' || status === 'unauthenticated' || !session) {
    return <div style={{ padding: '2rem' }}>Carregando sessão...</div>
  }

  const isAdmin = session.user.role === 'Administrador'

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
            <button className="icon-button" onClick={() => signOut({ callbackUrl: '/login' })}>
              Sair
            </button>
          </span>
        </header>
        <main className="prompt-page">
          <Link href="/" className="back-link">
            ← Voltar para a biblioteca
          </Link>
          {error && <div className="hint error-hint">{error}</div>}
          {loading ? (
            <div className="hint">Carregando...</div>
          ) : prompt ? (
            <PromptDetailView
              prompt={prompt}
              categories={categories}
              canShowEdit={isAdmin || (session.user.role === 'Editor' && prompt.ownerId === Number(session.user.id))}
              canActuallyEdit={isAdmin}
              onSaved={(updated) => setPrompt(updated)}
            />
          ) : (
            <div className="hint">Prompt não encontrado.</div>
          )}
        </main>
      </div>
    </div>
  )
}
