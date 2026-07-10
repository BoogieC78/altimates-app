import { test, expect } from '../fixtures'
import { login, logout, signInWithEmulator, MEMBER_EMAIL } from '../helpers/auth'

// Gestion dynamique des accès depuis le portail Admin (config/allowedEmails).
// La whitelist par défaut est seedée avant chaque test (voir fixtures.ts).
// On opère sur des emails JETABLES (jamais un membre partagé comme ousa.chac)
// pour ne pas coupler ce spec aux autres.
test.describe('Portail Admin — gestion des accès', () => {
  const NEW_MEMBER = 'nouveau.membre@gmail.com'
  const TO_REVOKE = 'membre.a.retirer@gmail.com'

  test('ajouter un email autorise un nouveau membre à se connecter', async ({ page }) => {
    await login(page, { email: MEMBER_EMAIL, name: 'Wacil' })
    await page.getByRole('button', { name: 'Admin' }).click()
    await expect(page.getByText('Données Firestore')).toBeVisible()

    await page.getByPlaceholder('Ajouter un email…').fill(NEW_MEMBER)
    await page.getByRole('button', { name: 'Ajouter' }).click()
    await expect(page.locator('.admin-row', { hasText: NEW_MEMBER })).toBeVisible()

    // L'admin se déconnecte, le nouveau membre se connecte : accès accordé.
    await logout(page)
    await login(page, { email: NEW_MEMBER, name: 'Nouveau' })
    await expect(page.getByRole('button', { name: /Proposer une rando/i })).toBeVisible()
  })

  test('retirer un email révoque l\'accès du membre', async ({ page }) => {
    await login(page, { email: MEMBER_EMAIL, name: 'Wacil' })
    await page.getByRole('button', { name: 'Admin' }).click()
    await expect(page.getByText('Données Firestore')).toBeVisible()

    // Ajout d'un email jetable, puis retrait.
    await page.getByPlaceholder('Ajouter un email…').fill(TO_REVOKE)
    await page.getByRole('button', { name: 'Ajouter' }).click()
    const row = page.locator('.admin-row', { hasText: TO_REVOKE })
    await expect(row).toBeVisible()

    page.once('dialog', (d) => d.accept()) // confirm() de retrait
    await row.getByRole('button', { name: 'Retirer' }).click()
    await expect(page.locator('.admin-row', { hasText: TO_REVOKE })).toHaveCount(0)

    // L'email retiré est désormais rejeté à la connexion.
    await logout(page)
    await signInWithEmulator(page, { email: TO_REVOKE, name: 'Retiré' })
    await expect(page.getByText(/Accès réservé à la cordée/i)).toBeVisible()
  })
})
