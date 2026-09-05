'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { updatePrompt } from '@/lib/api'
import type { Category, Prompt } from '@/lib/types'
import PromptFormFields, { type PromptFieldValues } from '@/components/PromptFormFields'

export default function PromptDetailView({
  prompt,
  categories,
  canShowEdit,
  canActuallyEdit,
}: {
  prompt: Prompt
  categories: Category[]
  canShowEdit: boolean
  canActuallyEdit: boolean
}) {
  const router = useRouter()
  const [current, setCurrent] = useState(prompt)
  const [editing, setEditing] = useState(false)

  return (
    <div className="prompt-detail-card">
      <div className="prompt-detail-header">
        <h2>{current.title}</h2>
        <span className="prompt-detail-category">{current.category}</span>
      </div>
      <div className="prompt-detail-body">
        {editing ? (
          <EditPromptFields
            prompt={current}
            categories={categories}
            onCancel={() => setEditing(false)}
            onSaved={(updated) => {
              setCurrent(updated)
              setEditing(false)
              router.refresh()
            }}
          />
        ) : (
          <>
            <div className="prompt-detail-section">
              <span className="prompt-detail-section-icon">◎</span>
              <div className="prompt-detail-section-body">
                <p className="prompt-detail-section-label">Para que serve</p>
                <p>{current.purpose}</p>
              </div>
            </div>
            <div className="prompt-detail-section">
              <span className="prompt-detail-section-icon">◷</span>
              <div className="prompt-detail-section-body">
                <p className="prompt-detail-section-label">Quando utilizar</p>
                <p>{current.whenToUse}</p>
              </div>
            </div>

            <div className="prompt-detail-content-head">
              <strong>Prompt completo</strong>
              <button className="prompt-detail-copy-button" onClick={() => navigator.clipboard?.writeText(current.content)}>
                ▧ Copiar
              </button>
            </div>
            <div className="prompt-detail-content-box">
              {current.content.split(/(\{\{.*?\}\})/g).map((part, index) =>
                part.startsWith('{{') ? <mark key={index}>{part}</mark> : <span key={index}>{part}</span>,
              )}
            </div>

            {current.attachments.length > 0 && (
              <div className="attachments">
                <strong>Anexos</strong>
                {current.attachments.map((file) => (
                  <div className="attachment" key={file.name}>
                    ▧ {file.name}
                    <small>{file.size}</small>
                  </div>
                ))}
              </div>
            )}

            {canShowEdit && (
              <div className="prompt-detail-footer">
                <button className="edit-button" onClick={canActuallyEdit ? () => setEditing(true) : undefined}>
                  Editar prompt
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function EditPromptFields({
  prompt,
  categories,
  onCancel,
  onSaved,
}: {
  prompt: Prompt
  categories: Category[]
  onCancel: () => void
  onSaved: (prompt: Prompt) => void
}) {
  const [values, setValues] = useState<PromptFieldValues>({
    title: prompt.title,
    description: prompt.description,
    category: prompt.category,
    purpose: prompt.purpose,
    whenToUse: prompt.whenToUse,
    content: prompt.content,
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      const updated = await updatePrompt(prompt.id, values)
      onSaved(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar o prompt')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <PromptFormFields values={values} onChange={setValues} categories={categories} />
      <div className="composer-actions">
        <button type="button" className="edit-button" onClick={onCancel}>
          Cancelar
        </button>
        <button className="use-button" disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>
      {error && <p className="login-error">{error}</p>}
    </form>
  )
}
