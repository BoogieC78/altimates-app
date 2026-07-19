import { useState } from 'react'
import type { User } from 'firebase/auth'
import { randosCol } from '../../core/firebase/collections'
import { GEAR, LVLS, type Level } from '../../core/constants/gear'
import { jMinus, todayLocalISO } from '../../core/services/dates'
import { signOut } from '../../core/firebase/auth'
import { useCollection } from '../../hooks/useCollection'
import { useUserProfile, type PastOuting, type Profile } from '../../hooks/useUserProfile'
import { Modal } from '../../components/Modal'
import { TrashIcon } from '../../components/icons'
import { RandoDetailModal } from '../sommets/RandoDetailModal'
import { blockNonDigitKeys } from '../sommets/AddRandoModal'

interface BasecampPageProps {
  user: User
  memberName: string
  onGoKit: () => void
}

export function BasecampPage({ user, memberName, onGoKit }: BasecampPageProps) {
  const { profile, loading, update, reset } = useUserProfile(user)
  const { data: randos } = useCollection(randosCol)
  const [editing, setEditing] = useState(false)
  const [showNext, setShowNext] = useState(false)

  if (loading) {
    return (
      <div className="tab active">
        <div className="spinner-wrap">
          <div className="spinner" />
        </div>
      </div>
    )
  }

  // État vide (profil non configuré) : équivalent de renderBaseCamp() sans user.
  if (!profile?.level) {
    return (
      <div className="tab active">
        <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--ink3)' }}>
          <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'center' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2D2D2A" strokeWidth="1.5" strokeLinecap="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9,22 9,12 15,12 15,22" />
            </svg>
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: 'var(--ink)' }}>
            Installe ton Base Camp
          </p>
          <p style={{ fontSize: 11, marginBottom: 16, fontFamily: 'var(--mono)', lineHeight: 1.6 }}>
            Ton QG perso — stats, kit, prochaine sortie
          </p>
          <button className="btn btn-primary" onClick={() => setEditing(true)}>
            Configurer
          </button>
          <div style={{ marginTop: 18 }}>
            <button className="btn btn-sm" onClick={() => void signOut()}>
              Déconnexion
            </button>
          </div>
        </div>

        {editing && (
          <EditProfileModal
            profile={profile}
            memberName={memberName}
            onSave={(patch) => {
              void update(patch)
              setEditing(false)
            }}
            onClose={() => setEditing(false)}
          />
        )}
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
  const today = todayLocalISO()
  const next = randos
    .filter((r) => r.memberVotes?.[memberName] === 'oui' && r.dateStart && r.dateStart.slice(0, 10) >= today)
    .sort((a, b) => (a.dateStart ?? '').localeCompare(b.dateStart ?? ''))[0]
  const jx = next ? jMinus(next.dateStart, today) : null

  const openNext = () => {
    if (next) setShowNext(true)
  }

  const handleReset = () => {
    if (window.confirm('Réinitialiser ton profil ? Tes stats et ta configuration kit seront effacées.')) {
      void reset()
    }
  }

  return (
    <div className="tab active">
      <div
        className="bc-hero"
        onClick={openNext}
        style={next ? { cursor: 'pointer' } : undefined}
        role={next ? 'button' : undefined}
        tabIndex={next ? 0 : undefined}
        aria-label={next ? 'Voir la prochaine sortie' : undefined}
        onKeyDown={
          next
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  if (e.key === ' ') e.preventDefault()
                  openNext()
                }
              }
            : undefined
        }
      >
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
          <div className="bc-name">{profile?.name ?? memberName}</div>
          <div className="bc-meta">
            <span className={`tag ${lv.cls}`}>{lv.l}</span>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,.65)', fontFamily: 'var(--mono)' }}>
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

      <PastOutingsSection outings={profile?.pastOutings ?? []} onChange={(outings) => void update({ pastOutings: outings })} />

      <div className="bc-section">
        <button className="btn btn-primary btn-full" onClick={() => setEditing(true)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          </svg>
          Modifier mon profil
        </button>
        <div style={{ display: 'flex', gap: 7, marginTop: 10 }}>
          <button
            className="btn btn-sm"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => void signOut()}
          >
            Déconnexion
          </button>
          <button
            className="btn btn-sm btn-danger"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={handleReset}
          >
            Réinitialiser
          </button>
        </div>
      </div>

      {editing && (
        <EditProfileModal
          profile={profile}
          memberName={memberName}
          onSave={(patch) => {
            void update(patch)
            setEditing(false)
          }}
          onClose={() => setEditing(false)}
        />
      )}

      {showNext && next && (
        <RandoDetailModal rando={next} memberName={memberName} onClose={() => setShowNext(false)} />
      )}
    </div>
  )
}

