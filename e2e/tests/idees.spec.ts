import { test, expect } from '../fixtures'
import { login } from '../helpers/auth'

test.describe('Idées — feedbacks', () => {
  test('soumettre une idée la fait apparaître dans la liste du groupe', async ({ page }) => {
    await login(page, { name: 'Wacil' })

    await page.getByRole('button', { name: 'Idées' }).click()
    const input = page.getByPlaceholder('ex: Filtrer par dénivelé max...')
    await expect(input).toBeVisible()

    await input.fill('Ajouter un filtre par difficulté')
    await page.getByRole('button', { name: 'Soumettre' }).click()

    await expect(page.getByText('Ajouter un filtre par difficulté')).toBeVisible()
  })
})
