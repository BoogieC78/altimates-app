import { defineConfig, devices } from '@playwright/test'

// Tests E2E Altimates. Tournent contre les émulateurs Firebase (auth + firestore) —
// jamais la prod. Voir e2e/helpers/emulator.ts et le script `npm run test:e2e`.
//
// L'état Firestore/Auth est PARTAGÉ entre les tests et remis à zéro avant chacun
// (voir e2e/fixtures.ts). On force donc l'exécution en série (workers: 1) pour
// éviter que deux tests se marchent dessus.

const PORT = 4173
const BASE_URL = `http://127.0.0.1:${PORT}`

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run preview:e2e',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
