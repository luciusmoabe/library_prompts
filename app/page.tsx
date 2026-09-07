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
import NewTagForm from '@/components/NewTagForm'
import NewUserForm from '@/components/NewUserForm'
import EditUserForm from '@/components/EditUserForm'
import ChangePasswordForm from '@/components/ChangePasswordForm'
import PromptCardSkeleton from '@/components/PromptCardSkeleton'
import { useToast } from '@/components/Toaster'
import { deleteTag, deleteUser, getPrompts, getTags, getUsers, toggleFavorite as apiToggleFavorite } from '@/lib/api'
import type { Prompt, Tag, User } from '@/lib/types'

type ModalKind = 'prompt' | 'tag' | 'user' | 'editUser' | 'password' | null

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const showToast = useToast()

  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [section, setSection] = useState<'library' | 'tags' | 'users'>('library')
  const [tagFilter, setTagFilter] = useState('Todos os prompts')
  const [query, setQuery] = useState('')
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
      const [promptsRes, tagsRes] = await Promise.all([getPrompts(), getTags()])
      setPrompts(promptsRes)
      setTags(tagsRes)
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
        const byTag =
          tagFilter === 'Todos os prompts' ||
          (tagFilter === 'Favoritos' ? prompt.favorite : prompt.tags.some((t) => t.name === tagFilter))
        const text = `${prompt.title} ${prompt.description} ${prompt.content}`.toLowerCase()
        return byTag && text.includes(query.toLowerCase())
      }),
    [prompts, tagFilter, query],
  )

  async function handleToggleFavorite(prompt: Prompt) {
    const nextFavorite = !prompt.favorite
    setPrompts((current) => current.map((p) => (p.id === prompt.id ? { ...p, favorite: nextFavorite } : p)))
    try {
      await apiToggleFavorite(prompt.id, nextFavorite)
      showToast(nextFavorite ? 'Adicionado aos favoritos.' : 'Removido dos favoritos.')
    } catch (err) {
      setPrompts((current) => current.map((p) => (p.id === prompt.id ? { ...p, favorite: prompt.favorite } : p)))
      setError(err instanceof Error ? err.message : 'Não foi possível favoritar o prompt')
    }
  }

  async function handleDeleteTag(id: number) {
    try {
      await deleteTag(id)
      setTags((current) => current.filter((t) => t.id !== id))
      showToast('Tag excluída.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível excluir a tag')
    }
  }

  async function handleDeleteUser(id: number) {
    try {
      await deleteUser(id)
      setUsers((current) => current.filter((u) => u.id !== id))
      showToast('Usuário excluído.')
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
        tagFilter={tagFilter}
        onSelectLibrary={(item) => {
          setSection('library')
          setTagFilter(item)
        }}
        onSelectSection={setSection}
        onOpenNewPrompt={() => setModal('prompt')}
        onOpenPassword={() => setModal('password')}
        prompts={prompts}
        tags={tags}
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
            section === 'library' ? (
              <section className="content-wrap">
                <div className="library-layout">
                  <div className="cards">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <PromptCardSkeleton key={i} />
                    ))}
                  </div>
                </div>
              </section>
            ) : (
              <div className="hint">Carregando...</div>
            )
          ) : section === 'tags' || section === 'users' ? (
            <AdminSection
              section={section}
              tags={tags}
              users={users}
              onAdd={() => setModal(section === 'tags' ? 'tag' : 'user')}
              onDeleteTag={handleDeleteTag}
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
              totalPrompts={prompts.length}
              onToggleFavorite={handleToggleFavorite}
            />
          )}
        </main>
      </div>

      {modal === 'prompt' && (
        <Modal title="Novo prompt" close={() => setModal(null)}>
          <NewPromptForm
            tags={tags}
            onSaved={(prompt) => {
              setPrompts((current) => [prompt, ...current])
              setModal(null)
            }}
          />
        </Modal>
      )}
      {modal === 'tag' && (
        <Modal title="Nova tag" close={() => setModal(null)}>
          <NewTagForm
            onSaved={(newTag) => {
              setTags((current) => [...current, newTag])
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
      {modal === 'password' && (
        <Modal title="Trocar senha" close={() => setModal(null)}>
          <ChangePasswordForm onSaved={() => setModal(null)} />
        </Modal>
      )}
    </div>
  )
}
