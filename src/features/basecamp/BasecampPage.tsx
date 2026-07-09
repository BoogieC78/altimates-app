import type { User } from 'firebase/auth'
import { randosCol } from '../../core/firebase/collections'
import { GEAR, LVLS } from '../../core/constants/gear'
import { jMinus } from '../../core/services/dates'
import { useCollection } from '../../hooks/useCollection'
import { useUserProfile } from '../../hooks/useUserProfile'

interface BasecampPageProps {
  user: User
  memberName: string
  onGoKit: () => void
}

export function BasecampPage({ user, memberName, onGoKit }: BasecampPageProps) {
  const { profile, loading } = useUserProfile(user)
  const { data: randos } = useCollection(randosCol)

  if (loading) {
    return (
      <div className="tab active">
        <div className="spinner-wrap">
          <div className="spinner" />
        </div>
      </div>
    )
  }

  const mode = profile?.mode ?? 'trek'
  const level = profile?.level ?? 'newbie'
  const lv = LVLS[level]
  const gear = GEAR[mode]
  const allItems = [...gear.indispensable, ...gear.recommande, ...gear.facultatif]
  const doneItems = allItems.filter((g) => profile?.checked?.[g.id]).length
  const kitPct = Math.round((doneItems / allItems.length) * 100)

  // Prochaine sortie où je suis partant (vote 'oui') avec une date future
  const today = new Date().toISOString().slice(0, 10)
  const next = randos
    .filter((r) => r.memberVotes?.[memberName] === 'oui' && r.dateStart && r.dateStart.slice(0, 10) >= today)
    .sort((a, b) => (a.dateStart ?? '').localeCompare(b.dateStart ?? ''))[0]
  const jx = next ? jMinus(next.dateStart, today) : null

  return (
    <div className="tab active">
      <div className="bc-hero">
        <div className="bc-hero-bg">
          <svg width="100%" height="100%" viewBox="0 0 440 160" preserveAspectRatio="xMidYMid slice">
            <g fill="none" stroke="#fff" strokeWidth="0.8">
              <path d="M-20,50 Q60,25 140,45 Q220,65 300,35 Q380,5 460,28" />
              <path d="M-20,80 Q60,55 140,75 Q220,95 300,65 Q380,35 460,58" />
              <path d="M-20,110 Q60,85 140,105 Q220,125 300,95 Q380,65 460,88" />
            </g>
          </svg>
        </div>
        <div className="bc-hero-content">
          <div className="bc-name">{memberName}</div>
          <div className="bc-meta">
            <span className={`tag ${lv.cls}`}>{lv.l}</span>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,.3)', fontFamily: 'var(--mono)' }}>
              BASE CAMP · ALTIMATES
            </span>
          </div>
          <div className="bc-stats">
            <div className="bc-stat">
              <div className="bc-stat-val">{profile?.km ?? 0}</div>
              <div className="bc-stat-lbl">km</div>
            </div>
            <div className="bc-stat">
              <div className="bc-stat-val">{profile?.dplus ? `+${profile.dplus.toLocaleString()}` : '0'}</div>
              <div className="bc-stat-lbl">D+</div>
            </div>
            <div className="bc-stat">
              <div className="bc-stat-val">{profile?.sorties ?? 0}</div>
              <div className="bc-stat-lbl">Sorties</div>
            </div>
          </div>
        </div>
      </div>

      {next && (
        <div className="bc-section">
          <div className="bc-section-title">Prochaine sortie</div>
          <div className="bc-next">
            <div className="bc-next-date">
              <div className="bc-next-day">{(next.date ?? '—').split(' ')[0]}</div>
              <div className="bc-next-month">{(next.date ?? '').split(' ').slice(1).join(' ')}</div>
            </div>
            <div className="bc-next-info">
              <div className="bc-next-title">{next.name}</div>
              <div className="bc-next-sub">
                {next.region}
                {next.km ? ` · ${next.km}km` : ''}
                {next.dplus ? ` · +${next.dplus}m` : ''}
              </div>
            </div>
            {jx && <div className="bc-countdown">{jx}</div>}
          </div>
        </div>
      )}

      <div className="bc-section">
        <div className="bc-section-title">Équipement</div>
        <div className="bc-kit-bar">
          <div className="bc-kit-circle">
            <svg width="44" height="44" viewBox="0 0 44 44">
              <circle cx="22" cy="22" r="18" fill="none" stroke="#E4DDD0" strokeWidth="4" />
              <circle
                cx="22"
                cy="22"
                r="18"
                fill="none"
                stroke="#2D2D2A"
                strokeWidth="4"
                strokeDasharray={`${((kitPct / 100) * 113.1).toFixed(1)} 113.1`}
                strokeLinecap="round"
              />
            </svg>
            <div className="bc-kit-pct">{kitPct}%</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 3 }}>
              {doneItems}/{allItems.length} équipements
            </div>
            <div style={{ fontSize: 10, color: 'var(--ink3)', fontFamily: 'var(--mono)' }}>
              {kitPct === 100 ? 'Kit complet !' : `${allItems.length - doneItems} articles manquants`}
            </div>
          </div>
          <button className="btn btn-sm btn-primary" onClick={onGoKit}>
            Kit
          </button>
        </div>
      </div>

      <div className="bc-section">
        <div className="bc-section-title">Personal bests</div>
        <div className="card" style={{ padding: '0 14px' }}>
          <div className="bc-record">
            <div className="bc-record-icon">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#C9A832" strokeWidth="2" strokeLinecap="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--mono)' }}>
                +{profile?.bestDplus ?? 0}m
              </div>
              <div style={{ fontSize: 10, color: 'var(--ink3)', fontFamily: 'var(--mono)' }}>Dénivelé max</div>
            </div>
          </div>
          <div className="bc-record">
            <div className="bc-record-icon">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#C9A832" strokeWidth="2" strokeLinecap="round">
                <path d="M2 12h20M2 12l4-4M2 12l4 4" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--mono)' }}>
                {profile?.bestKm ?? 0}km
              </div>
              <div style={{ fontSize: 10, color: 'var(--ink3)', fontFamily: 'var(--mono)' }}>Distance max</div>
            </div>
          </div>
          <div className="bc-record">
            <div className="bc-record-icon">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#C9A832" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--mono)' }}>{profile?.sorties ?? 0}</div>
              <div style={{ fontSize: 10, color: 'var(--ink3)', fontFamily: 'var(--mono)' }}>Sorties cette saison</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
