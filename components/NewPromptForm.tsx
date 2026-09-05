'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { createPrompt } from '@/lib/api'
import type { Attachment, Category, Prompt } from '@/lib/types'

export default function NewPromptForm({
  categories,
  onSaved,
}: {
  categories: Category[]
  onSaved: (prompt: Prompt) => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState(categories[0]?.name ?? 'Geral')
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
      const prompt = await createPrompt({ title, description, category, content, attachments })
      onSaved(prompt)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar o prompt')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Título
        <input required value={title} onChange={(event) => setTitle(event.target.value)} />
      </label>
      <label>
        Descrição
        <input required value={description} onChange={(event) => setDescription(event.target.value)} />
      </label>
      <label>
        Categoria
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          {categories.map((item) => (
            <option key={item.id}>{item.name}</option>
          ))}
        </select>
      </label>
      <label>
        Conteúdo
        <textarea required rows={6} value={content} onChange={(event) => setContent(event.target.value)} />
      </label>
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
