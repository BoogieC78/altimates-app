import { test, expect } from '../fixtures'
import {
  AUTH_HOST,
  FIRESTORE_HOST,
  PROJECT_ID,
  seedCordee,
  seedCordeeOrigine,
  seedDoc,
  seedInvite,
  seedRando,
} from '../helpers/emulator'

// Parrainage + cordées : les invariants (quota 6/lien, expiration 24 h,
// invité non approuvé sans aucun accès, cloisonnement entre cordées) vivent dans
// firestore.rules, pas dans l'UI. Ces tests attaquent l'API Firestore avec de
// vrais jetons, comme le ferait un script — l'UI n'est jamais dans la boucle.

const CREATOR_EMAIL = 'ousa.chac@gmail.com' // membre origine non-admin, créateur des liens
const GUEST_EMAIL = 'invite.securite@altimates.test' // aucun accès
const PARRAINE_EMAIL = 'parraine.securite@altimates.test' // membre origine HORS whitelist

const API_KEY = 'AIzaSyBHJUlBtfKWg2kgwO_qMar5qR2X-SgHcPM' // clé publique du projet (émulateur)
const FS_BASE = `http://${FIRESTORE_HOST}/v1/projects/${PROJECT_ID}/databases/(default)/documents`

async function signUp(email: string): Promise<{ idToken: string; uid: string }> {
  const body = JSON.stringify({ email, password: 'motdepasse-test', returnSecureToken: true })
  const headers = { 'Content-Type': 'application/json' }
  const base = `http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1`
  let res = await fetch(`${base}/accounts:signUp?key=${API_KEY}`, { method: 'POST', headers, body })
  if (!res.ok) {
    res = await fetch(`${base}/accounts:signInWithPassword?key=${API_KEY}`, { method: 'POST', headers, body })
  }
  const data = (await res.json()) as { idToken?: string; localId?: string }
  if (!data.idToken || !data.localId) throw new Error(`Connexion émulateur impossible pour ${email}`)
  return { idToken: data.idToken, uid: data.localId }
}

type RestValue =
  | { stringValue: string }
  | { arrayValue: { values: { stringValue: string }[] } }

const s = (v: string): RestValue => ({ stringValue: v })
const arr = (values: string[]): RestValue => ({
  arrayValue: { values: values.map((v) => ({ stringValue: v })) },
})

/** GET d'un document ; renvoie le statut HTTP (403 attendu sur refus des règles). */
async function getDocRest(idToken: string, path: string): Promise<number> {
  const res = await fetch(`${FS_BASE}/${path}`, {
    headers: { Authorization: `Bearer ${idToken}` },
  })
  return res.status
}

/** POST (création) d'un document ; renvoie le statut HTTP. */
async function createDocRest(
  idToken: string,
  collectionPath: string,
  fields: Record<string, RestValue>,
  documentId?: string,
): Promise<number> {
  const qs = documentId ? `?documentId=${encodeURIComponent(documentId)}` : ''
  const res = await fetch(`${FS_BASE}/${collectionPath}${qs}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ fields }),
  })
  return res.status
}

/** PATCH d'un champ ; renvoie le statut HTTP. */
async function patchDocRest(
  idToken: string,
  path: string,
  fields: Record<string, RestValue>,
): Promise<number> {
  const mask = Object.keys(fields)
    .map((f) => `updateMask.fieldPaths=${encodeURIComponent(f)}`)
    .join('&')
  const res = await fetch(`${FS_BASE}/${path}?${mask}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ fields }),
  })
  return res.status
}

/** Champs d'une demande d'entrée conforme aux règles (email/uid = le jeton). */
function joinRequestFields(inviteId: string, cordeeId: string, email: string, uid: string) {
  return {
    inviteId: s(inviteId),
    cordeeId: s(cordeeId),
    email: s(email),
    uid: s(uid),
    name: s('Testeur'),
  }
}

