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

export const ADMIN_EMAIL = 'hammadou.nordine@gmail.com'

export function isAllowed(email: string | null | undefined): boolean {
  return !!email && ALLOWED_EMAILS.includes(email)
}

export function isAdmin(user: User | null): boolean {
  return user?.email === ADMIN_EMAIL
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
