import { useCallback, useEffect, useState } from 'react'
import {
  FLUSHABLE_COLLECTIONS,
  addAllowedEmail,
  countCollection,
  ensureAllowedEmailsSeeded,
  flushCollection,
  getAllowedEmails,
  listUsers,
  removeAllowedEmail,
  type FlushableCollection,
} from '../../core/firebase/admin'
import { ADMIN_EMAILS, DEFAULT_ALLOWED_EMAILS, isAdminEmail } from '../../core/firebase/auth'
import { randosCol } from '../../core/firebase/collections'
import { deleteRando } from '../../core/firebase/randos'
import { useCollection, type WithDocId } from '../../hooks/useCollection'
import { EditRandoModal } from '../sommets/EditRandoModal'
import type { Rando, UserProfile } from '../../core/types'

// Libellés des collections, repris de l'ancienne app (adminFlush).
const COLLECTION_LABELS: Record<FlushableCollection, string> = {
  randos: 'Randos',
  messages: 'Messages Radio',
  feedbacks: 'Idées',
  departItems: 'Checklist départ',
}

const FLUSH_LABELS: Record<FlushableCollection, string> = {
  randos: 'les randos',
  messages: 'les messages',
  feedbacks: 'les idées',
  departItems: 'la checklist',
}

const APP_VERSION = 'v0.3.3 · ALTImates'

// Mêmes couleurs d'avatars que l'ancienne app.
const AVATAR_COLORS = ['#E8C84A', '#4ADE80', '#60A5FA', '#F87171', '#A78BFA']

interface AdminPageProps {
  memberName: string
}

