'use client'

import type { Prompt } from '@/lib/types'
import PromptCard from '@/components/PromptCard'

export default function PromptLibrary({
  canEdit,
  query,
  onQueryChange,
  onOpenNewPrompt,
  filtered,
  onToggleFavorite,
}: {
  canEdit: boolean
  query: string
  onQueryChange: (value: string) => void
  onOpenNewPrompt: () => void
  filtered: Prompt[]
  onToggleFavorite: (prompt: Prompt) => void
}) {
  return (
    <section className="content-wrap">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Seu espaço de ideias</p>
          <h1>Biblioteca de prompts</h1>
          <p className="subheading">Encontre e reutilize os prompts que fazem seu trabalho avançar.</p>
        </div>
        {canEdit && (
          <button className="primary-button" onClick={onOpenNewPrompt}>
            ＋ Criar prompt
          </button>
        )}
      </div>
      <label className="search-box">
        ⌕ <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Buscar prompts..." />
      </label>
      <div className="library-layout">
        <div className="cards">
          {filtered.map((prompt) => (
            <PromptCard key={prompt.id} prompt={prompt} onToggleFavorite={() => onToggleFavorite(prompt)} />
          ))}
          {filtered.length === 0 && (
            <div className="empty-state">
              <span>—</span>
              <strong>Nenhum prompt encontrado</strong>
              <p>Ajuste a busca ou o filtro de categoria.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
