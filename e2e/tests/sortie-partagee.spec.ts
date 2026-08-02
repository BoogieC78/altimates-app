import { test, expect } from '../fixtures'
import { login, MEMBER_EMAIL } from '../helpers/auth'
import { seedRando } from '../helpers/emulator'

// Onglets Dépenses / Transport / Photos du détail d'une sortie. Ces parcours
// passent par les vraies règles Firestore de l'émulateur : un test vert ici
// prouve que les nouvelles collections (expenses, transport, randoMedia) sont
// bien autorisées en écriture, ce que les tests de composants ne peuvent pas voir.

async function openRando(page: import('@playwright/test').Page, name: string) {
  const card = page.locator('.rcard', { hasText: name })
  await expect(card).toBeVisible()
  await card.click()
  await expect(page.locator('.modal-title', { hasText: name })).toBeVisible()
}

test.describe('Sortie partagée — dépenses, transport, photos', () => {
  test('une dépense saisie produit les soldes et le remboursement', async ({ page }) => {
    await seedRando({
      name: 'Dents du Midi',
      proposedBy: 'Wacil',
      votesOui: 2,
      memberVotes: { Wacil: 'oui', Nordine: 'oui' },
    })
    await login(page, { email: MEMBER_EMAIL, name: 'Wacil' })
    await openRando(page, 'Dents du Midi')

    await page.getByRole('button', { name: /Dépenses/ }).click()
    await page.getByLabel('Libellé de la dépense').fill('Lyophilisés')
    await page.getByLabel('Montant en euros').fill('30')
    await page.getByRole('button', { name: 'Ajouter la dépense' }).click()

    // Écriture Firestore acceptée : la dépense revient par onSnapshot.
    await expect(page.getByText('Lyophilisés — 30,00', { exact: false })).toBeVisible()
    // 30 € avancés par Wacil pour 2 → Nordine lui doit 15 €.
    await expect(page.getByText(/on lui doit 15,00/)).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Remboursements' })).toBeVisible()
    await expect(page.getByText('Nordine → Wacil')).toBeVisible()
  })

  test('déclarer sa voiture met à jour le récapitulatif transport', async ({ page }) => {
    await seedRando({
      name: 'Aiguille Verte',
      proposedBy: 'Wacil',
      votesOui: 4,
      memberVotes: { Wacil: 'oui', Nordine: 'oui', Ismail: 'oui', Sofia: 'oui' },
    })
    await login(page, { email: MEMBER_EMAIL, name: 'Wacil' })
    await openRando(page, 'Aiguille Verte')

    await page.getByRole('button', { name: /Transport/ }).click()
    // 4 partants, personne n'a répondu : 2 voitures nécessaires, aucune place.
    await expect(page.getByText('Il manque 2 voitures (4 places)')).toBeVisible()

    await page.getByRole('button', { name: "J'amène ma voiture" }).click()
    // 1 voiture (2 places + conducteur) pour 4 personnes : il en manque 1.
    await expect(page.getByText('Il manque 1 voiture (1 place)')).toBeVisible()
    await expect(page.getByLabel(/Places passagers/)).toBeVisible()
  })

  test('les photos sont réservées à l\'organisateur de la sortie', async ({ page }) => {
    await seedRando({ name: 'Pic du Canigou', proposedBy: 'Nordine', memberVotes: { Nordine: 'oui' } })
    await login(page, { email: MEMBER_EMAIL, name: 'Wacil' })
    await openRando(page, 'Pic du Canigou')

    await page.getByRole('button', { name: /Photos/ }).click()
    await expect(page.getByText('Aucune photo pour cette sortie.')).toBeVisible()
    // Wacil est admin dans les fixtures : l'ajout lui reste ouvert même s'il
    // n'a pas proposé la sortie. Le refus côté non-organisateur non-admin est
    // couvert par les tests de composants et par les règles Firestore.
    await expect(page.getByLabel('Ajouter une photo de la sortie')).toBeVisible()
  })

  test('aucun débordement horizontal sur les nouveaux onglets en 360px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 })
    await seedRando({
      name: 'Roche de Rame',
      proposedBy: 'Wacil',
      votesOui: 4,
      memberVotes: { Wacil: 'oui', Nordine: 'oui', Ismail: 'oui', Sofia: 'oui' },
    })
    await login(page, { email: MEMBER_EMAIL, name: 'Wacil' })
    await openRando(page, 'Roche de Rame')

    // 360px est la largeur la plus contrainte visée par le projet, et la barre
    // d'onglets y est passée de 3 à 6 entrées : c'est là que ça déborderait.
    for (const onglet of [/Dépenses/, /Transport/, /Photos/]) {
      await page.getByRole('button', { name: onglet }).click()
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow, `débordement horizontal sur l'onglet ${onglet}`).toBeLessThanOrEqual(0)
    }
  })

  test('ajouter une vraie photo la fait apparaître dans la galerie', async ({ page }) => {
    await seedRando({
      id: 100_010,
      name: 'Tête de Chabrière',
      proposedBy: 'Wacil',
      memberVotes: { Wacil: 'oui' },
    })
    await login(page, { email: MEMBER_EMAIL, name: 'Wacil' })
    await openRando(page, 'Tête de Chabrière')
    await page.getByRole('button', { name: /Photos/ }).click()

    // Vrai fichier JPEG décodé par le navigateur : c'est le seul moyen de couvrir
    // la chaîne complète lecture → décodage → compression canvas → écriture
    // Firestore. Un mock de compressImage laisserait passer une régression de
    // lecture (cas vécu : URL blob: bloquée par la CSP en production).
    await page.getByLabel('Ajouter une photo de la sortie').setInputFiles('e2e/fixtures-media/photo-test.jpg')

    // On n'assert pas le compteur « n/6 » : seedRando réutilise toujours le même
    // id métier (100001), et les photos sont indexées dessus — une photo d'un
    // test précédent qui aurait survécu au reset ferait varier le nombre sans
    // que le comportement testé soit en cause.
    await expect(page.getByAltText(/Photo de la sortie partagée par Wacil/)).toBeVisible()
    // Aucune erreur affichée : le message d'erreur a role="alert".
    await expect(page.getByRole('alert')).toHaveCount(0)
  })

  test('ajout de photo sous la CSP de production (img-src sans blob:)', async ({ page }) => {
    // Le serveur de preview local ne renvoie pas les en-têtes de vercel.json :
    // sans cette injection, la panne vécue en staging (URL blob: bloquée par la
    // CSP) reste invisible en CI. On rejoue donc la directive img-src réelle.
    await page.addInitScript(() => {
      const apply = () => {
        const meta = document.createElement('meta')
        meta.httpEquiv = 'Content-Security-Policy'
        meta.content =
          "img-src 'self' data: https://*.gstatic.com https://www.google.com https://lh3.googleusercontent.com"
        document.head.appendChild(meta)
      }
      if (document.head) apply()
      else document.addEventListener('readystatechange', apply, { once: true })
    })

    await seedRando({ id: 100_011, name: 'Pointe Percée', proposedBy: 'Wacil', memberVotes: { Wacil: 'oui' } })
    await login(page, { email: MEMBER_EMAIL, name: 'Wacil' })
    await openRando(page, 'Pointe Percée')
    await page.getByRole('button', { name: /Photos/ }).click()
    await page.getByLabel('Ajouter une photo de la sortie').setInputFiles('e2e/fixtures-media/photo-test.jpg')

    await expect(page.getByAltText(/Photo de la sortie partagée par Wacil/)).toBeVisible()
    await expect(page.getByRole('alert')).toHaveCount(0)
  })
})
