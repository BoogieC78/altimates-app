import { test, expect } from '../fixtures'
import { login } from '../helpers/auth'

test.describe('Kit — onboarding et checklist', () => {
  test('configurer son profil affiche la checklist matériel', async ({ page }) => {
    await login(page, { name: 'Wacil' })
    await page.getByRole('button', { name: 'Kit' }).click()

    // Étape 1 : niveau (les seuls .btn-full de l'onboarding).
    await expect(page.getByText('Ton niveau en rando ?')).toBeVisible()
    await page.locator('.btn.btn-full').first().click()

    // Étape 2 : type de sortie.
    await expect(page.getByText('Plutôt journée ou trek ?')).toBeVisible()
    await page.getByRole('button', { name: 'Journée' }).click()

    // La checklist personnalisée s'affiche.
    await expect(page.getByText('Indispensables')).toBeVisible()
  })
})
