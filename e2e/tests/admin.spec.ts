import { test, expect } from '../fixtures'
import { login, ADMIN_EMAIL } from '../helpers/auth'
import { seedRando } from '../helpers/emulator'

test.describe('Admin', () => {
  test('l\'admin accède au panneau d\'administration', async ({ page }) => {
    await login(page, { email: ADMIN_EMAIL, name: 'Nordine' })

    await page.getByRole('button', { name: 'Admin' }).click()
    await expect(page.getByText('Données Firestore')).toBeVisible()
    await expect(page.getByText('Membres', { exact: true })).toBeVisible()
  })

  test('l\'admin peut modifier puis supprimer une rando depuis le panneau', async ({ page }) => {
    await seedRando({ name: 'Rando à administrer', proposedBy: 'Wacil' })
    await login(page, { email: ADMIN_EMAIL, name: 'Nordine' })

    await page.getByRole('button', { name: 'Admin' }).click()
    const row = page.locator('.admin-row', { hasText: 'Rando à administrer' })
    await expect(row).toBeVisible()

    // Modifier : la modale s'ouvre pré-remplie, on renomme
    await row.getByRole('button', { name: 'Modifier' }).click()
    const nameInput = page.locator('input[name="name"]')
    await expect(nameInput).toHaveValue('Rando à administrer')
    await nameInput.fill('Rando renommée')
    await page.getByRole('button', { name: 'Enregistrer' }).click()
    const renamed = page.locator('.admin-row', { hasText: 'Rando renommée' })
    await expect(renamed).toBeVisible()

    // Supprimer (avec confirmation)
    page.once('dialog', (d) => void d.accept())
    await renamed.getByRole('button', { name: 'Supprimer' }).click()
    await expect(renamed).not.toBeVisible()
  })
})
