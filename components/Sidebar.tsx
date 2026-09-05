'use client'

import { signOut } from 'next-auth/react'
import type { Category, Prompt, Role } from '@/lib/types'

type Section = 'library' | 'categories' | 'users'

export default function Sidebar({
  section,
  category,
  onSelectLibrary,
  onSelectSection,
  onOpenNewPrompt,
  onOpenPassword,
  prompts,
  categories,
  canEdit,
  isAdmin,
  userName,
  userRole,
}: {
  section: Section
  category: string
  onSelectLibrary: (category: string) => void
  onSelectSection: (section: 'categories' | 'users') => void
  onOpenNewPrompt: () => void
  onOpenPassword: () => void
  prompts: Prompt[]
  categories: Category[]
  canEdit: boolean
  isAdmin: boolean
  userName: string
  userRole: Role
}) {
  const navItems = ['Todos os prompts', 'Favoritos', ...categories.map((c) => c.name)]

  function countFor(item: string) {
    if (item === 'Todos os prompts') return prompts.length
    if (item === 'Favoritos') return prompts.filter((p) => p.favorite).length
    return prompts.filter((p) => p.category === item).length
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
          className={section === 'library' && category === item ? 'nav-item active' : 'nav-item'}
          onClick={() => onSelectLibrary(item)}
        >
          {item}
          <span>{countFor(item)}</span>
        </button>
      ))}
      {isAdmin && (
        <>
          <p className="nav-label section-label">Administração</p>
          <button className={section === 'categories' ? 'nav-item active' : 'nav-item'} onClick={() => onSelectSection('categories')}>
            Categorias
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
