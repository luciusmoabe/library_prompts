'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { updateUser } from '@/lib/api'
import { useToast } from '@/components/Toaster'
import type { Role, User } from '@/lib/types'

export default function EditUserForm({ user, onSaved }: { user: User; onSaved: (user: User) => void }) {
  const showToast = useToast()
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [role, setRole] = useState<Role>(user.role)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      const updated = await updateUser(user.id, { name, email, role })
      showToast('Usuário atualizado.')
      onSaved(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar usuário')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Nome
        <input required value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <label>
        E-mail
        <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
      </label>
      <label>
        Papel
        <select value={role} onChange={(event) => setRole(event.target.value as Role)}>
          <option>Administrador</option>
          <option>Editor</option>
          <option>Leitor</option>
        </select>
      </label>
      <button className="use-button" disabled={saving}>
        {saving ? 'Salvando...' : 'Salvar alterações'}
      </button>
      {error && <p className="login-error">{error}</p>}
    </form>
  )
}
