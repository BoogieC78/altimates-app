import { test, expect } from '../fixtures'
import { login, MEMBER_EMAIL } from '../helpers/auth'

// Les documents légaux doivent être atteignables AVANT la connexion : se
// connecter vaut acceptation des conditions, elles ne peuvent donc pas vivre
// derrière l'authentification. Le second parcours vérifie l'autre point d'accès
// demandé, depuis le profil.

test.describe('Documents légaux', () => {
  test('sont consultables depuis l’écran de connexion, sans compte', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: /Continuer avec Google/i })).toBeVisible()

    await page.getByRole('button', { name: 'Mentions légales' }).click()
    // Les liens du pied de page restent dans le DOM derrière la modale : sans ce
    // cadrage sur le dialogue, chaque nom de document matcherait deux boutons.
    const modale = page.getByRole('dialog')
    await expect(modale.getByRole('heading', { name: 'Mentions légales' })).toBeVisible()
    await expect(modale.getByText(/Dernière mise à jour/)).toBeVisible()

    // Les trois documents sont dans la même modale : on passe de l'un à l'autre
    // sans repasser par l'écran de connexion.
    await modale.getByRole('button', { name: 'Confidentialité' }).click()
    await expect(modale.getByRole('heading', { name: 'Politique de confidentialité' })).toBeVisible()
    await modale.getByRole('button', { name: 'Conditions d’utilisation' }).click()
    await expect(modale.getByRole('heading', { name: 'Conditions générales d’utilisation' })).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    // Toujours pas connecté : la lecture des documents n'ouvre aucun accès.
    await expect(page.getByRole('button', { name: /Continuer avec Google/i })).toBeVisible()
  })

  test('sont retrouvables depuis le profil une fois connecté', async ({ page }) => {
    await login(page, { email: MEMBER_EMAIL, name: 'Wacil' })
    await page.getByRole('button', { name: 'Base Camp', exact: true }).click()

    await expect(page.getByText('Informations légales')).toBeVisible()
    await page.getByRole('button', { name: 'Conditions d’utilisation' }).click()
    const modale = page.getByRole('dialog')
    await expect(modale.getByRole('heading', { name: 'Conditions générales d’utilisation' })).toBeVisible()
  })
})
