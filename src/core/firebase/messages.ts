import {
  arrayUnion,
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { messagesColForChannel } from './collections'
import type { MessageType } from '../types'

// Radio par canal : chaque fonction cible un canal — l'id d'une cordée
// (cordees/{cid}/messages) ou BROADCAST_CHANNEL_ID (collection racine
// `messages`, héritée de l'ancienne radio globale, visible par tous les membres).

export function initials(name: string): string {
  return name.slice(0, 2).toUpperCase()
}

/** Même format que l'ancienne app : doc id = String(Date.now()), reads initialisé avec l'auteur. */
export async function sendMessage(
  channelId: string,
  author: string,
  text: string,
  type: MessageType,
): Promise<void> {
  const id = Date.now()
  await setDoc(doc(messagesColForChannel(channelId), String(id)), {
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

export async function togglePin(channelId: string, docId: string, pinned: boolean): Promise<void> {
  await updateDoc(doc(messagesColForChannel(channelId), docId), { pinned })
}

export async function deleteMessage(channelId: string, docId: string): Promise<void> {
  await deleteDoc(doc(messagesColForChannel(channelId), docId))
}

export async function markRead(
  channelId: string,
  docId: string,
  memberInitials: string,
): Promise<void> {
  await updateDoc(doc(messagesColForChannel(channelId), docId), { reads: arrayUnion(memberInitials) })
}
