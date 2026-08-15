import { test, expect } from '../fixtures'
import { login, logout, signInWithEmulator, NON_ADMIN_EMAIL, UNAUTHORIZED_EMAIL } from '../helpers/auth'
import { seedCordee, seedCordeeOrigine, seedInvite } from '../helpers/emulator'

// Parrainage + cordées multiples (parcours UI complet). Les invariants serveur
// (quota 6, expiration 24 h, cloisonnement) sont attaqués directement par
// invitations-securite.spec.ts — ici on vérifie le chemin nominal : un membre
// NON-ADMIN fait entrer quelqu'un tout seul, sans intervention de l'admin.

/** Chemin relatif d'un lien d'invitation (l'UI renvoie une URL absolue). */
function invitePath(link: string): string {
  const url = new URL(link)
  return url.pathname + url.search
}

test.describe('Invitations — parrainage', () => {
  test('un membre non-admin génère un lien et fait entrer un invité après approbation', async ({
    page,
  }) => {
    test.slow() // 4 connexions successives sur le même contexte
    await seedCordeeOrigine()

    // 1. Le membre (non-admin) génère un lien d'invitation depuis l'onglet Cordée.
    await login(page, { email: NON_ADMIN_EMAIL, name: 'Ousmane' })
    await page.getByRole('button', { name: 'Cordée' }).click()
    // .first() : le nom apparaît aussi dans le titre « Inviter dans … ».
    await expect(page.getByText("Cordée d'origine").first()).toBeVisible()
    await page.getByRole('button', { name: "Générer un lien d'invitation" }).click()
    const link = await page.getByLabel("Lien d'invitation").inputValue()
    expect(link).toContain('/?invite=')
    await logout(page)

    // 2. L'invité (hors whitelist) ouvre le lien, se connecte et dépose sa demande.
    await signInWithEmulator(page, { email: UNAUTHORIZED_EMAIL, name: 'Karim', url: invitePath(link) })
    await expect(page.getByText('Invitation à rejoindre « Cordée d\'origine »')).toBeVisible()
    await page.getByLabel('Ton prénom').fill('Karim')
    await page.getByRole('button', { name: 'Demander à rejoindre' }).click()
    await expect(page.getByText('Demande envoyée')).toBeVisible()
    await page.getByRole('button', { name: 'Annuler et se déconnecter' }).click()
    await expect(page.getByRole('button', { name: /Continuer avec Google/i })).toBeVisible()

    // 3. Le créateur du lien (toujours non-admin) approuve la demande.
    await login(page, { email: NON_ADMIN_EMAIL, name: 'Ousmane' })
    await page.getByRole('button', { name: 'Cordée' }).click()
    await expect(page.getByText('Demandes en attente')).toBeVisible()
    await expect(page.getByText('Karim')).toBeVisible()
    await page.getByRole('button', { name: 'Approuver' }).click()
    await expect(page.getByText('Demandes en attente')).not.toBeVisible()
    await logout(page)

    // 4. L'invité approuvé entre dans l'app (accès via son appartenance cordée,
    //    PAS via la whitelist — il n'y figure toujours pas).
    await login(page, { email: UNAUTHORIZED_EMAIL, name: 'Karim' })
  })

  test('un membre existant rejoint une seconde cordée via un lien', async ({ page }) => {
    await seedCordeeOrigine()
    await seedCordee('copains', 'Les Copains', [NON_ADMIN_EMAIL])
    const token = await seedInvite({
      cordeeId: 'copains',
      cordeeName: 'Les Copains',
      createdBy: NON_ADMIN_EMAIL,
    })

    // Membre d'origine, PAS de « Les Copains » : le lien lui montre la page
    // d'invitation avec un retour possible vers l'app.
    await signInWithEmulator(page, { name: 'Wacil', url: `/?invite=${token}` })
    await expect(page.getByText('Invitation à rejoindre « Les Copains »')).toBeVisible()
    await page.getByRole('button', { name: 'Demander à rejoindre' }).click()
    await expect(page.getByText('Demande envoyée')).toBeVisible()
    await page.getByRole('button', { name: "Retour à l'app" }).click()
    await expect(page.getByRole('button', { name: /Proposer une rando/i })).toBeVisible()
  })

  test('un lien expiré (plus de 24 h) est annoncé comme tel', async ({ page }) => {
    await seedCordeeOrigine()
    // Une cordée dont Wacil n'est PAS membre : sinon « Tu es déjà membre »
    // prime (à raison) sur l'expiration du lien.
    await seedCordee('copains', 'Les Copains', [NON_ADMIN_EMAIL])
    const token = await seedInvite({
      cordeeId: 'copains',
      cordeeName: 'Les Copains',
      createdBy: NON_ADMIN_EMAIL,
      ageMs: 25 * 60 * 60 * 1000,
    })

    await signInWithEmulator(page, { name: 'Wacil', url: `/?invite=${token}` })
    await expect(page.getByText('Lien expiré')).toBeVisible()
  })
})
