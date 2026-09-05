import type { Category, User } from '@/lib/types'

export default function AdminSection({
  section,
  categories,
  users,
  onAdd,
  onDeleteCategory,
  onEditUser,
  onDeleteUser,
}: {
  section: 'categories' | 'users'
  categories: Category[]
  users: User[]
  onAdd: () => void
  onDeleteCategory: (id: number) => void
  onEditUser: (user: User) => void
  onDeleteUser: (id: number) => void
}) {
  return (
    <section className="content-wrap">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Controle do workspace</p>
          <h1>{section === 'categories' ? 'Categorias' : 'Usuários'}</h1>
        </div>
        <button className="primary-button" onClick={onAdd}>
          ＋ Novo cadastro
        </button>
      </div>
      <div className="admin-table">
        {section === 'categories'
          ? categories.map((item) => (
              <div className="table-row" key={item.id}>
                <strong>{item.name}</strong>
                <span className="row-spacer" />
                <button onClick={() => onDeleteCategory(item.id)}>Excluir</button>
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
