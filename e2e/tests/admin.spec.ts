import { test, expect } from '../fixtures'
import { login, ADMIN_EMAIL } from '../helpers/auth'

test.describe('Admin', () => {
  test('l\'admin accède au panneau d\'administration', async ({ page }) => {
    await login(page, { email: ADMIN_EMAIL, name: 'Nordine' })

    await page.getByRole('button', { name: 'Admin' }).click()
    await expect(page.getByText('Données Firestore')).toBeVisible()
    await expect(page.getByText('Membres', { exact: true })).toBeVisible()
  })
})
