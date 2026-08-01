// Dépenses partagées d'une sortie : un document par dépense dans la collection
// expenses. Un doc par dépense (et non une map dans le doc rando) pour que la
// suppression soit atomique et que le doc rando ne grossisse pas à chaque achat.

import { addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { expensesCol } from './collections'
import type { Expense } from '../types'

export interface NewExpense {
  randoId: string
  label: string
  /** centimes */
  amount: number
  payer: string
  beneficiaries: string[]
}

/** Ajoute une dépense. L'id métier suit la convention des autres collections (Date.now()). */
export async function addExpense(input: NewExpense): Promise<void> {
  await addDoc(expensesCol, {
    id: Date.now(),
    randoId: input.randoId,
    label: input.label,
    amount: input.amount,
    payer: input.payer,
    beneficiaries: input.beneficiaries,
    createdAt: serverTimestamp(),
  } as unknown as Expense)
}

/** Supprime une dépense par l'id de son document. */
export async function removeExpense(docId: string): Promise<void> {
  await deleteDoc(doc(expensesCol, docId))
}
