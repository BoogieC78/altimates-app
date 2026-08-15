import { useCallback, useEffect, useRef, useState } from 'react'
import type { User } from 'firebase/auth'
import {
  getInvite,
  getMyJoinRequest,
  inviteExpired,
  inviteFull,
  listMyCordeeIds,
  normalizeEmail,
  requestJoin,
  type WithDocId,
} from '../../core/firebase/cordees'
import { signOut } from '../../core/firebase/auth'
import { auth } from '../../core/firebase/app'
import { FirebaseError } from 'firebase/app'
import type { CordeeInvite } from '../../core/types'
import { TopoBackground } from '../../components/TopoBackground'
import { LogoIcon } from '../../components/icons'

interface InvitePageProps {
  /** jeton du lien de parrainage (?invite=…) */
  token: string
  user: User
  /** true = déjà membre de l'app (rejoint une cordée SUPPLÉMENTAIRE) */
  isAppMember: boolean
  /** appelé quand le parcours est terminé ou abandonné (jeton à nettoyer) */
  onDone: () => void
}

type Status =
  | 'loading'
  | 'invalid' // lien inconnu
  | 'expired' // > 24 h
  | 'full' // 6 personnes déjà entrées
  | 'already' // déjà membre de cette cordée
  | 'ask' // formulaire de demande
  | 'pending' // demande envoyée, en attente d'approbation
  | 'approved'

/**
 * Page d'atterrissage d'un lien de parrainage. Sert aussi bien à un invité sans
 * aucun accès (mode invité : les règles Firestore ne lui laissent lire que le
 * doc d'invitation et sa propre demande) qu'à un membre existant qui rejoint
 * une cordée supplémentaire.
 */
