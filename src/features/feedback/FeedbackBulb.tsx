import { useState, type FormEvent } from 'react'
import { Modal } from '../../components/Modal'
import { BulbIcon } from '../../components/icons'
import { addFeedback } from '../../core/firebase/feedbacks'

// Boîte à idées : remplace l'ancien onglet Idées. Une ampoule persistante dans
// le header ouvre une modale de retour (amélioration, fonctionnalité, bug,
// contact) accessible depuis n'importe quel onglet.
//
// Acheminement : le feedback est d'abord écrit dans Firestore (collection
// `feedbacks` existante — source de vérité, règles membres), puis relayé en
// arrière-plan vers Trello via /api/send-feedback. Si le relais échoue, le
// retour est quand même en base : on n'affiche pas d'erreur pour ça.
// Si l'écriture Firestore échoue, on affiche l'erreur et on CONSERVE la saisie.

const TYPE_OPTIONS = [
  { value: 'amelioration', label: 'Amélioration' },
  { value: 'feature', label: 'Nouvelle fonctionnalité' },
  { value: 'bug', label: 'Bug' },
  { value: 'contact', label: 'Contact' },
] as const

const PLACEHOLDERS: Record<string, string> = {
  amelioration: 'ex: Rendre la liste des sorties plus lisible…',
  feature: 'ex: Filtrer les randos par dénivelé max…',
  bug: "ex: L'écran reste blanc quand je… (que s'est-il passé, sur quel écran ?)",
  contact: 'Ton message pour l’équipe…',
}

interface FeedbackBulbProps {
  memberName: string
  /** e-mail du compte connecté — joint à la carte Trello pour recontacter l'auteur */
  email: string | null
}

export function FeedbackBulb({ memberName, email }: FeedbackBulbProps) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<string>('amelioration')
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const close = () => {
    setOpen(false)
    setSent(false)
    setError('')
  }

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const t = text.trim()
    if (!t || sending) return
    setSending(true)
    setError('')
    try {
      // 1. Firestore d'abord : c'est ce qui garantit que le retour est capturé.
      await addFeedback(memberName, t, type)
    } catch (err) {
      console.warn('feedback:', err)
      setError("Envoi impossible pour l'instant. Vérifie ta connexion et réessaie — ton texte est conservé.")
      setSending(false)
      return
    }
    // 2. Relais Trello en arrière-plan (jamais bloquant, jamais d'erreur visible :
    //    le feedback est déjà en base ; erreur loguée côté serveur). Inutile en
    //    mode émulateur E2E : pas de fonctions serverless.
    if (import.meta.env.VITE_USE_EMULATOR !== '1') {
      void fetch('/api/send-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, text: t, email: email ?? '' }),
      }).catch((err) => console.warn('feedback:trello:', err))
    }
    setText('')
    setSending(false)
    setSent(true)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Boîte à idées"
        aria-label="Boîte à idées"
        style={{
          // Cible tactile 44px sans grossir visuellement le header (icône 20px).
          width: 44,
          height: 44,
          margin: '-5px 0',
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--ink2)',
          flexShrink: 0,
        }}
      >
        <BulbIcon />
      </button>

      {open && (
        <Modal title="Boîte à idées" onClose={close}>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '10px 0 4px' }}>
              <div style={{ fontSize: 30, marginBottom: 8 }} aria-hidden>
                💡
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.6, marginBottom: 14 }}>
                Merci ! Ton retour est bien envoyé,
                <br />
                on le traite au plus vite.
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button className="btn" onClick={() => setSent(false)}>
                  En envoyer un autre
                </button>
                <button className="btn btn-primary" onClick={close}>
                  Fermer
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={(e) => void submit(e)}>
              <p style={{ fontSize: 11, color: 'var(--ink3)', lineHeight: 1.5, margin: '0 0 12px' }}>
                Une idée, un bug, une question ? Dis-nous tout — ton retour part directement dans
                notre outil de suivi.
              </p>
              <div style={{ marginBottom: 9 }}>
                <label className="form-lbl" htmlFor="fb-type">
                  Type de retour
                </label>
                <select
                  id="fb-type"
                  className="form-input"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  {TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: 9 }}>
                <label className="form-lbl" htmlFor="fb-text">
                  Ton message
                </label>
                <textarea
                  id="fb-text"
                  className="form-input"
                  rows={4}
                  maxLength={2000}
                  placeholder={PLACEHOLDERS[type]}
                  style={{ resize: 'vertical' }}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              </div>
              {error && (
                <div className="auth-error" role="alert" style={{ display: 'block', marginBottom: 9 }}>
                  {error}
                </div>
              )}
              <button className="btn btn-primary btn-full" type="submit" disabled={sending || !text.trim()}>
                {sending ? 'Envoi…' : 'Envoyer'}
              </button>
            </form>
          )}
        </Modal>
      )}
    </>
  )
}
