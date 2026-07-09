// Docs partagés ravito/shared et hydra/shared : un seul document par
// collection, map clé = id métier de la rando (même structure que l'ancienne app).

import { doc, onSnapshot, setDoc, type Unsubscribe } from 'firebase/firestore'
import { hydraCol, ravitoCol } from './collections'
import type { HydraDoc, HydraEntry, RavitoDoc, RavitoEntry } from '../types'

const ravitoSharedRef = doc(ravitoCol, 'shared')
const hydraSharedRef = doc(hydraCol, 'shared')

/** Abonnement temps réel au doc ravito/shared. */
export function subscribeRavito(cb: (data: RavitoDoc) => void): Unsubscribe {
  return onSnapshot(ravitoSharedRef, (snap) => cb(snap.data() ?? {}))
}

/** Abonnement temps réel au doc hydra/shared. */
export function subscribeHydra(cb: (data: HydraDoc) => void): Unsubscribe {
  return onSnapshot(hydraSharedRef, (snap) => cb(snap.data() ?? {}))
}

/**
 * Écrit l'entrée d'une rando dans ravito/shared. setDoc merge pour ne pas
 * écraser les entrées des autres randos (l'ancienne app faisait un set complet).
 */
export async function saveRavitoEntry(randoId: string, entry: RavitoEntry): Promise<void> {
  await setDoc(ravitoSharedRef, { [randoId]: entry }, { merge: true })
}

/** Écrit l'entrée d'une rando dans hydra/shared (merge, mêmes raisons). */
export async function saveHydraEntry(randoId: string, entry: HydraEntry): Promise<void> {
  await setDoc(hydraSharedRef, { [randoId]: entry }, { merge: true })
}
