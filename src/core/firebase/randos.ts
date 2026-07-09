import {
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from './app'
import { randosCol } from './collections'
import { applyVote } from '../services/votes'
import { formatDateLabel, durationLabel } from '../services/dates'
import type { Difficulty, Rando, VoteValue } from '../types'

export interface NewRandoInput {
  name: string
  region: string
  diff: Difficulty
  dateStart?: string
  dateEnd?: string
  km?: number
  dplus?: number
  komoot?: string
  proposedBy: string
}

/** Extrait lat/lon d'une URL Komoot du type .../@45.93,6.87 (même heuristique que l'ancienne app). */
export function parseKomootCoords(url: string): { lat: number; lon: number } | null {
  const m = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
  return m ? { lat: parseFloat(m[1]), lon: parseFloat(m[2]) } : null
}

export async function addRando(input: NewRandoInput): Promise<void> {
  const coords = input.komoot ? parseKomootCoords(input.komoot) : null
  const rando: Omit<Rando, 'createdAt'> = {
    id: Date.now(),
    name: input.name,
    region: input.region || 'France',
    diff: input.diff,
    km: input.km ?? null,
    dplus: input.dplus ?? null,
    dur: durationLabel(input.dateStart, input.dateEnd),
    date: formatDateLabel(input.dateStart, input.dateEnd),
    dateStart: input.dateStart ?? null,
    dateEnd: input.dateEnd ?? null,
    desc: `Proposé par ${input.proposedBy}.`,
    proposedBy: input.proposedBy,
    traces: input.komoot
      ? [{ id: Date.now(), label: 'Trace principale', url: input.komoot, votes: [] }]
      : [],
    ...(coords ?? {}),
    alert: null,
    votes: { oui: 1, peut: 0 },
    memberVotes: { [input.proposedBy]: 'oui' },
  }
  await addDoc(randosCol, { ...rando, createdAt: serverTimestamp() } as Rando)
}

/** Met à jour uniquement les champs de vote, sans toucher au reste du document. */
export async function voteRando(
  rando: Rando & { docId: string },
  memberName: string,
  value: VoteValue,
): Promise<void> {
  const t = applyVote(rando, memberName, value)
  await updateDoc(doc(db, 'randos', rando.docId), {
    memberVotes: t.memberVotes,
    votes: t.votes,
  })
}

export async function deleteRando(docId: string): Promise<void> {
  await deleteDoc(doc(db, 'randos', docId))
}
