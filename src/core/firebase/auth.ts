import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getRedirectResult,
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailAndPassword,
  signInWithEmailLink,
  signInWithPopup,
  signInWithRedirect,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth'
import { FirebaseError } from 'firebase/app'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from './app'
import { isCordeeMemberAnywhere } from './cordees'

// Liste d'amorçage : les membres historiques. Elle ne sert plus qu'à SEEDER le
// document config/allowedEmails la première fois (voir ensureAllowedEmailsSeeded).
// Le contrôle d'accès réel des MEMBRES est désormais dynamique (config/allowedEmails),
// éditable depuis le panneau Admin. Voir firestore.rules (isMember).
export const DEFAULT_ALLOWED_EMAILS = [
  'hammadou.nordine@gmail.com',
  'mrbouchemoua.ismail@gmail.com',
  'wacil78@gmail.com',
  'ousa.chac@gmail.com',
  'david.agbodjanprince@gmail.com',
]

// Administrateurs : codés en dur À DESSEIN (ancre de sécurité). Toujours autorisés,
// même si la whitelist dynamique est vide/corrompue → un admin peut toujours se
// connecter et réparer les accès. Doit rester synchronisé avec isAdmin() de
// firestore.rules, qui applique réellement le contrôle côté serveur.
export const ADMIN_EMAILS = ['hammadou.nordine@gmail.com', 'wacil78@gmail.com']

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email)
}

export function isAdmin(user: User | null): boolean {
  return isAdminEmail(user?.email)
}

// ── Bypass de login pour le dev local (JAMAIS en prod) ──────────────────────
// `import.meta.env.DEV` est figé par Vite au moment du build : toujours `false`
// pour `vite build` (ce que Vercel exécute), quelle que soit la config d'env —
// donc aucune variable mal configurée ne peut activer ceci en production.
// Actif uniquement quand DEV + émulateurs + opt-in explicite (voir .env.dev-bypass).
// Mot de passe non-sensible : valide uniquement dans l'émulateur Auth local,
// jamais un compte réel.
const DEV_BYPASS_EMAIL = ADMIN_EMAILS[0]
const DEV_BYPASS_PASSWORD = 'dev-bypass-emulator-only'

export function isDevAutoLoginEnabled(): boolean {
  return (
    import.meta.env.DEV &&
    import.meta.env.VITE_USE_EMULATOR === '1' &&
    import.meta.env.VITE_DEV_AUTOLOGIN === '1'
  )
}

/** Connecte (ou crée) l'admin de dev sur l'émulateur Auth — jamais sur le vrai projet Firebase. */
export async function devAutoSignIn(): Promise<User> {
  try {
    return (await signInWithEmailAndPassword(auth, DEV_BYPASS_EMAIL, DEV_BYPASS_PASSWORD)).user
  } catch {
    return (await createUserWithEmailAndPassword(auth, DEV_BYPASS_EMAIL, DEV_BYPASS_PASSWORD)).user
  }
}

const allowedEmailsRef = doc(db, 'config', 'allowedEmails')

/** Liste des membres autorisés, lue depuis config/allowedEmails (source de vérité). */
export async function fetchAllowedEmails(): Promise<string[]> {
  const snap = await getDoc(allowedEmailsRef)
  return (snap.data()?.emails as string[] | undefined) ?? []
}

/**
 * Accès effectif d'un non-admin : whitelist config/allowedEmails OU appartenance
 * à au moins une cordée. La lecture de la whitelist est refusée aux non-membres
 * (permission-denied) : pour un membre entré UNIQUEMENT par parrainage dans une
 * cordée, ce refus est normal et ne doit pas conclure "non autorisé" — on tranche
 * alors via la requête collectionGroup sur ses propres appartenances (toujours
 * autorisée pour son propre e-mail).
 */
async function hasAnyAccess(email: string): Promise<boolean> {
  try {
    if ((await fetchAllowedEmails()).includes(email)) return true
  } catch (err) {
    // Seul un refus de permission est un "non" attendu ; toute autre erreur remonte.
    if (!(err instanceof FirebaseError) || err.code !== 'permission-denied') throw err
  }
  return isCordeeMemberAnywhere(email)
}

