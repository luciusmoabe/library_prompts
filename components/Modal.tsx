'use client'

import type { ReactNode, MouseEvent } from 'react'

export default function Modal({ title, close, children }: { title: string; close: () => void; children: ReactNode }) {
  function stop(event: MouseEvent) {
    event.stopPropagation()
  }
  return (
    <div className="modal-backdrop" onMouseDown={close}>
      <div className="composer" onMouseDown={stop}>
        <button className="close-button" onClick={close}>×</button>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  )
}