test.describe('Invitations — contrôle serveur (firestore.rules)', () => {
  test('un lien de plus de 24 h ne fait plus entrer personne', async () => {
    await seedCordeeOrigine()
    const guest = await signUp(GUEST_EMAIL)

    const perime = await seedInvite({ ageMs: 25 * 60 * 60 * 1000 })
    expect(
      await createDocRest(
        guest.idToken,
        'joinRequests',
        joinRequestFields(perime, 'origine', GUEST_EMAIL, guest.uid),
        `${perime}_${guest.uid}`,
      ),
    ).toBe(403)

    // Témoin : le même appel passe sur un lien frais.
    const frais = await seedInvite()
    expect(
      await createDocRest(
        guest.idToken,
        'joinRequests',
        joinRequestFields(frais, 'origine', GUEST_EMAIL, guest.uid),
        `${frais}_${guest.uid}`,
      ),
    ).toBe(200)
  })

  test('le 7e usage d\'un lien est refusé par les règles', async () => {
    await seedCordeeOrigine()
    const guest = await signUp(GUEST_EMAIL)
    const creator = await signUp(CREATOR_EMAIL)

    const six = ['a@t.test', 'b@t.test', 'c@t.test', 'd@t.test', 'e@t.test', 'f@t.test']
    const plein = await seedInvite({ approved: six })

    // Plus aucune DEMANDE possible sur un lien plein…
    expect(
      await createDocRest(
        guest.idToken,
        'joinRequests',
        joinRequestFields(plein, 'origine', GUEST_EMAIL, guest.uid),
        `${plein}_${guest.uid}`,
      ),
    ).toBe(403)

    // …et le créateur lui-même ne peut pas pousser le quota à 7.
    expect(
      await patchDocRest(creator.idToken, `invites/${plein}`, {
        approved: arr([...six, GUEST_EMAIL]),
      }),
    ).toBe(403)

    // Ni retirer des entrées pour réarmer le quota.
    expect(
      await patchDocRest(creator.idToken, `invites/${plein}`, { approved: arr(six.slice(0, 2)) }),
    ).toBe(403)
  })

  test('une appartenance ne se crée pas sans consommer le quota du lien (batch exigé)', async () => {
    await seedCordeeOrigine()
    const creator = await signUp(CREATOR_EMAIL)
    const invite = await seedInvite()

    // Écriture directe du doc membre par le créateur du lien, SANS l'écriture
    // jumelle sur invites/{id}.approved : refusée (getAfter dans les règles).
    expect(
      await createDocRest(
        creator.idToken,
        'cordees/origine/members',
        {
          email: s(GUEST_EMAIL),
          inviteId: s(invite),
          requestId: s(`${invite}_x`),
          addedBy: s(CREATOR_EMAIL),
          via: s('invitation'),
        },
        GUEST_EMAIL,
      ),
    ).toBe(403)
  })

  test('un invité non approuvé ne lit et n\'écrit rien dans la cordée', async () => {
    await seedCordeeOrigine()
    await seedRando({ name: 'Mont Aiguille' })
    const invite = await seedInvite()
    const guest = await signUp(GUEST_EMAIL)

    // Sa demande est acceptée…
    expect(
      await createDocRest(
        guest.idToken,
        'joinRequests',
        joinRequestFields(invite, 'origine', GUEST_EMAIL, guest.uid),
        `${invite}_${guest.uid}`,
      ),
    ).toBe(200)

    // …mais tant qu'elle n'est pas approuvée : rien à lire, rien à écrire.
    expect(await getDocRest(guest.idToken, 'cordees/origine')).toBe(403)
    expect(await getDocRest(guest.idToken, `cordees/origine/members/${CREATOR_EMAIL}`)).toBe(403)
    expect(await getDocRest(guest.idToken, 'config/allowedEmails')).toBe(403)
    expect(
      await createDocRest(guest.idToken, 'cordees/origine/messages', { text: s('coucou') }),
    ).toBe(403)
    expect(
      await createDocRest(guest.idToken, 'messages', { text: s('coucou') }),
    ).toBe(403)
  })

  test('cloisonnement : membre d\'une cordée ≠ accès aux autres cordées', async () => {
    await seedCordeeOrigine()
    await seedCordee('equipeB', 'Équipe B', [PARRAINE_EMAIL])
    const membreB = await signUp(PARRAINE_EMAIL)
    const membreOrigine = await signUp(CREATOR_EMAIL)

    // Membre de B : accès à SA cordée…
    expect(await getDocRest(membreB.idToken, 'cordees/equipeB')).toBe(200)
    // …mais pas à l'origine (doc, membres, données de cordée).
    expect(await getDocRest(membreB.idToken, 'cordees/origine')).toBe(403)
    expect(await getDocRest(membreB.idToken, `cordees/origine/members/${CREATOR_EMAIL}`)).toBe(403)
    expect(
      await createDocRest(membreB.idToken, 'cordees/origine/messages', { text: s('intrusion') }),
    ).toBe(403)

    // Et symétriquement, un membre d'origine ne voit pas la cordée B.
    expect(await getDocRest(membreOrigine.idToken, 'cordees/equipeB')).toBe(403)
    expect(
      await getDocRest(membreOrigine.idToken, `cordees/equipeB/members/${PARRAINE_EMAIL}`),
    ).toBe(403)

    // Radio par cordée : le fil cordees/{cid}/messages est un canal PRIVÉ —
    // lisible par les membres de la cordée, refusé (par les règles, pas l'UI)
    // à un membre d'une autre cordée.
    const msgId = await seedDoc('cordees/origine/messages', { text: 'point météo à 8h' })
    expect(await getDocRest(membreOrigine.idToken, `cordees/origine/messages/${msgId}`)).toBe(200)
    expect(await getDocRest(membreB.idToken, `cordees/origine/messages/${msgId}`)).toBe(403)

    // Canal broadcast = collection racine `messages`, sémantique v0.5.0
    // inchangée : ouverte aux membres de l'app (whitelist/origine), pas aux
    // membres d'une cordée tierce uniquement.
    expect(await createDocRest(membreOrigine.idToken, 'messages', { text: s('annonce') })).toBe(200)
    expect(await createDocRest(membreB.idToken, 'messages', { text: s('annonce') })).toBe(403)
  })

  test('un membre de la cordée d\'origine HORS whitelist accède aux données historiques', async () => {
    // C'est le pont de migration : les collections racines appartiennent à la
    // cordée d'origine, un membre entré par parrainage y accède sans whitelist.
    await seedCordeeOrigine(['ousa.chac@gmail.com', PARRAINE_EMAIL])
    const randoDocId = await seedRando({ name: 'Grand Colon' })
    const parraine = await signUp(PARRAINE_EMAIL)
    const etranger = await signUp(GUEST_EMAIL)

    expect(await getDocRest(parraine.idToken, `randos/${randoDocId}`)).toBe(200)
    expect(await getDocRest(etranger.idToken, `randos/${randoDocId}`)).toBe(403)
  })
})
