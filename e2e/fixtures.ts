import { test as base } from '@playwright/test'
import { resetEmulators, seedAllowedEmails } from './helpers/emulator'

// Test de base commun à tous les specs E2E :
//  - remet les émulateurs à zéro avant chaque test (isolation)
//  - saute le tour guidé (localStorage) pour aller droit à l'app
//    → le tour guidé a son propre spec dédié qui, lui, ne pose pas ce flag.

export const test = base.extend<{ skipTour: boolean }>({
  skipTour: [true, { option: true }],
  page: async ({ page, skipTour }, use) => {
    if (skipTour) {
      await page.addInitScript(() => {
        try {
          localStorage.setItem('altimates-tuto-done', '1')
        } catch {
          /* localStorage indispo : le tour s'affichera, tant pis */
        }
      })
    }
    await use(page)
  },
})

test.beforeEach(async () => {
  await resetEmulators()
  // Whitelist dynamique : sans elle, les membres non-admin seraient rejetés.
  await seedAllowedEmails()
})

export { expect } from '@playwright/test'
