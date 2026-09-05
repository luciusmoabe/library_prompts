'use client'

import { useState } from 'react'
import type { FormEvent, MouseEvent } from 'react'
import { updatePrompt } from '@/lib/api'
import type { Category, Prompt } from '@/lib/types'
import PromptFormFields, { type PromptFieldValues } from '@/components/PromptFormFields'

export default function PromptDetailModal({
  prompt,
  categories,
  canShowEdit,
  canActuallyEdit,
  onClose,
  onSaved,
}: {
  prompt: Prompt
  categories: Category[]
  canShowEdit: boolean
  canActuallyEdit: boolean
  onClose: () => void
  onSaved: (prompt: Prompt) => void
}) {
  const [editing, setEditing] = useState(false)

  function stop(event: MouseEvent) {
    event.stopPropagation()
  }

  return (
    <div className="prompt-modal-backdrop" onMouseDown={onClose}>
      <div className="prompt-modal" onMouseDown={stop}>
        <div className="prompt-modal-header">
          <button className="prompt-modal-close" onClick={onClose}>
            ×
          </button>
          <h2>{prompt.title}</h2>
          <span className="prompt-modal-category">{prompt.category}</span>
        </div>
        <div className="prompt-modal-body">
          {editing ? (
            <EditPromptFields
              prompt={prompt}
              categories={categories}
              onCancel={() => setEditing(false)}
              onSaved={(updated) => {
                onSaved(updated)
                setEditing(false)
              }}
            />
          ) : (
            <>
              <div className="prompt-modal-section">
                <span className="prompt-modal-section-icon">◎</span>
                <div className="prompt-modal-section-body">
                  <p className="prompt-modal-section-label">Para que serve</p>
                  <p>{prompt.purpose}</p>
                </div>
              </div>
              <div className="prompt-modal-section">
                <span className="prompt-modal-section-icon">◷</span>
                <div className="prompt-modal-section-body">
                  <p className="prompt-modal-section-label">Quando utilizar</p>
                  <p>{prompt.whenToUse}</p>
                </div>
              </div>

              <div className="prompt-modal-content-head">
                <strong>Prompt completo</strong>
                <button className="prompt-modal-copy-button" onClick={() => navigator.clipboard?.writeText(prompt.content)}>
                  ▧ Copiar
                </button>
              </div>
              <div className="prompt-modal-content-box">
                {prompt.content.split(/(\{\{.*?\}\})/g).map((part, index) =>
                  part.startsWith('{{') ? <mark key={index}>{part}</mark> : <span key={index}>{part}</span>,
                )}
              </div>

              {prompt.attachments.length > 0 && (
                <div className="attachments">
                  <strong>Anexos</strong>
                  {prompt.attachments.map((file) => (
                    <div className="attachment" key={file.name}>
                      ▧ {file.name}
                      <small>{file.size}</small>
                    </div>
                  ))}
                </div>
              )}

              {canShowEdit && (
                <div className="prompt-modal-footer">
                  <button className="edit-button" onClick={canActuallyEdit ? () => setEditing(true) : undefined}>
                    Editar prompt
                  </button>
                </div>
              )}
            </>
          )}
        </div>
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
