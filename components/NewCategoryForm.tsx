'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { createCategory } from '@/lib/api'
import type { Category } from '@/lib/types'

export default function NewCategoryForm({ onSaved }: { onSaved: (category: Category) => void }) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      const category = await createCategory(name.trim())
      onSaved(category)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar categoria')
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
