import { transportCol } from '../../core/firebase/collections'
import { clearTransport, setTransport } from '../../core/firebase/transport'
import {
  MAX_SEATS,
  MIN_SEATS,
  PLACES_PAR_VOITURE,
  clampSeats,
  summarizeTransport,
} from '../../core/services/transport'
import { useCollection, type WithDocId } from '../../hooks/useCollection'
import type { Rando, TransportMode } from '../../core/types'

const MODE_LABELS: Record<TransportMode, string> = {
  voiture: "J'amène ma voiture",
  passager: 'Je cherche une place',
  'non-vehicule': 'Non véhiculé',
}

/**
 * Onglet Transport d'une sortie : chacun déclare comment il rejoint le parking
 * de départ, l'app en déduit le nombre de voitures nécessaires (1 pour 3,
 * sacs et matos compris) et ce qui manque.
 */
export function TransportTab({ rando: r, memberName }: { rando: WithDocId<Rando>; memberName: string }) {
  const randoId = String(r.id)
  const { data: allDocs } = useCollection(transportCol)
  const docs = allDocs.filter((d) => d.randoId === randoId)

  const partants = Object.entries(r.memberVotes ?? {})
    .filter(([, v]) => v === 'oui')
    .map(([name]) => name)
  // Le membre courant est ajouté même s'il n'a pas encore voté : il doit
  // pouvoir se déclarer sans passer d'abord par le vote.
  const participants = Array.from(new Set([...partants, memberName])).sort()

  const summary = summarizeTransport(participants, docs)
  const mine = docs.find((d) => d.member === memberName)
  const mySeats = clampSeats(mine?.seats)

  const choose = (mode: TransportMode) => {
    if (mine?.mode === mode) {
      void clearTransport(randoId, memberName).catch((e) => console.warn('clearTransport:', e))
      return
    }
    void setTransport(randoId, memberName, mode, mode === 'voiture' ? mySeats : undefined).catch((e) =>
      console.warn('setTransport:', e),
    )
  }

  const changeSeats = (seats: number) => {
    void setTransport(randoId, memberName, 'voiture', clampSeats(seats)).catch((e) => console.warn('setTransport:', e))
  }

  const manque = summary.placesManquantes > 0

  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--ink3)', fontFamily: 'var(--mono)', marginBottom: 10 }}>
        {PLACES_PAR_VOITURE} personnes par voiture, sacs et matos compris.
      </div>

      {/* Ma déclaration */}
      <h2 className="sec">Comment je viens</h2>
      <div className="card" style={{ padding: '12px 14px', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(Object.keys(MODE_LABELS) as TransportMode[]).map((mode) => (
            <button
              key={mode}
              className={mine?.mode === mode ? 'time-btn active' : 'time-btn'}
              aria-pressed={mine?.mode === mode}
              onClick={() => choose(mode)}
            >
              {MODE_LABELS[mode]}
            </button>
          ))}
        </div>
        {mine?.mode === 'voiture' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
            <label htmlFor="transport-seats" style={{ flex: 1, fontSize: 12 }}>
              Places passagers
              <div style={{ fontSize: 10, color: 'var(--ink3)', fontFamily: 'var(--mono)' }}>en plus de toi, matos compris</div>
            </label>
            <input
              id="transport-seats"
              type="number"
              className="hydra-num"
              min={MIN_SEATS}
              max={MAX_SEATS}
              defaultValue={mySeats}
              onBlur={(e) => changeSeats(Number(e.target.value))}
            />
          </div>
        )}
      </div>

      {/* Récapitulatif */}
      <h2 className="sec">Récapitulatif</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <div className="card" style={{ textAlign: 'center', padding: 10 }}>
          <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--mono)' }}>
            {summary.voituresNecessaires}
          </div>
          <div style={{ fontSize: 9, color: 'var(--ink3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', marginTop: 2 }}>
            Voiture{summary.voituresNecessaires > 1 ? 's' : ''} nécessaire{summary.voituresNecessaires > 1 ? 's' : ''}
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: 10 }}>
          <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--mono)' }}>
            {summary.placesOffertes}
          </div>
          <div style={{ fontSize: 9, color: 'var(--ink3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', marginTop: 2 }}>
            Places proposées
          </div>
        </div>
      </div>

      <div className={manque ? 'hydra-alert' : 'hydra-alert hydra-ok'} style={{ marginTop: 0, marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: manque ? 'var(--red)' : 'var(--green)' }}>
          {manque
            ? `Il manque ${summary.voituresManquantes} voiture${summary.voituresManquantes > 1 ? 's' : ''} (${summary.placesManquantes} place${summary.placesManquantes > 1 ? 's' : ''})`
            : 'Tout le monde a une place'}
        </span>
      </div>

      {/* Qui vient comment */}
      <h2 className="sec">Qui vient comment</h2>
      <div className="card" style={{ padding: '0 14px', marginBottom: 12 }}>
        {participants.map((name) => {
          const d = docs.find((x) => x.member === name)
          const detail = !d
            ? 'pas encore répondu'
            : d.mode === 'voiture'
              ? `voiture · ${clampSeats(d.seats)} place${clampSeats(d.seats) > 1 ? 's' : ''}`
              : MODE_LABELS[d.mode].toLowerCase()
          return (
            <div className="hydra-input-row" key={name}>
              <div style={{ flex: 1, fontSize: 12, fontWeight: 500 }}>
                {name}
                {name === memberName ? ' (toi)' : ''}
              </div>
              <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: d ? 'var(--ink2)' : 'var(--ink3)' }}>{detail}</div>
            </div>
          )
        })}
      </div>

      {summary.nonVehicules.length > 0 && (
        <div style={{ fontSize: 10, color: 'var(--ink3)', fontFamily: 'var(--mono)', marginBottom: 12 }}>
          {summary.nonVehicules.join(', ')} sans voiture : trajet train/bus à organiser entre vous pour l'instant.
        </div>
      )}
    </div>
  )
}
