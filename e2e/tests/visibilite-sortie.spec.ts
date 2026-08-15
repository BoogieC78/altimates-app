import { test, expect } from '../fixtures'
import {
  AUTH_HOST,
  FIRESTORE_HOST,
  PROJECT_ID,
  seedCordee,
  seedCordeeOrigine,
  seedDoc,
  seedRando,
  seedUserProfile,
} from '../helpers/emulator'

// Visibilité d'une sortie (potes / public) : le contrôle vit dans
// firestore.rules, pas dans l'UI. Ces tests attaquent l'API Firestore avec de
// vrais jetons, comme le ferait un script — l'UI n'est jamais dans la boucle.
//
// Invariants vérifiés :
//  - champ `visibility` ABSENT (randos historiques v0.5.0) = potes : refusé
//    à tout non-pote ;
//  - 'public' = lisible par un membre d'une AUTRE cordée, mais JAMAIS par un
//    visiteur anonyme (public ≠ non connecté) ;
//  - les sous-données (dépenses, transport, photos, enquête) d'une sortie
//    publique restent refusées serveur à un lecteur public non-pote ;
//  - seul l'auteur (ou un admin) peut CHANGER la visibilité.

const AUTHOR_EMAIL = 'ousa.chac@gmail.com' // membre origine non-admin, auteur
const OTHER_MEMBER_EMAIL = 'david.agbodjanprince@gmail.com' // membre origine non-auteur
const CORDEE_B_EMAIL = 'membre.b@altimates.test' // membre d'une autre cordée

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

/** GET d'un document ; renvoie le statut HTTP (403 attendu sur refus des règles). */
async function getDocRest(idToken: string | null, path: string): Promise<number> {
  const res = await fetch(`${FS_BASE}/${path}`, {
    headers: idToken ? { Authorization: `Bearer ${idToken}` } : {},
  })
  return res.status
}

/** PATCH d'un champ ; renvoie le statut HTTP. */
async function patchDocRest(
  idToken: string,
  path: string,
  fields: Record<string, { stringValue: string }>,
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

const s = (v: string) => ({ stringValue: v })

test.describe('Visibilité des sorties — contrôle serveur (firestore.rules)', () => {
  test('potes seulement (champ absent = potes) : refusée à tout non-pote', async () => {
    await seedCordeeOrigine()
    await seedCordee('equipeB', 'Équipe B', [CORDEE_B_EMAIL])
    // Champ absent : forme exacte des randos historiques écrites par la prod v0.5.0.
    const historique = await seedRando({ name: 'Grand Colon' })
    const explicite = await seedRando({ id: 100_002, name: 'Lac Blanc', visibility: 'potes' })

    const pote = await signUp(AUTHOR_EMAIL)
    const membreB = await signUp(CORDEE_B_EMAIL)

    // Un pote lit ; un membre d'une autre cordée non.
    expect(await getDocRest(pote.idToken, `randos/${historique}`)).toBe(200)
    expect(await getDocRest(membreB.idToken, `randos/${historique}`)).toBe(403)
    expect(await getDocRest(membreB.idToken, `randos/${explicite}`)).toBe(403)
  })

  test('publique : lisible par une autre cordée, jamais par un anonyme', async () => {
    await seedCordeeOrigine()
    await seedCordee('equipeB', 'Équipe B', [CORDEE_B_EMAIL])
    const publique = await seedRando({ name: 'Mont Aiguille', visibility: 'public' })

    const membreB = await signUp(CORDEE_B_EMAIL)
    expect(await getDocRest(membreB.idToken, `randos/${publique}`)).toBe(200)

    // « Public » ne veut JAMAIS dire anonyme : sans jeton, refus.
    expect(await getDocRest(null, `randos/${publique}`)).toBe(403)
  })

  test('les sous-données d\'une sortie publique restent privées cordée', async () => {
    await seedCordeeOrigine()
    await seedCordee('equipeB', 'Équipe B', [CORDEE_B_EMAIL])
    const publique = await seedRando({ id: 424_242, name: 'Mont Aiguille', visibility: 'public' })

    // Sous-données rattachées à la sortie (id métier 424242), seedées en bypass.
    const depense = await seedDoc('expenses', { randoId: '424242', payer: 'Nordine', amountCents: 1250, label: 'Péage' })
    const transport = await seedDoc('transport', { randoId: '424242', member: 'Nordine', mode: 'voiture' })
    const photo = await seedDoc('randoMedia', { randoId: '424242', randoDocId: publique, author: 'Nordine', authorUid: 'x', dataUrl: 'data:image/png;base64,AAA' })
    const enquete = await seedDoc('randoSurveys', { randoId: '424242', authorUid: 'x', rating: 5, organization: 5, difficulty: 'facile', weather: 'soleil' })

    const membreB = await signUp(CORDEE_B_EMAIL)
    const pote = await signUp(AUTHOR_EMAIL)

    // Le lecteur public voit la sortie…
    expect(await getDocRest(membreB.idToken, `randos/${publique}`)).toBe(200)
    // …mais AUCUNE de ses données privées : dépenses, transport, photos, enquête.
    expect(await getDocRest(membreB.idToken, `expenses/${depense}`)).toBe(403)
    expect(await getDocRest(membreB.idToken, `transport/${transport}`)).toBe(403)
    expect(await getDocRest(membreB.idToken, `randoMedia/${photo}`)).toBe(403)
    expect(await getDocRest(membreB.idToken, `randoSurveys/${enquete}`)).toBe(403)

    // Témoin : un pote lit tout.
    expect(await getDocRest(pote.idToken, `expenses/${depense}`)).toBe(200)
    expect(await getDocRest(pote.idToken, `randoSurveys/${enquete}`)).toBe(200)
  })

  test('seul l\'auteur (ou un admin) change la visibilité', async () => {
    await seedCordeeOrigine()
    const rando = await seedRando({ name: 'Lac Blanc', proposedBy: 'Ousmane' })

    const auteur = await signUp(AUTHOR_EMAIL)
    await seedUserProfile(auteur.uid, 'Ousmane')
    const autreMembre = await signUp(OTHER_MEMBER_EMAIL)
    await seedUserProfile(autreMembre.uid, 'David')

    // Un membre NON-auteur ne peut pas basculer la sortie en publique…
    expect(
      await patchDocRest(autreMembre.idToken, `randos/${rando}`, { visibility: s('public') }),
    ).toBe(403)
    // …ni écrire une valeur farfelue, même l'auteur.
    expect(
      await patchDocRest(auteur.idToken, `randos/${rando}`, { visibility: s('invisible') }),
    ).toBe(403)
    // L'auteur bascule en publique, puis revient en potes.
    expect(
      await patchDocRest(auteur.idToken, `randos/${rando}`, { visibility: s('public') }),
    ).toBe(200)
    expect(
      await patchDocRest(auteur.idToken, `randos/${rando}`, { visibility: s('potes') }),
    ).toBe(200)

    // Les AUTRES écritures membres (votes…) restent libres pour un non-auteur :
    // comportement v0.5.0 inchangé.
    expect(
      await patchDocRest(autreMembre.idToken, `randos/${rando}`, { date: s('16 août') }),
    ).toBe(200)
  })
})
