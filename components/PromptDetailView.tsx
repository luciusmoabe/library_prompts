'use client'

import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { deletePrompt, getPromptVersions, updatePrompt, updatePromptVisibility } from '@/lib/api'
import { useToast } from '@/components/Toaster'
import Modal from '@/components/Modal'
import NewPromptForm from '@/components/NewPromptForm'
import type { Prompt, PromptVersion, Tag } from '@/lib/types'
import PromptFormFields, { type PromptFieldValues } from '@/components/PromptFormFields'

export default function PromptDetailView({
  prompt,
  tags,
  canManage,
  canActuallyEdit,
  canToggleVisibility,
  canDuplicate,
  isAdmin,
}: {
  prompt: Prompt
  tags: Tag[]
  canManage: boolean
  canActuallyEdit: boolean
  canToggleVisibility: boolean
  canDuplicate: boolean
  isAdmin: boolean
}) {
  const router = useRouter()
  const showToast = useToast()
  const [current, setCurrent] = useState(prompt)
  const [editing, setEditing] = useState(false)
  const [duplicating, setDuplicating] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [togglingVisibility, setTogglingVisibility] = useState(false)

  async function handleDelete() {
    if (!window.confirm(`Excluir o prompt "${current.title}"? Essa ação não pode ser desfeita.`)) return
    setDeleteError('')
    setDeleting(true)
    try {
      await deletePrompt(current.id)
      showToast('Prompt excluído.')
      router.push('/')
      router.refresh()
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Erro ao excluir o prompt')
      setDeleting(false)
    }
  }

  async function handleToggleVisibility() {
    setTogglingVisibility(true)
    try {
      const next = current.visibility === 'private' ? 'shared' : 'private'
      await updatePromptVisibility(current.id, next)
      setCurrent((c) => ({ ...c, visibility: next }))
      showToast(next === 'private' ? 'Prompt marcado como privado.' : 'Prompt agora é compartilhado.')
      router.refresh()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao alterar a privacidade')
    } finally {
      setTogglingVisibility(false)
    }
  }

  return (
    <div className="prompt-detail-card">
      <div className="prompt-detail-header">
        <h2>{current.title}</h2>
        <div className="tag-pill-row">
          {current.tags.map((tag) => (
            <span className="prompt-detail-category" key={tag.id}>
              {tag.name}
            </span>
          ))}
          {current.visibility === 'private' && <span className="prompt-detail-category">🔒 Privado</span>}
        </div>
      </div>
      <div className="prompt-detail-body">
        {editing ? (
          <EditPromptFields
            prompt={current}
            tags={tags}
            onCancel={() => setEditing(false)}
            onSaved={(updated) => {
              setCurrent(updated)
              setEditing(false)
              showToast('Prompt atualizado.')
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
              <button
                className="prompt-detail-copy-button"
                onClick={() => {
                  navigator.clipboard?.writeText(current.content)
                  showToast('Prompt copiado.')
                }}
              >
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
                {current.attachments.map((file) =>
                  file.url ? (
                    <a className="attachment" key={file.name} href={file.url} target="_blank" rel="noreferrer">
                      ▧ {file.name}
                      <small>{file.size}</small>
                    </a>
                  ) : (
                    <div className="attachment" key={file.name}>
                      ▧ {file.name}
                      <small>{file.size}</small>
                    </div>
                  ),
                )}
              </div>
            )}

            <div className="prompt-detail-footer">
              {canDuplicate && (
                <button className="edit-button" onClick={() => setDuplicating(true)}>
                  Duplicar
                </button>
              )}
              {canToggleVisibility && (
                <button className="edit-button" onClick={handleToggleVisibility} disabled={togglingVisibility}>
                  {current.visibility === 'private' ? 'Tornar compartilhado' : 'Tornar privado'}
                </button>
              )}
              {isAdmin && (
                <button className="edit-button" onClick={() => setShowHistory(true)}>
                  Histórico de versões
                </button>
              )}
              {canManage && (
                <button className="edit-button" onClick={canActuallyEdit ? () => setEditing(true) : undefined}>
                  Editar prompt
                </button>
              )}
              {canManage && (
                <button className="delete-button" onClick={handleDelete} disabled={deleting}>
                  {deleting ? 'Excluindo...' : 'Excluir prompt'}
                </button>
              )}
            </div>
            {deleteError && <p className="login-error">{deleteError}</p>}
          </>
        )}
      </div>

      {duplicating && (
        <Modal title="Duplicar prompt" close={() => setDuplicating(false)}>
          <NewPromptForm
            tags={tags}
            initialValues={{
              title: `${current.title} (cópia)`,
              description: current.description,
              tagIds: current.tags.map((t) => t.id),
              purpose: current.purpose,
              whenToUse: current.whenToUse,
              content: current.content,
              attachments: current.attachments,
            }}
            onSaved={(newPrompt) => {
              setDuplicating(false)
              router.push(`/prompts/${newPrompt.id}`)
            }}
          />
        </Modal>
      )}

      {showHistory && (
        <VersionHistoryModal
          promptId={current.id}
          currentTagIds={current.tags.map((t) => t.id)}
          onClose={() => setShowHistory(false)}
          onRestored={(updated) => setCurrent(updated)}
        />
      )}
    </div>
  )
}

