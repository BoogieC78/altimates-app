import { useState } from 'react'
import { voteRando, deleteRando } from '../../core/firebase/randos'
import { jMinus, todayLocalISO } from '../../core/services/dates'
import { RandoDetailModal } from './RandoDetailModal'
import { PhotoLightbox, type LightboxPhoto } from './PhotoLightbox'
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

/** Nombre de vignettes montrées sur la carte avant le raccourci « +N ». */
const STRIP_LIMIT = 4

interface RandoCardProps {
  rando: WithDocId<Rando>
  memberName: string
  /**
   * Photos de cette sortie. Fournies par la page plutôt que lues ici : une carte
   * qui s'abonnerait elle-même à `randoMedia` multiplierait l'abonnement par le
   * nombre de sorties affichées, pour la même collection.
   */
  photos?: LightboxPhoto[]
}

const DIFF_TAG: Record<string, string> = {
  Facile: 'tg',
  Moyen: 'ta',
  Trek: 'tb',
  Difficile: 'tr',
}

export function RandoCard({ rando: r, memberName, photos = [] }: RandoCardProps) {
  const weather = useWeather(r.lat, r.lon)
  const [showDetail, setShowDetail] = useState(false)
  const [detailTab, setDetailTab] = useState<'info' | 'photos'>('info')
  const [zoomed, setZoomed] = useState<number | null>(null)
  const myVote = r.memberVotes?.[memberName] ?? null
  const today = todayLocalISO()
  const jx = jMinus(r.dateStart, today)

  const vote = (v: VoteValue) => {
    void voteRando(r, memberName, v).catch((e) => console.warn('vote:', e))
  }

  const openDetail = (tab: 'info' | 'photos' = 'info') => {
    setDetailTab(tab)
    setShowDetail(true)
  }

  const remove = () => {
    if (confirm(`Supprimer "${r.name}" ? Cette action est irréversible.`)) {
      void deleteRando(r.docId).catch((e) => console.warn('delete:', e))
    }
  }

  return (
    <div className="rcard">
      {/* Comme l'ancienne app : clic sur la zone principale = ouverture du détail */}
      <div
        className="rcard-top"
        role="button"
        tabIndex={0}
        aria-label="Détails de la rando"
        onClick={() => openDetail()}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return
          if (e.key === 'Enter' || e.key === ' ') {
            if (e.key === ' ') e.preventDefault()
            openDetail()
          }
        }}
        style={{ cursor: 'pointer' }}
      >
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
            {r.visibility === 'public' && (
              <span
                className="tag tb"
                style={{ marginLeft: 'auto' }}
                title="Visible par les membres des autres cordées"
              >
                Publique
              </span>
            )}
            {r.diff && (
              <span
                className={`tag ${DIFF_TAG[r.diff] ?? 'ta'}`}
                style={{ marginLeft: r.visibility === 'public' ? undefined : 'auto' }}
              >
                {r.diff}
              </span>
            )}
          </div>
          <div className="vrow">
            <button
              className={myVote === 'oui' ? 'vbtn vyes' : 'vbtn'}
              aria-pressed={myVote === 'oui'}
              onClick={(e) => {
                e.stopPropagation()
                vote('oui')
              }}
            >
              ✅ {myVote === 'oui' ? 'VOTÉ' : 'PARTANT'}
            </button>
            <button
              className={myVote === 'peut' ? 'vbtn vmay' : 'vbtn'}
              aria-pressed={myVote === 'peut'}
              onClick={(e) => {
                e.stopPropagation()
                vote('peut')
              }}
            >
              🤔 PEUT-ÊTRE
            </button>
            <button
              className={myVote === 'non' ? 'vbtn vno' : 'vbtn'}
              aria-pressed={myVote === 'non'}
              onClick={(e) => {
                e.stopPropagation()
                vote('non')
              }}
            >
              ❌ PAS PARTANT
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
                aria-label="Supprimer"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 8,
                  margin: -5,
                  color: 'var(--ink3)',
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
            <div className="wx-icon">
              <span aria-hidden="true">{weather.icon}</span>
            </div>
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

      {/* Les photos d'une sortie n'étaient visibles qu'après avoir ouvert le détail
          PUIS l'onglet Photos. Les poser ici les rend visibles dans la liste, et
          un clic sur une vignette ouvre directement le plein écran. */}
      {photos.length > 0 && (
        <div className="rphotos">
          {photos.slice(0, STRIP_LIMIT).map((p, i) => (
            <button
              key={p.docId}
              className="rphoto-btn"
              aria-label={`Agrandir la photo de ${p.author}`}
              onClick={(e) => {
                e.stopPropagation()
                setZoomed(i)
              }}
            >
              <img src={p.dataUrl} alt="" aria-hidden="true" />
            </button>
          ))}
          {photos.length > STRIP_LIMIT && (
            <button
              className="rphoto-more"
              aria-label={`Voir les ${photos.length} photos de la sortie`}
              onClick={(e) => {
                e.stopPropagation()
                openDetail('photos')
              }}
            >
              +{photos.length - STRIP_LIMIT}
            </button>
          )}
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

      {zoomed !== null && (
        <PhotoLightbox photos={photos} startIndex={zoomed} onClose={() => setZoomed(null)} />
      )}

      {showDetail && (
        <RandoDetailModal
          rando={r}
          memberName={memberName}
          initialTab={detailTab}
          onClose={() => setShowDetail(false)}
        />
      )}
    </div>
  )
}
