import type { Category } from '@/lib/types'

export type PromptFieldValues = {
  title: string
  description: string
  category: string
  purpose: string
  whenToUse: string
  content: string
}

export default function PromptFormFields({
  values,
  onChange,
  categories,
}: {
  values: PromptFieldValues
  onChange: (values: PromptFieldValues) => void
  categories: Category[]
}) {
  function set<K extends keyof PromptFieldValues>(key: K, value: PromptFieldValues[K]) {
    onChange({ ...values, [key]: value })
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
        Categoria
        <select value={values.category} onChange={(event) => set('category', event.target.value)}>
          {categories.map((item) => (
            <option key={item.id}>{item.name}</option>
          ))}
        </select>
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
