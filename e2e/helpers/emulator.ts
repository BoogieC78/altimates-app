import { getApps, initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'

// Accès admin aux émulateurs Firebase pour le reset et le seed des données de test.
// L'admin SDK contourne les firestore.rules (bypass total), ce qui est exactement
// ce qu'on veut pour préparer l'état avant chaque test.

export const PROJECT_ID = 'altimates-4c37f'
export const FIRESTORE_HOST = process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080'
export const AUTH_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST ?? '127.0.0.1:9099'

// L'admin SDK lit ces variables pour cibler les émulateurs plutôt que la prod.
process.env.FIRESTORE_EMULATOR_HOST = FIRESTORE_HOST
process.env.FIREBASE_AUTH_EMULATOR_HOST = AUTH_HOST

function db() {
  if (getApps().length === 0) initializeApp({ projectId: PROJECT_ID })
  return getFirestore()
}

/** Vide toutes les données Firestore ET tous les comptes Auth des émulateurs. */
export async function resetEmulators(): Promise<void> {
  await fetch(
    `http://${FIRESTORE_HOST}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`,
    { method: 'DELETE' },
  )
  await fetch(`http://${AUTH_HOST}/emulator/v1/projects/${PROJECT_ID}/accounts`, {
    method: 'DELETE',
  })
}

/** Membres autorisés par défaut, seedés avant chaque test (whitelist dynamique). */
export const DEFAULT_MEMBERS = [
  'hammadou.nordine@gmail.com',
  'mrbouchemoua.ismail@gmail.com',
  'wacil78@gmail.com',
  'ousa.chac@gmail.com',
  'david.agbodjanprince@gmail.com',
]

/** Écrit la whitelist dynamique config/allowedEmails. */
export async function seedAllowedEmails(emails: string[] = DEFAULT_MEMBERS): Promise<void> {
  await db().collection('config').doc('allowedEmails').set({ emails })
}

/** Ajoute un document dans une collection ; renvoie son docId. */
export async function seedDoc(collection: string, data: Record<string, unknown>): Promise<string> {
  const ref = await db()
    .collection(collection)
    .add({ ...data, createdAt: FieldValue.serverTimestamp() })
  return ref.id
}

export interface SeedRandoOptions {
  name?: string
  region?: string
  proposedBy?: string
  dateStart?: string
  votesOui?: number
  memberVotes?: Record<string, 'oui' | 'peut'>
}

/**
 * Seed une rando "à venir" (date lointaine pour rester dans l'onglet Sommets),
 * proposée par défaut par un autre membre que celui qui testera le vote.
 */
export async function seedRando(opts: SeedRandoOptions = {}): Promise<string> {
  const proposedBy = opts.proposedBy ?? 'Nordine'
  const dateStart = opts.dateStart ?? '2099-08-15'
  return seedDoc('randos', {
    id: 100_001,
    name: opts.name ?? 'Lac Blanc',
    region: opts.region ?? 'Haute-Savoie',
    diff: 'Moyen',
    km: 12,
    dplus: 800,
    dur: '1j',
    date: '15 août',
    dateStart,
    dateEnd: null,
    desc: `Proposé par ${proposedBy}.`,
    proposedBy,
    traces: [],
    alert: null,
    votes: { oui: opts.votesOui ?? 1, peut: 0 },
    memberVotes: opts.memberVotes ?? { [proposedBy]: 'oui' },
  })
}
