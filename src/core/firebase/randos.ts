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
import { safeExternalUrl } from '../services/url'
import type { Difficulty, Rando, RandoTrace, VoteValue } from '../types'

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
  const komoot = safeExternalUrl(input.komoot)
  const coords = komoot ? parseKomootCoords(komoot) : null
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
    traces: komoot
      ? [{ id: Date.now(), label: 'Trace principale', url: komoot, votes: [] }]
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

export interface EditRandoInput {
  name: string
  region: string
  diff: Difficulty
  dateStart?: string
  dateEnd?: string
  km?: number
  dplus?: number
  komoot?: string
}

/**
 * Édition des champs du formulaire (équivalent saveEditRando de l'ancienne app) :
 * update ciblé, recalcule dur/date, met à jour l'URL de la trace principale.
 */
export async function updateRando(rando: Rando & { docId: string }, input: EditRandoInput): Promise<void> {
  const fields: Record<string, unknown> = {
    name: input.name,
    region: input.region || rando.region || 'France',
    diff: input.diff,
    km: input.km ?? null,
    dplus: input.dplus ?? null,
    dur: durationLabel(input.dateStart, input.dateEnd),
    date: formatDateLabel(input.dateStart, input.dateEnd),
    dateStart: input.dateStart ?? null,
    dateEnd: input.dateEnd ?? null,
  }
  const komoot = safeExternalUrl(input.komoot)
  if (komoot) {
    const coords = parseKomootCoords(komoot)
    if (coords) Object.assign(fields, coords)
    const traces = [...(rando.traces ?? [])]
    if (traces.length > 0) traces[0] = { ...traces[0], url: komoot }
    else traces.push({ id: Date.now(), label: 'Trace principale', url: komoot, votes: [] })
    fields.traces = traces
  }
  await updateDoc(doc(db, 'randos', rando.docId), fields)
}

/** Ajoute une variante de trace ; renseigne lat/lon si la rando n'en a pas encore. */
export async function addTrace(rando: Rando & { docId: string }, label: string, url: string): Promise<void> {
  const safeUrl = safeExternalUrl(url)
  if (!safeUrl) throw new Error('URL de trace invalide (http/https attendu)')
  const traces: RandoTrace[] = [...(rando.traces ?? []), { id: Date.now(), label, url: safeUrl, votes: [] }]
  const fields: Record<string, unknown> = { traces }
  if (rando.lat == null || rando.lon == null) {
    const coords = parseKomootCoords(safeUrl)
    if (coords) Object.assign(fields, coords)
  }
  await updateDoc(doc(db, 'randos', rando.docId), fields)
}

export async function removeTrace(rando: Rando & { docId: string }, index: number): Promise<void> {
  const traces = (rando.traces ?? []).filter((_, i) => i !== index)
  await updateDoc(doc(db, 'randos', rando.docId), { traces })
}

/** Toggle du vote "Je préfère" d'un membre sur une trace. */
export async function voteTrace(
  rando: Rando & { docId: string },
  index: number,
  memberName: string,
): Promise<void> {
  const traces = (rando.traces ?? []).map((t, i) => {
    if (i !== index) return t
    const votes = t.votes ?? []
    return {
      ...t,
      votes: votes.includes(memberName) ? votes.filter((v) => v !== memberName) : [...votes, memberName],
    }
  })
  await updateDoc(doc(db, 'randos', rando.docId), { traces })
}
