import { useState } from 'react'
import { Modal } from '../../components/Modal'
import { usersCol } from '../../core/firebase/collections'
import { addTrace, removeTrace, voteRando, voteTrace } from '../../core/firebase/randos'
import { saveHydraEntry, saveRavitoEntry } from '../../core/firebase/ravito'
import {
  MEAL_CATS,
  WATER_SOURCES,
  calcBesoins,
  calcHydraBesoins,
  calcStockTotal,
  defaultHydraEntry,
  defaultRavitoEntry,
  duplicateItemNames,
  parseJours,
} from '../../core/services/ravito'
import { safeExternalUrl, tourSearchUrl } from '../../core/services/url'
import { useCollection, type WithDocId } from '../../hooks/useCollection'
import { useHydra, useRavito } from '../../hooks/useRavito'
import type {
  HydraEntry,
  MealId,
  Rando,
  RavitoDepart,
  RavitoEntry,
  RavitoItem,
  RavitoRetour,
  WaterSourceId,
} from '../../core/types'
import { EditRandoModal } from './EditRandoModal'

// ── Icônes locales (mêmes tracés SVG que l'ancienne app) ──

const svgProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

function InfoTabIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" {...svgProps} style={{ display: 'inline', verticalAlign: -1, marginRight: 3 }}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

function RavitoTabIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" {...svgProps} style={{ display: 'inline', verticalAlign: -2, marginRight: 3 }}>
      <path d="M2 12h20" />
      <path d="M6 12a6 6 0 0 1 12 0" />
      <path d="M6 20h12" />
      <path d="M9 20v-2a3 3 0 0 1 6 0v2" />
      <path d="M9 8c0-1.5.5-3 3-3s3 1.5 3 3" />
    </svg>
  )
}

function DropIcon({ size = 12, stroke }: { size?: number; stroke?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...svgProps} stroke={stroke ?? 'currentColor'} style={{ display: 'inline', verticalAlign: -2, marginRight: 3 }}>
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" {...svgProps} stroke="var(--ink3)">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function WarnIcon({ size = 14, stroke = '#C4531A' }: { size?: number; stroke?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...svgProps} stroke={stroke}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function CheckIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth={2.5} strokeLinecap="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function TrashIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...svgProps}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function ExternalIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" {...svgProps}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}

function PlusIcon({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

// Icônes des catégories de repas (tracés de MEAL_CATS de l'ancienne app)
const MEAL_ICONS: Record<MealId, React.ReactNode> = {
  petitdej: (
    <>
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
      <line x1="6" y1="2" x2="6" y2="4" />
      <line x1="10" y1="2" x2="10" y2="4" />
      <line x1="14" y1="2" x2="14" y2="4" />
    </>
  ),
  lunch: (
    <>
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
      <line x1="7" y1="2" x2="7" y2="11" />
      <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
    </>
  ),
  snack: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3m0 14v3M4.22 4.22l2.12 2.12m11.32 11.32 2.12 2.12M2 12h3m14 0h3M4.22 19.78l2.12-2.12M18.66 5.34l2.12-2.12" />
    </>
  ),
  diner: (
    <>
      <path d="M2 20h20" />
      <path d="M5 20V8a7 7 0 0 1 14 0v12" />
      <path d="M12 8v12" />
    </>
  ),
}

// Icônes des sources d'eau (tracés de WATER_SOURCES de l'ancienne app)
const WATER_ICONS: Record<WaterSourceId, React.ReactNode> = {
  refuge: (
    <>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9,22 9,12 15,12 15,22" />
    </>
  ),
  ruisseau: <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />,
  aucun: (
    <>
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
      <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
    </>
  ),
}

// ── Helpers dates (ports de formatDateDisplay et getJx) ──

function formatDateDisplay(r: Rando): string {
  if (r.dateStart) {
    const d1 = new Date(r.dateStart)
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
    if (r.dateEnd && r.dateEnd !== r.dateStart) {
      const d2 = new Date(r.dateEnd)
      return d1.getDate() + '–' + d2.toLocaleDateString('fr', opts)
    }
    return d1.toLocaleDateString('fr', opts)
  }
  return r.date || 'Date à confirmer'
}

function getJx(dateStart: string | null | undefined): string | null {
  if (!dateStart) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStart)
  target.setHours(0, 0, 0, 0)
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000)
  if (diff < 0) return null
  if (diff === 0) return "Aujourd'hui"
  if (diff === 1) return 'Demain'
  return 'J-' + diff
}

