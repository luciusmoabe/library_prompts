import type { Tag } from '@/lib/types'

export type PromptFieldValues = {
  title: string
  description: string
  tagIds: number[]
  purpose: string
  whenToUse: string
  content: string
}

export default function PromptFormFields({
  values,
  onChange,
  tags,
}: {
  values: PromptFieldValues
  onChange: (values: PromptFieldValues) => void
  tags: Tag[]
}) {
  function set<K extends keyof PromptFieldValues>(key: K, value: PromptFieldValues[K]) {
    onChange({ ...values, [key]: value })
  }

  function toggleTag(id: number) {
    set('tagIds', values.tagIds.includes(id) ? values.tagIds.filter((t) => t !== id) : [...values.tagIds, id])
  }

  return (
    <>
      <label>
        Título
        <input required value={values.title} onChange={(event) => set('title', event.target.value)} />
      </label>
      <label>
        Descrição
        <input required value={values.description} onChange={(event) => set('description', event.target.value)} />
      </label>
      <label>
        Tags
        <div className="tag-picker">
          {tags.map((tag) => (
            <button
              type="button"
              key={tag.id}
              className={values.tagIds.includes(tag.id) ? 'tag-chip selected' : 'tag-chip'}
              onClick={() => toggleTag(tag.id)}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </label>
      <label>
        Para que serve
        <textarea
          required
          rows={2}
          value={values.purpose}
          onChange={(event) => set('purpose', event.target.value)}
        />
      </label>
      <label>
        Quando utilizar
        <textarea
          required
          rows={2}
          value={values.whenToUse}
          onChange={(event) => set('whenToUse', event.target.value)}
        />
      </label>
      <label>
        Conteúdo
        <textarea required rows={6} value={values.content} onChange={(event) => set('content', event.target.value)} />
      </label>
    </>
  )
}
