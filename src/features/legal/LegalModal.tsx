import { useState } from 'react'
import { Modal } from '../../components/Modal'
import { LEGAL_DOCS, type LegalDoc } from './legalContent'

/**
 * Visionneuse des documents légaux, utilisée aux deux endroits où ils doivent
 * être atteignables : l'écran de connexion (donc sans être authentifié) et le
 * Base Camp. Les trois documents sont dans la même modale, avec des onglets :
 * quelqu'un venu lire les mentions légales tombe souvent sur la confidentialité
 * juste après, et refermer/rouvrir pour ça n'a pas de sens.
 */
export function LegalModal({ initial, onClose }: { initial: LegalDoc['id']; onClose: () => void }) {
  const [current, setCurrent] = useState<LegalDoc['id']>(initial)
  const doc = LEGAL_DOCS.find((d) => d.id === current) ?? LEGAL_DOCS[0]

  return (
    <Modal title={doc.title} onClose={onClose}>
      <div className="ravito-tab-row">
        {LEGAL_DOCS.map((d) => (
          <button
            key={d.id}
            className={d.id === current ? 'ravito-tab active' : 'ravito-tab'}
            aria-pressed={d.id === current}
            onClick={() => setCurrent(d.id)}
          >
            {d.short}
          </button>
        ))}
      </div>

      <div className="legal-meta">Dernière mise à jour : {doc.updated}</div>

      {doc.sections.map((s) => (
        <section key={s.heading} className="legal-section">
          <h3 className="legal-heading">{s.heading}</h3>
          {s.body.map((p, i) => (
            <p key={i} className={p.startsWith('—') ? 'legal-p legal-bullet' : 'legal-p'}>
              {p}
            </p>
          ))}
        </section>
      ))}
    </Modal>
  )
}

/**
 * Pied de page « Mentions légales · Confidentialité · Conditions d'utilisation ».
 * Rendu tel quel sur l'écran de connexion et dans le Base Camp — l'ouverture de
 * la modale est gérée ici pour que les deux appelants n'aient rien à câbler.
 */
export function LegalLinks({ align = 'center' }: { align?: 'center' | 'left' }) {
  const [open, setOpen] = useState<LegalDoc['id'] | null>(null)

  return (
    <>
      <div className="legal-links" style={{ justifyContent: align === 'center' ? 'center' : 'flex-start' }}>
        {/* Pas de séparateur « · » entre les liens : la ligne passe sur deux
            lignes en 360px, et le point se retrouvait alors seul en fin de ligne.
            L'espacement suffit à les distinguer. */}
        {LEGAL_DOCS.map((d) => (
          <button key={d.id} type="button" className="legal-link" onClick={() => setOpen(d.id)}>
            {d.short}
          </button>
        ))}
      </div>
      {open && <LegalModal initial={open} onClose={() => setOpen(null)} />}
    </>
  )
}
