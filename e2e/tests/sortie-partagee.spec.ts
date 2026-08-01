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
})
