'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { createPrompt } from '@/lib/api'
import type { Attachment, Category, Prompt } from '@/lib/types'
import PromptFormFields, { type PromptFieldValues } from '@/components/PromptFormFields'

export default function NewPromptForm({
  categories,
  onSaved,
}: {
  categories: Category[]
  onSaved: (prompt: Prompt) => void
}) {
  const [values, setValues] = useState<PromptFieldValues>({
    title: '',
    description: '',
    category: categories[0]?.name ?? 'Geral',
    purpose: '',
    whenToUse: '',
    content: '',
  })
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function attachFiles(files: FileList | null) {
    if (!files) return
    setAttachments((current) => [
      ...current,
      ...Array.from(files).map((file) => ({ name: file.name, size: `${Math.max(1, Math.round(file.size / 1024))} KB` })),
    ])
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      const prompt = await createPrompt({ ...values, attachments })
      onSaved(prompt)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar o prompt')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <PromptFormFields values={values} onChange={setValues} categories={categories} />
      <label className="file-drop">
        ＋ Anexar arquivos
        <input type="file" multiple onChange={(event) => attachFiles(event.target.files)} />
      </label>
      {attachments.map((file) => (
        <div className="selected-file" key={file.name}>
          {file.name}
          <span>{file.size}</span>
        </div>
      ))}
      <button className="use-button" disabled={saving}>
        {saving ? 'Salvando...' : 'Salvar prompt'}
      </button>
      {error && <p className="login-error">{error}</p>}
    </form>
  )
}