export function AdminPage({ memberName }: AdminPageProps) {
  const [counts, setCounts] = useState<Partial<Record<FlushableCollection, number>>>({})
  const [users, setUsers] = useState<(UserProfile & { docId: string })[] | null>(null)
  const [usersError, setUsersError] = useState(false)
  const [allowedEmails, setAllowedEmails] = useState<string[]>([])
  const [newEmail, setNewEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const { data: randos } = useCollection(randosCol)
  const [editRando, setEditRando] = useState<WithDocId<Rando> | null>(null)

  // Recharge compteurs, membres et whitelist (équivalent de renderAdmin).
  const refresh = useCallback(() => {
    for (const name of FLUSHABLE_COLLECTIONS) {
      void countCollection(name)
        .then((n) => setCounts((c) => ({ ...c, [name]: n })))
        .catch(() => {})
    }
    listUsers()
      .then((u) => {
        setUsers(u)
        setUsersError(false)
      })
      .catch(() => setUsersError(true))
    // Amorce la whitelist si elle n'existe pas encore (migration), puis la charge.
    void ensureAllowedEmailsSeeded(DEFAULT_ALLOWED_EMAILS)
      .catch(() => {})
      .then(() => getAllowedEmails())
      .then(setAllowedEmails)
      .catch(() => {})
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const flush = async (name: FlushableCollection) => {
    if (!window.confirm(`Vider ${FLUSH_LABELS[name]} ? Cette action est irréversible.`)) return
    setBusy(true)
    try {
      await flushCollection(name)
    } catch (e) {
      console.warn('adminFlush:', e)
    }
    setBusy(false)
    refresh()
  }

  const resetAll = async () => {
    if (!window.confirm('Reset COMPLET : toutes les données Firestore seront supprimées. Irréversible. Continuer ?'))
      return
    if (!window.confirm('Confirmation finale : es-tu vraiment sûr ? Dernière chance.')) return
    setBusy(true)
    try {
      for (const name of FLUSHABLE_COLLECTIONS) {
        await flushCollection(name)
      }
    } catch (e) {
      console.warn('adminResetAll:', e)
    }
    setBusy(false)
    refresh()
  }

  const addEmail = async () => {
    const email = newEmail.trim().toLowerCase()
    if (!email || !email.includes('@')) {
      window.alert('Entre un email valide.')
      return
    }
    try {
      await addAllowedEmail(email)
      setNewEmail('')
      setAllowedEmails(await getAllowedEmails())
    } catch (e) {
      console.warn('adminAddEmail:', e)
    }
  }

  const removeEmail = async (email: string) => {
    if (!window.confirm(`Retirer ${email} de la whitelist ?`)) return
    try {
      await removeAllowedEmail(email)
      setAllowedEmails(await getAllowedEmails())
    } catch (e) {
      console.warn('adminRemoveEmail:', e)
    }
  }

  const countText = (name: FlushableCollection) =>
    counts[name] === undefined ? '—' : `${counts[name]} entrées`

  return (
    <div className="tab active">
      {/* Bandeau noir PANNEAU ADMIN, repris tel quel de l'ancien markup */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px',
          background: 'var(--ink)',
          borderRadius: 12,
          marginBottom: 14,
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#E8C84A"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#fff',
              fontFamily: 'var(--mono)',
              letterSpacing: '.04em',
            }}
          >
            PANNEAU ADMIN
          </div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,.35)', fontFamily: 'var(--mono)' }}>
            {APP_VERSION}
          </div>
        </div>
        <span className="admin-badge" style={{ marginLeft: 'auto' }}>
          ADMIN
        </span>
      </div>

      <div className="admin-section">
        <div className="admin-section-title">Données Firestore</div>
        {FLUSHABLE_COLLECTIONS.map((name) => (
          <div className="admin-row" key={name}>
            <div>
              <div className="admin-label">{COLLECTION_LABELS[name]}</div>
              <div className="admin-sub">{countText(name)}</div>
            </div>
            <button className="admin-btn-warn" disabled={busy} onClick={() => void flush(name)}>
              Vider
            </button>
          </div>
        ))}
        <div className="admin-row">
          <div>
            <div className="admin-label">Reset complet</div>
            <div className="admin-sub">Toutes les collections</div>
          </div>
          <button className="admin-btn-danger" disabled={busy} onClick={() => void resetAll()}>
            Reset tout
          </button>
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-title">Randos</div>
        {randos.length === 0 && (
          <div style={{ fontSize: 11, color: 'var(--ink3)', fontFamily: 'var(--mono)', textAlign: 'center', padding: 12 }}>
            Aucune rando
          </div>
        )}
        {randos.map((r) => (
          <div className="admin-row" key={r.docId}>
            <div>
              <div className="admin-label">{r.name}</div>
              <div className="admin-sub">
                {r.region}
                {r.date ? ` · ${r.date}` : ''}
                {r.proposedBy ? ` · par ${r.proposedBy}` : ''}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button className="btn btn-sm" onClick={() => setEditRando(r)}>
                Modifier
              </button>
              <button
                className="admin-btn-danger"
                onClick={() => {
                  if (window.confirm(`Supprimer "${r.name}" ? Cette action est irréversible.`))
                    void deleteRando(r.docId).catch((e) => console.warn('adminDeleteRando:', e))
                }}
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-section">
        <div className="admin-section-title">Membres</div>
        {users === null && !usersError && (
          <div
            style={{
              fontSize: 11,
              color: 'var(--ink3)',
              fontFamily: 'var(--mono)',
              textAlign: 'center',
              padding: 12,
            }}
          >
            Chargement…
          </div>
        )}
        {usersError && (
          <div
            style={{
              fontSize: 10,
              color: 'var(--red)',
              fontFamily: 'var(--mono)',
              textAlign: 'center',
              padding: 8,
            }}
          >
            Erreur Firestore
          </div>
        )}
        {users !== null && users.length === 0 && (
          <div
            style={{
              fontSize: 10,
              color: 'var(--ink3)',
              fontFamily: 'var(--mono)',
              textAlign: 'center',
              padding: 8,
            }}
          >
            Aucun membre enregistré
          </div>
        )}
        {users?.map((u) => {
          // 'Anonyme' = ancien fallback persisté par erreur (carte FMl7ZRjm) : on l'ignore
          const name =
            (u.profile?.name !== 'Anonyme' && u.profile?.name) || u.displayName || 'Inconnu'
          const email = u.email || '—'
          const isMe = name === memberName
          const isAdminUser = isAdminEmail(email)
          const initials = name.slice(0, 2).toUpperCase()
          const color = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
          return (
            <div className="member-card" key={u.docId}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#2D2D2A',
                  flexShrink: 0,
                }}
              >
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>
                  {name}
                  {isMe ? ' (toi)' : ''}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    color: 'var(--ink3)',
                    fontFamily: 'var(--mono)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {email}
                </div>
              </div>
              {isAdminUser && <span className="admin-badge">ADMIN</span>}
            </div>
          )
        })}

        {/* Whitelist config/allowedEmails */}
        {allowedEmails.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <div className="admin-sub" style={{ marginBottom: 4 }}>
              Whitelist (config/allowedEmails)
            </div>
            {allowedEmails.map((email) => (
              <div className="admin-row" key={email}>
                <div
                  className="admin-sub"
                  style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                >
                  {email}
                </div>
                <button className="admin-btn-warn" onClick={() => void removeEmail(email)}>
                  Retirer
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
          <input
            className="form-input"
            placeholder="Ajouter un email…"
            style={{ fontSize: 11, flex: 1 }}
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void addEmail()
            }}
          />
          <button className="btn btn-primary btn-sm" onClick={() => void addEmail()}>
            Ajouter
          </button>
        </div>
        <div
          style={{
            fontSize: 9,
            color: 'var(--ink3)',
            fontFamily: 'var(--mono)',
            marginTop: 6,
            lineHeight: 1.5,
          }}
        >
          Ajout/retrait effectifs immédiatement (contrôle appliqué par les règles Firestore).
          Les admins ({ADMIN_EMAILS.join(', ')}) gardent toujours accès.
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-title">App</div>
        <div className="admin-row">
          <div>
            <div className="admin-label">Environnement</div>
            <div className="admin-sub">{window.location.hostname}</div>
          </div>
        </div>
        <div className="admin-row">
          <div>
            <div className="admin-label">Version</div>
            <div className="admin-sub">{APP_VERSION}</div>
          </div>
        </div>
      </div>
      {editRando && <EditRandoModal rando={editRando} onClose={() => setEditRando(null)} />}
    </div>
  )
}
