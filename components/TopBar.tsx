import type { Role } from '@/lib/types'

export default function TopBar({ section, role }: { section: 'library' | 'tags' | 'users'; role: Role }) {
  const label = section === 'library' ? 'Biblioteca' : 'Administração'
  return (
    <header className="topbar">
      <span>
        Workspace / <b>{label}</b>
      </span>
      <span className="role-badge">{role}</span>
    </header>
  )
}
