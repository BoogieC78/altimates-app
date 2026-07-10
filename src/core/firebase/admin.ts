import {
  arrayRemove,
  arrayUnion,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
  type CollectionReference,
} from 'firebase/firestore'
import { db } from './app'
import {
  configCol,
  departItemsCol,
  feedbacksCol,
  messagesCol,
  randosCol,
  usersCol,
} from './collections'
import type { UserProfile } from '../types'

// Fonctions d'administration (panneau admin). Réservées à l'admin,
// le vrai contrôle d'accès reste dans firestore.rules.

/** Collections vidables depuis le panneau admin. */
export type FlushableCollection = 'randos' | 'messages' | 'feedbacks' | 'departItems'

export const FLUSHABLE_COLLECTIONS: FlushableCollection[] = [
  'randos',
  'messages',
  'feedbacks',
  'departItems',
]

const COLLECTION_REFS: Record<FlushableCollection, CollectionReference<unknown>> = {
  randos: randosCol,
  messages: messagesCol,
  feedbacks: feedbacksCol,
  departItems: departItemsCol,
}

/** Nombre de documents d'une collection (lecture ponctuelle, pas d'abonnement). */
export async function countCollection(name: FlushableCollection): Promise<number> {
  const snap = await getDocs(COLLECTION_REFS[name])
  return snap.size
}

/** Supprime tous les documents d'une collection (même batch delete que l'ancienne app). */
export async function flushCollection(name: FlushableCollection): Promise<void> {
  const snap = await getDocs(COLLECTION_REFS[name])
  const batch = writeBatch(db)
  snap.docs.forEach((d) => batch.delete(d.ref))
  await batch.commit()
}

/** Doc de référence de la whitelist : config/allowedEmails, champ emails: string[]. */
const allowedEmailsDoc = doc(configCol, 'allowedEmails')

export async function getAllowedEmails(): Promise<string[]> {
  const snap = await getDoc(allowedEmailsDoc)
  return snap.data()?.emails ?? []
}

/**
 * Amorce la whitelist si le document n'existe pas encore (migration vers la
 * whitelist dynamique). Ne touche à rien si le doc existe déjà — même vide —
 * pour ne pas ré-ajouter des membres volontairement retirés. Renvoie true si
 * un seed a eu lieu. Réservé à l'admin (règles Firestore).
 */
export async function ensureAllowedEmailsSeeded(defaults: string[]): Promise<boolean> {
  const snap = await getDoc(allowedEmailsDoc)
  if (snap.exists()) return false
  await setDoc(allowedEmailsDoc, { emails: defaults })
  return true
}

export async function addAllowedEmail(email: string): Promise<void> {
  await setDoc(allowedEmailsDoc, { emails: arrayUnion(email) }, { merge: true })
}

export async function removeAllowedEmail(email: string): Promise<void> {
  await setDoc(allowedEmailsDoc, { emails: arrayRemove(email) }, { merge: true })
}

/** Liste les membres enregistrés (collection users). */
export async function listUsers(): Promise<(UserProfile & { docId: string })[]> {
  const snap = await getDocs(usersCol)
  return snap.docs.map((d) => ({ ...d.data(), docId: d.id }))
}
