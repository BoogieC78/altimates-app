import { test, expect } from '../fixtures'
import { login, logout } from '../helpers/auth'

test.describe('Navigation entre les onglets', () => {
  test('chaque onglet principal se charge sans erreur', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))

    await login(page, { name: 'Wacil' })

    // L'onglet Kit affiche l'onboarding (profil vide) OU la checklist (profil configuré) :
    // ce smoke ne présume pas de l'état du profil, il vérifie juste que l'onglet se rend.
    await page.getByRole('button', { name: 'Kit' }).click()
    await expect(page.getByText(/Ton niveau en rando \?|Indispensables/)).toBeVisible()

    await page.getByRole('button', { name: 'Cordée' }).click()
    await expect(page.getByText('Membres', { exact: true })).toBeVisible()

    // Base Camp affiche l'état vide (profil vierge) OU le tableau de bord (configuré).
    // exact: pour ne pas matcher l'avatar "Mon Base Camp".
    await page.getByRole('button', { name: 'Base Camp', exact: true }).click()
    await expect(page.getByText(/Personal bests|Installe ton Base Camp/)).toBeVisible()

    await page.getByRole('button', { name: 'Sommets' }).click()
    await expect(page.getByRole('button', { name: /Proposer une rando/i })).toBeVisible()

    expect(errors, `Erreurs JS: ${errors.join('\n')}`).toEqual([])
  })

  test('déconnexion (via Base Camp) ramène à l\'écran de login', async ({ page }) => {
    await login(page, { name: 'Wacil' })
    await logout(page)
    await expect(page.getByRole('button', { name: /Continuer avec Google/i })).toBeVisible()
  })
})
