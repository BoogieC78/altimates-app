import {
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from './app'
import { departItemsCol } from './collections'

export async function addDepartItem(name: string): Promise<void> {
  const id = Date.now()
  await setDoc(doc(departItemsCol, String(id)), {
    id,
    name,
    assignee: null,
    done: false,
    createdAt: serverTimestamp(),
  })
}

export async function toggleDepartDone(docId: string, done: boolean): Promise<void> {
  await updateDoc(doc(db, 'departItems', docId), { done })
}

/** "Prendre en charge" : s'assigne l'article. */
export async function assignDepartItem(docId: string, assignee: string | null): Promise<void> {
  await updateDoc(doc(db, 'departItems', docId), { assignee })
}

/** "Me retirer" : se désassigne ET remet l'article "à préparer" (retour Adebola : un retrait doit décocher). */
export async function withdrawDepartItem(docId: string): Promise<void> {
  await updateDoc(doc(db, 'departItems', docId), { assignee: null, done: false })
}

export async function deleteDepartItem(docId: string): Promise<void> {
  await deleteDoc(doc(db, 'departItems', docId))
}
