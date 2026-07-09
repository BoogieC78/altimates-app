import {
  arrayUnion,
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from './app'
import { messagesCol } from './collections'
import type { MessageType } from '../types'

export function initials(name: string): string {
  return name.slice(0, 2).toUpperCase()
}

/** Même format que l'ancienne app : doc id = String(Date.now()), reads initialisé avec l'auteur. */
export async function sendMessage(author: string, text: string, type: MessageType): Promise<void> {
  const id = Date.now()
  await setDoc(doc(messagesCol, String(id)), {
    id,
    type,
    author,
    text,
    time: "à l'instant",
    reads: [initials(author)],
    pinned: false,
    createdAt: serverTimestamp(),
  })
}

export async function togglePin(docId: string, pinned: boolean): Promise<void> {
  await updateDoc(doc(db, 'messages', docId), { pinned })
}

export async function deleteMessage(docId: string): Promise<void> {
  await deleteDoc(doc(db, 'messages', docId))
}

export async function markRead(docId: string, memberInitials: string): Promise<void> {
  await updateDoc(doc(db, 'messages', docId), { reads: arrayUnion(memberInitials) })
}
