'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { upload } from '@vercel/blob/client'
import { createPrompt } from '@/lib/api'
import { useToast } from '@/components/Toaster'
import type { Attachment, Prompt, Tag, Visibility } from '@/lib/types'
import PromptFormFields, { type PromptFieldValues } from '@/components/PromptFormFields'

export default function NewPromptForm({
  tags,
  initialValues,
  onSaved,
}: {
  tags: Tag[]
  initialValues?: Partial<PromptFieldValues> & { attachments?: Attachment[] }
  onSaved: (prompt: Prompt) => void
}) {
  const showToast = useToast()
  const [values, setValues] = useState<PromptFieldValues>({
    title: initialValues?.title ?? '',
    description: initialValues?.description ?? '',
    tagIds: initialValues?.tagIds ?? [],
    purpose: initialValues?.purpose ?? '',
    whenToUse: initialValues?.whenToUse ?? '',
    content: initialValues?.content ?? '',
  })
  const [visibility, setVisibility] = useState<Visibility>('shared')
  const [attachments, setAttachments] = useState<Attachment[]>(initialValues?.attachments ?? [])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function attachFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    setError('')
    try {
      for (const file of Array.from(files)) {
        const blob = await upload(file.name, file, { access: 'public', handleUploadUrl: '/api/uploads' })
        setAttachments((current) => [
          ...current,
          { name: file.name, size: `${Math.max(1, Math.round(file.size / 1024))} KB`, url: blob.url },
        ])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar o arquivo')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      const prompt = await createPrompt({ ...values, attachments, visibility })
      showToast('Prompt criado.')
      onSaved(prompt)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar o prompt')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <PromptFormFields values={values} onChange={setValues} tags={tags} />
      <label className="file-drop">
        ＋ Anexar arquivos
        <input type="file" multiple disabled={uploading} onChange={(event) => attachFiles(event.target.files)} />
      </label>
      {uploading && <p className="hint" style={{ padding: '4px 0' }}>Enviando arquivo...</p>}
      {attachments.map((file) => (
        <div className="selected-file" key={file.name}>
          {file.name}
          <span>{file.size}</span>
        </div>
      ))}
      <label>
        <input
          type="checkbox"
          checked={visibility === 'private'}
          onChange={(event) => setVisibility(event.target.checked ? 'private' : 'shared')}
          style={{ display: 'inline-block', width: 'auto', marginRight: 8 }}
        />
        Tornar este prompt privado
      </label>
      <button className="use-button" disabled={saving || uploading}>
        {saving ? 'Salvando...' : 'Salvar prompt'}
      </button>
      {error && <p className="login-error">{error}</p>}
    </form>
  )
}
