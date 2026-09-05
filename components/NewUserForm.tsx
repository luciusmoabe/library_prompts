'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { createUser } from '@/lib/api'
import type { Role, User } from '@/lib/types'

export default function NewUserForm({ onSaved }: { onSaved: (user: User) => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('Leitor')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      const user = await createUser({ name, email, role })
      onSaved(user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar usuário')
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
        {saving ? 'Salvando...' : 'Salvar usuário'}
      </button>
      {error && <p className="login-error">{error}</p>}
    </form>
  )
}
