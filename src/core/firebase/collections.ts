import { collection, type CollectionReference } from 'firebase/firestore'
import { db } from './app'
import type { Rando, RadioMessage, Feedback, DepartItem, UserProfile, AppConfig, RavitoDoc, HydraDoc } from '../types'

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