export function InvitePage({ token, user, isAppMember, onDone }: InvitePageProps) {
  const [invite, setInvite] = useState<WithDocId<CordeeInvite> | null>(null)
  const [status, setStatus] = useState<Status>('loading')
  const [name, setName] = useState(user.displayName?.split(' ')[0] ?? '')
  const [error, setError] = useState('')
  const email = normalizeEmail(user.email ?? '')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // L'approbation se manifeste par l'apparition de NOTRE doc d'appartenance
  // (la seule chose qu'un invité a le droit de requêter : ses propres docs members).
  const checkApproved = useCallback(
    async (cordeeId: string): Promise<boolean> => {
      const ids = await listMyCordeeIds(email)
      return ids.includes(cordeeId)
    },
    [email],
  )

  useEffect(() => {
    let mounted = true
    void (async () => {
      try {
        // Juste après la connexion, Firestore peut ne pas encore connaître le
        // jeton d'auth : première lecture refusée à tort (permission-denied
        // transitoire, même piège que isMemberEmail). On attend le jeton, et on
        // ne réessaie qu'une fois, en le forçant.
        try {
          await auth.authStateReady()
          await auth.currentUser?.getIdToken()
        } catch {
          /* la lecture ci-dessous tranchera */
        }
        let inv: Awaited<ReturnType<typeof getInvite>>
        try {
          inv = await getInvite(token)
        } catch (err) {
          if (!(err instanceof FirebaseError) || err.code !== 'permission-denied') throw err
          await auth.currentUser?.getIdToken(true)
          inv = await getInvite(token)
        }
        if (!mounted) return
        if (!inv) {
          setStatus('invalid')
          return
        }
        setInvite(inv)
        if (await checkApproved(inv.cordeeId)) {
          setStatus('already')
          return
        }
        if (inviteExpired(inv)) {
          setStatus('expired')
          return
        }
        if (inviteFull(inv)) {
          setStatus('full')
          return
        }
        const myRequest = await getMyJoinRequest(token, user.uid)
        if (!mounted) return
        setStatus(myRequest ? 'pending' : 'ask')
      } catch (e) {
        console.warn('invite:', e)
        if (mounted) setStatus('invalid')
      }
    })()
    return () => {
      mounted = false
    }
  }, [token, user.uid, checkApproved])

  // En attente d'approbation : on guette l'apparition de l'appartenance (5 s).
  useEffect(() => {
    if (status !== 'pending' || !invite) return
    pollRef.current = setInterval(() => {
      void checkApproved(invite.cordeeId)
        .then((ok) => ok && setStatus('approved'))
        .catch(() => {})
    }, 5000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [status, invite, checkApproved])

  const submit = async () => {
    if (!invite) return
    setError('')
    try {
      await requestJoin(invite, { uid: user.uid, email }, name.trim() || null)
      setStatus('pending')
    } catch (e) {
      console.warn('requestJoin:', e)
      // Refus des règles = lien expiré ou quota atteint entre-temps.
      setError('Demande refusée : le lien a expiré ou a déjà fait entrer 6 personnes.')
    }
  }

  const finish = () => {
    onDone()
    // Invité fraîchement approuvé : l'app doit réévaluer son appartenance
    // (useAuth a conclu "non membre" au chargement) → rechargement complet.
    if (!isAppMember) window.location.reload()
  }

  const quit = () => {
    onDone()
    if (!isAppMember) void signOut()
  }

  const cordeeName = invite?.cordeeName ?? ''
  const inviterName = invite?.createdByName || invite?.createdBy || ''

  return (
    <div className="auth-screen">
      <div style={{ opacity: 0.4 }}>
        <TopoBackground />
      </div>
      <div className="auth-logo">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <LogoIcon size={56} />
        </div>
        <div style={{ fontWeight: 800, fontSize: 22, color: 'var(--ink)', letterSpacing: '.04em' }}>
          ALTI
          <span style={{ fontWeight: 700, fontStyle: 'italic', color: 'var(--gold2)' }}>mates</span>
        </div>
      </div>
      <main className="auth-card">
        {status === 'loading' && (
          <div className="spinner-wrap">
            <div className="spinner" />
          </div>
        )}

        {status === 'invalid' && (
          <>
            <h1 className="auth-title">Lien d'invitation invalide</h1>
            <div className="auth-sub">Ce lien n'existe pas ou a été supprimé. Demande un nouveau lien à ton contact.</div>
          </>
        )}

        {status === 'expired' && (
          <>
            <h1 className="auth-title">Lien expiré</h1>
            <div className="auth-sub">
              Un lien d'invitation est valable 24 heures. Demande à {inviterName || 'ton contact'} d'en générer un nouveau.
            </div>
          </>
        )}

        {status === 'full' && (
          <>
            <h1 className="auth-title">Lien complet</h1>
            <div className="auth-sub">
              Ce lien a déjà fait entrer 6 personnes dans « {cordeeName} ». Demande un nouveau lien à {inviterName || 'ton contact'}.
            </div>
          </>
        )}

        {status === 'already' && (
          <>
            <h1 className="auth-title">Tu es déjà membre</h1>
            <div className="auth-sub">Tu fais déjà partie de la cordée « {cordeeName} ».</div>
            <button className="btn btn-primary btn-full" style={{ marginTop: 12 }} onClick={finish}>
              Ouvrir l'app
            </button>
          </>
        )}

        {status === 'ask' && (
          <>
            <h1 className="auth-title">Invitation à rejoindre « {cordeeName} »</h1>
            <div className="auth-sub">
              {inviterName ? `${inviterName} t'invite dans sa cordée.` : 'On t\'invite dans cette cordée.'} Ta demande
              devra être approuvée avant que tu accèdes au groupe.
            </div>
            <input
              className="form-input"
              aria-label="Ton prénom"
              placeholder="Ton prénom"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ marginTop: 10 }}
            />
            <button className="btn btn-primary btn-full" style={{ marginTop: 8 }} onClick={() => void submit()}>
              Demander à rejoindre
            </button>
          </>
        )}

        {status === 'pending' && (
          <>
            <h1 className="auth-title">Demande envoyée</h1>
            <div className="auth-sub">
              En attente d'approbation par {inviterName || 'le créateur du lien'}. Cette page se mettra à jour toute
              seule dès que c'est bon.
            </div>
            <div className="spinner-wrap" style={{ marginTop: 12 }}>
              <div className="spinner" />
            </div>
          </>
        )}

        {status === 'approved' && (
          <>
            <h1 className="auth-title">Bienvenue dans « {cordeeName} » !</h1>
            <div className="auth-sub">Ta demande a été approuvée.</div>
            <button className="btn btn-primary btn-full" style={{ marginTop: 12 }} onClick={finish}>
              Entrer dans l'app
            </button>
          </>
        )}

        {error && (
          <div className="auth-error" role="alert" style={{ display: 'block' }}>
            {error}
          </div>
        )}

        {status !== 'loading' && status !== 'already' && status !== 'approved' && (
          <button
            className="btn btn-full"
            style={{ marginTop: 14 }}
            onClick={isAppMember ? finish : quit}
          >
            {isAppMember ? "Retour à l'app" : 'Annuler et se déconnecter'}
          </button>
        )}
      </main>
    </div>
  )
}
