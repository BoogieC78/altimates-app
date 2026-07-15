import { useState, type FormEvent } from 'react'
import { DateField } from '../../components/DateField'
import { Modal } from '../../components/Modal'
import { updateRando } from '../../core/firebase/randos'
import type { Difficulty, Rando } from '../../core/types'
import type { WithDocId } from '../../hooks/useCollection'

interface EditRandoModalProps {
  rando: WithDocId<Rando>
  onClose: () => void
}

// Édition d'une rando existante (port de openEditRando/saveEditRando) :
// mêmes champs que AddRandoModal, pré-remplis, recalcul date/dur à l'enregistrement.
export function EditRandoModal({ rando: r, onClose }: EditRandoModalProps) {
  const [isTrek, setIsTrek] = useState(Boolean(r.dateEnd && r.dateEnd !== r.dateStart))
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
      await updateRando(r, {
        name,
        region: String(form.get('region') ?? '').trim() || 'France',
        diff: (String(form.get('diff')) || 'Moyen') as Difficulty,
        dateStart: String(form.get('dateStart') ?? '') || undefined,
        dateEnd: isTrek ? String(form.get('dateEnd') ?? '') || undefined : undefined,
        km: Number(form.get('km')) || undefined,
        dplus: Number(form.get('dplus')) || undefined,
        komoot: String(form.get('komoot') ?? '').trim() || undefined,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setSaving(false)
    }
  }

  return (
    <Modal title="Modifier la rando" onClose={onClose}>
      <form onSubmit={submit}>
        <div style={{ marginBottom: 9 }}>
          <label className="form-lbl">Nom</label>
          <input className="form-input" name="name" required defaultValue={r.name} placeholder="ex: Lac Blanc" />
        </div>
        <div className="form-row2" style={{ marginBottom: 9 }}>
          <div>
            <label className="form-lbl">Région</label>
            <input className="form-input" name="region" defaultValue={r.region} placeholder="ex: Haute-Savoie" />
          </div>
          <div>
            <label className="form-lbl">Niveau</label>
            <select className="form-input" name="diff" defaultValue={r.diff ?? 'Moyen'}>
              <option>Facile</option>
              <option>Moyen</option>
              <option>Difficile</option>
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 9 }}>
          <label className="form-lbl">Lien Komoot (optionnel)</label>
          <input
            className="form-input"
            name="komoot"
            defaultValue={r.traces?.[0]?.url ?? ''}
            placeholder="https://www.komoot.com/tour/..."
          />
        </div>
        <div style={{ marginBottom: 9 }}>
          <label className="form-lbl">Durée</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <button
              type="button"
              className={!isTrek ? 'btn btn-sm btn-primary' : 'btn btn-sm'}
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => setIsTrek(false)}
            >
              Journée
            </button>
            <button
              type="button"
              className={isTrek ? 'btn btn-sm btn-primary' : 'btn btn-sm'}
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => setIsTrek(true)}
            >
              Plusieurs jours
            </button>
          </div>
          {!isTrek ? (
            <div>
              <label className="form-lbl">Date</label>
              <DateField name="dateStart" defaultValue={r.dateStart ?? ''} />
            </div>
          ) : (
            <div className="form-row2">
              <div>
                <label className="form-lbl">Du</label>
                <DateField name="dateStart" defaultValue={r.dateStart ?? ''} />
              </div>
              <div>
                <label className="form-lbl">Au</label>
                <DateField name="dateEnd" defaultValue={r.dateEnd ?? ''} />
              </div>
            </div>
          )}
        </div>
        <div className="form-row2" style={{ marginBottom: 12 }}>
          <div>
            <label className="form-lbl">Distance (km)</label>
            <input className="form-input" name="km" type="number" defaultValue={r.km ?? ''} placeholder="15" />
          </div>
          <div>
            <label className="form-lbl">Dénivelé (m D+)</label>
            <input className="form-input" name="dplus" type="number" defaultValue={r.dplus ?? ''} placeholder="850" />
          </div>
        </div>
        {error && (
          <div className="alert-band" style={{ marginBottom: 10 }}>
            <div className="alert-text">{error}</div>
          </div>
        )}
        <button className="btn btn-primary btn-full" disabled={saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </form>
    </Modal>
  )
}
