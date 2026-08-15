import { collection, type CollectionReference } from 'firebase/firestore'
import { db } from './app'
import type {
  Rando,
  RadioMessage,
  Feedback,
  DepartItem,
  UserProfile,
  AppConfig,
  RavitoDoc,
  HydraDoc,
  AvailabilityDoc,
  Expense,
  TransportDoc,
  RandoMedia,
  Cordee,
  CordeeInvite,
  CordeeJoinRequest,
  CordeeMember,
} from '../types'

// Références typées vers les collections existantes. Une seule source de vérité
// pour les noms de collections : ne jamais écrire collection(db, '...') ailleurs.

function typedCollection<T>(name: string): CollectionReference<T> {
  return collection(db, name) as CollectionReference<T>
}

export const randosCol = typedCollection<Rando>('randos')
export const messagesCol = typedCollection<RadioMessage>('messages')
export const feedbacksCol = typedCollection<Feedback>('feedbacks')
export const departItemsCol = typedCollection<DepartItem>('departItems')
export const usersCol = typedCollection<UserProfile>('users')
export const configCol = typedCollection<AppConfig>('config')
export const ravitoCol = typedCollection<RavitoDoc>('ravito')
export const hydraCol = typedCollection<HydraDoc>('hydra')
export const availabilityCol = typedCollection<AvailabilityDoc>('availability')
export const expensesCol = typedCollection<Expense>('expenses')
export const transportCol = typedCollection<TransportDoc>('transport')
export const randoMediaCol = typedCollection<RandoMedia>('randoMedia')

// ── Cordées multiples & parrainage ──
export const cordeesCol = typedCollection<Cordee>('cordees')
export const invitesCol = typedCollection<CordeeInvite>('invites')
export const joinRequestsCol = typedCollection<CordeeJoinRequest>('joinRequests')

/** Cordée par défaut portant les données historiques (collections racines). */
export const CORDEE_ORIGINE_ID = 'origine'

/** Membres d'une cordée : sous-collection cordees/{cid}/members, 1 doc par e-mail. */
export function cordeeMembersCol(cordeeId: string): CollectionReference<CordeeMember> {
  return collection(db, 'cordees', cordeeId, 'members') as CollectionReference<CordeeMember>
}
