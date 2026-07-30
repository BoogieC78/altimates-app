import { useState } from 'react'
import type { GearItem, KitStatus } from '../../core/constants/gear'

const CAT_LABELS: Record<string, { l: string; tag: string }> = {
  indispensable: { l: 'Indispensable', tag: 'tr' },
  recommande: { l: 'Recommandé', tag: 'ta' },
  facultatif: { l: 'Facultatif', tag: 'tgold' },
}

interface KitTriageProps {
  items: (GearItem & { cat: string })[]
  onStatus: (id: string, status: KitStatus) => void
  onClose: () => void
}

/**
 * Triage express (variante A, choix du 30/07) : premier remplissage du kit en mode
 * « une carte à la fois » — deux gros boutons J'ai / À acheter, sortie discrète pour
 * les cas rares. La file est figée au montage : écrire un statut ne la fait pas bouger.
 */
export function KitTriage({ items, onStatus, onClose }: KitTriageProps) {
  const [queue] = useState(items)
  const [idx, setIdx] = useState(0)

  const g = queue[idx]
  if (!g) {
    onClose()
    return null
  }

  const advance = () => {
    if (idx + 1 >= queue.length) onClose()
    else setIdx(idx + 1)
  }

  const decide = (status: KitStatus) => {
    onStatus(g.id, status)
    advance()
  }

  const cat = CAT_LABELS[g.cat] ?? CAT_LABELS.facultatif

  return (
    <div className="tab active">
      <div className="triage-head">
        <span className="triage-count">
          TRIAGE · {idx + 1}/{queue.length}
        </span>
        <button type="button" className="triage-exit" onClick={onClose}>
          Voir la liste →
        </button>
      </div>
      <div className="triage-bar" role="progressbar" aria-valuemin={0} aria-valuemax={queue.length} aria-valuenow={idx} aria-label="Progression du triage">
        <div className="triage-bar-fill" style={{ width: `${Math.round((idx / queue.length) * 100)}%` }} />
      </div>

      <div className="triage-card">
        <span className={`tag ${cat.tag}`}>{cat.l}</span>
        <div className="triage-name">{g.name}</div>
        <div className="triage-meta">
          {g.price}
          {g.note ? ` · ${g.note}` : ''}
        </div>
      </div>

      <div className="triage-actions">
        <button type="button" className="btn triage-btn triage-have" onClick={() => decide('have')}>
          ✓ J'ai
        </button>
        <button type="button" className="btn triage-btn triage-want" onClick={() => decide('want')}>
          🛒 À acheter
        </button>
      </div>
      <div className="triage-secondary">
        <button type="button" className="triage-link" onClick={() => decide('skip')}>
          ✕ Pas besoin
        </button>
      </div>
    </div>
  )
}
