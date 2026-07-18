import {
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from './app'
import { feedbacksCol } from './collections'
import type { Feedback, FeedbackComment, FeedbackStatus } from '../types'

export async function addFeedback(author: string, text: string, cat: string): Promise<void> {
  const id = Date.now()
  await setDoc(doc(feedbacksCol, String(id)), {
    id,
    text,
    cat,
    author,
    votes: { up: 1, down: 0 },
    voters: { [author]: 'up' },
    status: 'backlog',
    comments: [],
    ts: "à l'instant",
    createdAt: serverTimestamp(),
  })
}

/** Même logique de bascule que les randos : recliquer retire le vote, l'autre sens le remplace. */
export async function voteFeedback(f: Feedback & { docId: string }, member: string, v: 'up' | 'down'): Promise<void> {
  const voters = { ...(f.voters ?? {}) }
  const votes = { up: f.votes?.up ?? 0, down: f.votes?.down ?? 0 }
  const current = voters[member]
  if (current === v) {
    delete voters[member]
    votes[v] = Math.max(0, votes[v] - 1)
  } else {
    if (current) votes[current] = Math.max(0, votes[current] - 1)
    voters[member] = v
    votes[v] += 1
  }
  await updateDoc(doc(db, 'feedbacks', f.docId), { voters, votes })
}

export async function setFeedbackStatus(docId: string, status: FeedbackStatus): Promise<void> {
  await updateDoc(doc(db, 'feedbacks', docId), { status })
}

export async function updateFeedback(docId: string, text: string, cat: string): Promise<void> {
  await updateDoc(doc(db, 'feedbacks', docId), { text, cat })
}

export async function addFeedbackComment(f: Feedback & { docId: string }, comment: FeedbackComment): Promise<void> {
  await updateDoc(doc(db, 'feedbacks', f.docId), { comments: [...(f.comments ?? []), comment] })
}

export async function deleteFeedbackComment(f: Feedback & { docId: string }, index: number): Promise<void> {
  const comments = [...(f.comments ?? [])]
  comments.splice(index, 1)
  await updateDoc(doc(db, 'feedbacks', f.docId), { comments })
}

export async function deleteFeedback(docId: string): Promise<void> {
  await deleteDoc(doc(db, 'feedbacks', docId))
}
