import { test, expect } from '../fixtures'
import { login } from '../helpers/auth'
import { readCollection } from '../helpers/emulator'

// Boîte à idées (ampoule du header) — remplace l'ancien onglet Idées.
// En mode émulateur, le relais Trello (/api/send-feedback) est court-circuité :
// on vérifie ici le parcours utilisateur + l'écriture Firestore (source de vérité).
test.describe('Boîte à idées — ampoule', () => {
  test("l'onglet Idées n'existe plus, l'ampoule est là depuis n'importe quel onglet", async ({ page }) => {
    await login(page, { name: 'Wacil' })

    const nav = page.getByRole('navigation', { name: 'Navigation principale' })
    await expect(nav.getByRole('button', { name: 'Sommets' })).toBeVisible()
    await expect(nav.getByRole('button', { name: 'Idées' })).toHaveCount(0)

    // Ampoule visible sur Sommets… puis toujours là après changement d'onglet.
    await expect(page.getByRole('button', { name: 'Boîte à idées' })).toBeVisible()
    await page.getByRole('button', { name: 'Cordée' }).click()
    await expect(page.getByRole('button', { name: 'Boîte à idées' })).toBeVisible()
  })

  test('envoyer un retour affiche la confirmation et écrit le feedback en base', async ({ page }) => {
    await login(page, { name: 'Wacil' })

    await page.getByRole('button', { name: 'Boîte à idées' }).click()
    const dialog = page.getByRole('dialog', { name: 'Boîte à idées' })
    await expect(dialog).toBeVisible()

    await dialog.getByLabel('Type de retour').selectOption('feature')
    await dialog.getByLabel('Ton message').fill('Filtrer les randos par dénivelé')
    await dialog.getByRole('button', { name: 'Envoyer' }).click()

    await expect(dialog.getByText(/Ton retour est bien envoyé/)).toBeVisible()

    // Le feedback est bien en base (collection feedbacks, source de vérité).
    await expect
      .poll(async () => await readCollection('feedbacks'))
      .toEqual([
        expect.objectContaining({
          author: 'Wacil',
          text: 'Filtrer les randos par dénivelé',
          cat: 'feature',
        }),
      ])

    // « En envoyer un autre » revient à un formulaire vierge.
    await dialog.getByRole('button', { name: 'En envoyer un autre' }).click()
    await expect(dialog.getByLabel('Ton message')).toHaveValue('')

    // Escape ferme la modale (dialog accessible) — focus dans le formulaire,
    // comme un utilisateur qui vient de cliquer dans le champ.
    await dialog.getByLabel('Ton message').click()
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
  })
})
