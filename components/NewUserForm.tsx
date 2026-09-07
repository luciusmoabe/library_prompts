'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { createUser } from '@/lib/api'
import { useToast } from '@/components/Toaster'
import type { Role, User } from '@/lib/types'

export default function NewUserForm({ onSaved }: { onSaved: (user: User) => void }) {
  const showToast = useToast()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('Leitor')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('A senha deve ter ao menos 6 caracteres.')
      return
    }
    setSaving(true)
    try {
      const user = await createUser({ name, email, role, password })
      showToast('Usuário criado.')
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
      <label>
        Senha inicial
        <input required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
      </label>
      <button className="use-button" disabled={saving}>
        {saving ? 'Salvando...' : 'Salvar usuário'}
      </button>
      {error && <p className="login-error">{error}</p>}
    </form>
  )
}
