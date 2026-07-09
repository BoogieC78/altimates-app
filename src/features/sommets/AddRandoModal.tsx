import { useState, type FormEvent } from 'react'
import { Modal } from '../../components/Modal'
import { addRando } from '../../core/firebase/randos'
import type { Difficulty } from '../../core/types'

interface AddRandoModalProps {
  memberName: string
  onClose: () => void
}

export function AddRandoModal({ memberName, onClose }: AddRandoModalProps) {
  const [isTrek, setIsTrek] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const name = String(form.get('name') ?? '').trim()
    if (!name) return
    setSaving(true)
    setError('')
    try {
      await addRando({
        name,
        region: String(form.get('region') ?? '').trim() || 'France',
        diff: (String(form.get('diff')) || 'Moyen') as Difficulty,
        dateStart: String(form.get('dateStart') ?? '') || undefined,
        dateEnd: isTrek ? String(form.get('dateEnd') ?? '') || undefined : undefined,
        km: Number(form.get('km')) || undefined,
        dplus: Number(form.get('dplus')) || undefined,
        komoot: String(form.get('komoot') ?? '').trim() || undefined,
        proposedBy: memberName,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setSaving(false)
    }
  }

  return (
    <Modal title="Proposer une rando" onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <label>
          Nom *
          <input name="name" required placeholder="Lac Blanc — Chamonix" />
        </label>
        <label>
          Région
          <input name="region" placeholder="Haute-Savoie" />
        </label>
        <label>
          Difficulté
          <select name="diff" defaultValue="Moyen">
            <option>Facile</option>
            <option>Moyen</option>
            <option>Difficile</option>
          </select>
        </label>
        <div className="form-row">
          <button
            type="button"
            className={!isTrek ? 'btn-toggle active' : 'btn-toggle'}
            onClick={() => setIsTrek(false)}
          >
            Journée
          </button>
          <button
            type="button"
            className={isTrek ? 'btn-toggle active' : 'btn-toggle'}
            onClick={() => setIsTrek(true)}
          >
            Trek
          </button>
        </div>
        <label>
          {isTrek ? 'Date de début' : 'Date'}
          <input name="dateStart" type="date" />
        </label>
        {isTrek && (
          <label>
            Date de fin
            <input name="dateEnd" type="date" />
          </label>
        )}
        <div className="form-row">
          <label>
            Distance (km)
            <input name="km" type="number" min="0" />
          </label>
          <label>
            Dénivelé (m D+)
            <input name="dplus" type="number" min="0" />
          </label>
        </div>
        <label>
          Lien Komoot
          <input name="komoot" type="url" placeholder="https://www.komoot.com/..." />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn-primary" disabled={saving}>
          {saving ? 'Enregistrement…' : 'Proposer'}
        </button>
      </form>
    </Modal>
  )
}
