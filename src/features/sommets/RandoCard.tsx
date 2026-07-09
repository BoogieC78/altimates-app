import { voteRando, deleteRando } from '../../core/firebase/randos'
import { votersFor } from '../../core/services/votes'
import { useWeather } from '../../hooks/useWeather'
import type { Rando, VoteValue } from '../../core/types'
import type { WithDocId } from '../../hooks/useCollection'

interface RandoCardProps {
  rando: WithDocId<Rando>
  memberName: string
}

export function RandoCard({ rando: r, memberName }: RandoCardProps) {
  const weather = useWeather(r.lat, r.lon)
  const myVote = r.memberVotes?.[memberName] ?? null
  const partants = votersFor(r, 'oui')
  const peutEtre = votersFor(r, 'peut')

  const vote = (v: VoteValue) => {
    void voteRando(r, memberName, v).catch((e) => console.warn('vote:', e))
  }

  const remove = () => {
    if (confirm(`Supprimer "${r.name}" ? Cette action est irréversible.`)) {
      void deleteRando(r.docId).catch((e) => console.warn('delete:', e))
    }
  }

  return (
    <li className="rando-card">
      <div className="rando-top">
        <div className="rando-main">
          <div className="rando-name">{r.name}</div>
          <div className="rando-meta">
            {r.region}
            {r.date ? ` · ${r.date}` : ''}
            {r.dur && r.dur !== '1j' ? ` · ${r.dur}` : ''}
            {r.diff ? ` · ${r.diff}` : ''}
            {r.km ? ` · ${r.km} km` : ''}
            {r.dplus ? ` · ${r.dplus} m D+` : ''}
          </div>
          {r.desc && <div className="rando-desc">{r.desc}</div>}
        </div>
        {weather && weather !== 'error' && (
          <div className={`wx wx-${weather.quality}`}>
            <div className="wx-icon">{weather.icon}</div>
            <div className="wx-temp">{weather.temp}°</div>
            <div className="wx-wind">{weather.wind} km/h</div>
            <div className="wx-label">{weather.label}</div>
          </div>
        )}
      </div>

      {weather && weather !== 'error' && (
        <div className="forecast">
          {weather.forecast.map((d, i) => (
            <div key={i} className="fc">
              <div className="fc-day">{d.dayName}</div>
              <div className="fc-icon">{d.icon}</div>
              <div className="fc-temp">{d.tempMax}°</div>
              {d.precipitation > 0 && <div className="fc-rain">{d.precipitation}mm</div>}
            </div>
          ))}
        </div>
      )}

      {r.alert?.text && <div className="rando-alert">⚠ {r.alert.text}</div>}

      <div className="rando-actions">
        <button className={myVote === 'oui' ? 'btn-vote active' : 'btn-vote'} onClick={() => vote('oui')}>
          ✓ Partant {r.votes?.oui ?? 0}
        </button>
        <button className={myVote === 'peut' ? 'btn-vote active' : 'btn-vote'} onClick={() => vote('peut')}>
          ? Peut-être {r.votes?.peut ?? 0}
        </button>
        {r.traces?.[0]?.url && (
          <a className="btn-link" href={r.traces[0].url} target="_blank" rel="noreferrer">
            Komoot ↗
          </a>
        )}
        {r.proposedBy === memberName && (
          <button className="btn-ghost btn-delete" onClick={remove} title="Supprimer">
            🗑
          </button>
        )}
      </div>

      {(partants.length > 0 || peutEtre.length > 0) && (
        <div className="rando-voters">
          {partants.length > 0 && <span>✓ {partants.join(', ')}</span>}
          {peutEtre.length > 0 && <span>? {peutEtre.join(', ')}</span>}
        </div>
      )}
    </li>
  )
}
