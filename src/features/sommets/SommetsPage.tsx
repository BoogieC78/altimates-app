import { useMemo, useState } from 'react'
import { randosCol } from '../../core/firebase/collections'
import { isPast } from '../../core/services/dates'
import { useCollection } from '../../hooks/useCollection'
import { RandoCard } from './RandoCard'
import { AddRandoModal } from './AddRandoModal'

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

  if (loading) return <p className="muted">Chargement des sorties…</p>
  if (error) return <p className="muted">Erreur : {error.message}</p>

  return (
    <>
      <div className="page-head">
        <h2>Prochaines sorties</h2>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>
          + Proposer
        </button>
      </div>

      {upcoming.length === 0 ? (
        <p className="muted">Aucune sortie planifiée. Propose la prochaine !</p>
      ) : (
        <ul className="rando-list">
          {upcoming.map((r) => (
            <RandoCard key={r.docId} rando={r} memberName={memberName} />
          ))}
        </ul>
      )}

      {past.length > 0 && (
        <>
          <h2 className="section-past">Sorties passées</h2>
          <ul className="rando-list past">
            {past.map((r) => (
              <RandoCard key={r.docId} rando={r} memberName={memberName} />
            ))}
          </ul>
        </>
      )}

      {showAdd && <AddRandoModal memberName={memberName} onClose={() => setShowAdd(false)} />}
    </>
  )
}
