import { useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'

// Modal bloquante (pas de bouton fermer) affichée quand aucun prénom n'est
// disponible pour le membre connecté — typiquement une connexion par lien
// e-mail, sans displayName Google. Tant qu'un prénom n'est pas saisi, les
// votes/dispos seraient enregistrés sous 'Anonyme' et entreraient en collision
// entre membres.
export function NamePromptModal({ onSave }: { onSave: (name: string) => void }) {
  const [name, setName] = useState('')

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (trimmed) onSave(trimmed)
  }

  return createPortal(
    <div className="modal-wrap open">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-header">
          <span className="modal-title">Bienvenue dans la cordée !</span>
        </div>
        <form onSubmit={submit}>
          <p style={{ fontSize: 12, color: 'var(--ink2)', lineHeight: 1.6, marginBottom: 12 }}>
            Comment doit-on t'appeler ? Ton prénom sera visible par les autres membres
            (votes, dispos, checklist de départ).
          </p>
          <input
            className="form-input"
            name="firstname"
            placeholder="Ton prénom"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            maxLength={30}
          />
          <button
            className="btn btn-primary btn-full"
            style={{ marginTop: 10 }}
            type="submit"
            disabled={!name.trim()}
          >
            C'est parti
          </button>
        </form>
      </div>
    </div>,
    document.body,
  )
}
