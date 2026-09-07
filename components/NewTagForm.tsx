'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { createTag } from '@/lib/api'
import { useToast } from '@/components/Toaster'
import type { Tag } from '@/lib/types'

export default function NewTagForm({ onSaved }: { onSaved: (tag: Tag) => void }) {
  const showToast = useToast()
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      const tag = await createTag(name.trim())
      showToast('Tag criada.')
      onSaved(tag)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar tag')
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
      <button className="use-button" disabled={saving}>
        {saving ? 'Salvando...' : 'Salvar'}
      </button>
      {error && <p className="login-error">{error}</p>}
    </form>
  )
}
