import { defineConfig, devices } from '@playwright/test'

// Smoke tests post-déploiement : tournent contre un environnement DÉPLOYÉ
// (staging par défaut), pas contre les émulateurs. Aucune donnée n'est créée :
// uniquement des vérifications non-authentifiées (page de login, headers de
// sécurité, validation de l'API). Voir e2e/smoke/.
//
// SMOKE_BASE_URL                  URL cible (défaut : staging)
// VERCEL_AUTOMATION_BYPASS_SECRET traverse le SSO Vercel qui protège le staging

const BASE_URL = process.env.SMOKE_BASE_URL ?? 'https://altimates-app-staging.vercel.app'

export default defineConfig({
  testDir: './e2e/smoke',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never', outputFolder: 'playwright-report-smoke' }]]
    : [['list'], ['html', { open: 'never', outputFolder: 'playwright-report-smoke' }]],
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Pas de header de bypass global : posé sur le contexte, il s'appliquerait
    // aussi aux requêtes cross-origin (fonts Google), dont le preflight CORS
    // rejette tout header custom → erreurs console qui cassent le smoke. On
    // passe le bypass via query param (scopé à l'origine), voir e2e/smoke/.
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
