import { test, expect } from '../fixtures'
import { login } from '../helpers/auth'
import { DEFAULT_MEMBERS, seedAllowedEmails } from '../helpers/emulator'

// Photo de profil. Le test écrit dans users/{uid} : il utilise une adresse
// dédiée pour ne pas laisser une photo derrière lui sur l'identité partagée par
// les autres specs (l'émulateur donne un uid déterministe par e-mail, et une
// écriture peut survivre au reset — piège documenté dans le skill e2e-playwright).
const PHOTO_EMAIL = 'photo.profil.test@altimates.test'

test.beforeEach(async () => {
  // L'adresse dédiée n'est pas dans la whitelist par défaut : on l'ajoute sans
  // retirer les autres, pour ne casser aucun test qui s'y appuie.
  await seedAllowedEmails([...DEFAULT_MEMBERS, PHOTO_EMAIL])
})

test.describe('Photo de profil', () => {
  test('ajout, affichage puis retrait depuis le Base Camp', async ({ page }) => {
    await login(page, { email: PHOTO_EMAIL, name: 'Sofia' })
    await page.getByRole('button', { name: 'Base Camp', exact: true }).click()

    // Profil vierge : le Base Camp propose « Configurer », qui ouvre le même modal.
    await page.getByRole('button', { name: /Configurer|Modifier mon profil/ }).click()
    await expect(page.getByText('Photo de profil')).toBeVisible()

    // Vrai JPEG décodé par le navigateur : couvre toute la chaîne lecture →
    // décodage → cadrage carré → compression canvas → écriture Firestore. Un
    // mock de la compression laisserait passer une régression de lecture.
    await page.getByLabel('Choisir une photo de profil').setInputFiles('e2e/fixtures-media/photo-test.jpg')

    // L'aperçu apparaît : l'écriture est passée par les règles Firestore, donc
    // le plafond de taille imposé sur users/{uid} accepte bien une photo compressée.
    await expect(page.locator('.pp-preview')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Retirer' })).toBeVisible()
    await expect(page.getByRole('alert')).toHaveCount(0)

    // La pastille du header porte la photo (et plus seulement le prénom).
    await expect(page.locator('.av-btn img')).toBeVisible()

    await page.getByRole('button', { name: 'Retirer' }).click()
    await expect(page.locator('.pp-preview')).toHaveCount(0)
    await expect(page.locator('.av-btn img')).toHaveCount(0)
    // Le prénom reste affiché : retirer la photo ne touche pas au reste du profil.
    await expect(page.locator('.av-btn')).toContainText('Sofia')
  })

  test('la photo d’un membre apparaît dans la liste de la Cordée', async ({ page }) => {
    await login(page, { email: PHOTO_EMAIL, name: 'Sofia' })
    await page.getByRole('button', { name: 'Base Camp', exact: true }).click()
    await page.getByRole('button', { name: /Configurer|Modifier mon profil/ }).click()
    await page.getByLabel('Choisir une photo de profil').setInputFiles('e2e/fixtures-media/photo-test.jpg')
    await expect(page.locator('.pp-preview')).toBeVisible()
    await page.getByRole('button', { name: 'Fermer' }).click()

    await page.getByRole('button', { name: 'Cordée' }).click()
    const ligne = page.locator('.member-row', { hasText: 'Sofia' })
    await expect(ligne).toBeVisible()
    await expect(ligne.locator('img')).toBeVisible()
  })
})
