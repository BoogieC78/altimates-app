import { getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
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

function app() {
  return getApps()[0] ?? initializeApp({ projectId: PROJECT_ID })
}

function db() {
  return getFirestore(app())
}

/** Vide toutes les données Firestore ET tous les comptes Auth des émulateurs. */
export async function resetEmulators(): Promise<void> {
  // fetch ne rejette pas sur un statut HTTP d'erreur : un reset silencieusement
  // raté laisse fuiter l'état du test précédent (flake vécu, données 'Ousmane'
  // survivant au beforeEach). On vérifie donc explicitement chaque réponse.
  const fs = await fetch(
    `http://${FIRESTORE_HOST}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`,
    { method: 'DELETE' },
  )
  if (!fs.ok) throw new Error(`Reset Firestore échoué: ${fs.status} ${await fs.text()}`)
  const auth = await fetch(`http://${AUTH_HOST}/emulator/v1/projects/${PROJECT_ID}/accounts`, {
    method: 'DELETE',
  })
  if (!auth.ok) throw new Error(`Reset Auth échoué: ${auth.status} ${await auth.text()}`)

  await Promise.all([waitForFirestoreEmpty(), waitForAuthEmpty()])
}

/**
 * Vérifie que la suppression est RÉELLEMENT visible avant de rendre la main.
 *
 * Garde-fou : la « fuite entre fichiers de specs » historiquement imputée à une
 * suppression asynchrone venait en réalité d'un reset qui ne s'exécutait pas du
 * tout (hook enregistré dans le seul premier fichier — voir e2e/fixtures.ts).
 * En pratique la suppression s'est montrée synchrone une fois le 200 reçu, mais
 * cette vérification est quasi gratuite et transformerait un reset silencieusement
 * inefficace en erreur explicite plutôt qu'en flake mystérieux.
 */
async function waitForFirestoreEmpty(timeoutMs = 5000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  for (;;) {
    const collections = await db().listCollections()
    if (collections.length === 0) return

    const counts = await Promise.all(collections.map((c) => c.limit(1).get()))
    if (counts.every((snap) => snap.empty)) return

    if (Date.now() > deadline) {
      const restantes = collections.filter((_, i) => !counts[i].empty).map((c) => c.id)
      throw new Error(`Reset Firestore incomplet après ${timeoutMs}ms : ${restantes.join(', ')}`)
    }
    await new Promise((r) => setTimeout(r, 50))
  }
}

/**
 * Même garde-fou que waitForFirestoreEmpty, côté Auth. Les comptes qui
 * « survivaient » au reset (e-mail déjà pris comme compte Google fédéré, sur
 * lequel signInWithPassword échoue — d'où les adresses dédiées de
 * photos-securite.spec.ts) venaient du reset jamais exécuté, pas d'une
 * suppression lente. On vérifie néanmoins que la liste est réellement vide :
 * un seul listUsers(1) quand tout va bien, et une erreur explicite sinon.
 */
async function waitForAuthEmpty(timeoutMs = 5000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  for (;;) {
    const { users } = await getAuth(app()).listUsers(1)
    if (users.length === 0) return

    if (Date.now() > deadline) {
      throw new Error(`Reset Auth incomplet après ${timeoutMs}ms : ${users[0].email} survit`)
    }
    await new Promise((r) => setTimeout(r, 50))
  }
}

/**
 * Récupère le dernier lien de connexion e-mail généré pour `email`. L'émulateur
 * Auth n'envoie pas de vrai mail : il expose les codes via /oobCodes.
 */
export async function getLatestEmailSignInLink(email: string): Promise<string> {
  const res = await fetch(`http://${AUTH_HOST}/emulator/v1/projects/${PROJECT_ID}/oobCodes`)
  const data = (await res.json()) as { oobCodes?: { email: string; oobLink: string }[] }
  const match = (data.oobCodes ?? []).filter((c) => c.email === email)
  const last = match[match.length - 1]
  if (!last) throw new Error(`Aucun lien de connexion trouvé pour ${email}`)
  return last.oobLink
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
  /**
   * Id MÉTIER de la rando (distinct de l'id du document). Les données rattachées
   * à une sortie — ravito, hydratation, dépenses, transport, photos — sont
   * indexées dessus : deux randos seedées avec le même id partagent donc leurs
   * pièces jointes. À personnaliser dans tout test qui en crée.
   */
  id?: number
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
    id: opts.id ?? 100_001,
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

/**
 * Écrit users/{uid}.profile.name via le SDK Admin (donc sans passer par les
 * règles). Indispensable aux tests qui vérifient les règles indexées sur le
 * prénom : `memberName()` lit ce document, un membre sans profil ne correspond
 * à aucun prénom.
 */
export async function seedUserProfile(uid: string, name: string): Promise<void> {
  await db().collection('users').doc(uid).set({ profile: { name } }, { merge: true })
}
