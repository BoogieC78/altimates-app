import { test as base } from '@playwright/test'
import { resetEmulators, seedAllowedEmails } from './helpers/emulator'

// Test de base commun à tous les specs E2E :
//  - remet les émulateurs à zéro avant chaque test (isolation)
//  - saute le tour guidé (localStorage) pour aller droit à l'app
//    → le tour guidé a son propre spec dédié qui, lui, ne pose pas ce flag.
//
// PIÈGE (cause racine des « fuites entre fichiers de specs ») : le reset était un
// `test.beforeEach` déclaré ici, au niveau module. Or un hook s'enregistre dans la
// suite du fichier EN COURS DE CHARGEMENT au moment où il s'exécute — c'est-à-dire
// uniquement le PREMIER spec qui importe fixtures.ts. Les fichiers suivants du même
// worker retrouvent le module en cache : le hook n'était jamais réenregistré, et
// leurs tests tournaient SANS AUCUN reset (vérifié : 1 seul reset sur un run de
// 12 tests répartis sur 3 fichiers). Une fixture `auto` n'a pas ce défaut : elle
// fait partie du `test` étendu lui-même et s'exécute pour chaque test.

export const test = base.extend<{ skipTour: boolean; resetEtSeed: undefined }>({
  skipTour: [true, { option: true }],
  resetEtSeed: [
    async ({}, use) => {
      await resetEmulators()
      // Whitelist dynamique : sans elle, les membres non-admin seraient rejetés.
      await seedAllowedEmails()
      await use(undefined)
    },
    { auto: true },
  ],
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

export { expect } from '@playwright/test'
