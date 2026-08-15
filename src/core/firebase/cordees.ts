import { FirebaseError } from 'firebase/app'
import {
  arrayUnion,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from './app'
import {
  CORDEE_ORIGINE_ID,
  cordeeMembersCol,
  cordeesCol,
  invitesCol,
  joinRequestsCol,
} from './collections'
import type { Cordee, CordeeInvite, CordeeJoinRequest } from '../types'

// Cordées multiples & parrainage. Les invariants (quota 6/lien, expiration 24 h,
// approbation par le créateur du lien, cloisonnement par cordée) sont appliqués
// par firestore.rules — ce module n'est que le chemin nominal côté client.

/** Quota d'entrées par lien de parrainage — miroir de firestore.rules (approved <= 6). */
export const INVITE_MAX_USES = 6
/** Durée de validité d'un lien — miroir de firestore.rules (createdAt + 24 h). */
export const INVITE_TTL_MS = 24 * 60 * 60 * 1000

export type WithDocId<T> = T & { docId: string }

/** Les appartenances sont indexées par e-mail EN MINUSCULES (id des docs members). */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/** Ids des cordées dont `email` est membre (requête collectionGroup sur members). */
export async function listMyCordeeIds(email: string): Promise<string[]> {
  const snap = await getDocs(
    query(collectionGroup(db, 'members'), where('email', '==', normalizeEmail(email))),
  )
  return snap.docs
    .map((d) => d.ref.parent.parent?.id)
    .filter((id): id is string => !!id)
}

/** `email` est-il membre d'AU MOINS une cordée ? (contrôle d'accès client, cf. isMemberEmail) */
export async function isCordeeMemberAnywhere(email: string): Promise<boolean> {
  const snap = await getDocs(
    query(collectionGroup(db, 'members'), where('email', '==', normalizeEmail(email)), limit(1)),
  )
  return !snap.empty
}

/** Mes cordées avec leur contenu (nom…), triées par nom, 'origine' en tête. */
export async function listMyCordees(email: string): Promise<WithDocId<Cordee>[]> {
  const ids = await listMyCordeeIds(email)
  const docs = await Promise.all(ids.map((id) => getDoc(doc(cordeesCol, id))))
  return docs
    .filter((d) => d.exists())
    .map((d) => ({ ...(d.data() as Cordee), docId: d.id }))
    .sort((a, b) =>
      a.docId === CORDEE_ORIGINE_ID ? -1 : b.docId === CORDEE_ORIGINE_ID ? 1 : a.name.localeCompare(b.name),
    )
}

/**
 * Fonde une nouvelle cordée : le doc cordée et l'appartenance du fondateur
 * partent dans le MÊME batch — la règle du doc membre vérifie via getAfter que
 * le fondateur est bien le créateur de la cordée.
 */
export async function createCordee(name: string, email: string, displayName?: string | null): Promise<string> {
  const e = normalizeEmail(email)
  const cordeeRef = doc(cordeesCol)
  const batch = writeBatch(db)
  batch.set(cordeeRef, { name: name.trim(), createdBy: e, createdAt: serverTimestamp() })
  batch.set(doc(cordeeMembersCol(cordeeRef.id), e), {
    email: e,
    name: displayName ?? null,
    addedBy: e,
    via: 'fondateur',
    addedAt: serverTimestamp(),
  })
  await batch.commit()
  return cordeeRef.id
}

/** Crée un lien de parrainage (24 h, 6 personnes max) ; renvoie son jeton (id du doc). */
export async function createInvite(
  cordeeId: string,
  cordeeName: string,
  email: string,
  displayName?: string | null,
): Promise<string> {
  const inviteRef = doc(invitesCol)
  await setDoc(inviteRef, {
    cordeeId,
    cordeeName,
    createdBy: normalizeEmail(email),
    createdByName: displayName ?? null,
    approved: [],
    createdAt: serverTimestamp(),
  })
  return inviteRef.id
}

/** URL à partager pour un jeton d'invitation. */
export function inviteUrl(inviteId: string): string {
  return `${window.location.origin}/?invite=${encodeURIComponent(inviteId)}`
}

export async function getInvite(inviteId: string): Promise<WithDocId<CordeeInvite> | null> {
  const snap = await getDoc(doc(invitesCol, inviteId))
  return snap.exists() ? { ...(snap.data() as CordeeInvite), docId: snap.id } : null
}

/** Lien expiré ? (>24 h — les règles refusent de toute façon côté serveur) */
export function inviteExpired(invite: CordeeInvite, now = Date.now()): boolean {
  const created = invite.createdAt?.toMillis()
  // createdAt absent = serverTimestamp pas encore résolu (doc tout juste créé) : pas expiré.
  return created !== undefined && now >= created + INVITE_TTL_MS
}

/** Quota atteint ? (6 entrées — les règles refusent de toute façon côté serveur) */
export function inviteFull(invite: CordeeInvite): boolean {
  return (invite.approved?.length ?? 0) >= INVITE_MAX_USES
}

/** Id déterministe de la demande d'un utilisateur pour un lien (pas de doublon). */
export function joinRequestId(inviteId: string, uid: string): string {
  return `${inviteId}_${uid}`
}

/** Dépose une demande d'entrée (refusée par les règles si lien expiré ou quota atteint). */
export async function requestJoin(
  invite: WithDocId<CordeeInvite>,
  user: { uid: string; email: string },
  name?: string | null,
): Promise<void> {
  await setDoc(doc(joinRequestsCol, joinRequestId(invite.docId, user.uid)), {
    inviteId: invite.docId,
    cordeeId: invite.cordeeId,
    cordeeName: invite.cordeeName,
    email: normalizeEmail(user.email),
    uid: user.uid,
    name: name ?? null,
    createdAt: serverTimestamp(),
  })
}

/** Ma demande pour ce lien, si elle existe encore (supprimée si refusée). */
export async function getMyJoinRequest(
  inviteId: string,
  uid: string,
): Promise<WithDocId<CordeeJoinRequest> | null> {
  try {
    const snap = await getDoc(doc(joinRequestsCol, joinRequestId(inviteId, uid)))
    return snap.exists() ? { ...(snap.data() as CordeeJoinRequest), docId: snap.id } : null
  } catch (err) {
    // Lire un doc ABSENT est refusé par les règles pour un non-admin (leurs
    // conditions référencent resource.data, qui n'existe pas) : Firestore répond
    // permission-denied au lieu de "n'existe pas". Même conclusion : pas de demande.
    if (err instanceof FirebaseError && err.code === 'permission-denied') return null
    throw err
  }
}

/** Demandes d'entrée en attente pour une cordée (visibles par ses membres). */
export async function listJoinRequests(cordeeId: string): Promise<WithDocId<CordeeJoinRequest>[]> {
  const snap = await getDocs(query(joinRequestsCol, where('cordeeId', '==', cordeeId)))
  return snap.docs.map((d) => ({ ...d.data(), docId: d.id }))
}

/** Mes liens de parrainage (le listage des invites est limité à ses propres liens). */
export async function listMyInvites(email: string): Promise<WithDocId<CordeeInvite>[]> {
  const snap = await getDocs(query(invitesCol, where('createdBy', '==', normalizeEmail(email))))
  return snap.docs.map((d) => ({ ...d.data(), docId: d.id }))
}

/**
 * Approuve une demande : trois écritures dans le MÊME batch — quota consommé sur
 * le lien (approved, plafonné à 6 par les règles), appartenance créée, demande
 * soldée. Réservé au créateur du lien (règles) ; un 7e usage fait échouer tout le batch.
 */
export async function approveJoinRequest(
  request: WithDocId<CordeeJoinRequest>,
  approverEmail: string,
): Promise<void> {
  const batch = writeBatch(db)
  batch.update(doc(invitesCol, request.inviteId), { approved: arrayUnion(request.email) })
  batch.set(doc(cordeeMembersCol(request.cordeeId), request.email), {
    email: request.email,
    name: request.name ?? null,
    addedBy: normalizeEmail(approverEmail),
    via: 'invitation',
    inviteId: request.inviteId,
    requestId: request.docId,
    addedAt: serverTimestamp(),
  })
  batch.delete(doc(joinRequestsCol, request.docId))
  await batch.commit()
}

/** Refuse (supprime) une demande — créateur du lien ou demandeur lui-même. */
export async function rejectJoinRequest(requestId: string): Promise<void> {
  await deleteDoc(doc(joinRequestsCol, requestId))
}

// ── Cordée active (partition affichée par l'app ; cartes suivantes : radio…) ──

const ACTIVE_CORDEE_KEY = 'altimates-cordee-active'

/** Cordée actuellement affichée par l'app ('origine' par défaut). */
export function getActiveCordeeId(): string {
  try {
    return window.localStorage.getItem(ACTIVE_CORDEE_KEY) ?? CORDEE_ORIGINE_ID
  } catch {
    return CORDEE_ORIGINE_ID
  }
}

export function setActiveCordeeId(cordeeId: string): void {
  try {
    window.localStorage.setItem(ACTIVE_CORDEE_KEY, cordeeId)
  } catch {
    /* localStorage indispo : on reste sur la valeur par défaut */
  }
}