type TabId = 'info' | 'ravito' | 'hydra'

interface RandoDetailModalProps {
  rando: WithDocId<Rando>
  memberName: string
  onClose: () => void
}

// Modal bottom-sheet du détail de rando (port de openRando), 3 onglets :
// Infos / Ravito / Hydratation.
export function RandoDetailModal({ rando: r, memberName, onClose }: RandoDetailModalProps) {
  const [tab, setTab] = useState<TabId>('info')
  const [showEdit, setShowEdit] = useState(false)
  const isProposer = r.proposedBy === memberName

  if (showEdit) {
    return <EditRandoModal rando={r} onClose={() => setShowEdit(false)} />
  }

  return (
    <Modal
      title={r.name}
      onClose={onClose}
      headerExtra={
        isProposer && (
          <button
            onClick={() => setShowEdit(true)}
            style={{
              background: 'none',
              border: '.5px solid rgba(45,45,42,.2)',
              borderRadius: 8,
              padding: '4px 10px',
              fontSize: 10,
              fontFamily: 'var(--mono)',
              color: 'var(--ink3)',
              cursor: 'pointer',
            }}
          >
            Modifier
          </button>
        )
      }
    >
      <div className="ravito-tab-row">
        <button className={tab === 'info' ? 'ravito-tab active' : 'ravito-tab'} aria-pressed={tab === 'info'} onClick={() => setTab('info')}>
          <InfoTabIcon />
          Infos
        </button>
        <button className={tab === 'ravito' ? 'ravito-tab active' : 'ravito-tab'} aria-pressed={tab === 'ravito'} onClick={() => setTab('ravito')}>
          <RavitoTabIcon />
          Ravito
        </button>
        <button className={tab === 'hydra' ? 'ravito-tab active' : 'ravito-tab'} aria-pressed={tab === 'hydra'} onClick={() => setTab('hydra')}>
          <DropIcon />
          Hydratation
        </button>
      </div>
      {tab === 'info' && <InfoTab rando={r} memberName={memberName} onClose={onClose} />}
      {tab === 'ravito' && <RavitoTab rando={r} memberName={memberName} />}
      {tab === 'hydra' && <HydraTab rando={r} />}
    </Modal>
  )
}

// ── Onglet Infos ──────────────────────────────────────

