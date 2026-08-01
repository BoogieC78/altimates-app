// Déclarations de transport vers le départ : un document par (rando, membre),
// id = `${randoId}__${member}`. Même principe que availability : chacun n'écrit
// que sa propre déclaration, ce que les règles Firestore imposent.

import { deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { transportCol } from './collections'
import { transportDocId } from '../services/transport'
import type { TransportMode } from '../types'

/** Déclare (ou met à jour) le moyen de transport du membre pour une rando. */
export async function setTransport(
  randoId: string,
  member: string,
  mode: TransportMode,
  seats?: number,
): Promise<void> {
  await setDoc(
    doc(transportCol, transportDocId(randoId, member)),
    {
      randoId,
      member,
      mode,
      // Le nombre de places n'a de sens que pour un conducteur : on ne le
      // conserve pas sur les autres modes, sinon il ressurgirait au prochain
      // passage en mode voiture avec une valeur périmée.
      ...(mode === 'voiture' && seats !== undefined ? { seats } : {}),
      updatedAt: serverTimestamp(),
    },
    { merge: false },
  )
}

/** Retire la déclaration du membre (retour à « pas encore répondu »). */
export async function clearTransport(randoId: string, member: string): Promise<void> {
  await deleteDoc(doc(transportCol, transportDocId(randoId, member)))
}
