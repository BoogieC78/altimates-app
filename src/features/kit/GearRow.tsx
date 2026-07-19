import { GEAR_INFO, type GearItem, type KitStatus } from '../../core/constants/gear'

const SHARE_ITEMS = ['tente', 'rechaud', 'filtreeau', 'camelbak']
const LINK_ORDER = ['Decathlon', 'Vinted', 'Amazon', 'LeBonCoin', 'IGN Boutique']

export interface ShareData {
  shared: boolean
  capacity: number
}

interface GearRowProps {
  item: GearItem
  status: KitStatus | undefined
  share: ShareData
  onStatus: (id: string, status: KitStatus) => void
  onShareToggle: (id: string) => void
  onShareCapacity: (id: string, capacity: number) => void
  onInfo: (id: string) => void
}

export function GearRow({ item: g, status, share, onStatus, onShareToggle, onShareCapacity, onInfo }: GearRowProps) {
  const info = GEAR_INFO[g.id] ?? null
  const isShareItem = SHARE_ITEMS.includes(g.id)
  const showLinks = status === 'want' || status === 'maybe'
  const links =
    showLinks && info?.links
      ? [...info.links].sort((a, b) => {
          const ia = LINK_ORDER.indexOf(a.label)
          const ib = LINK_ORDER.indexOf(b.label)
          return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
        })
      : []

  const STATUS_MARKS: Record<KitStatus, string> = { have: '✓', want: '🛒', maybe: '?', skip: '✕' }

  return (
    <div className="gear-item" style={status === 'skip' ? { opacity: 0.45 } : undefined}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
          <span style={{ flexShrink: 0, width: 11, fontSize: 11 }}>{status ? STATUS_MARKS[status] : ''}</span>
          <span
            className="gear-name"
            style={{ margin: 0, textDecoration: status === 'skip' ? 'line-through' : 'none' }}
          >
            {g.name}
          </span>
          {info && (
            <button
              onClick={() => onInfo(g.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 8,
                margin: -7,
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0,
                opacity: 0.5,
              }}
              aria-label="Conseils"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--ink3)" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </button>
          )}
        </div>
        {g.note && !status && <div className="gear-note">{g.note}</div>}
        <div className="kit-status-bar">
          <button
            className={status === 'have' ? 'ks-btn have' : 'ks-btn'}
            aria-pressed={status === 'have'}
            onClick={() => onStatus(g.id, 'have')}
          >
            ✓ J'ai
          </button>
          <button
            className={status === 'want' ? 'ks-btn want' : 'ks-btn'}
            aria-pressed={status === 'want'}
            onClick={() => onStatus(g.id, 'want')}
          >
            🛒 Je prends
          </button>
          <button
            className={status === 'maybe' ? 'ks-btn maybe' : 'ks-btn'}
            aria-pressed={status === 'maybe'}
            onClick={() => onStatus(g.id, 'maybe')}
          >
            ? Réfléchir
          </button>
          <button
            className={status === 'skip' ? 'ks-btn skip' : 'ks-btn'}
            aria-pressed={status === 'skip'}
            onClick={() => onStatus(g.id, 'skip')}
          >
            ✕ Skip
          </button>
        </div>
        {isShareItem && status === 'have' && (
          <div className="kit-share-row">
            <button
              className={share.shared ? 'kit-share-toggle on' : 'kit-share-toggle off'}
              role="switch"
              aria-checked={share.shared}
              aria-label="Partager cet équipement"
              onClick={() => onShareToggle(g.id)}
              title={share.shared ? 'Partage activé' : 'Partage désactivé'}
            />
            <span style={{ fontSize: 10, color: 'var(--ink3)', fontFamily: 'var(--mono)', flex: 1 }}>
              {share.shared ? 'Ouvert au partage' : 'Solo uniquement'}
            </span>
            {share.shared && (
              <select
                value={share.capacity}
                aria-label="Capacité de partage"
                onChange={(e) => onShareCapacity(g.id, Number(e.target.value))}
                style={{
                  fontSize: 10,
                  fontFamily: 'var(--mono)',
                  border: '.5px solid var(--border2)',
                  borderRadius: 6,
                  padding: '2px 4px',
                  background: 'rgba(255,255,255,.8)',
                }}
              >
                <option value={1}>1 pers.</option>
                <option value={2}>2 pers.</option>
                <option value={3}>3 pers.</option>
              </select>
            )}
          </div>
        )}
        {links.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
            {links.map((l) => (
              <a className="platform-link" key={l.label} href={l.url} target="_blank" rel="noopener noreferrer">
                <img
                  src={l.favicon}
                  width="12"
                  height="12"
                  style={{ borderRadius: 2, flexShrink: 0 }}
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                  alt=""
                />
                {l.label}
              </a>
            ))}
          </div>
        )}
      </div>
      <div className="gear-right">
        <span className={status === 'have' ? 'gear-price owned' : 'gear-price'}>{g.price}</span>
      </div>
    </div>
  )
}
