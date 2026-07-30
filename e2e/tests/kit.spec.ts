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

  test('le poids du sac estimé baisse quand on skippe un article', async ({ page }) => {
    await login(page, { name: 'Wacil' })
    await page.getByRole('button', { name: 'Kit' }).click()
    await page.locator('.btn.btn-full').first().click()
    await page.getByRole('button', { name: 'Journée' }).click()

    const poids = page.locator('.budget-weight-val')
    await expect(poids).toBeVisible()
    const avant = (await poids.textContent()) ?? ''
    await expect(page.getByText(/14 articles emportés/)).toBeVisible()

    // Skip du premier article (chaussures) : il sort du sac, le total doit changer.
    await page.locator('.gear-item').first().getByRole('button', { name: '✕ Skip' }).click()
    await expect(page.getByText(/13 articles emportés/)).toBeVisible()
    await expect(poids).not.toHaveText(avant)
  })
})
