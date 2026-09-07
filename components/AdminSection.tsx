import type { Tag, User } from '@/lib/types'

export default function AdminSection({
  section,
  tags,
  users,
  onAdd,
  onDeleteTag,
  onEditUser,
  onDeleteUser,
}: {
  section: 'tags' | 'users'
  tags: Tag[]
  users: User[]
  onAdd: () => void
  onDeleteTag: (id: number) => void
  onEditUser: (user: User) => void
  onDeleteUser: (id: number) => void
}) {
  return (
    <section className="content-wrap">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Controle do workspace</p>
          <h1>{section === 'tags' ? 'Tags' : 'Usuários'}</h1>
        </div>
        <button className="primary-button" onClick={onAdd}>
          ＋ Novo cadastro
        </button>
      </div>
      <div className="admin-table">
        {section === 'tags'
          ? tags.map((item) => (
              <div className="table-row" key={item.id}>
                <strong>{item.name}</strong>
                <span className="row-spacer" />
                <button onClick={() => onDeleteTag(item.id)}>Excluir</button>
              </div>
            ))
          : users.map((user) => (
              <div className="table-row" key={user.id}>
                <strong>{user.name}</strong>
                <span>{user.email}</span>
                <span className="role-badge">{user.role}</span>
                <button onClick={() => onEditUser(user)}>Editar</button>
                <button onClick={() => onDeleteUser(user.id)}>Excluir</button>
              </div>
            ))}
      </div>
    </section>
  )
}
