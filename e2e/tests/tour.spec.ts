import { test, expect } from '../fixtures'
import { signInWithEmulator } from '../helpers/auth'

// Ce spec NE saute PAS le tour guidé (contrairement aux autres) : on veut le voir.
test.use({ skipTour: false })

test.describe('Tour guidé (première connexion)', () => {
  test('s\'affiche à la première connexion et se passe', async ({ page }) => {
    await signInWithEmulator(page, { name: 'Wacil' })

    const skip = page.getByRole('button', { name: /Passer/i })
    await expect(skip).toBeVisible()

    await skip.click()

    // Le tour terminé, on arrive sur l'app.
    await expect(page.getByRole('button', { name: /Proposer une rando/i })).toBeVisible()
  })
})
