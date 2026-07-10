import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth'
import { auth } from './app'

// Whitelist reprise de l'ancienne app. Le vrai contrôle d'accès est dans firestore.rules ;
// cette liste côté client sert uniquement à l'UX (déconnexion immédiate + message clair).
export const ALLOWED_EMAILS = [
  'hammadou.nordine@gmail.com',
  'mrbouchemoua.ismail@gmail.com',
  'wacil78@gmail.com',
  'ousa.chac@gmail.com',
  'david.agbodjanprince@gmail.com',
]

// Administrateurs (gestion des accès + panneau Admin). Doit rester synchronisé
// avec la fonction isAdmin() de firestore.rules : c'est elle qui applique
// réellement le contrôle côté serveur (le code client n'est que de l'UX).
export const ADMIN_EMAILS = ['hammadou.nordine@gmail.com', 'wacil78@gmail.com']

export function isAllowed(email: string | null | undefined): boolean {
  return !!email && ALLOWED_EMAILS.includes(email)
}

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email)
}

export function isAdmin(user: User | null): boolean {
  return isAdminEmail(user?.email)
}

export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, new GoogleAuthProvider())
  if (!isAllowed(result.user.email)) {
    await fbSignOut(auth)
    throw new Error('Email non autorisé. Demande un accès à la cordée.')
  }
  return result.user
}

export function signOut(): Promise<void> {
  return fbSignOut(auth)
}
