import { useState } from 'react'
import { voteRando, deleteRando } from '../../core/firebase/randos'
import { jMinus, todayLocalISO } from '../../core/services/dates'
import { RandoDetailModal } from './RandoDetailModal'
import { useWeather } from '../../hooks/useWeather'
import type { Rando, VoteValue } from '../../core/types'
import type { WithDocId } from '../../hooks/useCollection'
import {
  AlertIcon,
  DplusIcon,
  DurIcon,
  KmIcon,
  PinIcon,
  TrashIcon,
} from '../../components/icons'

interface RandoCardProps {
  rando: WithDocId<Rando>
  memberName: string
}

const DIFF_TAG: Record<string, string> = {
  Facile: 'tg',
  Moyen: 'ta',
  Trek: 'tb',
  Difficile: 'tr',
}

export function RandoCard({ rando: r, memberName }: RandoCardProps) {
  const weather = useWeather(r.lat, r.lon)
  const [showDetail, setShowDetail] = useState(false)
  const myVote = r.memberVotes?.[memberName] ?? null
  const today = todayLocalISO()
  const jx = jMinus(r.dateStart, today)

  const vote = (v: VoteValue) => {
    void voteRando(r, memberName, v).catch((e) => console.warn('vote:', e))
  }

  const remove = () => {
    if (confirm(`Supprimer "${r.name}" ? Cette action est irréversible.`)) {
      void deleteRando(r.docId).catch((e) => console.warn('delete:', e))
    }
  }

  return (
    <div className="rcard">
      {/* Comme l'ancienne app : clic sur la zone principale = ouverture du détail */}
      <div className="rcard-top" onClick={() => setShowDetail(true)} style={{ cursor: 'pointer' }}>
        <div className="rcard-main">
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 6,
              marginBottom: 3,
            }}
          >
            <div className="rname" style={{ margin: 0, flex: 1 }}>
              {r.name}
              {r.alert && <span className="alert-dot" />}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
              {r.date && (
                <span style={{ fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--ink3)', whiteSpace: 'nowrap' }}>
                  {r.date}
                </span>
              )}
              {jx && (
                <span
                  style={{
                    fontSize: 9,
                    fontFamily: 'var(--mono)',
                    padding: '1px 6px',
                    borderRadius: 10,
                    background: 'var(--ink)',
                    color: 'var(--gold)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {jx}
                </span>
              )}
            </div>
          </div>
          <div className="rreg">
            <PinIcon />
            {r.region}
          </div>
          <div className="rstats">
            {r.km != null && (
              <span className="rst">
                <KmIcon />
                {r.km}km
              </span>
            )}
            {r.dplus != null && (
              <span className="rst">
                <DplusIcon />+{r.dplus}m
              </span>
            )}
            {r.dur && (
              <span className="rst">
                <DurIcon />
                {r.dur}
              </span>
            )}
            {r.diff && (
              <span className={`tag ${DIFF_TAG[r.diff] ?? 'ta'}`} style={{ marginLeft: 'auto' }}>
                {r.diff}
              </span>
            )}
          </div>
          <div className="vrow">
            <button
              className={myVote === 'oui' ? 'vbtn vyes' : 'vbtn'}
              onClick={(e) => {
                e.stopPropagation()
                vote('oui')
              }}
            >
              ✅ {myVote === 'oui' ? 'VOTÉ' : 'PARTANT'}
            </button>
            <button
              className={myVote === 'peut' ? 'vbtn vmay' : 'vbtn'}
              onClick={(e) => {
                e.stopPropagation()
                vote('peut')
              }}
            >
              🤔 PEUT-ÊTRE
            </button>
            <button
              className={myVote === 'non' ? 'vbtn vno' : 'vbtn'}
              onClick={(e) => {
                e.stopPropagation()
                vote('non')
              }}
            >
              🇨🇳 PAS PARTANT
            </button>
            <span className="vtally">
              {r.votes?.oui ?? 0}✓ {r.votes?.peut ?? 0}? {r.votes?.non ?? 0}✗
            </span>
            {r.proposedBy === memberName && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  remove()
                }}
                title="Supprimer"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 3,
                  color: 'var(--ink4)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <TrashIcon />
              </button>
            )}
          </div>
        </div>

        {weather === null && (r.lat != null || r.lon != null) && (
          <div className="rcard-wx wx-mid" style={{ justifyContent: 'center' }}>
            <div className="spinner" />
          </div>
        )}
        {weather === 'error' && (
          <div
            className="rcard-wx wx-mid"
            style={{ justifyContent: 'center', fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--ink3)' }}
          >
            N/A
          </div>
        )}
        {weather && weather !== 'error' && (
          <div className={`rcard-wx wx-${weather.quality}`}>
            <div className="wx-icon">{weather.icon}</div>
            <div className="wx-temp">{weather.temp}°</div>
            <div className="wx-wind">
              {weather.wind}km/h
            </div>
            <div className={`wx-lbl wx-${weather.quality}`}>{weather.label}</div>
          </div>
        )}
      </div>

      {weather && weather !== 'error' && (
        <div className="forecast">
          {weather.forecast.map((d, i) => (
            <div key={i} className="fc">
              <div className="fc-d">{d.dayName}</div>
              <div className="fc-i">{d.icon}</div>
              <div className="fc-t">{d.tempMax}°</div>
              {d.precipitation > 0 && <div className="fc-r">{d.precipitation}mm</div>}
            </div>
          ))}
        </div>
      )}

      {r.alert?.text && (
        <div style={{ padding: '0 13px 9px' }}>
          <div className="alert-band">
            <span style={{ color: 'var(--red)', flexShrink: 0, marginTop: 1 }}>
              <AlertIcon />
            </span>
            <div className="alert-text">{r.alert.text}</div>
          </div>
        </div>
      )}

      {showDetail && <RandoDetailModal rando={r} memberName={memberName} onClose={() => setShowDetail(false)} />}
    </div>
  )
}
