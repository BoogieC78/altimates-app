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

/** "Prendre en charge" : s'assigne l'article ; repasser à null si on se désassigne. */
export async function assignDepartItem(docId: string, assignee: string | null): Promise<void> {
  await updateDoc(doc(db, 'departItems', docId), { assignee })
}

export async function deleteDepartItem(docId: string): Promise<void> {
  await deleteDoc(doc(db, 'departItems', docId))
}