function InfoTab({ rando: r, memberName, onClose }: RandoDetailModalProps) {
  const jx = getJx(r.dateStart)

  const goPartant = () => {
    void voteRando(r, memberName, 'oui').catch((e) => console.warn('vote:', e))
    onClose()
  }

  // Port de downloadGPX : ouvre la recherche d'itinéraires (Komoot ou repli Google)
  const openGPX = () => {
    window.open(tourSearchUrl(r), '_blank')
  }

  return (
    <div>
      <div className="modal-stats">
        {r.km != null && (
          <div className="modal-stat">
            <div className="modal-stat-val">{r.km}km</div>
            <div className="modal-stat-lbl">distance</div>
          </div>
        )}
        {r.dplus != null && (
          <div className="modal-stat">
            <div className="modal-stat-val">+{r.dplus}m</div>
            <div className="modal-stat-lbl">D+</div>
          </div>
        )}
        <div className="modal-stat">
          <div className="modal-stat-val">{r.dur || '1j'}</div>
          <div className="modal-stat-lbl">durée</div>
        </div>
        <div className="modal-stat">
          <div className="modal-stat-val">{r.diff}</div>
          <div className="modal-stat-lbl">niveau</div>
        </div>
      </div>
      {(r.dateStart || r.date) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <CalendarIcon />
          <span style={{ fontSize: 12, color: 'var(--ink2)', fontFamily: 'var(--mono)' }}>{formatDateDisplay(r)}</span>
          {jx && (
            <span
              style={{
                fontSize: 11,
                fontFamily: 'var(--mono)',
                padding: '2px 8px',
                borderRadius: 10,
                background: 'var(--ink)',
                color: 'var(--gold)',
              }}
            >
              {jx}
            </span>
          )}
        </div>
      )}
      <p style={{ fontSize: 10, color: 'var(--ink3)', fontFamily: 'var(--mono)', marginBottom: 6 }}>{r.region}</p>
      <p style={{ fontSize: 12, color: 'var(--ink2)', lineHeight: 1.7, marginBottom: 12 }}>{r.desc}</p>
      {r.alert && (
        <div className="alert-band" style={{ marginBottom: 12 }}>
          <span style={{ color: 'var(--red)', flexShrink: 0 }}>
            <WarnIcon />
          </span>
          <div className="alert-text">
            <strong>ALERTE :</strong> {r.alert.text} {r.alert.src ? `(${r.alert.src})` : ''}
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
        <TracesSection rando={r} memberName={memberName} />
        <button className="gpx-btn" onClick={openGPX}>
          GPX Komoot ↗
        </button>
        <span className="ign-btn" style={{ opacity: 0.4, cursor: 'default', pointerEvents: 'none', position: 'relative' }}>
          Carte IGN{' '}
          <span
            style={{
              fontSize: 8,
              fontFamily: 'var(--mono)',
              background: 'var(--ink)',
              color: 'var(--gold)',
              padding: '1px 5px',
              borderRadius: 6,
              marginLeft: 3,
            }}
          >
            soon
          </span>
        </span>
        <button className="btn btn-primary btn-sm" onClick={goPartant}>
          Partant
        </button>
      </div>
    </div>
  )
}

// Section traces Komoot (port de renderTracesHTML/addTrace/voteTrace/removeTrace)
function TracesSection({ rando: r, memberName }: { rando: WithDocId<Rando>; memberName: string }) {
  const isProposer = r.proposedBy === memberName
  const traces = r.traces ?? []
  const [label, setLabel] = useState('')
  const [url, setUrl] = useState('')
  const [formError, setFormError] = useState('')

  const submitTrace = () => {
    const u = url.trim()
    if (!u) {
      setFormError('URL KOMOOT REQUISE')
      return
    }
    if (!u.includes('komoot') || !safeExternalUrl(u)) {
      setFormError('LIEN KOMOOT INVALIDE')
      return
    }
    setFormError('')
    void addTrace(r, label.trim() || 'Trace ' + (traces.length + 1), u).catch((e) => console.warn('addTrace:', e))
    setLabel('')
    setUrl('')
  }

  return (
    <div style={{ marginBottom: 10, width: '100%' }}>
      <div
        style={{
          fontSize: 9,
          color: 'var(--ink3)',
          fontFamily: 'var(--mono)',
          textTransform: 'uppercase',
          letterSpacing: '.08em',
          marginBottom: 8,
        }}
      >
        {traces.length > 0 ? `${traces.length} trace${traces.length > 1 ? 's' : ''}` : 'Aucune trace'}
        {isProposer ? ' · ajoute tes variantes' : ''}
      </div>
      {traces.map((t, i) => {
        const myVote = t.votes?.includes(memberName)
        const voteCount = t.votes?.length ?? 0
        return (
          <div className="trace-item" key={t.id}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>{t.label}</div>
              <a
                href={safeExternalUrl(t.url) ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 10,
                  color: 'var(--ink3)',
                  fontFamily: 'var(--mono)',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <ExternalIcon />
                Komoot ↗
              </a>
            </div>
            <button
              className={myVote ? 'trace-vote-btn voted' : 'trace-vote-btn'}
              onClick={() => void voteTrace(r, i, memberName).catch((e) => console.warn('voteTrace:', e))}
            >
              {myVote ? '✓ Préféré' : 'Je préfère'} {voteCount > 0 ? `· ${voteCount}` : ''}
            </button>
            {isProposer && (
              <button
                onClick={() => void removeTrace(r, i).catch((e) => console.warn('removeTrace:', e))}
                title="Supprimer"
                aria-label="Supprimer"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, margin: -5, color: 'var(--ink4)', flexShrink: 0 }}
              >
                <TrashIcon />
              </button>
            )}
          </div>
        )
      })}
      {isProposer && (
        <>
          <div className="trace-add-row">
            <input
              className="form-input"
              placeholder="Nom (ex: Variante facile)"
              aria-label="Nom de la trace"
              style={{ fontSize: 16, padding: '6px 9px', flex: 1 }}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
            <input
              className="form-input"
              placeholder="https://www.komoot.com/tour/..."
              aria-label="Lien Komoot de la trace"
              style={{ fontSize: 16, padding: '6px 9px', flex: 2 }}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <button className="btn btn-primary btn-sm" aria-label="Ajouter la trace" onClick={submitTrace} style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
              <PlusIcon />
            </button>
          </div>
          {formError && (
            <div role="alert" style={{ fontSize: 10, color: 'var(--red)', fontFamily: 'var(--mono)', marginTop: 4 }}>{formError}</div>
          )}
        </>
      )}
    </div>
  )
}

