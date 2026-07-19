import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
  /** contenu optionnel à gauche du bouton fermer (ex : bouton Modifier) */
  headerExtra?: ReactNode
}

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

// Bottom-sheet du design topo (classes modal-wrap/modal/modal-handle de l'ancienne app).
// Rendue en portal sur <body> : sinon un ancêtre avec opacity (ex. wrapper des
// sorties passées) délave la modale et piège son z-index sous la nav.
// Dialogue accessible : focus déplacé à l'ouverture, piégé au Tab, rendu à la
// fermeture ; Escape ferme.
export function Modal({ title, onClose, children, headerExtra }: ModalProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    const sheet = sheetRef.current
    if (sheet) {
      const first = sheet.querySelector<HTMLElement>(FOCUSABLE)
      ;(first ?? sheet).focus()
    }
    return () => previouslyFocused?.focus()
  }, [])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      onClose()
      return
    }
    if (e.key !== 'Tab' || !sheetRef.current) return
    const focusables = Array.from(
      sheetRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
    ).filter((el) => !el.hasAttribute('disabled'))
    if (focusables.length === 0) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  return createPortal(
    <div
      className="modal-wrap open"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
      onKeyDown={onKeyDown}
    >
      <div className="modal" ref={sheetRef} tabIndex={-1} onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-header">
          <h2 className="modal-title" id={titleId}>
            {title}
          </h2>
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