// Historique des sorties faites avant ALTImates (saisie manuelle) — pas de moteur
// de recommandation aujourd'hui, juste un mémo perso pour éviter de reproposer
// une sortie déjà faite.
function PastOutingsSection({
  outings,
  onChange,
}: {
  outings: PastOuting[]
  onChange: (outings: PastOuting[]) => void
}) {
  const [name, setName] = useState('')
  const [km, setKm] = useState('')
  const [dplus, setDplus] = useState('')

  const add = () => {
    const n = name.trim()
    if (!n) return
    const outing: PastOuting = {
      id: Date.now(),
      name: n,
      km: parseInt(km, 10) || undefined,
      dplus: parseInt(dplus, 10) || undefined,
    }
    setName('')
    setKm('')
    setDplus('')
    onChange([...outings, outing])
  }

  const remove = (id: number) => {
    onChange(outings.filter((o) => o.id !== id))
  }

  return (
    <div className="bc-section">
      <div className="bc-section-title">Sorties passées</div>
      <div className="card" style={{ padding: '0 14px' }}>
        {outings.length === 0 && (
          <div style={{ padding: '10px 0', fontSize: 11, color: 'var(--ink3)', fontFamily: 'var(--mono)' }}>
            Aucune sortie ajoutée. Renseigne tes randos déjà faites.
          </div>
        )}
        {outings.map((o) => (
          <div className="hydra-input-row" key={o.id}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 500 }}>{o.name}</div>
              <div style={{ fontSize: 10, color: 'var(--ink3)', fontFamily: 'var(--mono)' }}>
                {o.km ? `${o.km}km` : ''}
                {o.km && o.dplus ? ' · ' : ''}
                {o.dplus ? `+${o.dplus}m` : ''}
              </div>
            </div>
            <button
              onClick={() => remove(o.id)}
              title="Supprimer"
              aria-label="Supprimer"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, margin: -5, color: 'var(--ink4)' }}
            >
              <TrashIcon size={13} />
            </button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 6, padding: '10px 0', flexWrap: 'wrap' }}>
          <input
            className="form-input"
            placeholder="ex: Mont Blanc"
            aria-label="Nom de la sortie"
            style={{ flex: '1 1 120px', fontSize: 16, padding: '6px 9px' }}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="form-input"
            placeholder="km"
            aria-label="Distance en km"
            inputMode="numeric"
            style={{ width: 60, fontSize: 16, padding: '6px 9px' }}
            value={km}
            onKeyDown={blockNonDigitKeys}
            onChange={(e) => setKm(e.target.value.replace(/\D/g, ''))}
          />
          <input
            className="form-input"
            placeholder="D+"
            aria-label="Dénivelé positif en mètres"
            inputMode="numeric"
            style={{ width: 60, fontSize: 16, padding: '6px 9px' }}
            value={dplus}
            onKeyDown={blockNonDigitKeys}
            onChange={(e) => setDplus(e.target.value.replace(/\D/g, ''))}
          />
          <button className="btn btn-primary btn-sm" onClick={add}>
            Ajouter
          </button>
        </div>
      </div>
    </div>
  )
}

// Modal d'édition du profil : nom, niveau et stats de saison.
function EditProfileModal({
  profile,
  memberName,
  onSave,
  onClose,
}: {
  profile: Profile | null
  memberName: string
  onSave: (patch: Partial<Profile>) => void
  onClose: () => void
}) {
  const [name, setName] = useState(profile?.name ?? memberName)
  const [level, setLevel] = useState<Level>(profile?.level ?? 'newbie')
  const [stats, setStats] = useState({
    km: String(profile?.km ?? 0),
    dplus: String(profile?.dplus ?? 0),
    sorties: String(profile?.sorties ?? 0),
    bestKm: String(profile?.bestKm ?? 0),
    bestDplus: String(profile?.bestDplus ?? 0),
  })

  const STAT_FIELDS: { k: keyof typeof stats; l: string }[] = [
    { k: 'km', l: 'Km saison' },
    { k: 'dplus', l: 'D+ saison' },
    { k: 'sorties', l: 'Sorties' },
    { k: 'bestKm', l: 'Best km' },
    { k: 'bestDplus', l: 'Best D+' },
  ]

  const save = () => {
    onSave({
      name: name.trim() || memberName,
      level,
      km: parseInt(stats.km) || 0,
      dplus: parseInt(stats.dplus) || 0,
      sorties: parseInt(stats.sorties) || 0,
      bestKm: parseInt(stats.bestKm) || 0,
      bestDplus: parseInt(stats.bestDplus) || 0,
    })
  }

  return (
    <Modal title="Modifier profil" onClose={onClose}>
      <div style={{ marginBottom: 10 }}>
        <label className="form-lbl" htmlFor="profil-prenom">Prénom</label>
        <input id="profil-prenom" className="form-input" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div style={{ marginBottom: 10 }}>
        <label className="form-lbl" htmlFor="profil-niveau">Niveau</label>
        <select id="profil-niveau" className="form-input" value={level} onChange={(e) => setLevel(e.target.value as Level)}>
          {(Object.keys(LVLS) as Level[]).map((k) => (
            <option key={k} value={k}>
              {LVLS[k].l}
            </option>
          ))}
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        {STAT_FIELDS.map(({ k, l }) => (
          <div key={k}>
            <label className="form-lbl" htmlFor={`profil-stat-${k}`}>{l}</label>
            <input
              id={`profil-stat-${k}`}
              className="form-input"
              type="text"
              inputMode="numeric"
              min={0}
              value={stats[k]}
              onKeyDown={blockNonDigitKeys}
              onChange={(e) => setStats({ ...stats, [k]: e.target.value.replace(/\D/g, '') })}
            />
          </div>
        ))}
      </div>
      <button className="btn btn-primary btn-full" onClick={save}>
        Enregistrer
      </button>
    </Modal>
  )
}
