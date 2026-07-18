import { useMemo, useState } from 'react'
import { randosCol } from '../../core/firebase/collections'
import { isPast, todayLocalISO } from '../../core/services/dates'
import { useCollection } from '../../hooks/useCollection'
import { RandoCard } from './RandoCard'
import { AddRandoModal } from './AddRandoModal'
import { PlusIcon } from '../../components/icons'

interface SommetsPageProps {
  memberName: string
}

const DPLUS_MAX_OPTIONS = [500, 1000, 1500, 2000] as const

export function SommetsPage({ memberName }: SommetsPageProps) {
  const { data: randos, loading, error } = useCollection(randosCol)
  const [showAdd, setShowAdd] = useState(false)
  const [dplusMax, setDplusMax] = useState<number | null>(null)

  const { upcoming, past } = useMemo(() => {
    const today = todayLocalISO()
    const filtered = dplusMax == null ? randos : randos.filter((r) => r.dplus == null || r.dplus <= dplusMax)
    const upcoming = filtered
      .filter((r) => !isPast(r, today))
      .sort((a, b) => (a.dateStart ?? '9999').localeCompare(b.dateStart ?? '9999'))
    const past = filtered
      .filter((r) => isPast(r, today))
      .sort((a, b) => (b.dateStart ?? '').localeCompare(a.dateStart ?? ''))
    return { upcoming, past }
  }, [randos, dplusMax])

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
            <div className="dplus-filter" role="group" aria-label="Filtrer par dénivelé max">
              <button
                type="button"
                className={dplusMax == null ? 'dplus-chip active' : 'dplus-chip'}
                onClick={() => setDplusMax(null)}
              >
                Tout dénivelé
              </button>
              {DPLUS_MAX_OPTIONS.map((max) => (
                <button
                  key={max}
                  type="button"
                  className={dplusMax === max ? 'dplus-chip active' : 'dplus-chip'}
                  onClick={() => setDplusMax(max)}
                >
                  ≤ {max} m
                </button>
              ))}
            </div>
            {upcoming.length === 0 && (
              <div className="card">
                <div className="t-body">
                  {dplusMax == null
                    ? 'Aucune sortie planifiée. Propose la prochaine !'
                    : 'Aucune sortie sous ce dénivelé.'}
                </div>
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
