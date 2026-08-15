import {
  arrayRemove,
  arrayUnion,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
  type CollectionReference,
} from 'firebase/firestore'
import { auth, db } from './app'
import {
  CORDEE_ORIGINE_ID,
  configCol,
  cordeeMembersCol,
  cordeesCol,
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
  // Miroir cordée d'origine : la whitelist et les membres de 'origine' doivent
  // rester alignés (les deux donnent accès aux données historiques). Best-effort :
  // si la cordée n'est pas encore seedée, le seed la rattrapera.
  try {
    await setDoc(doc(cordeeMembersCol(CORDEE_ORIGINE_ID), email), {
      email,
      addedBy: auth.currentUser?.email ?? 'admin',
      via: 'seed',
      addedAt: serverTimestamp(),
    })
  } catch (e) {
    console.warn('miroir cordée origine (ajout):', e)
  }
}

export async function removeAllowedEmail(email: string): Promise<void> {
  await setDoc(allowedEmailsDoc, { emails: arrayRemove(email) }, { merge: true })
  // Miroir cordée d'origine : sans ce retrait, l'appartenance à 'origine'
  // continuerait de donner accès aux données historiques malgré le retrait de
  // la whitelist (isMember = whitelist OU membre d'origine).
  try {
    await deleteDoc(doc(cordeeMembersCol(CORDEE_ORIGINE_ID), email))
  } catch (e) {
    console.warn('miroir cordée origine (retrait):', e)
  }
}

/**
 * Migration multi-cordées : crée la « Cordée d'origine » (id fixe 'origine') et
 * y inscrit tous les e-mails fournis (whitelist + admins) si elle n'existe pas
 * encore. Aucune donnée déplacée : les collections racines SONT les données de
 * cette cordée. Ne touche à rien si le doc existe déjà (membres retirés depuis
 * l'Admin non ré-ajoutés). Réservé à l'admin (règles Firestore).
 */
export async function ensureCordeeOrigineSeeded(emails: string[]): Promise<boolean> {
  const origineRef = doc(cordeesCol, CORDEE_ORIGINE_ID)
  const snap = await getDoc(origineRef)
  if (snap.exists()) return false
  const adminEmail = auth.currentUser?.email ?? 'admin'
  const batch = writeBatch(db)
  batch.set(origineRef, {
    name: "Cordée d'origine",
    createdBy: adminEmail,
    createdAt: serverTimestamp(),
  })
  for (const email of new Set(emails.map((e) => e.trim().toLowerCase()))) {
    batch.set(doc(cordeeMembersCol(CORDEE_ORIGINE_ID), email), {
      email,
      addedBy: adminEmail,
      via: 'seed',
      addedAt: serverTimestamp(),
    })
  }
  await batch.commit()
  return true
}

/** Liste les membres enregistrés (collection users). */
export async function listUsers(): Promise<(UserProfile & { docId: string })[]> {
  const snap = await getDocs(usersCol)
  return snap.docs.map((d) => ({ ...d.data(), docId: d.id }))
}
