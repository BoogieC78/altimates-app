import {
  GoogleAuthProvider,
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

export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, new GoogleAuthProvider())
  if (!(await isMemberEmail(result.user.email))) {
    await fbSignOut(auth)
    throw new Error('Email non autorisé. Demande un accès à la cordée.')
  }
  return result.user
}

export function signOut(): Promise<void> {
  return fbSignOut(auth)
}
