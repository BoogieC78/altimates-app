import { test, expect } from '../fixtures'
import { login } from '../helpers/auth'

// L'export PDF charge jspdf en import dynamique (voir kitPdf.ts et le commentaire
// de vite.config.ts sur les chunks). Ce test garde le contrat : le clic sur PDF
// déclenche bien un téléchargement, donc le chunk asynchrone est servi et exécuté.
// Sans lui, sortir jspdf du graphe initial pourrait le casser en silence.
test.describe('Kit — export PDF', () => {
  test('le clic sur PDF télécharge le fichier (chunk jspdf chargé à la demande)', async ({ page }) => {
    // Email dédié : uid distinct, donc profil kit garanti vierge quel que soit
    // l'ordre d'exécution (même précaution que kit.spec.ts).
    await login(page, { email: 'ousa.chac@gmail.com', name: 'Ousmane' })
    await page.getByRole('button', { name: 'Kit' }).click()

    // Onboarding du kit, puis sortie du triage pour atteindre la barre d'actions.
    await page.locator('.btn.btn-full').first().click()
    await page.getByRole('button', { name: 'Journée' }).click()
    await page.getByRole('button', { name: 'Voir la liste →' }).click()
    await expect(page.getByText('Indispensables')).toBeVisible()

    const pdfButton = page.getByRole('button', { name: 'PDF', exact: true })
    await expect(pdfButton).toBeVisible()

    const download = page.waitForEvent('download')
    await pdfButton.click()
    expect((await download).suggestedFilename()).toMatch(/\.pdf$/i)
  })
})
