import { test, expect } from '../fixtures'
import { login } from '../helpers/auth'

// Écran "compte" ouvert via les initiales (avatar) — équivalent du Base Camp de l'app d'origine.
test.describe('Base Camp (écran compte via avatar)', () => {
  // Amène le Base Camp à l'état "configuré". Tolère un profil déjà présent
  // (l'uid émulateur est déterministe par email → l'état peut persister entre tests).
  const configure = async (page: import('@playwright/test').Page, name: string) => {
    await expect(page.getByText(/Installe ton Base Camp|Personal bests/)).toBeVisible()
    const configureBtn = page.getByRole('button', { name: 'Configurer' })
    if (await configureBtn.isVisible().catch(() => false)) {
      await configureBtn.click()
      await page.locator('.modal input.form-input').first().fill(name)
      await page.getByRole('button', { name: 'Enregistrer' }).click()
    }
    await expect(page.locator('.bc-name')).toBeVisible()
  }

  test('cliquer sur les initiales ouvre le Base Camp', async ({ page }) => {
    await login(page, { name: 'Wacil' })
    await page.locator('.av-btn').click()
    // Profil vierge → état vide "Installe ton Base Camp".
    await expect(page.getByText('Installe ton Base Camp')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Configurer' })).toBeVisible()
  })

  test('configurer puis modifier le profil', async ({ page }) => {
    await login(page, { name: 'Wacil' })
    await page.locator('.av-btn').click()

    await page.getByRole('button', { name: 'Configurer' }).click()
    await page.locator('.modal input.form-input').first().fill('Wacil Test')
    await page.locator('.modal select.form-input').selectOption('expert')
    await page.getByRole('button', { name: 'Enregistrer' }).click()

    // Le hero affiche le profil configuré.
    await expect(page.locator('.bc-name')).toHaveText('Wacil Test')
    await expect(page.getByText('Expert')).toBeVisible()

    // "Modifier profil" rouvre la modale pré-remplie.
    await page.getByRole('button', { name: 'Modifier profil' }).click()
    await expect(page.locator('.modal-title', { hasText: 'Modifier profil' })).toBeVisible()
    await expect(page.locator('.modal input.form-input').first()).toHaveValue('Wacil Test')
  })

  test('le bouton Kit renvoie vers l\'onglet Kit', async ({ page }) => {
    await login(page, { name: 'Wacil' })
    await page.locator('.av-btn').click()
    await configure(page, 'Wacil')

    await page.locator('.bc-kit-bar').getByRole('button', { name: 'Kit' }).click()
    await expect(page.getByText(/Ton niveau en rando \?|Indispensables/)).toBeVisible()
  })

  test('Réinitialiser revient à l\'état vide', async ({ page }) => {
    await login(page, { name: 'Wacil' })
    await page.locator('.av-btn').click()
    await configure(page, 'Wacil')

    page.once('dialog', (d) => d.accept())
    await page.getByRole('button', { name: 'Réinitialiser' }).click()
    await expect(page.getByText('Installe ton Base Camp')).toBeVisible()
  })

  test('Déconnexion depuis le Base Camp ramène au login', async ({ page }) => {
    await login(page, { name: 'Wacil' })
    await page.locator('.av-btn').click()
    // Le bouton Déconnexion est présent dans les deux états (vide ou configuré).
    await page.getByRole('button', { name: 'Déconnexion' }).click()
    await expect(page.getByRole('button', { name: /Continuer avec Google/i })).toBeVisible()
  })
})