function EditPromptFields({
  prompt,
  tags,
  onCancel,
  onSaved,
}: {
  prompt: Prompt
  tags: Tag[]
  onCancel: () => void
  onSaved: (prompt: Prompt) => void
}) {
  const [values, setValues] = useState<PromptFieldValues>({
    title: prompt.title,
    description: prompt.description,
    tagIds: prompt.tags.map((t) => t.id),
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
      <PromptFormFields values={values} onChange={setValues} tags={tags} />
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

function VersionHistoryModal({
  promptId,
  currentTagIds,
  onClose,
  onRestored,
}: {
  promptId: number
  currentTagIds: number[]
  onClose: () => void
  onRestored: (prompt: Prompt) => void
}) {
  const showToast = useToast()
  const [versions, setVersions] = useState<PromptVersion[] | null>(null)
  const [error, setError] = useState('')
  const [openId, setOpenId] = useState<number | null>(null)
  const [restoringId, setRestoringId] = useState<number | null>(null)

  useEffect(() => {
    getPromptVersions(promptId)
      .then(setVersions)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar o histórico'))
  }, [promptId])

  async function handleRestore(version: PromptVersion) {
    if (!window.confirm(`Restaurar a versão de ${formatDate(version.createdAt)}? Isso substitui o conteúdo atual (uma nova versão do estado atual será salva antes).`)) {
      return
    }
    setRestoringId(version.id)
    try {
      const updated = await updatePrompt(promptId, {
        title: version.title,
        description: version.description,
        content: version.content,
        purpose: version.purpose,
        whenToUse: version.whenToUse,
        tagIds: currentTagIds,
      })
      showToast('Versão restaurada.')
      onRestored(updated)
      onClose()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao restaurar')
    } finally {
      setRestoringId(null)
    }
  }

  return (
    <Modal title="Histórico de versões" close={onClose}>
      {error && <p className="login-error">{error}</p>}
      {!versions && !error && <p className="hint">Carregando...</p>}
      {versions && versions.length === 0 && <p className="hint">Este prompt ainda não tem versões anteriores.</p>}
      {versions && versions.length > 0 && (
        <div className="version-list">
          {versions.map((v) => (
            <div className="version-row" key={v.id}>
              <button type="button" className="version-row-head" onClick={() => setOpenId(openId === v.id ? null : v.id)}>
                <span>{formatDate(v.createdAt)}</span>
                <span className="version-editor">{v.editedBy ?? 'desconhecido'}</span>
              </button>
              {openId === v.id && (
                <div className="version-row-body">
                  <p>
                    <strong>{v.title}</strong>
                  </p>
                  <p className="hint" style={{ padding: 0 }}>
                    {v.description}
                  </p>
                  <div className="prompt-detail-content-box">{v.content}</div>
                  <button
                    type="button"
                    className="use-button"
                    style={{ marginTop: 12 }}
                    onClick={() => handleRestore(v)}
                    disabled={restoringId === v.id}
                  >
                    {restoringId === v.id ? 'Restaurando...' : 'Restaurar esta versão'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}
