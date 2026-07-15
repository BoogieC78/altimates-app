import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { login } from '../helpers/auth'
import { DEFAULT_MEMBERS, seedAllowedEmails } from '../helpers/emulator'

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

/** Libellés du premier samedi + dimanche du mois courant (mois affiché à l'ouverture). */
function firstWeekend() {
  const now = new Date()
  let d = 1
  while (new Date(now.getFullYear(), now.getMonth(), d).getDay() !== 6) d++
  const month = MONTHS[now.getMonth()]
  return { saturday: `${d} ${month}`, sunday: `${d + 1} ${month}` }
}

/**
 * Connexion avec un e-mail UNIQUE PAR TEST. L'uid émulateur est déterministe
 * par e-mail : sans ça, tous les tests partageraient le même doc
 * availability/<uid> et la session Firestore d'un test précédent pourrait
 * rejouer ses écritures après le reset et polluer le suivant. Un e-mail
 * distinct isole chaque test sur son propre doc.
 */
async function openFenetre(page: Page, slug: string) {
  const email = `wacil78+${slug}@gmail.com`
  await seedAllowedEmails([...DEFAULT_MEMBERS, email])
  await login(page, { name: 'Wacil', email })
  await page.getByRole('button', { name: 'Fenêtre' }).click()
  await expect(page.getByText('Mon statut')).toBeVisible()
}

/** Peint un jour et attend que la couleur soit posée (écriture optimiste rendue). */
async function paintDay(page: Page, dayLabel: string) {
  const day = page.getByRole('button', { name: dayLabel, exact: true })
  await day.click()
  await expect(day).toHaveAttribute('style', /background/)
}

test.describe('Fenêtre — disponibilités', () => {
  test("marquer un week-end dispo l'affiche dans les meilleures fenêtres", async ({ page }) => {
    await openFenetre(page, 'best')
    const { saturday, sunday } = firstWeekend()

    // Statut par défaut = DISPO.
    await paintDay(page, saturday)
    await paintDay(page, sunday)

    // Pas d'assertion sur le prénom : l'émulateur Auth ne propage pas displayName
    // (memberName retombe sur "Anonyme") — piège connu du skill e2e.
    await expect(page.locator('.fen-window').first()).toContainText('Week-end du')
    await expect(page.locator('.fen-window').first()).toContainText('1/1')
  })

  test('repeindre un jour avec le même statut l’efface (toggle)', async ({ page }) => {
    await openFenetre(page, 'toggle')
    const day = page.getByRole('button', { name: firstWeekend().saturday, exact: true })

    await paintDay(page, firstWeekend().saturday)
    await day.click()
    await expect(day).not.toHaveAttribute('style', /background/)
  })

  test('le statut « retour dimanche soir » est signalé dans la fenêtre', async ({ page }) => {
    await openFenetre(page, 'retour')
    const { saturday, sunday } = firstWeekend()

    await page.getByRole('button', { name: 'DISPO', exact: true }).click()
    await paintDay(page, saturday)
    await page.getByRole('button', { name: 'RETOUR DIM.' }).click()
    await paintDay(page, sunday)

    await expect(page.locator('.fen-window').first()).toContainText('Retour dimanche soir :')
  })
})
