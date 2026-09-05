'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
import PromptLibrary from '@/components/PromptLibrary'
import AdminSection from '@/components/AdminSection'
import Modal from '@/components/Modal'
import NewPromptForm from '@/components/NewPromptForm'
import NewCategoryForm from '@/components/NewCategoryForm'
import NewUserForm from '@/components/NewUserForm'
import EditUserForm from '@/components/EditUserForm'
import ChangePasswordForm from '@/components/ChangePasswordForm'
import PromptDetailModal from '@/components/PromptDetailModal'
import { deleteCategory, deleteUser, getCategories, getPrompts, getUsers, toggleFavorite as apiToggleFavorite } from '@/lib/api'
import type { Category, Prompt, User } from '@/lib/types'

type ModalKind = 'prompt' | 'category' | 'user' | 'editUser' | 'password' | 'promptDetail' | null

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [section, setSection] = useState<'library' | 'categories' | 'users'>('library')
  const [category, setCategory] = useState('Todos os prompts')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [modal, setModal] = useState<ModalKind>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  const canEdit = session?.user.role !== 'Leitor'
  const isAdmin = session?.user.role === 'Administrador'

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  const loadData = useCallback(async (role: User['role'] | undefined) => {
    setLoading(true)
    setError('')
    try {
      const [promptsRes, categoriesRes] = await Promise.all([getPrompts(), getCategories()])
      setPrompts(promptsRes)
      setCategories(categoriesRes)
      if (role === 'Administrador') {
        setUsers(await getUsers())
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar os dados')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status !== 'authenticated' || !session) return
    loadData(session.user.role)
  }, [status, session, loadData])

  const filtered = useMemo(
    () =>
      prompts.filter((prompt) => {
        const byCategory = category === 'Todos os prompts' || (category === 'Favoritos' ? prompt.favorite : prompt.category === category)
        const text = `${prompt.title} ${prompt.description}`.toLowerCase()
        return byCategory && text.includes(query.toLowerCase())
      }),
    [prompts, category, query],
  )
  const selected = prompts.find((prompt) => prompt.id === selectedId)

  async function handleToggleFavorite(prompt: Prompt) {
    const nextFavorite = !prompt.favorite
    setPrompts((current) => current.map((p) => (p.id === prompt.id ? { ...p, favorite: nextFavorite } : p)))
    try {
      await apiToggleFavorite(prompt.id, nextFavorite)
    } catch (err) {
      setPrompts((current) => current.map((p) => (p.id === prompt.id ? { ...p, favorite: prompt.favorite } : p)))
      setError(err instanceof Error ? err.message : 'Não foi possível favoritar o prompt')
    }
  }

  async function handleDeleteCategory(id: number) {
    try {
      await deleteCategory(id)
      setCategories((current) => current.filter((c) => c.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível excluir a categoria')
    }
  }

  async function handleDeleteUser(id: number) {
    try {
      await deleteUser(id)
      setUsers((current) => current.filter((u) => u.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível excluir o usuário')
    }
  }

  if (status === 'loading' || status === 'unauthenticated' || !session) {
    return <div style={{ padding: '2rem' }}>Carregando sessão...</div>
  }

  return (
    <div className="app-shell">
      <Sidebar
        section={section}
        category={category}
        onSelectLibrary={(item) => {
          setSection('library')
          setCategory(item)
        }}
        onSelectSection={setSection}
        onOpenNewPrompt={() => setModal('prompt')}
        onOpenPassword={() => setModal('password')}
        prompts={prompts}
        categories={categories}
        canEdit={canEdit}
        isAdmin={isAdmin}
        userName={session.user.name}
        userRole={session.user.role}
      />
      <div className="main-content">
        <TopBar section={section} role={session.user.role} />
        <main id="section-content">
          {error && <div className="hint error-hint">{error}</div>}
          {loading ? (
            <div className="hint">Carregando...</div>
          ) : section === 'categories' || section === 'users' ? (
            <AdminSection
              section={section}
              categories={categories}
              users={users}
              onAdd={() => setModal(section === 'categories' ? 'category' : 'user')}
              onDeleteCategory={handleDeleteCategory}
              onEditUser={(user) => {
                setEditingUser(user)
                setModal('editUser')
              }}
              onDeleteUser={handleDeleteUser}
            />
          ) : (
            <PromptLibrary
              canEdit={canEdit}
              query={query}
              onQueryChange={setQuery}
              onOpenNewPrompt={() => setModal('prompt')}
              filtered={filtered}
              selectedId={selectedId}
              onSelect={(id) => {
                setSelectedId(id)
                setModal('promptDetail')
              }}
              onToggleFavorite={handleToggleFavorite}
            />
          )}
        </main>
      </div>

      {modal === 'prompt' && (
        <Modal title="Novo prompt" close={() => setModal(null)}>
          <NewPromptForm
            categories={categories}
            onSaved={(prompt) => {
              setPrompts((current) => [prompt, ...current])
              setSelectedId(prompt.id)
              setModal(null)
            }}
          />
        </Modal>
      )}
      {modal === 'category' && (
        <Modal title="Nova categoria" close={() => setModal(null)}>
          <NewCategoryForm
            onSaved={(newCategory) => {
              setCategories((current) => [...current, newCategory])
              setModal(null)
            }}
          />
        </Modal>
      )}
      {modal === 'user' && (
        <Modal title="Novo usuário" close={() => setModal(null)}>
          <NewUserForm
            onSaved={(user) => {
              setUsers((current) => [...current, user])
              setModal(null)
            }}
          />
        </Modal>
      )}
      {modal === 'editUser' && editingUser && (
        <Modal
          title="Editar usuário"
          close={() => {
            setModal(null)
            setEditingUser(null)
          }}
        >
          <EditUserForm
            user={editingUser}
            onSaved={(updated) => {
              setUsers((current) => current.map((u) => (u.id === updated.id ? updated : u)))
              setModal(null)
              setEditingUser(null)
            }}
          />
        </Modal>
      )}
      {modal === 'promptDetail' && selected && (
        <PromptDetailModal
          prompt={selected}
          categories={categories}
          canShowEdit={isAdmin || (session.user.role === 'Editor' && selected.ownerId === Number(session.user.id))}
          canActuallyEdit={isAdmin}
          onClose={() => setModal(null)}
          onSaved={(updated) => {
            setPrompts((current) => current.map((p) => (p.id === updated.id ? updated : p)))
          }}
        />
      )}
      {modal === 'password' && (
        <Modal title="Trocar senha" close={() => setModal(null)}>
          <ChangePasswordForm onSaved={() => setModal(null)} />
        </Modal>
      )}
    </div>
  )
}
