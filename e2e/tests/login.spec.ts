import { test, expect } from '../fixtures'
import { login, MEMBER_EMAIL, ADMIN_EMAIL, NON_ADMIN_EMAIL, UNAUTHORIZED_EMAIL } from '../helpers/auth'

test.describe('Login / contrôle d\'accès', () => {
  test('un membre autorisé se connecte et accède à l\'app', async ({ page }) => {
    await login(page, { email: MEMBER_EMAIL, name: 'Wacil' })
    await expect(page.getByRole('button', { name: /Proposer une rando/i })).toBeVisible()
    // Onglets de navigation présents
    await expect(page.getByRole('button', { name: 'Sommets' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Kit' })).toBeVisible()
  })

  test('un email hors whitelist est rejeté', async ({ page }) => {
    await login(page, { email: UNAUTHORIZED_EMAIL, name: 'Intrus', expectRejected: true })
    await expect(page.getByRole('button', { name: /Continuer avec Google/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Proposer une rando/i })).toHaveCount(0)
  })

  test('un admin voit l\'onglet Admin', async ({ page }) => {
    await login(page, { email: ADMIN_EMAIL, name: 'Nordine' })
    await expect(page.getByRole('button', { name: 'Admin' })).toBeVisible()
  })

  test('wacil78 (admin) voit l\'onglet Admin', async ({ page }) => {
    await login(page, { email: MEMBER_EMAIL, name: 'Wacil' })
    await expect(page.getByRole('button', { name: 'Admin' })).toBeVisible()
  })

  test('un membre non-admin ne voit pas l\'onglet Admin', async ({ page }) => {
    await login(page, { email: NON_ADMIN_EMAIL, name: 'Ousa' })
    await expect(page.getByRole('button', { name: 'Admin' })).toHaveCount(0)
  })
})
