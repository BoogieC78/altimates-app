import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export interface LightboxPhoto {
  docId: string
  dataUrl: string
  author: string
}

/**
 * Vue plein écran d'une photo de sortie, avec navigation dans la série.
 *
 * Rendue en portal sur `<body>` : ouverte depuis une carte de la liste, elle
 * serait sinon piégée sous la nav fixe et délavée par l'`opacity` du bloc des
 * sorties passées — le même piège que celui qui avait imposé le portal à
 * `Modal.tsx`.
 *
 * C'est une vraie boîte de dialogue : focus déplacé dessus à l'ouverture, rendu
 * à l'élément déclencheur à la fermeture, Escape ferme, flèches naviguent.
 */
export function PhotoLightbox({
  photos,
  startIndex,
  onClose,
}: {
  photos: LightboxPhoto[]
  startIndex: number
  onClose: () => void
}) {
  const [index, setIndex] = useState(startIndex)
  const rootRef = useRef<HTMLDivElement>(null)

  // Une photo supprimée pendant que la vue est ouverte raccourcit la liste :
  // sans ce garde-fou, l'index déborde et l'écran devient noir.
  const safeIndex = Math.min(index, photos.length - 1)
  const photo = photos[safeIndex]

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    rootRef.current?.focus()
    return () => previouslyFocused?.focus()
  }, [])

  useEffect(() => {
    if (photos.length === 0) onClose()
  }, [photos.length, onClose])

  if (!photo) return null

  const go = (delta: number) => {
    setIndex((i) => (i + delta + photos.length) % photos.length)
  }

  return createPortal(
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Photo ${safeIndex + 1} sur ${photos.length}, partagée par ${photo.author}`}
      tabIndex={-1}
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          onClose()
        } else if (e.key === 'ArrowRight') {
          e.preventDefault()
          go(1)
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault()
          go(-1)
        }
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        padding: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(20,20,18,.92)',
        cursor: 'zoom-out',
      }}
    >
      <img
        src={photo.dataUrl}
        alt=""
        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
      />

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 'calc(12px + env(safe-area-inset-bottom))',
          textAlign: 'center',
          color: 'rgba(255,255,255,.75)',
          fontFamily: 'var(--mono)',
          fontSize: 10,
          pointerEvents: 'none',
        }}
      >
        {photo.author}
        {photos.length > 1 && ` · ${safeIndex + 1}/${photos.length}`}
      </div>

      {photos.length > 1 && (
        <>
          <LightboxArrow side="left" label="Photo précédente" onClick={() => go(-1)} />
          <LightboxArrow side="right" label="Photo suivante" onClick={() => go(1)} />
        </>
      )}

      <button
        // Le fond ferme déjà au clic : sans cet arrêt, un clic sur la croix
        // déclencherait deux fermetures pour un seul geste.
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        aria-label="Fermer la photo"
        style={{
          position: 'absolute',
          top: 'calc(8px + env(safe-area-inset-top))',
          right: 8,
          minWidth: 44,
          minHeight: 44,
          border: 'none',
          background: 'none',
          color: '#fff',
          fontSize: 22,
          lineHeight: 1,
          cursor: 'pointer',
        }}
      >
        ×
      </button>
    </div>,
    document.body,
  )
}

function LightboxArrow({
  side,
  label,
  onClick,
}: {
  side: 'left' | 'right'
  label: string
  onClick: () => void
}) {
  return (
    <button
      // Le clic sur le fond ferme la vue : sans cet arrêt, changer de photo la
      // refermerait aussitôt.
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      aria-label={label}
      style={{
        position: 'absolute',
        [side]: 4,
        top: '50%',
        transform: 'translateY(-50%)',
        minWidth: 48,
        minHeight: 48,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'none',
        borderRadius: 24,
        background: 'rgba(45,45,42,.55)',
        color: '#fff',
        fontSize: 20,
        lineHeight: 1,
        cursor: 'pointer',
      }}
    >
      <span aria-hidden="true">{side === 'left' ? '‹' : '›'}</span>
    </button>
  )
}
