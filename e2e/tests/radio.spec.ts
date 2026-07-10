import { test, expect } from '../fixtures'
import { login } from '../helpers/auth'

test.describe('Radio — messages', () => {
  test('poster un message le fait apparaître dans le fil', async ({ page }) => {
    await login(page, { name: 'Wacil' })

    await page.getByRole('button', { name: 'Radio' }).click()
    const input = page.getByPlaceholder('Ton message...')
    await expect(input).toBeVisible()

    await input.fill('Point de rendez-vous 8h au parking')
    await page.getByRole('button', { name: 'Envoyer' }).click()

    await expect(page.getByText('Point de rendez-vous 8h au parking')).toBeVisible()
    // Le champ se vide après envoi.
    await expect(input).toHaveValue('')
  })
})
