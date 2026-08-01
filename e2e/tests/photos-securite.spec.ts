import { test, expect } from '../fixtures'
import {
  AUTH_HOST,
  DEFAULT_MEMBERS,
  FIRESTORE_HOST,
  PROJECT_ID,
  seedAllowedEmails,
  seedRando,
  seedUserProfile,
} from '../helpers/emulator'

// Les règles Firestore de randoMedia sont la vraie protection : masquer un bouton
// dans l'UI n'en est pas une. Ces tests attaquent l'API Firestore directement avec
// un vrai jeton de membre, comme le ferait quelqu'un depuis la console du
// navigateur ou un script — l'UI n'est jamais dans la boucle.

const ORGA_EMAIL = 'orga.photos.test@altimates.test'
const INTRUS_EMAIL = 'intrus.photos.test@altimates.test'

const API_KEY = 'AIzaSyBHJUlBtfKWg2kgwO_qMar5qR2X-SgHcPM' // clé publique du projet (émulateur)

/**
 * Crée (ou récupère) un compte sur l'émulateur Auth et renvoie son jeton.
 * Le repli sur signInWithPassword couvre le cas où le compte a survécu au reset
 * des émulateurs : sans lui, `localId` est absent et l'échec se manifeste plus
 * loin, sous la forme trompeuse d'un chemin de document vide.
 */
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

/** Tente de créer un doc randoMedia avec ce jeton ; renvoie le statut HTTP. */
async function tryCreateMedia(idToken: string, fields: Record<string, string>): Promise<number> {
  const res = await fetch(
    `http://${FIRESTORE_HOST}/v1/projects/${PROJECT_ID}/databases/(default)/documents/randoMedia`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({
        fields: Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, { stringValue: v }])),
      }),
    },
  )
  return res.status
}

test.describe('Photos post-rando — contrôle serveur', () => {
  test('seul l\'organisateur peut publier, et seulement une vraie image', async () => {
    const randoDocId = await seedRando({
      name: 'Grand Veymont',
      proposedBy: 'Orga',
      memberVotes: { Orga: 'oui' },
    })

    // Adresses propres à ce test : les e-mails des autres specs y existent déjà
    // comme comptes Google (fédérés), sur lesquels une connexion par mot de passe
    // est impossible. On les ajoute donc à la whitelist pour ce test seulement.
    await seedAllowedEmails([...DEFAULT_MEMBERS, ORGA_EMAIL, INTRUS_EMAIL])
    const organisateur = await signUp(ORGA_EMAIL)
    const intrus = await signUp(INTRUS_EMAIL)
    // Le prénom vient de users/{uid}.profile.name — c'est lui que lit memberName()
    // dans les règles ; sans ce document, aucun prénom ne correspond.
    await Promise.all([seedUserProfile(organisateur.uid, 'Orga'), seedUserProfile(intrus.uid, 'Intrus')])

    const photo = { randoId: '100001', randoDocId, dataUrl: 'data:image/jpeg;base64,YWJj' }

    // 1. Un membre qui n'a pas organisé la sortie est refusé.
    expect(await tryCreateMedia(intrus.idToken, { ...photo, author: 'Intrus', authorUid: intrus.uid })).toBe(403)

    // 2. Usurper l'uid de l'organisateur ne marche pas non plus.
    expect(await tryCreateMedia(intrus.idToken, { ...photo, author: 'Orga', authorUid: organisateur.uid })).toBe(403)

    // 3. L'organisateur ne peut pas stocker autre chose qu'une image.
    expect(
      await tryCreateMedia(organisateur.idToken, {
        ...photo,
        dataUrl: 'data:text/html,<script>alert(1)</script>',
        author: 'Orga',
        authorUid: organisateur.uid,
      }),
    ).toBe(403)

    // 4. L'organisateur, avec une vraie image, est accepté.
    expect(await tryCreateMedia(organisateur.idToken, { ...photo, author: 'Orga', authorUid: organisateur.uid })).toBe(200)
  })
})