/**
 * Un email a-t-il accès ? Les admins passent toujours (sans lecture Firestore).
 * Les autres sont autorisés s'ils figurent dans config/allowedEmails ou s'ils
 * sont membres d'au moins une cordée (parrainage).
 *
 * Cause racine du permission-denied transitoire juste après la connexion :
 * Firestore est notifié du nouveau jeton d'auth de façon asynchrone, donc une
 * lecture lancée immédiatement après signIn* peut partir sans jeton (ou avec un
 * jeton périmé) et être refusée par les règles. Plutôt qu'un retry aveugle à
 * délai fixe, on attend l'état d'auth stable et l'émission du jeton AVANT de
 * lire, puis on ne réessaie qu'une fois, uniquement sur permission-denied, en
 * forçant un rafraîchissement du jeton (resynchronise le canal Firestore).
 * Toute autre erreur (réseau, etc.) conclut "non autorisé", comme avant.
 */
export async function isMemberEmail(email: string | null | undefined): Promise<boolean> {
  if (!email) return false
  if (isAdminEmail(email)) return true
  try {
    await auth.authStateReady()
    await auth.currentUser?.getIdToken()
  } catch {
    // Jeton indisponible : la lecture ci-dessous tranchera.
  }
  try {
    return await hasAnyAccess(email)
  } catch (err) {
    if (!(err instanceof FirebaseError) || err.code !== 'permission-denied') return false
    try {
      await auth.currentUser?.getIdToken(true)
      return await hasAnyAccess(email)
    } catch {
      return false // refus persistant : réellement non autorisé (ou hors ligne)
    }
  }
}

// ── Invitation par lien de parrainage (?invite=JETON) ───────────────────────
// Le jeton est mémorisé en localStorage : la connexion Google (popup) ou par
// lien e-mail (aller-retour par la boîte mail) fait perdre les paramètres d'URL.

const INVITE_TOKEN_KEY = 'altimates-invite-token'

/** Mémorise le jeton d'invitation présent dans l'URL, et renvoie le jeton courant. */
export function capturePendingInvite(): string | null {
  let fromUrl: string | null = null
  try {
    fromUrl = new URLSearchParams(window.location.search).get('invite')
    if (fromUrl) window.localStorage.setItem(INVITE_TOKEN_KEY, fromUrl)
    return fromUrl ?? window.localStorage.getItem(INVITE_TOKEN_KEY)
  } catch {
    return fromUrl
  }
}

/** Jeton d'invitation en attente, s'il y en a un. */
export function getPendingInvite(): string | null {
  try {
    return window.localStorage.getItem(INVITE_TOKEN_KEY)
  } catch {
    return null
  }
}

export function clearPendingInvite(): void {
  try {
    window.localStorage.removeItem(INVITE_TOKEN_KEY)
  } catch {
    /* rien à nettoyer */
  }
  // Retire aussi le paramètre de l'URL pour ne pas recapturer le jeton au prochain chargement.
  const url = new URL(window.location.href)
  if (url.searchParams.has('invite')) {
    url.searchParams.delete('invite')
    window.history.replaceState(null, '', url.toString())
  }
}

/**
 * Vérifie l'appartenance et déconnecte + throw si l'email n'est pas autorisé.
 * Exception : un jeton d'invitation en attente laisse l'utilisateur connecté en
 * MODE INVITÉ — il ne verra que la page d'invitation (App), et les règles
 * Firestore ne lui laissent de toute façon rien lire ni écrire dans la cordée
 * tant qu'il n'est pas approuvé.
 */
async function enforceMembership(user: User): Promise<User> {
  if (await isMemberEmail(user.email)) return user
  if (getPendingInvite()) return user
  await fbSignOut(auth)
  throw new Error('Email non autorisé. Demande un accès à la cordée.')
}

/**
 * PWA installée sur iOS ("Ajouter à l'écran d'accueil") : signInWithPopup y est
 * peu fiable — le popup s'ouvre dans un contexte séparé (SFSafariViewController)
 * qui ne peut pas rendre la main à la web app standalone. On bascule alors sur
 * signInWithRedirect ; le retour est terminé au chargement par
 * completeRedirectSignIn() (appelé dans App).
 */
