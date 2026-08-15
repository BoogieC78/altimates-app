import { useCallback, useEffect, useState } from 'react'
import { auth } from '../../core/firebase/app'
import {
  INVITE_MAX_USES,
  approveJoinRequest,
  createCordee,
  createInvite,
  getActiveCordeeId,
  inviteExpired,
  inviteUrl,
  listJoinRequests,
  listMyCordees,
  listMyInvites,
  normalizeEmail,
  rejectJoinRequest,
  setActiveCordeeId,
  type WithDocId,
} from '../../core/firebase/cordees'
import type { Cordee, CordeeInvite, CordeeJoinRequest } from '../../core/types'

interface CordeeManagerProps {
  memberName: string
}

/**
 * Gestion des cordées d'un membre : liste + cordée active, création d'une
 * nouvelle cordée, lien de parrainage (24 h / 6 personnes) et approbation des
 * demandes d'entrée. Les invariants sont appliqués par firestore.rules — ici on
 * ne fait qu'afficher proprement les refus.
 */
export function CordeeManager({ memberName }: CordeeManagerProps) {
  const user = auth.currentUser
  const email = normalizeEmail(user?.email ?? '')
  const [cordees, setCordees] = useState<WithDocId<Cordee>[] | null>(null)
  const [active, setActive] = useState(getActiveCordeeId())
  const [newName, setNewName] = useState('')
  const [invites, setInvites] = useState<WithDocId<CordeeInvite>[]>([])
  const [requests, setRequests] = useState<WithDocId<CordeeJoinRequest>[]>([])
  const [link, setLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const refresh = useCallback(() => {
    if (!email) return
    void listMyCordees(email)
      .then(setCordees)
      .catch((e) => {
        console.warn('cordees:', e)
        setCordees([])
      })
    void listMyInvites(email)
      .then(setInvites)
      .catch(() => setInvites([]))
  }, [email])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Demandes en attente pour la cordée active (visibles par tous ses membres,
  // approbation réservée au créateur du lien — les autres voient qui demande).
  useEffect(() => {
    if (!cordees?.some((c) => c.docId === active)) {
      setRequests([])
      return
    }
    void listJoinRequests(active)
      .then(setRequests)
      .catch(() => setRequests([]))
  }, [active, cordees])

  const activeCordee = cordees?.find((c) => c.docId === active) ?? null

  const selectCordee = (id: string) => {
    setActiveCordeeId(id)
    setActive(id)
    setLink('')
  }

  const addCordee = async () => {
    const name = newName.trim()
    if (!name || !email) return
    setError('')
    try {
      const id = await createCordee(name, email, memberName)
      setNewName('')
      selectCordee(id)
      refresh()
    } catch (e) {
      console.warn('createCordee:', e)
      setError('Création de la cordée refusée.')
    }
  }

  const generateLink = async () => {
    if (!activeCordee || !email) return
    setError('')
    try {
      const id = await createInvite(activeCordee.docId, activeCordee.name, email, memberName)
      setLink(inviteUrl(id))
      refresh()
    } catch (e) {
      console.warn('createInvite:', e)
      setError("Impossible de générer un lien pour cette cordée (en es-tu membre ?).")
    }
  }

  const copyLink = () => {
    void navigator.clipboard
      .writeText(link)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      .catch((e) => console.warn('clipboard:', e))
  }

  const approve = async (rq: WithDocId<CordeeJoinRequest>) => {
    setError('')
    try {
      await approveJoinRequest(rq, email)
      setRequests((rs) => rs.filter((r) => r.docId !== rq.docId))
      refresh()
    } catch (e) {
      console.warn('approve:', e)
      setError(
        'Approbation refusée : seul le créateur du lien peut approuver, et un lien fait entrer 6 personnes maximum.',
      )
    }
  }

  const reject = async (rq: WithDocId<CordeeJoinRequest>) => {
    if (!window.confirm(`Refuser la demande de ${rq.name || rq.email} ?`)) return
    setError('')
    try {
      await rejectJoinRequest(rq.docId)
      setRequests((rs) => rs.filter((r) => r.docId !== rq.docId))
    } catch (e) {
      console.warn('reject:', e)
      setError('Refus impossible : seul le créateur du lien peut refuser une demande.')
    }
  }

  const myInviteIds = new Set(invites.map((i) => i.docId))
  const hint = {
    background: 'rgba(74,127,168,.08)',
    border: '.5px solid rgba(74,127,168,.25)',
    borderRadius: 'var(--r)',
    padding: '9px 12px',
    marginBottom: 10,
    fontSize: 11,
    color: 'var(--blue)',
    fontFamily: 'var(--mono)',
    lineHeight: 1.6,
  } as const

  return (
    <>
      <h2 className="sec">Mes cordées</h2>
      <div className="card" role="list" aria-label="Mes cordées">
        {cordees === null && (
          <div className="spinner-wrap">
            <div className="spinner" />
          </div>
        )}
        {cordees?.length === 0 && (
          <div style={{ fontSize: 11, color: 'var(--ink3)', fontFamily: 'var(--mono)', padding: 12, lineHeight: 1.6 }}>
            Aucune cordée pour l'instant. La « Cordée d'origine » est activée par un admin (onglet Admin) ; tu peux
            aussi fonder la tienne ci-dessous.
          </div>
        )}
        {cordees?.map((c) => (
          <div className="member-row" role="listitem" key={c.docId}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</div>
              <div style={{ fontSize: 9, color: 'var(--ink3)', fontFamily: 'var(--mono)' }}>
                {c.docId === active ? 'CORDÉE ACTIVE' : ''}
              </div>
            </div>
            {c.docId === active ? (
              <span className="tag ta">Active</span>
            ) : (
              <button className="btn btn-sm" onClick={() => selectCordee(c.docId)}>
                Activer
              </button>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <input
          className="form-input"
          placeholder="Fonder une nouvelle cordée…"
          aria-label="Nom de la nouvelle cordée"
          style={{ flex: 1, fontSize: 16 }}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void addCordee()}
        />
        <button className="btn btn-sm" onClick={() => void addCordee()}>
          Fonder
        </button>
      </div>

      <h2 className="sec" style={{ marginTop: 12 }}>
        Inviter dans {activeCordee ? `« ${activeCordee.name} »` : 'ma cordée'}
      </h2>
      <div style={hint}>
        Un lien d'invitation est valable 24 h et fait entrer {INVITE_MAX_USES} personnes maximum. Chaque demande doit
        être approuvée par toi avant l'entrée effective (vérifié côté serveur, pas seulement ici).
      </div>
      <div className="card">
        {link ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input className="form-input" aria-label="Lien d'invitation" style={{ flex: 1, fontSize: 11 }} readOnly value={link} />
            <button className="btn btn-sm" onClick={copyLink}>
              {copied ? 'Copié !' : 'Copier'}
            </button>
          </div>
        ) : (
          <button className="btn btn-primary btn-full" onClick={() => void generateLink()} disabled={!activeCordee}>
            Générer un lien d'invitation
          </button>
        )}
        {invites.some((i) => i.cordeeId === active && !inviteExpired(i)) && (
          <div style={{ fontSize: 9, color: 'var(--ink3)', fontFamily: 'var(--mono)', marginTop: 8, lineHeight: 1.5 }}>
            {invites
              .filter((i) => i.cordeeId === active && !inviteExpired(i))
              .map((i) => `Lien actif : ${i.approved.length}/${INVITE_MAX_USES} entrées`)
              .join(' · ')}
          </div>
        )}
      </div>

      {requests.length > 0 && (
        <>
          <h2 className="sec" style={{ marginTop: 12 }}>
            Demandes en attente
          </h2>
          <div className="card" style={{ padding: '0 14px' }}>
            {requests.map((rq) => (
              <div className="admin-row" key={rq.docId}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{rq.name || rq.email}</div>
                  <div style={{ fontSize: 9, color: 'var(--ink3)', fontFamily: 'var(--mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {rq.email}
                    {myInviteIds.has(rq.inviteId) ? ' · via ton lien' : " · via le lien d'un autre membre"}
                  </div>
                </div>
                {myInviteIds.has(rq.inviteId) && (
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button className="btn btn-primary btn-sm" onClick={() => void approve(rq)}>
                      Approuver
                    </button>
                    <button className="admin-btn-warn" onClick={() => void reject(rq)}>
                      Refuser
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {error && (
        <div className="auth-error" role="alert" style={{ display: 'block', marginTop: 8 }}>
          {error}
        </div>
      )}
    </>
  )
}
