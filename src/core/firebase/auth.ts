import {
  GoogleAuthProvider,
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signInWithPopup,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from './app'

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

const allowedEmailsRef = doc(db, 'config', 'allowedEmails')

/** Liste des membres autorisés, lue depuis config/allowedEmails (source de vérité). */
export async function fetchAllowedEmails(): Promise<string[]> {
  const snap = await getDoc(allowedEmailsRef)
  return (snap.data()?.emails as string[] | undefined) ?? []
}

/**
 * Un email a-t-il accès ? Les admins passent toujours (sans lecture Firestore).
 * Les autres sont autorisés s'ils figurent dans config/allowedEmails.
 *
 * La lecture peut échouer transitoirement juste après la connexion (jeton d'auth
 * pas encore propagé) : on réessaie brièvement avant de conclure "non autorisé".
 */
export async function isMemberEmail(email: string | null | undefined): Promise<boolean> {
  if (!email) return false
  if (isAdminEmail(email)) return true
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return (await fetchAllowedEmails()).includes(email)
    } catch {
      await new Promise((r) => setTimeout(r, 250))
    }
  }
  return false
}

/** Vérifie l'appartenance et déconnecte + throw si l'email n'est pas autorisé. */
async function enforceMembership(user: User): Promise<User> {
  if (!(await isMemberEmail(user.email))) {
    await fbSignOut(auth)
    throw new Error('Email non autorisé. Demande un accès à la cordée.')
  }
  return user
}

export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, new GoogleAuthProvider())
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

/** Envoie un lien de connexion à `email` et mémorise l'adresse pour la reprise. */
export async function sendEmailSignInLink(email: string): Promise<void> {
  await sendSignInLinkToEmail(auth, email, {
    // On embarque l'adresse dans le lien (param `e`) pour terminer la connexion
    // SANS redemander l'e-mail, même si le lien est ouvert sur un autre appareil.
    // Sûr : le oobCode n'est valable que pour cette adresse (vérifié côté serveur).
    // Le domaine doit être autorisé (Authentication > Settings > Authorized domains).
    url: `${window.location.origin}/?e=${encodeURIComponent(email)}`,
    handleCodeInApp: true,
  })
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
