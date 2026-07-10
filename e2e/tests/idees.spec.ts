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

  test('bascule entre les vues Liste et Kanban', async ({ page }) => {
    await login(page, { name: 'Wacil' })
    await page.getByRole('button', { name: 'Idées' }).click()

    await page.getByRole('button', { name: 'Kanban' }).click()
    await expect(page.getByText('Backlog')).toBeVisible()

    await page.getByRole('button', { name: 'Liste', exact: true }).click()
    await expect(page.getByPlaceholder('ex: Filtrer par dénivelé max...')).toBeVisible()
  })
})
