import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
  /** contenu optionnel à gauche du bouton fermer (ex : bouton Modifier) */
  headerExtra?: ReactNode
}

// Bottom-sheet du design topo (classes modal-wrap/modal/modal-handle de l'ancienne app).
// Rendue en portal sur <body> : sinon un ancêtre avec opacity (ex. wrapper des
// sorties passées) délave la modale et piège son z-index sous la nav.
export function Modal({ title, onClose, children, headerExtra }: ModalProps) {
  return createPortal(
    <div className="modal-wrap open" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {headerExtra}
            <button className="close-btn" onClick={onClose} aria-label="Fermer">
              ✕
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}
