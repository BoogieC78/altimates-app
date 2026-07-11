import { expect, test } from '@playwright/test'

// Smoke tests contre un environnement déployé (staging). Non-authentifiés,
// sans effet de bord : on vérifie que le déploiement est sain avant de
// donner le go pour la production.

test("la page de login s'affiche sans erreur console", async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  await page.goto('/')
  await expect(page.getByText('Bienvenue dans la cordée')).toBeVisible()
  await expect(page.getByRole('button', { name: /Continuer avec Google/i })).toBeVisible()
  await expect(page.getByPlaceholder('ton@email.com')).toBeVisible()
  // Une origine oubliée dans la CSP casse silencieusement fonts/auth/météo :
  // toute erreur console (violation CSP incluse) fait échouer le smoke.
  expect(consoleErrors).toEqual([])
})

test('les headers de sécurité sont servis', async ({ request }) => {
  const res = await request.get('/')
  expect(res.status()).toBe(200)
  const headers = res.headers()
  expect(headers['content-security-policy']).toContain("default-src 'self'")
  expect(headers['x-frame-options']).toBe('DENY')
  expect(headers['x-content-type-options']).toBe('nosniff')
  expect(headers['strict-transport-security']).toContain('max-age=')
})

test("l'API send-signin-link valide les entrées", async ({ request }) => {
  // E-mail invalide → 400 avant tout accès Firebase (aucun e-mail envoyé).
  const bad = await request.post('/api/send-signin-link', {
    data: { email: 'pas-un-email' },
  })
  expect(bad.status()).toBe(400)

  // Méthode non autorisée → 405.
  const wrongMethod = await request.get('/api/send-signin-link')
  expect(wrongMethod.status()).toBe(405)
})
