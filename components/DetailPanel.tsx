import type { Prompt } from '@/lib/types'

export default function DetailPanel({ prompt, canEditThis }: { prompt: Prompt; canEditThis: boolean }) {
  return (
    <aside className="detail-panel">
      <span className="detail-category">{prompt.category}</span>
      <h2>{prompt.title}</h2>
      <p>{prompt.description}</p>
      <div className="prompt-content">
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
      <button className="use-button" onClick={() => navigator.clipboard?.writeText(prompt.content)}>
        Copiar prompt ↗
      </button>
      {canEditThis && <button className="edit-button">Editar prompt</button>}
    </aside>
  )
}
