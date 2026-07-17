import { useState, type FormEvent } from 'react'
import { DateField, frToIso } from '../../components/DateField'
import { Modal } from '../../components/Modal'
import { addRando } from '../../core/firebase/randos'
import type { Difficulty } from '../../core/types'

/** Distance/dénivelé : seuls les entiers strictement positifs sont retenus. */
export function positive(v: FormDataEntryValue | null): number | undefined {
  const n = Math.round(Number(v))
  return Number.isFinite(n) && n > 0 ? n : undefined
}

/**
 * Ne laisse passer que des chiffres dans le champ, quelle que soit la source
 * (frappe, collage, autofill) — un onKeyDown seul n'attrape pas le collage.
 */
export function digitsOnlyInput(e: React.FormEvent<HTMLInputElement>) {
  const el = e.currentTarget
  const cleaned = el.value.replace(/\D/g, '')
  if (el.value !== cleaned) el.value = cleaned
}

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
        dateStart: frToIso(String(form.get('dateStart') ?? '')) || undefined,
        dateEnd: isTrek ? frToIso(String(form.get('dateEnd') ?? '')) || undefined : undefined,
        km: positive(form.get('km')),
        dplus: positive(form.get('dplus')),
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
      <form onSubmit={submit}>
        <div style={{ marginBottom: 9 }}>
          <label className="form-lbl">Nom</label>
          <input className="form-input" name="name" required placeholder="ex: Lac Blanc" />
        </div>
        <div className="form-row2" style={{ marginBottom: 9 }}>
          <div>
            <label className="form-lbl">Région</label>
            <input className="form-input" name="region" placeholder="ex: Haute-Savoie" />
          </div>
          <div>
            <label className="form-lbl">Niveau</label>
            <select className="form-input" name="diff" defaultValue="Moyen">
              <option>Facile</option>
              <option>Moyen</option>
              <option>Difficile</option>
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 9 }}>
          <label className="form-lbl">Lien Komoot (optionnel)</label>
          <input className="form-input" name="komoot" placeholder="https://www.komoot.com/tour/..." />
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
              <DateField name="dateStart" />
            </div>
          ) : (
            <div className="form-row2">
              <div>
                <label className="form-lbl">Du</label>
                <DateField name="dateStart" />
              </div>
              <div>
                <label className="form-lbl">Au</label>
                <DateField name="dateEnd" />
              </div>
            </div>
          )}
        </div>
        <div className="form-row2" style={{ marginBottom: 12 }}>
          <div>
            <label className="form-lbl">Distance (km)</label>
            <input className="form-input" name="km" type="text" inputMode="numeric" onInput={digitsOnlyInput} placeholder="15" />
          </div>
          <div>
            <label className="form-lbl">Dénivelé (m D+)</label>
            <input className="form-input" name="dplus" type="text" inputMode="numeric" onInput={digitsOnlyInput} placeholder="850" />
          </div>
        </div>
        {error && (
          <div className="alert-band" style={{ marginBottom: 10 }}>
            <div className="alert-text">{error}</div>
          </div>
        )}
        <button className="btn btn-primary btn-full" disabled={saving}>
          {saving ? 'Enregistrement…' : 'Proposer la rando'}
        </button>
      </form>
    </Modal>
  )
}
