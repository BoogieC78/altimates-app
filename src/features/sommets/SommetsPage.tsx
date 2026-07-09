import { orderBy } from 'firebase/firestore'
import { randosCol } from '../../core/firebase/collections'
import { useCollection } from '../../hooks/useCollection'

// Première feature migrée, en lecture seule pour valider le socle Firestore.
// Votes, météo et détail rando arrivent dans les PR suivantes.
export function SommetsPage() {
  const { data: randos, loading, error } = useCollection(randosCol, orderBy('date', 'asc'))

  if (loading) return <p className="muted">Chargement des sorties…</p>
  if (error) return <p className="muted">Erreur : {error.message}</p>
  if (randos.length === 0) return <p className="muted">Aucune sortie planifiée.</p>

  return (
    <ul className="rando-list">
      {randos.map((r) => (
        <li key={r.id} className="rando-card">
          <div className="rando-name">{r.name}</div>
          <div className="rando-meta">
            {r.region} · {r.date}
            {r.dateEnd ? ` → ${r.dateEnd}` : ''} · {r.dplus} m D+
            {r.durType === 'trek' ? ' · trek' : ''}
          </div>
          {r.alert?.text && <div className="rando-alert">⚠ {r.alert.text}</div>}
        </li>
      ))}
    </ul>
  )
}
