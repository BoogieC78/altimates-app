import { test, expect } from '../fixtures'
import { getLatestEmailSignInLink } from '../helpers/emulator'
import { NON_ADMIN_EMAIL, UNAUTHORIZED_EMAIL } from '../helpers/auth'

// Connexion sans mot de passe par lien e-mail (gratuit). L'émulateur capture le
// lien (pas de vrai mail) ; on le suit pour terminer la connexion.
test.describe('Connexion par e-mail (lien magique)', () => {
  test('un membre reçoit un lien et se connecte', async ({ page }) => {
    await page.goto('/')
    await page.getByPlaceholder('ton@email.com').fill(NON_ADMIN_EMAIL)
    await page.getByRole('button', { name: 'Recevoir un lien de connexion' }).click()
    await expect(page.getByText(/Lien de connexion envoyé/i)).toBeVisible()

    const link = await getLatestEmailSignInLink(NON_ADMIN_EMAIL)
    await page.goto(link)

    // Connexion terminée → l'app s'affiche.
    await expect(page.getByRole('button', { name: /Proposer une rando/i })).toBeVisible()
  })

  test('un e-mail hors whitelist est rejeté après le lien', async ({ page }) => {
    await page.goto('/')
    await page.getByPlaceholder('ton@email.com').fill(UNAUTHORIZED_EMAIL)
    await page.getByRole('button', { name: 'Recevoir un lien de connexion' }).click()
    await expect(page.getByText(/Lien de connexion envoyé/i)).toBeVisible()

    const link = await getLatestEmailSignInLink(UNAUTHORIZED_EMAIL)
    await page.goto(link)

    await expect(page.getByText(/Email non autorisé/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Proposer une rando/i })).toHaveCount(0)
  })

  test('adresse e-mail invalide : message d\'erreur', async ({ page }) => {
    await page.goto('/')
    await page.getByPlaceholder('ton@email.com').fill('a@b')
    await page.getByRole('button', { name: 'Recevoir un lien de connexion' }).click()
    await expect(page.getByText(/adresse e-mail valide/i)).toBeVisible()
  })
})
