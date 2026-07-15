import { expect, test } from '@playwright/test'

// Smoke tests contre un environnement déployé (staging). Non-authentifiés,
// sans effet de bord : on vérifie que le déploiement est sain avant de
// donner le go pour la production.

const BYPASS = process.env.VERCEL_AUTOMATION_BYPASS_SECRET

// Traverse le SSO Vercel du staging via query param (et non via un header
// global : celui-ci fuirait sur les requêtes cross-origin comme les fonts
// Google, dont le preflight CORS refuse tout header custom). Le param est
// scopé à l'origine cible ; setCookie=true propage le bypass aux assets
// same-origin chargés ensuite sans repolluer les requêtes tierces.
function withBypass(path: string, setCookie = false): string {
  if (!BYPASS) return path
  const sep = path.includes('?') ? '&' : '?'
  const cookie = setCookie ? '&x-vercel-set-bypass-cookie=true' : ''
  return `${path}${sep}x-vercel-protection-bypass=${BYPASS}${cookie}`
}

test("la page de login s'affiche sans erreur console", async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  await page.goto(withBypass('/', true))
  await expect(page.getByText('Bienvenue dans la cordée')).toBeVisible()
  await expect(page.getByRole('button', { name: /Continuer avec Google/i })).toBeVisible()
  await expect(page.getByPlaceholder('ton@email.com')).toBeVisible()
  // Une origine oubliée dans la CSP casse silencieusement fonts/auth/météo :
  // toute erreur console (violation CSP incluse) fait échouer le smoke.
  expect(consoleErrors).toEqual([])
})

test('les headers de sécurité sont servis', async ({ request }) => {
  const res = await request.get(withBypass('/'))
  expect(res.status()).toBe(200)
  const headers = res.headers()
  expect(headers['content-security-policy']).toContain("default-src 'self'")
  expect(headers['x-frame-options']).toBe('DENY')
  expect(headers['x-content-type-options']).toBe('nosniff')
  expect(headers['strict-transport-security']).toContain('max-age=')
})

test("l'API send-signin-link valide les entrées", async ({ request }) => {
  // E-mail invalide → 400 avant tout accès Firebase (aucun e-mail envoyé).
  const bad = await request.post(withBypass('/api/send-signin-link'), {
    data: { email: 'pas-un-email' },
  })
  expect(bad.status()).toBe(400)

  // Méthode non autorisée → 405.
  const wrongMethod = await request.get(withBypass('/api/send-signin-link'))
  expect(wrongMethod.status()).toBe(405)
})