// ── Onglet Ravito ─────────────────────────────────────

const DEPART_LABELS: Record<RavitoDepart, string> = { matin: 'Matin', midi: 'Midi', apresmidi: 'Après-midi' }
const RETOUR_LABELS: Record<RavitoRetour, string> = { midi: 'Midi', apresmidi: 'Après-midi', soir: 'Soir' }

/** Nombre de membres du groupe : les profils créés dans users (comme l'ancienne app). */
function useMemberCount(): number {
  const { data: users } = useCollection(usersCol)
  return Math.max(1, users.filter((u) => u.profile?.name).length)
}

function RavitoTab({ rando: r, memberName }: { rando: WithDocId<Rando>; memberName: string }) {
  const ravito = useRavito()
  const randoId = String(r.id)
  const entry: RavitoEntry = ravito[randoId] ?? defaultRavitoEntry()
  const nMembres = useMemberCount()
  const jours = parseJours(r.dur)
  const besoins = calcBesoins(jours, nMembres, entry.config)
  const stockTotal = calcStockTotal(entry.stocks)

  const partants = Object.entries(r.memberVotes ?? {})
    .filter(([, v]) => v === 'oui')
    .map(([name]) => name)
  const allMembres = partants.length >= 2 ? partants : [memberName]

  const save = (next: RavitoEntry) => {
    void saveRavitoEntry(randoId, next).catch((e) => console.warn('saveRavito:', e))
  }

  const setTime = (key: 'depart' | 'retour', val: string) => {
    save({ ...entry, config: { ...entry.config, [key]: val } })
  }

  const setStock = (name: string, cat: MealId, val: string) => {
    const stock = entry.stocks[name] ?? { petitdej: 0, lunch: 0, snack: 0, diner: 0 }
    save({ ...entry, stocks: { ...entry.stocks, [name]: { ...stock, [cat]: parseInt(val, 10) || 0 } } })
  }

  const setElectrolytes = (name: string, val: string) => {
    save({ ...entry, electrolytes: { ...(entry.electrolytes ?? {}), [name]: parseInt(val, 10) || 0 } })
  }

  const besoinsTotal = MEAL_CATS.reduce((a, c) => a + Math.max(0, (besoins[c.id] || 0) - (stockTotal[c.id] || 0)), 0)

  const items = entry.items ?? []
  const dupeNames = duplicateItemNames(items)
  const [itemName, setItemName] = useState('')
  const [itemQty, setItemQty] = useState('1')

  const addItem = () => {
    const name = itemName.trim()
    if (!name) return
    const qty = parseInt(itemQty, 10) || 1
    const item: RavitoItem = { id: Date.now(), name, qty, assignee: memberName }
    setItemName('')
    setItemQty('1')
    save({ ...entry, items: [...items, item] })
  }

  const removeItem = (id: number) => {
    save({ ...entry, items: items.filter((i) => i.id !== id) })
  }

  return (
    <div className="ravito-wrap">
      {partants.length < 2 && (
        <div style={{ fontSize: 10, color: 'var(--ink3)', fontFamily: 'var(--mono)', padding: '8px 0', marginBottom: 8 }}>
          En attente d'un autre partant pour activer le Ravito partagé
        </div>
      )}
      {/* Config départ/retour */}
      <div style={{ background: 'var(--kraft2)', borderRadius: 'var(--r)', padding: '11px 13px', marginBottom: 12 }}>
        <div
          style={{
            fontSize: 9,
            color: 'var(--ink3)',
            fontFamily: 'var(--mono)',
            textTransform: 'uppercase',
            letterSpacing: '.08em',
            marginBottom: 8,
          }}
        >
          {jours}j · {nMembres} membres
        </div>
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--ink3)', marginBottom: 5 }}>Départ</div>
          <div className="time-select">
            {(Object.keys(DEPART_LABELS) as RavitoDepart[]).map((t) => (
              <button key={t} className={entry.config.depart === t ? 'time-btn active' : 'time-btn'} aria-pressed={entry.config.depart === t} onClick={() => setTime('depart', t)}>
                {DEPART_LABELS[t]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--ink3)', marginBottom: 5 }}>Retour</div>
          <div className="time-select">
            {(Object.keys(RETOUR_LABELS) as RavitoRetour[]).map((t) => (
              <button key={t} className={entry.config.retour === t ? 'time-btn active' : 'time-btn'} aria-pressed={entry.config.retour === t} onClick={() => setTime('retour', t)}>
                {RETOUR_LABELS[t]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Besoins par catégorie */}
      <h2 className="sec">Besoins vs stock</h2>
      <div className="card" style={{ padding: '0 14px' }}>
        {MEAL_CATS.map((c) => {
          const b = besoins[c.id] || 0
          const s = stockTotal[c.id] || 0
          const pct = b > 0 ? Math.min(100, Math.round((s / b) * 100)) : 100
          const cls = pct >= 100 ? 'ravito-ok' : pct >= 50 ? 'ravito-mid' : 'ravito-low'
          const gap = Math.max(0, b - s)
          return (
            <div className="ravito-meal-row" key={c.id}>
              <div className="ravito-meal-icon">
                <svg width="16" height="16" viewBox="0 0 24 24">
                  {MEAL_ICONS[c.id]}
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 12, fontWeight: 500 }}>{c.label}</span>
                  <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--ink3)' }}>
                    {s}/{b} repas
                  </span>
                </div>
                <div className="ravito-progress">
                  <div className={`ravito-progress-fill ${cls}`} style={{ width: `${pct}%` }} />
                </div>
                {gap > 0 ? (
                  <div style={{ fontSize: 10, color: 'var(--red)', fontFamily: 'var(--mono)', marginTop: 2 }}>{gap} manquant(s)</div>
                ) : (
                  <div style={{ fontSize: 10, color: 'var(--green)', fontFamily: 'var(--mono)', marginTop: 2 }}>Stock suffisant</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Stock par membre */}
      <h2 className="sec" style={{ marginTop: 4 }}>
        Mon stock lyophilisé
      </h2>
      <div className="card" style={{ padding: '0 14px', overflowX: 'auto' }}>
        {allMembres.map((name) => {
          const stock = entry.stocks[name] ?? { petitdej: 0, lunch: 0, snack: 0, diner: 0 }
          const isMe = name === memberName
          return (
            <div className="ravito-member-row" key={name}>
              <div style={{ fontSize: 12, fontWeight: 500, minWidth: 70 }}>
                {name}
                {isMe ? ' (toi)' : ''}
              </div>
              {MEAL_CATS.map((c) => (
                <div key={c.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <span style={{ fontSize: 8, color: 'var(--ink3)', fontFamily: 'var(--mono)' }}>{c.label.slice(0, 3)}</span>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    className="ravito-stock-input"
                    aria-label={`Stock ${c.label} de ${name}`}
                    defaultValue={stock[c.id] || 0}
                    onBlur={(e) => isMe && setStock(name, c.id, e.target.value)}
                    disabled={!isMe}
                    style={!isMe ? { opacity: 0.5 } : undefined}
                  />
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {/* Stock électrolytes */}
      <h2 className="sec" style={{ marginTop: 4 }}>
        Mon stock électrolytes
      </h2>
      <div className="card" style={{ padding: '0 14px' }}>
        {allMembres.map((name) => {
          const isMe = name === memberName
          return (
            <div className="ravito-member-row" key={name}>
              <div style={{ fontSize: 12, fontWeight: 500, minWidth: 70 }}>
                {name}
                {isMe ? ' (toi)' : ''}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, marginLeft: 'auto' }}>
                <span style={{ fontSize: 8, color: 'var(--ink3)', fontFamily: 'var(--mono)' }}>Pastilles</span>
                <input
                  type="number"
                  min={0}
                  max={99}
                  className="ravito-stock-input"
                  aria-label={`Pastilles d'électrolytes de ${name}`}
                  defaultValue={entry.electrolytes?.[name] || 0}
                  onBlur={(e) => isMe && setElectrolytes(name, e.target.value)}
                  disabled={!isMe}
                  style={!isMe ? { opacity: 0.5 } : undefined}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Répartition précise : qui ramène quoi */}
      <h2 className="sec" style={{ marginTop: 4 }}>
        Qui ramène quoi
      </h2>
      <div className="card" style={{ padding: '0 14px', marginBottom: 12 }}>
        {items.length === 0 && (
          <div style={{ padding: '10px 0', fontSize: 11, color: 'var(--ink3)', fontFamily: 'var(--mono)' }}>
            Aucun item assigné. Ajoute ce que tu ramènes ci-dessous.
          </div>
        )}
        {items.map((item) => {
          const isDupe = dupeNames.has(item.name.trim().toLowerCase())
          return (
            <div className="hydra-input-row" key={item.id}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500 }}>
                  {item.name} × {item.qty}
                  {isDupe && (
                    <span style={{ marginLeft: 6, fontSize: 9, color: 'var(--red)', fontFamily: 'var(--mono)' }}>
                      DOUBLON
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 10, color: 'var(--ink3)', fontFamily: 'var(--mono)' }}>{item.assignee}</div>
              </div>
              {item.assignee === memberName && (
                <button
                  onClick={() => removeItem(item.id)}
                  title="Supprimer"
                  aria-label="Supprimer"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, margin: -5, color: 'var(--ink4)' }}
                >
                  <TrashIcon size={13} />
                </button>
              )}
            </div>
          )
        })}
        <div style={{ display: 'flex', gap: 6, padding: '10px 0' }}>
          <input
            className="form-input"
            placeholder="ex: Riz lyophilisé"
            aria-label="Nom de l'item à ramener"
            style={{ flex: 1, fontSize: 16, padding: '6px 9px' }}
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
          />
          <input
            type="number"
            min={1}
            max={99}
            className="ravito-stock-input"
            aria-label="Quantité"
            value={itemQty}
            onChange={(e) => setItemQty(e.target.value)}
          />
          <button className="btn btn-primary btn-sm" onClick={addItem}>
            Ajouter
          </button>
        </div>
      </div>

      {/* Achats suggérés */}
      <h2 className="sec" style={{ marginTop: 4 }}>
        À acheter
      </h2>
      {besoinsTotal > 0 ? (
        <div style={{ marginTop: 4 }}>
          {MEAL_CATS.map((c) => {
            const gap = Math.max(0, (besoins[c.id] || 0) - (stockTotal[c.id] || 0))
            if (!gap)
              return (
                <div className="ravito-buy-row ravito-buy-ok" key={c.id}>
                  <CheckIcon />
                  <span style={{ fontSize: 11, color: 'var(--green)', fontFamily: 'var(--mono)' }}>{c.label} — stock ok</span>
                </div>
              )
            const parPers = Math.ceil(gap / nMembres)
            return (
              <div className="ravito-buy-row" key={c.id}>
                <WarnIcon size={13} stroke="var(--red)" />
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 11, color: 'var(--red)', fontFamily: 'var(--mono)', fontWeight: 500 }}>
                    {c.label} — {gap} manquant(s)
                  </span>
                  <div style={{ fontSize: 10, color: 'var(--red)', fontFamily: 'var(--mono)' }}>~{parPers} par personne</div>
                </div>
                <a
                  href={`https://www.decathlon.fr/search?query=repas+lyophilise+${c.id}`}
                  target="_blank"
                  rel="noopener"
                  style={{
                    fontSize: 9,
                    padding: '3px 7px',
                    borderRadius: 6,
                    background: 'var(--kraft2)',
                    color: 'var(--ink)',
                    textDecoration: 'none',
                    fontFamily: 'var(--mono)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Decathlon
                </a>
                <a
                  href={`https://www.amazon.fr/s?k=repas+lyophilise+randonnee+${c.id}`}
                  target="_blank"
                  rel="noopener"
                  style={{
                    fontSize: 9,
                    padding: '3px 7px',
                    borderRadius: 6,
                    background: 'var(--kraft2)',
                    color: 'var(--ink)',
                    textDecoration: 'none',
                    fontFamily: 'var(--mono)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Amazon
                </a>
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{ padding: 12, textAlign: 'center', fontSize: 12, color: 'var(--green)', fontFamily: 'var(--mono)' }}>
          Stock suffisant pour toute la cordée
        </div>
      )}
    </div>
  )
}

// ── Onglet Hydratation ────────────────────────────────

function HydraTab({ rando: r }: { rando: WithDocId<Rando> }) {
  const hydra = useHydra()
  const randoId = String(r.id)
  const cfg: HydraEntry = hydra[randoId] ?? defaultHydraEntry()
  const nMembres = useMemberCount()
  const jours = parseJours(r.dur)
  const besoins = calcHydraBesoins(jours, nMembres, cfg)

  const save = (next: HydraEntry) => {
    void saveHydraEntry(randoId, next).catch((e) => console.warn('saveHydra:', e))
  }

  const setNum = (key: keyof HydraEntry, val: string) => {
    save({ ...cfg, [key]: parseFloat(val) || 0 })
  }

  const setSegment = (idx: number, patch: Partial<HydraEntry['segments'][number]>) => {
    save({ ...cfg, segments: cfg.segments.map((s, i) => (i === idx ? { ...s, ...patch } : s)) })
  }

  const pctCapacite = Math.min(100, Math.round((besoins.capaciteTotal / besoins.parPersonneParJour) * 100))
  const autonomieH = Math.floor((cfg.capacite / cfg.conso) * 10) / 10
  const statusCls = pctCapacite >= 100 ? 'hydra-ok' : pctCapacite >= 70 ? 'hydra-warn' : ''

  const numRow = (
    key: keyof HydraEntry,
    label: string,
    sub: string,
    unit: string,
    attrs: { min: number; max: number; step?: number },
    last = false,
  ) => (
    <div className="hydra-input-row" style={last ? { border: 'none' } : undefined}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 10, color: 'var(--ink3)', fontFamily: 'var(--mono)' }}>{sub}</div>
      </div>
      <input
        type="number"
        className="hydra-num"
        aria-label={`${label} (${unit})`}
        defaultValue={cfg[key] as number}
        min={attrs.min}
        max={attrs.max}
        step={attrs.step}
        onBlur={(e) => setNum(key, e.target.value)}
      />
      <span className="hydra-unit">{unit}</span>
    </div>
  )

  return (
    <div>
      {/* Paramètres */}
      <div className="card" style={{ padding: '0 14px', marginBottom: 12 }}>
        {numRow('conso', 'Consommation', 'par personne par heure', 'ml/h', { min: 200, max: 1500, step: 100 })}
        {numRow('heures', 'Marche estimée', 'par jour', 'h/j', { min: 1, max: 14 })}
        {jours > 1 && numRow('cuisine', 'Cuisine + vaisselle', 'par personne par soir', 'ml', { min: 0, max: 3000, step: 250 })}
        {numRow('toilette', 'Toilette / hygiène', 'par personne par jour (optionnel)', 'ml', { min: 0, max: 2000, step: 100 })}
        {numRow('capacite', 'Capacité contenants', 'camelbak + gourdes par personne', 'ml', { min: 500, max: 6000, step: 500 })}
        <div className="hydra-input-row" style={{ border: 'none' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 500 }}>Gourde filtrante</div>
            <div style={{ fontSize: 10, color: 'var(--ink3)', fontFamily: 'var(--mono)' }}>Lifestraw, Sawyer, etc.</div>
          </div>
          <button
            onClick={() => save({ ...cfg, filtreDisponible: !cfg.filtreDisponible })}
            style={{
              padding: '4px 12px',
              borderRadius: 20,
              border: '.5px solid var(--border2)',
              cursor: 'pointer',
              fontSize: 10,
              fontFamily: 'var(--mono)',
              background: cfg.filtreDisponible ? 'var(--ink)' : 'transparent',
              color: cfg.filtreDisponible ? 'var(--gold)' : 'var(--ink3)',
            }}
          >
            {cfg.filtreDisponible ? 'Disponible' : 'Non disponible'}
          </button>
        </div>
      </div>

      {/* Récap besoins */}
      <h2 className="sec">Besoin estimé</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <div className="card" style={{ textAlign: 'center', padding: 10 }}>
          <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--mono)' }}>
            {(besoins.parPersonneParJour / 1000).toFixed(1)}L
          </div>
          <div style={{ fontSize: 9, color: 'var(--ink3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', marginTop: 2 }}>
            Par personne/jour
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: 10 }}>
          <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--mono)' }}>
            {(besoins.total / 1000).toFixed(1)}L
          </div>
          <div style={{ fontSize: 9, color: 'var(--ink3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', marginTop: 2 }}>
            Total cordée
          </div>
        </div>
      </div>
      <div className={`hydra-alert ${statusCls}`} style={{ marginBottom: 12 }}>
        <DropIcon size={14} stroke={pctCapacite >= 100 ? 'var(--green)' : pctCapacite >= 70 ? 'var(--gold2)' : 'var(--red)'} />
        <div style={{ fontSize: 11, fontFamily: 'var(--mono)' }}>
          <strong>Autonomie {autonomieH}h</strong> avec {(cfg.capacite / 1000).toFixed(1)}L/personne
          <br />
          {pctCapacite >= 100 ? (
            <span style={{ color: 'var(--green)' }}>Capacité suffisante pour la journée</span>
          ) : (
            <span style={{ color: 'var(--red)' }}>Capacité insuffisante — prévoir ravitaillement en eau</span>
          )}
        </div>
      </div>

      {/* Points d'eau sur le tracé */}
      <h2 className="sec">Points d'eau sur le tracé</h2>
      <div style={{ fontSize: 10, color: 'var(--ink3)', fontFamily: 'var(--mono)', marginBottom: 8 }}>
        Renseigne les sources d'eau disponibles sur ton tracé
      </div>
      {cfg.segments.map((seg, i) => {
        const needsWarn = seg.source === 'ruisseau' && !cfg.filtreDisponible
        return (
          <div className="hydra-segment" key={seg.id}>
            <div className="hydra-segment-header">
              <input
                className="form-input"
                aria-label="Nom du segment"
                style={{ flex: 1, fontSize: 16, padding: '5px 8px' }}
                defaultValue={seg.label}
                placeholder="ex: Départ → Refuge"
                onBlur={(e) => setSegment(i, { label: e.target.value })}
              />
              <button
                onClick={() => save({ ...cfg, segments: cfg.segments.filter((_, j) => j !== i) })}
                title="Supprimer"
                aria-label="Supprimer"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, margin: -5, color: 'var(--ink4)' }}
              >
                <TrashIcon size={13} />
              </button>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {WATER_SOURCES.map((s) => (
                <button
                  key={s.id}
                  className={seg.source === s.id ? 'hydra-source-btn active' : 'hydra-source-btn'}
                  aria-pressed={seg.source === s.id}
                  onClick={() => setSegment(i, { source: s.id })}
                >
                  <svg viewBox="0 0 24 24">{WATER_ICONS[s.id]}</svg>
                  {s.label}
                </button>
              ))}
            </div>
            {needsWarn && (
              <div className="hydra-alert" style={{ marginTop: 8 }}>
                <WarnIcon size={13} stroke="var(--red)" />
                <span style={{ fontSize: 10, color: 'var(--red)', fontFamily: 'var(--mono)' }}>
                  Ruisseau détecté — gourde filtrante non disponible. Ajouter une Lifestraw au kit.
                </span>
              </div>
            )}
            {seg.source === 'refuge' && (
              <div className="hydra-alert hydra-ok" style={{ marginTop: 8 }}>
                <CheckIcon />
                <span style={{ fontSize: 10, color: 'var(--green)', fontFamily: 'var(--mono)' }}>
                  Eau potable disponible — repartir avec au moins 1L par personne
                </span>
              </div>
            )}
          </div>
        )
      })}
      <button
        className="btn btn-sm"
        onClick={() => save({ ...cfg, segments: [...cfg.segments, { id: Date.now(), label: 'Nouveau segment', source: 'ruisseau' }] })}
        style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
      >
        <PlusIcon size={12} />
        Ajouter un segment
      </button>
    </div>
  )
}
