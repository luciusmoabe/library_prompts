'use client'

import type { MouseEvent } from 'react'
import Link from 'next/link'
import type { Prompt } from '@/lib/types'

export default function PromptCard({
  prompt,
  onToggleFavorite,
}: {
  prompt: Prompt
  onToggleFavorite: () => void
}) {
  function handleFavoriteClick(event: MouseEvent) {
    event.preventDefault()
    event.stopPropagation()
    onToggleFavorite()
  }

  return (
    <Link href={`/prompts/${prompt.id}`} className="prompt-card">
      <div className="card-top">
        <span>{prompt.category}</span>
        <button className="favorite" onClick={handleFavoriteClick}>
          {prompt.favorite ? '★' : '☆'}
        </button>
      </div>
      <h2>{prompt.title}</h2>
      <p>{prompt.description}</p>
      <small>Por {prompt.owner}</small>
    </Link>
  )
}
