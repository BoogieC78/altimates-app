import { test, expect } from './fixtures'
import { login, MEMBER_EMAIL } from './helpers/auth'
import { seedRando } from './helpers/emulator'

// Captures d'écran des onglets de sortie, en 375px (iPhone). Utilitaire de
// documentation, PAS un test de non-régression : il vit hors de `e2e/tests`
// (testDir de playwright.config.ts) pour ne pas tourner dans la CI, où il
// entrerait en collision avec les specs qui seedent la même rando.
//
// Lancer à la demande :
//   npm run build:e2e && firebase emulators:exec --only auth,firestore \
//     --project altimates-4c37f 'npx playwright test e2e/captures.spec.ts'
test.describe('Captures des onglets de sortie', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('dépenses, transport et photos', async ({ page }) => {
    await seedRando({
      name: 'Lac Blanc',
      proposedBy: 'Wacil',
      votesOui: 4,
      memberVotes: { Wacil: 'oui', Nordine: 'oui', Ismail: 'oui', Sofia: 'oui' },
    })
    await login(page, { email: MEMBER_EMAIL, name: 'Wacil' })

    await page.locator('.rcard', { hasText: 'Lac Blanc' }).click()
    await expect(page.locator('.modal-title', { hasText: 'Lac Blanc' })).toBeVisible()

    // Onglet Dépenses, avec deux dépenses croisées pour montrer les soldes.
    await page.getByRole('button', { name: /Dépenses/ }).click()
    await page.getByLabel('Libellé de la dépense').fill('Lyophilisés')
    await page.getByLabel('Montant en euros').fill('48,60')
    await page.getByRole('button', { name: 'Ajouter la dépense' }).click()
    await expect(page.getByRole('heading', { name: 'Remboursements' })).toBeVisible()
    await page.screenshot({ path: 'captures/depenses.png', fullPage: true, animations: 'disabled' })

    // Onglet Transport : 4 partants, une voiture déclarée.
    await page.getByRole('button', { name: /Transport/ }).click()
    await page.getByRole('button', { name: "J'amène ma voiture" }).click()
    await expect(page.getByLabel(/Places passagers/)).toBeVisible()
    await expect(page.getByRole('button', { name: "J'amène ma voiture" })).toHaveAttribute('aria-pressed', 'true')
    await page.screenshot({ path: 'captures/transport.png', fullPage: true, animations: 'disabled' })

    // Onglet Photos (vide : l'ajout passe par le sélecteur de fichier natif).
    await page.getByRole('button', { name: /Photos/ }).click()
    await expect(page.getByText('Aucune photo pour cette sortie.')).toBeVisible()
    await page.screenshot({ path: 'captures/photos.png', fullPage: true, animations: 'disabled' })
  })
})
