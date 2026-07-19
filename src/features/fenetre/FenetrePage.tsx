import { useState, type ReactElement } from 'react'
import type { User } from 'firebase/auth'
import { availabilityCol } from '../../core/firebase/collections'
import { setDayAvailability } from '../../core/firebase/availability'
import {
  AVAILABLE_STATUSES,
  MONTH_LABELS,
  STATUS_META,
  WEEKDAY_LABELS,
  bestWeekends,
  monthDays,
} from '../../core/services/fenetre'
import { useCollection } from '../../hooks/useCollection'
import type { AvailabilityStatus } from '../../core/types'

interface FenetrePageProps {
  user: User
  memberName: string
}

const STATUSES: AvailabilityStatus[] = ['dispo', 'retour', 'prolonge', 'indispo']

const STATUS_ICONS: Record<AvailabilityStatus, ReactElement> = {
  dispo: (
    <path d="M20 6 9 17l-5-5" />
  ),
  retour: (
    <path d="M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
  ),
  prolonge: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M3 10h18M8 2v4M16 2v4M12 14v6M9 17h6" />
    </>
  ),
  indispo: (
    <path d="M18 6 6 18M6 6l12 12" />
  ),
}

export function FenetrePage({ user, memberName }: FenetrePageProps) {
  const { data: docs, loading } = useCollection(availabilityCol)
  const now = new Date()
  const [ym, setYm] = useState({ year: now.getFullYear(), month: now.getMonth() })
  const [brush, setBrush] = useState<AvailabilityStatus>('dispo')

  const days = monthDays(ym.year, ym.month)
  const members = docs.map((d) => ({ name: d.name, days: d.days ?? {} }))
  const mine = docs.find((d) => d.docId === user.uid)?.days ?? {}
  const windows = bestWeekends(ym.year, ym.month, members).filter((w) => w.available.length > 0)

  const prevMonth = () => setYm(({ year, month }) => (month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }))
  const nextMonth = () => setYm(({ year, month }) => (month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }))

  const paint = (iso: string) => {
    // Repeindre un jour avec son statut actuel l'efface (toggle).
    const next = mine[iso] === brush ? null : brush
    void setDayAvailability(user.uid, memberName, iso, next).catch((e) => console.warn('availability:', e))
  }

  return (
    <div className="tab active">
      <div className="info-box">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4A7FA8" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p>Renseigne tes disponibilités : choisis un statut puis touche les jours. La cordée voit les fenêtres communes.</p>
      </div>

      <h2 className="sec">Mon statut</h2>
      <div className="fen-status-cards">
        {STATUSES.map((s) => (
          <button
            key={s}
            className={brush === s ? 'fen-status-card active' : 'fen-status-card'}
            style={{ ['--brush' as string]: STATUS_META[s].color }}
            aria-label={STATUS_META[s].label}
            aria-pressed={brush === s}
            onClick={() => setBrush(s)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {STATUS_ICONS[s]}
            </svg>
            <span>
              <span className="fen-status-title">{STATUS_META[s].label}</span>
              <span className="fen-status-hint">{STATUS_META[s].hint}</span>
            </span>
          </button>
        ))}
      </div>
      <p className="fen-status-visibility">Visible par la cordée sur le calendrier, à ton nom.</p>

      <div className="sec" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button className="fen-nav" onClick={prevMonth} aria-label="Mois précédent">
          ←
        </button>
        <span>
          {MONTH_LABELS[ym.month]} {ym.year}
        </span>
        <button className="fen-nav" onClick={nextMonth} aria-label="Mois suivant">
          →
        </button>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="fen-grid">
          {WEEKDAY_LABELS.map((w, i) => (
            <div key={i} className="fen-wd">
              {w}
            </div>
          ))}
          {days[0] && Array.from({ length: days[0].weekday }, (_, i) => <div key={`pad${i}`} />)}
          {days.map((d) => {
            const my = mine[d.iso]
            const others = members.filter((m) => m.name !== memberName && AVAILABLE_STATUSES.includes(m.days[d.iso]))
            return (
              <button
                key={d.iso}
                className={d.isWeekend ? 'fen-day we' : 'fen-day'}
                style={my ? { background: STATUS_META[my].color, color: '#fff', borderColor: 'transparent' } : undefined}
                onClick={() => paint(d.iso)}
                aria-label={`${d.day} ${MONTH_LABELS[ym.month]}`}
                aria-pressed={Boolean(my)}
              >
                {d.day}
                <span className="fen-dots">
                  {others.slice(0, 4).map((m) => (
                    <i
                      key={m.name}
                      style={{ background: STATUS_META[m.days[d.iso]].color }}
                      role="img"
                      aria-label={`${m.name} : ${STATUS_META[m.days[d.iso]].label}`}
                    />
                  ))}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <h2 className="sec">Meilleures fenêtres du mois</h2>
      {loading && (
        <div className="spinner-wrap">
          <div className="spinner" />
        </div>
      )}
      {!loading && windows.length === 0 && (
        <div style={{ textAlign: 'center', padding: 20, color: 'var(--ink3)', fontSize: 11, fontFamily: 'var(--mono)' }}>
          AUCUNE FENÊTRE COMMUNE — RENSEIGNE TES DISPOS
        </div>
      )}
      {windows.map((w) => (
        <div className="card fen-window" key={w.saturday}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>
              Week-end du {w.label} {MONTH_LABELS[ym.month].toLowerCase()}
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink2)', marginTop: 3 }}>{w.available.join(', ')}</div>
            {w.mustReturnSunday.length > 0 && (
              <div style={{ fontSize: 10, color: STATUS_META.retour.color, marginTop: 2 }}>
                Retour dimanche soir : {w.mustReturnSunday.join(', ')}
              </div>
            )}
            {w.canExtend.length > 0 && (
              <div style={{ fontSize: 10, color: STATUS_META.prolonge.color, marginTop: 2 }}>
                Peuvent prolonger : {w.canExtend.join(', ')}
              </div>
            )}
          </div>
          <span className="tag tgold">
            {w.available.length}/{members.length || 1}
          </span>
        </div>
      ))}
    </div>
  )
}
