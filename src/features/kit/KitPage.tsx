import { useState } from 'react'
import type { User } from 'firebase/auth'
import { GEAR, GEAR_INFO, LVLS, type KitMode, type KitStatus, type Level } from '../../core/constants/gear'
import { budgetRange, findGearItem, kitStats } from '../../core/services/kit'
import { buildKitEmailLines, EMAIL_SECTION_LABELS, kitMailtoUrl } from '../../core/services/kitEmail'
import { generateKitPdf } from '../../core/services/kitPdf'
import { useUserProfile } from '../../hooks/useUserProfile'
import { Modal } from '../../components/Modal'
import { GearRow, type ShareData } from './GearRow'

type SectionKey = 'indispensable' | 'recommande' | 'facultatif'

const SECTIONS: { k: SectionKey; l: string; tag: string }[] = [
  { k: 'indispensable', l: 'Indispensables', tag: 'tr' },
  { k: 'recommande', l: 'Recommandés', tag: 'ta' },
  { k: 'facultatif', l: 'Facultatifs', tag: 'tgold' },
]

interface KitPageProps {
  user: User
  memberName: string
}

export function KitPage({ user, memberName }: KitPageProps) {
  const { profile, loading, update } = useUserProfile(user)
  const [openSec, setOpenSec] = useState<Record<SectionKey, boolean>>({
    indispensable: true,
    recommande: false,
    facultatif: false,
  })
  const [infoId, setInfoId] = useState<string | null>(null)
  const [emailOpen, setEmailOpen] = useState(false)
  const [emailAddr, setEmailAddr] = useState('')

  if (loading) {
    return (
      <div className="tab active">
        <div className="spinner-wrap">
          <div className="spinner" />
        </div>
      </div>
    )
  }

  // Onboarding : même parcours que l'ancienne app (niveau + mode) si le profil est incomplet.
  if (!profile?.mode || !profile?.level) {
    const configure = (level: Level, mode: KitMode) => {
      void update({ name: profile?.name ?? memberName, level, mode })
    }
    return <Onboarding onDone={configure} />
  }

  const mode = profile.mode
  const level = profile.level
  const kitStatus = profile.kitStatus ?? {}
  const kitShare = profile.kitShare ?? {}
  const gear = GEAR[mode]
  const stats = kitStats(mode, kitStatus)
  const { min: budgetMin, max: budgetMax } = budgetRange(stats.missing)

  const setStatus = (id: string, status: KitStatus) => {
    const next = { ...kitStatus }
    const checked = { ...(profile.checked ?? {}) }
    if (next[id] === status) {
      delete next[id]
      checked[id] = false
    } else {
      next[id] = status
      checked[id] = status === 'have'
    }
    void update({ kitStatus: next, checked })
  }

  const shareFor = (id: string): ShareData => kitShare[id] ?? { shared: false, capacity: 1 }

  const toggleShare = (id: string) => {
    const cur = shareFor(id)
    void update({ kitShare: { ...kitShare, [id]: { ...cur, shared: !cur.shared } } })
  }

  const setShareCapacity = (id: string, capacity: number) => {
    const cur = shareFor(id)
    void update({ kitShare: { ...kitShare, [id]: { ...cur, capacity } } })
  }

  const info = infoId ? GEAR_INFO[infoId] : null

  return (
    <div className="tab active">
      <div className="budget-summary">
        <div className="budget-topo">
          <svg width="100%" height="100%" viewBox="0 0 400 100" preserveAspectRatio="xMidYMid slice">
            <g fill="none" stroke="#fff" strokeWidth="0.8">
              <path d="M-20,30 Q80,10 180,28 Q280,46 380,20 Q420,8 450,16" />
              <path d="M-20,55 Q80,35 180,53 Q280,71 380,45 Q420,33 450,41" />
              <path d="M-20,80 Q80,60 180,78 Q280,96 380,70 Q420,58 450,66" />
            </g>
          </svg>
        </div>
        <div className="budget-content">
          <div
            style={{
              fontSize: 10,
              color: 'rgba(255,255,255,.65)',
              fontFamily: 'var(--mono)',
              letterSpacing: '.08em',
              marginBottom: 4,
            }}
          >
            BUDGET ESTIMÉ · ARTICLES MANQUANTS
          </div>
          <div className="budget-total">
            {budgetMin > 0 ? `${budgetMin}€` : '—'}
            <span style={{ fontSize: 16, color: 'rgba(232,200,74,.5)' }}> – {budgetMax > 0 ? `${budgetMax}€` : '—'}</span>
          </div>
          <div className="budget-sub">Entrée de gamme → milieu de gamme</div>
          <div className="budget-grid">
            <div className="budget-stat">
              <div className="budget-stat-val">
                {stats.done}/{stats.total}
              </div>
              <div className="budget-stat-lbl">Coché</div>
            </div>
            <div className="budget-stat">
              <div className="budget-stat-val">{stats.missing.length}</div>
              <div className="budget-stat-lbl">À acheter</div>
            </div>
            <div className="budget-stat">
              <div className="budget-stat-val">{stats.pct}%</div>
              <div className="budget-stat-lbl">Complet</div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="card"
        style={{
          padding: '8px 12px',
          marginBottom: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          rowGap: 6,
        }}
      >
        <div style={{ display: 'flex', gap: 6 }}>
          <span className={`tag ${LVLS[level].cls}`}>{LVLS[level].l}</span>
          <span className={`tag ${mode === 'trek' ? 'tb' : 'tg'}`}>{mode === 'trek' ? 'Trek' : 'Journée'}</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-gold btn-sm" onClick={() => void generateKitPdf(mode, kitStatus, memberName)}>
            PDF
          </button>
          <button className="btn btn-sm" onClick={() => setEmailOpen(true)}>
            Email
          </button>
          <button className="btn btn-sm" onClick={() => void update({ mode: mode === 'trek' ? 'journee' : 'trek' })}>
            {mode === 'trek' ? 'Journée' : 'Trek'}
          </button>
        </div>
      </div>

      {level === 'newbie' && (
        <div className="info-box">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4A7FA8" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p>Coche les articles que tu as déjà. Les liens te renvoient vers des produits recommandés pour chaque article manquant.</p>
        </div>
      )}

      <div className="card" style={{ padding: '0 14px' }}>
        {SECTIONS.map((s) => {
          const items = gear[s.k]
          const done = items.filter((g) => kitStatus[g.id] === 'have').length
          const open = openSec[s.k]
          return (
            <div key={s.k}>
              <button
                type="button"
                className="sec-toggle"
                aria-expanded={open}
                onClick={() => setOpenSec({ ...openSec, [s.k]: !open })}
              >
                <span className="sec-toggle-title">
                  <span className={`tag ${s.tag}`}>{s.l}</span>
                  <span style={{ fontSize: 10, color: 'var(--ink3)' }}>{items.length} articles</span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 9, color: 'var(--ink3)', fontFamily: 'var(--mono)' }}>
                    {done}/{items.length}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--ink3)' }} aria-hidden="true">{open ? '▲' : '▼'}</span>
                </span>
              </button>
              {open &&
                items.map((g) => (
                  <GearRow
                    key={g.id}
                    item={g}
                    status={kitStatus[g.id]}
                    share={shareFor(g.id)}
                    onStatus={setStatus}
                    onShareToggle={toggleShare}
                    onShareCapacity={setShareCapacity}
                    onInfo={setInfoId}
                  />
                ))}
            </div>
          )
        })}
      </div>

      {emailOpen && (
        <Modal title="Recevoir mon kit" onClose={() => setEmailOpen(false)}>
          <div style={{ marginBottom: 10 }}>
            <label className="form-lbl" htmlFor="kit-email-addr">
              Email
            </label>
            <input
              id="kit-email-addr"
              className="form-input"
              type="email"
              placeholder="prenom@email.com"
              value={emailAddr}
              onChange={(e) => setEmailAddr(e.target.value)}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label className="form-lbl" style={{ marginBottom: 5 }}>
              Aperçu
            </label>
            <div className="email-preview">
              {buildKitEmailLines(mode, profile.checked ?? {}, memberName).map((l, i) => (
                <div key={i} style={EMAIL_SECTION_LABELS.includes(l) ? { fontWeight: 500, marginTop: 6 } : undefined}>
                  {l || ' '}
                </div>
              ))}
            </div>
          </div>
          <button
            className="btn btn-full"
            onClick={() => {
              window.location.href = kitMailtoUrl(emailAddr, mode, profile.checked ?? {}, memberName)
              setEmailOpen(false)
            }}
          >
            Ouvrir messagerie
          </button>
        </Modal>
      )}

      {info && infoId && (
        <Modal title={findGearItem(infoId)?.name ?? 'Conseils'} onClose={() => setInfoId(null)}>
          <p className="t-body" style={{ marginBottom: 12 }}>{info.tip}</p>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {info.links.map((l) => (
              <a className="platform-link" key={l.label} href={l.url} target="_blank" rel="noopener noreferrer">
                <img src={l.favicon} width="12" height="12" style={{ borderRadius: 2 }} alt="" />
                {l.label}
              </a>
            ))}
          </div>
        </Modal>
      )}
    </div>
  )
}

function Onboarding({ onDone }: { onDone: (level: Level, mode: KitMode) => void }) {
  const [level, setLevel] = useState<Level | null>(null)

  return (
    <div className="tab active">
      <div style={{ textAlign: 'center', padding: '30px 16px' }}>
        <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 5 }}>
          {level ? 'Plutôt journée ou trek ?' : 'Ton niveau en rando ?'}
        </p>
        <p style={{ fontSize: 11, marginBottom: 16, fontFamily: 'var(--mono)', color: 'var(--ink3)', lineHeight: 1.6 }}>
          2 questions · liste personnalisée
        </p>
        {!level ? (
          <div style={{ display: 'grid', gap: 8, maxWidth: 260, margin: '0 auto' }}>
            {(Object.keys(LVLS) as Level[]).map((k) => (
              <button key={k} className="btn btn-full" onClick={() => setLevel(k)}>
                {LVLS[k].l}
              </button>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 8, maxWidth: 260, margin: '0 auto' }}>
            <button className="btn btn-full" onClick={() => onDone(level, 'journee')}>
              Journée
            </button>
            <button className="btn btn-full btn-primary" onClick={() => onDone(level, 'trek')}>
              Trek (multi-jours)
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
