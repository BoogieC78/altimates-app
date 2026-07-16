import { test, expect } from '../fixtures'
import { DEFAULT_MEMBERS, getLatestEmailSignInLink, seedAllowedEmails } from '../helpers/emulator'
import { NON_ADMIN_EMAIL, UNAUTHORIZED_EMAIL } from '../helpers/auth'

// Connexion sans mot de passe par lien e-mail (gratuit). L'émulateur capture le
// lien (pas de vrai mail) ; on le suit pour terminer la connexion.
test.describe('Connexion par e-mail (lien magique)', () => {
  test('un membre reçoit un lien et se connecte (sans pop-up, cross-device)', async ({ page }) => {
    // Toute pop-up (prompt) fait échouer le test : la connexion ne doit rien demander.
    page.on('dialog', (d) => {
      throw new Error(`Pop-up inattendue: ${d.message()}`)
    })

    await page.goto('/')
    await page.getByPlaceholder('ton@email.com').fill(NON_ADMIN_EMAIL)
    await page.getByRole('button', { name: 'Recevoir un lien de connexion' }).click()
    await expect(page.getByText(/Lien de connexion envoyé/i)).toBeVisible()

    // Simule un autre appareil/navigateur : l'adresse n'est plus en local.
    await page.evaluate(() => localStorage.removeItem('altimates-email-signin'))

    const link = await getLatestEmailSignInLink(NON_ADMIN_EMAIL)
    await page.goto(link)

    // Connexion terminée via l'adresse embarquée dans le lien. Pas de displayName
    // sur un compte lien e-mail → la modal prénom (in-app, pas un dialog) s'affiche
    // et masque la barre Proposer tant qu'un prénom n'est pas saisi.
    await expect(page.getByText(/Comment doit-on t'appeler/i)).toBeVisible()
    await page.getByPlaceholder('Ton prénom').fill('Ousmane')
    await page.locator('input[name="firstname"]').press('Enter')

    // → l'app s'affiche.
    await expect(page.getByRole('button', { name: /Proposer une rando/i })).toBeVisible()
  })

  test('un e-mail hors whitelist est rejeté après le lien', async ({ page }) => {
    await page.goto('/')
    await page.getByPlaceholder('ton@email.com').fill(UNAUTHORIZED_EMAIL)
    await page.getByRole('button', { name: 'Recevoir un lien de connexion' }).click()
    await expect(page.getByText(/Lien de connexion envoyé/i)).toBeVisible()

    const link = await getLatestEmailSignInLink(UNAUTHORIZED_EMAIL)
    await page.goto(link)

    await expect(page.getByText(/Email non autorisé/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Proposer une rando/i })).toHaveCount(0)
  })

  test.describe('nouveau membre', () => {
    test.use({ skipTour: false }) // on veut voir le tour guidé
    test('après le lien, arrive sur le tour guidé de bienvenue', async ({ page }) => {
      await page.goto('/')
      await page.getByPlaceholder('ton@email.com').fill(NON_ADMIN_EMAIL)
      await page.getByRole('button', { name: 'Recevoir un lien de connexion' }).click()
      await expect(page.getByText(/Lien de connexion envoyé/i)).toBeVisible()

      const link = await getLatestEmailSignInLink(NON_ADMIN_EMAIL)
      await page.goto(link)

      // Connecté ET tour guidé affiché (première visite).
      await expect(page.getByRole('button', { name: /Passer/i })).toBeVisible()
    })
  })

  test('sans displayName Google, demande le prénom et l\'utilise (pas d\'Anonyme)', async ({ page }) => {
    // Identité jetable : NON_ADMIN_EMAIL est déjà utilisé (et nommé) par le test
    // de connexion plus haut — la partager rendrait ce test dépendant de l'ordre.
    const THROWAWAY_EMAIL = 'sans.displayname@gmail.com'
    await seedAllowedEmails([...DEFAULT_MEMBERS, THROWAWAY_EMAIL])

    await page.goto('/')
    await page.getByPlaceholder('ton@email.com').fill(THROWAWAY_EMAIL)
    await page.getByRole('button', { name: 'Recevoir un lien de connexion' }).click()
    await expect(page.getByText(/Lien de connexion envoyé/i)).toBeVisible()

    const link = await getLatestEmailSignInLink(THROWAWAY_EMAIL)
    await page.goto(link)

    // Aucun displayName sur un compte lien e-mail → la modal prénom est obligatoire.
    await expect(page.getByText(/Comment doit-on t'appeler/i)).toBeVisible()
    await page.getByPlaceholder('Ton prénom').fill('Ousmane')
    await page.locator('input[name="firstname"]').press('Enter')

    // Prénom enregistré : modal fermée, avatar aux initiales du prénom.
    await expect(page.getByText(/Comment doit-on t'appeler/i)).toHaveCount(0)
    await expect(page.locator('.av-btn')).toHaveText('OU')
  })

  test('adresse e-mail invalide : message d\'erreur', async ({ page }) => {
    await page.goto('/')
    await page.getByPlaceholder('ton@email.com').fill('a@b')
    await page.getByRole('button', { name: 'Recevoir un lien de connexion' }).click()
    await expect(page.getByText(/adresse e-mail valide/i)).toBeVisible()
  })
})
