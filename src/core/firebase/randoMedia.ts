// Photos post-rando : un document par photo dans la collection randoMedia.
// L'image est stockée en data URL (pas de Firebase Storage, pas de plan Blaze) ;
// un doc par photo évite de faire grossir le doc rando et permet une suppression
// atomique.

import { addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { randoMediaCol } from './collections'
import type { RandoMedia } from '../types'

export interface NewRandoMedia {
  randoId: string
  /** id du document rando : les règles s'en servent pour vérifier l'organisateur */
  randoDocId: string
  author: string
  /** uid Firebase : c'est lui que vérifient les règles, pas le prénom */
  authorUid: string
  dataUrl: string
  caption?: string
}

export async function addRandoMedia(input: NewRandoMedia): Promise<void> {
  await addDoc(randoMediaCol, {
    randoId: input.randoId,
    randoDocId: input.randoDocId,
    author: input.author,
    authorUid: input.authorUid,
    dataUrl: input.dataUrl,
    ...(input.caption ? { caption: input.caption } : {}),
    createdAt: serverTimestamp(),
  } as unknown as RandoMedia)
}

export async function removeRandoMedia(docId: string): Promise<void> {
  await deleteDoc(doc(randoMediaCol, docId))
}
