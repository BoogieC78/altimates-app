import { test, expect } from '../fixtures'
import { login } from '../helpers/auth'

test.describe('Kit — onboarding et checklist', () => {
  test('configurer son profil affiche la checklist matériel', async ({ page }) => {
    await login(page, { name: 'Wacil' })
    await page.getByRole('button', { name: 'Kit' }).click()

    // Étape 1 : niveau (les seuls .btn-full de l'onboarding).
    await expect(page.getByText('Ton niveau en rando ?')).toBeVisible()
    await page.locator('.btn.btn-full').first().click()

    // Étape 2 : type de sortie.
    await expect(page.getByText('Plutôt journée ou trek ?')).toBeVisible()
    await page.getByRole('button', { name: 'Journée' }).click()

    // Kit vierge : le triage express démarre ; on le quitte pour voir la checklist.
    await expect(page.getByText(/TRIAGE · 1\/\d+/)).toBeVisible()
    await page.getByRole('button', { name: 'Voir la liste →' }).click()
    await expect(page.getByText('Indispensables')).toBeVisible()
  })

  test('le triage express écrit les statuts carte par carte', async ({ page }) => {
    // Email dédié à ce test : uid distinct → profil garanti vierge, quel que soit
    // l'ordre d'exécution (l'uid de Wacil est partagé et peut fuiter entre tests).
    await login(page, { email: 'mrbouchemoua.ismail@gmail.com', name: 'Ismail' })
    await page.getByRole('button', { name: 'Kit' }).click()
    await page.locator('.btn.btn-full').first().click()
    await page.getByRole('button', { name: 'Journée' }).click()

    // Carte 1 (chaussures) : « J'ai ». Carte 2 : « À acheter ». Carte 3 : « Pas besoin ».
    await expect(page.getByText(/TRIAGE · 1\/\d+/)).toBeVisible()
    await page.getByRole('button', { name: "✓ J'ai" }).click()
    await expect(page.getByText(/TRIAGE · 2\/\d+/)).toBeVisible()
    await page.getByRole('button', { name: '🛒 À acheter' }).click()
    await page.getByRole('button', { name: '✕ Pas besoin' }).click()

    // Sortie vers la liste : les statuts sont persistés dans les stats.
    await page.getByRole('button', { name: 'Voir la liste →' }).click()
    await expect(page.locator('.budget-stat-val').first()).toHaveText(/^1\/\d+$/)
    // Bouton de relance sur les articles restants (14 - 3 = 11 en journée).
    await expect(page.getByRole('button', { name: /^Trier \(\d+\)$/ })).toBeVisible()

    // « Tout retrier » repasse sur TOUS les articles (14 en journée), et répondre
    // « J'ai » sur un article déjà possédé le garde (pas de toggle qui l'effacerait).
    await page.getByRole('button', { name: 'Tout retrier' }).click()
    await expect(page.getByText('TRIAGE · 1/14')).toBeVisible()
    await page.getByRole('button', { name: "✓ J'ai" }).click()
    await page.getByRole('button', { name: 'Voir la liste →' }).click()
    await expect(page.locator('.budget-stat-val').first()).toHaveText('1/14')

    // « Réinitialiser mon kit » (avec confirm) → retour à l'onboarding, comme un
    // nouveau membre — stats de sorties conservées côté profil.
    page.once('dialog', (d) => void d.accept())
    await page.getByRole('button', { name: 'Réinitialiser mon kit' }).click()
    await expect(page.getByText('Ton niveau en rando ?')).toBeVisible()
  })

  test('le poids du sac estimé baisse quand on skippe un article', async ({ page }) => {
    // Email dédié (voir test précédent) : les compteurs absolus (9 articles, poids)
    // supposent un kit vierge, un statut fuité d'un autre test les fausserait.
    await login(page, { email: 'david.agbodjanprince@gmail.com', name: 'David' })
    await page.getByRole('button', { name: 'Kit' }).click()
    await page.locator('.btn.btn-full').first().click()
    await page.getByRole('button', { name: 'Journée' }).click()
    await page.getByRole('button', { name: 'Voir la liste →' }).click()

    const poids = page.locator('.budget-weight-val')
    await expect(poids).toBeVisible()
    const avant = (await poids.textContent()) ?? ''
    await expect(page.getByText(/9 articles dans le sac/)).toBeVisible()

    // Skipper les chaussures (portées sur soi) ne doit RIEN changer au poids du sac.
    await page.locator('.gear-item').first().getByRole('button', { name: '✕ Skip' }).click()
    await expect(page.getByText(/9 articles dans le sac/)).toBeVisible()
    await expect(poids).toHaveText(avant)

    // Skipper le sac à dos (3e article, porté dans le dos) doit alléger le total.
    await page.locator('.gear-item').nth(2).getByRole('button', { name: '✕ Skip' }).click()
    await expect(page.getByText(/8 articles dans le sac/)).toBeVisible()
    await expect(poids).not.toHaveText(avant)
  })
})
