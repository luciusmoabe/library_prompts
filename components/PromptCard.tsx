'use client'

import type { MouseEvent } from 'react'
import type { Prompt } from '@/lib/types'

export default function PromptCard({
  prompt,
  selected,
  onSelect,
  onToggleFavorite,
}: {
  prompt: Prompt
  selected: boolean
  onSelect: () => void
  onToggleFavorite: () => void
}) {
  function handleFavoriteClick(event: MouseEvent) {
    event.stopPropagation()
    onToggleFavorite()
  }

  return (
    <article className={selected ? 'prompt-card selected' : 'prompt-card'} onClick={onSelect}>
      <div className="card-top">
        <span>{prompt.category}</span>
        <button className="favorite" onClick={handleFavoriteClick}>
          {prompt.favorite ? '★' : '☆'}
        </button>
      </div>
      <h2>{prompt.title}</h2>
      <p>{prompt.description}</p>
      <small>Por {prompt.owner}</small>
    </article>
  )
}
