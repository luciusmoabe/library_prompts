'use client'

import { signOut } from 'next-auth/react'
import type { Prompt, Role, Tag } from '@/lib/types'

type Section = 'library' | 'tags' | 'users'

export default function Sidebar({
  section,
  tagFilter,
  onSelectLibrary,
  onSelectSection,
  onOpenNewPrompt,
  onOpenPassword,
  prompts,
  tags,
  canEdit,
  isAdmin,
  userName,
  userRole,
}: {
  section: Section
  tagFilter: string
  onSelectLibrary: (tagFilter: string) => void
  onSelectSection: (section: 'tags' | 'users') => void
  onOpenNewPrompt: () => void
  onOpenPassword: () => void
  prompts: Prompt[]
  tags: Tag[]
  canEdit: boolean
  isAdmin: boolean
  userName: string
  userRole: Role
}) {
  const navItems = ['Todos os prompts', 'Favoritos', ...tags.map((t) => t.name)]

  function countFor(item: string) {
    if (item === 'Todos os prompts') return prompts.length
    if (item === 'Favoritos') return prompts.filter((p) => p.favorite).length
    return prompts.filter((p) => p.tags.some((t) => t.name === item)).length
  }

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">✦</span>
        <span>Promptly</span>
      </div>
      {canEdit && (
        <button className="new-button" onClick={onOpenNewPrompt}>
          ＋ Novo prompt
        </button>
      )}
      <p className="nav-label">Biblioteca</p>
      {navItems.map((item) => (
        <button
          key={item}
          className={section === 'library' && tagFilter === item ? 'nav-item active' : 'nav-item'}
          onClick={() => onSelectLibrary(item)}
        >
          {item}
          <span>{countFor(item)}</span>
        </button>
      ))}
      {isAdmin && (
        <>
          <p className="nav-label section-label">Administração</p>
          <button className={section === 'tags' ? 'nav-item active' : 'nav-item'} onClick={() => onSelectSection('tags')}>
            Tags
          </button>
          <button className={section === 'users' ? 'nav-item active' : 'nav-item'} onClick={() => onSelectSection('users')}>
            Usuários
          </button>
        </>
      )}
      <button className="nav-item" onClick={onOpenPassword}>
        Trocar senha
      </button>
      <div className="sidebar-footer">
        <strong>{userName}</strong>
        <span>{userRole}</span>
        <button className="more" onClick={() => signOut({ callbackUrl: '/login' })}>
          Sair
        </button>
      </div>
    </aside>
  )
}
