'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { changePassword } from '@/lib/api'
import { useToast } from '@/components/Toaster'

export default function ChangePasswordForm({ onSaved }: { onSaved: () => void }) {
  const showToast = useToast()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (next.length < 6 || next !== confirm) {
      setError('A nova senha deve ter ao menos 6 caracteres e confirmar corretamente.')
      return
    }
    setSaving(true)
    try {
      await changePassword({ current, next, confirm })
      showToast('Senha alterada.')
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao trocar a senha')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Senha atual
        <input required type="password" value={current} onChange={(event) => setCurrent(event.target.value)} />
      </label>
      <label>
        Nova senha
        <input required minLength={6} type="password" value={next} onChange={(event) => setNext(event.target.value)} />
      </label>
      <label>
        Confirmar senha
        <input required type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} />
      </label>
      <button className="use-button" disabled={saving}>
        {saving ? 'Salvando...' : 'Alterar senha'}
      </button>
      {error && <p className="login-error">{error}</p>}
    </form>
  )
}
