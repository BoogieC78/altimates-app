import { useMemo, useState } from 'react'
import { randosCol } from '../../core/firebase/collections'
import { isPast } from '../../core/services/dates'
import { useCollection } from '../../hooks/useCollection'
import { RandoCard } from './RandoCard'
import { AddRandoModal } from './AddRandoModal'
import { PlusIcon } from '../../components/icons'

interface SommetsPageProps {
  memberName: string
}

export function SommetsPage({ memberName }: SommetsPageProps) {
  const { data: randos, loading, error } = useCollection(randosCol)
  const [showAdd, setShowAdd] = useState(false)

  const { upcoming, past } = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const upcoming = randos
      .filter((r) => !isPast(r, today))
      .sort((a, b) => (a.dateStart ?? '9999').localeCompare(b.dateStart ?? '9999'))
    const past = randos
      .filter((r) => isPast(r, today))
      .sort((a, b) => (b.dateStart ?? '').localeCompare(a.dateStart ?? ''))
    return { upcoming, past }
  }, [randos])

  return (
    <>
      <div className="tab active" style={{ paddingBottom: 130 }}>
        {loading && (
          <div className="spinner-wrap">
            <div className="spinner" />
            <span style={{ fontSize: 10, color: 'var(--ink4)', fontFamily: 'var(--mono)' }}>CHARGEMENT…</span>
          </div>
        )}
        {error && (
          <div className="alert-band">
            <div className="alert-text">{error.message}</div>
          </div>
        )}
        {!loading && !error && (
          <>
            <div className="sec">Randos proposées</div>
            {upcoming.length === 0 && (
              <div className="card">
                <div className="t-body">Aucune sortie planifiée. Propose la prochaine !</div>
              </div>
            )}
            {upcoming.map((r) => (
              <RandoCard key={r.docId} rando={r} memberName={memberName} />
            ))}

            {past.length > 0 && (
              <>
                <div className="sec" style={{ marginTop: 18 }}>
                  Sorties passées
                </div>
                <div style={{ opacity: 0.6 }}>
                  {past.map((r) => (
                    <RandoCard key={r.docId} rando={r} memberName={memberName} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <div className="propose-btn-wrap visible">
        <button className="propose-btn" onClick={() => setShowAdd(true)}>
          <PlusIcon />
          Proposer une rando
        </button>
      </div>

      {showAdd && <AddRandoModal memberName={memberName} onClose={() => setShowAdd(false)} />}
    </>
  )
}
