import { test, expect } from '../fixtures'
import { login, MEMBER_EMAIL } from '../helpers/auth'
import { seedRando } from '../helpers/emulator'

test.describe('Sommets — proposer / voter / supprimer', () => {
  test('proposer une rando la fait apparaître dans la liste', async ({ page }) => {
    await login(page, { email: MEMBER_EMAIL, name: 'Wacil' })

    await page.getByRole('button', { name: /Proposer une rando/i }).click()
    await expect(page.locator('.modal-title', { hasText: 'Proposer une rando' })).toBeVisible()

    await page.locator('input[name="name"]').fill('Aiguille du Midi')
    await page.locator('input[name="region"]').fill('Haute-Savoie')
    await page.locator('select[name="diff"]').selectOption('Difficile')
    await page.locator('input[name="dateStart"]').fill('20/09/2099')
    await page.locator('input[name="km"]').fill('18')
    await page.locator('input[name="dplus"]').fill('1200')

    // Soumission au clavier : le submit est en bas du bottom-sheet, parfois recouvert
    // par la nav fixe pendant l'animation. Entrée déclenche le submit du formulaire.
    await page.locator('input[name="name"]').press('Enter')

    const card = page.locator('.rcard', { hasText: 'Aiguille du Midi' })
    await expect(card).toBeVisible()
    await expect(card).toContainText('Haute-Savoie')
    await expect(card).toContainText('Difficile')
    // Le proposeur est compté "partant" d'office.
    await expect(card.getByRole('button', { name: /VOTÉ/i })).toBeVisible()
  })

  test('voter "partant" puis retirer son vote met à jour le compteur', async ({ page }) => {
    await seedRando({ name: 'Lac Blanc', proposedBy: 'Nordine', votesOui: 1 })
    await login(page, { email: MEMBER_EMAIL, name: 'Wacil' })

    const card = page.locator('.rcard', { hasText: 'Lac Blanc' })
    await expect(card).toBeVisible()

    const partant = card.getByRole('button', { name: /^✅ (PARTANT|VOTÉ)$/i })
    await expect(partant).toHaveText(/PARTANT/i)

    // Voter partant
    await partant.click()
    await expect(partant).toHaveText(/VOTÉ/i)
    await expect(card).toContainText('2✓')

    // Retirer le vote (re-clic)
    await partant.click()
    await expect(partant).toHaveText(/PARTANT/i)
    await expect(card).toContainText('1✓')
  })

  test('voter "peut-être" est exclusif avec "partant"', async ({ page }) => {
    await seedRando({ name: 'Mont Aiguille', proposedBy: 'Nordine', votesOui: 1 })
    await login(page, { email: MEMBER_EMAIL, name: 'Wacil' })

    const card = page.locator('.rcard', { hasText: 'Mont Aiguille' })
    await card.getByRole('button', { name: /^✅ PARTANT$/i }).click()
    await expect(card).toContainText('2✓ 0?')

    // Basculer sur peut-être : oui repasse à 1, peut passe à 1
    await card.getByRole('button', { name: /PEUT-ÊTRE/i }).click()
    await expect(card).toContainText('1✓ 1?')

    // Basculer sur pas partant : peut repasse à 0, non passe à 1
    await card.getByRole('button', { name: /PAS PARTANT/i }).click()
    await expect(card).toContainText('1✓ 0? 1✗')
  })

  test('le proposeur peut supprimer sa rando', async ({ page }) => {
    await login(page, { email: MEMBER_EMAIL, name: 'Wacil' })

    // Créer une rando dont Wacil est le proposeur (bouton corbeille visible).
    await page.getByRole('button', { name: /Proposer une rando/i }).click()
    await page.locator('input[name="name"]').fill('Rando à supprimer')
    await page.locator('input[name="dateStart"]').fill('01/10/2099')
    await page.locator('input[name="name"]').press('Enter')

    const card = page.locator('.rcard', { hasText: 'Rando à supprimer' })
    await expect(card).toBeVisible()

    page.once('dialog', (d) => d.accept())
    await card.getByRole('button', { name: 'Supprimer' }).click()

    await expect(page.locator('.rcard', { hasText: 'Rando à supprimer' })).toHaveCount(0)
  })
})