function isIosStandalonePwa(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  // iPadOS se présente comme "Macintosh" mais expose un écran tactile.
  const isIos = /iPhone|iPad|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1)
  const isStandalone =
    window.matchMedia?.('(display-mode: standalone)')?.matches === true ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  return isIos && isStandalone
}

export async function signInWithGoogle(): Promise<User> {
  if (isIosStandalonePwa()) {
    await signInWithRedirect(auth, new GoogleAuthProvider())
    // La page navigue vers Google : cette promesse ne se résout jamais ici.
    return new Promise<never>(() => {})
  }
  const result = await signInWithPopup(auth, new GoogleAuthProvider())
  return enforceMembership(result.user)
}

/**
 * Termine une connexion Google par redirection (retour PWA iOS). Renvoie null
 * s'il n'y a pas de retour de redirection en attente. Throw si l'email n'est
 * pas autorisé (même contrat que signInWithGoogle).
 */
export async function completeRedirectSignIn(): Promise<User | null> {
  const result = await getRedirectResult(auth)
  if (!result) return null
  return enforceMembership(result.user)
}

export function signOut(): Promise<void> {
  return fbSignOut(auth)
}

// ── Connexion par e-mail (lien magique, sans mot de passe) ──────────────────
// Gratuit chez Firebase. L'utilisateur reçoit un lien par mail ; en cliquant, il
// revient sur l'app qui termine la connexion. Nécessite d'activer "Email link
// (passwordless sign-in)" dans la console Firebase (Authentication > Sign-in method).

const EMAIL_STORAGE_KEY = 'altimates-email-signin'

/** Envoi via le SDK client (mail Firebase par défaut) — émulateur E2E + repli prod. */
function clientSendLink(email: string): Promise<void> {
  return sendSignInLinkToEmail(auth, email, {
    // Adresse embarquée dans le lien (param `e`) → reprise sans redemander l'e-mail.
    url: `${window.location.origin}/?e=${encodeURIComponent(email)}`,
    handleCodeInApp: true,
  })
}

/**
 * Envoie un lien de connexion à `email` et mémorise l'adresse pour la reprise.
 * - En prod : via notre fonction serverless (/api/send-signin-link) qui envoie un
 *   e-mail au design ALTImates par SMTP Gmail (meilleure délivrabilité).
 * - Repli automatique (fonction absente/non configurée, ou mode émulateur E2E) :
 *   le SDK client envoie le mail Firebase par défaut → jamais de login e-mail cassé.
 */
export async function sendEmailSignInLink(email: string): Promise<void> {
  if (import.meta.env.VITE_USE_EMULATOR === '1') {
    await clientSendLink(email)
  } else {
    try {
      const res = await fetch('/api/send-signin-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) throw new Error(String(res.status))
    } catch {
      await clientSendLink(email) // repli : mail Firebase par défaut
    }
  }
  window.localStorage.setItem(EMAIL_STORAGE_KEY, email)
}

/** L'URL courante est-elle un lien de connexion e-mail ? */
export function isEmailSignInLink(): boolean {
  return isSignInWithEmailLink(auth, window.location.href)
}

/**
 * Termine la connexion si l'URL courante est un lien e-mail. Renvoie l'utilisateur,
 * ou null si aucun lien n'est présent. Throw si l'email n'est pas autorisé.
 * `promptEmail` sert de secours quand l'adresse n'est plus en localStorage
 * (lien ouvert sur un autre appareil/navigateur).
 */
export async function completeEmailSignIn(
  promptEmail?: () => string | null,
): Promise<User | null> {
  if (!isEmailSignInLink()) return null
  // Ordre : adresse embarquée dans le lien (param `e`) → mémorisée en local →
  // en dernier recours seulement, on demande (secours, ne devrait plus arriver).
  const fromUrl = new URLSearchParams(window.location.search).get('e')
  const email = fromUrl ?? window.localStorage.getItem(EMAIL_STORAGE_KEY) ?? promptEmail?.() ?? ''
  if (!email) throw new Error('Adresse e-mail requise pour terminer la connexion.')

  const result = await signInWithEmailLink(auth, email, window.location.href)
  window.localStorage.removeItem(EMAIL_STORAGE_KEY)
  // Retire les paramètres du lien de l'URL (propreté + évite de rejouer le lien).
  window.history.replaceState(null, '', window.location.origin)
  return enforceMembership(result.user)
}
