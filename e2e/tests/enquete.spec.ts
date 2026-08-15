import { test, expect } from '../fixtures'
import { login, MEMBER_EMAIL } from '../helpers/auth'
import { readCollection, seedRando } from '../helpers/emulator'

// Enquête post-rando (onglet Enquête du détail d'une sortie). Ces parcours
// passent par les vraies règles Firestore de l'émulateur : un test vert ici
// prouve que la collection randoSurveys accepte l'écriture d'une réponse et
// que l'id imposé `${randoId}_${uid}` fait bien d'une resoumission un
// remplacement (jamais deux réponses pour un même membre).

/** yyyy-mm-dd local à J+delta — arithmétique calendaire, insensible à l'heure d'été. */
function localISO(deltaDays: number): string {
  const d = new Date()
  d.setDate(d.getDate() + deltaDays)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const j = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${j}`
}

async function openRando(page: import('@playwright/test').Page, name: string) {
  const card = page.locator('.rcard', { hasText: name }).first()
  await expect(card).toBeVisible()
  await card.locator('.rname').click()
  await expect(page.locator('.modal-title', { hasText: name })).toBeVisible()
}

test.describe('Enquête post-rando', () => {
  test("l'onglet Enquête n'apparaît pas sur une sortie à venir", async ({ page }) => {
    await seedRando({ id: 100_030, name: 'Mont Thabor', dateStart: localISO(7), memberVotes: { Wacil: 'oui' } })
    await login(page, { email: MEMBER_EMAIL, name: 'Wacil' })
    await openRando(page, 'Mont Thabor')

    // Les autres onglets sont là, mais pas l'enquête : la date n'est pas passée.
    await expect(page.getByRole('button', { name: /Photos/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Enquête/ })).toHaveCount(0)
  })

  test('répondre puis modifier : une seule réponse par membre, acceptée par les règles', async ({ page }) => {
    await seedRando({ id: 100_031, name: 'Crêt de la Neige', dateStart: localISO(-1), memberVotes: { Wacil: 'oui' } })
    await login(page, { email: MEMBER_EMAIL, name: 'Wacil' })
    await openRando(page, 'Crêt de la Neige')

    await page.getByRole('button', { name: /Enquête/ }).click()

    // Réponse complète : 4 questions + commentaire, moins d'une minute.
    await page.getByRole('button', { name: 'Note globale : 5 sur 5' }).click()
    await page.getByRole('button', { name: 'Plus dur que prévu' }).click()
    await page.getByRole('button', { name: 'Grand soleil' }).click()
    await page.getByRole('button', { name: 'Organisation : 4 sur 5' }).click()
    await page.getByLabel('Commentaire libre').fill('Superbe crête')
    await page.getByRole('button', { name: 'Envoyer ma réponse' }).click()

    // Écriture Firestore ACCEPTÉE : la réponse revient par onSnapshot dans la
    // restitution, et aucune erreur (role="alert") n'est affichée.
    await expect(page.getByText('Retours de la cordée · 1 réponse')).toBeVisible()
    // Le commentaire apparaît deux fois : dans « Ta réponse » ET dans la
    // restitution nominative — .first() évite la violation du mode strict.
    await expect(page.getByText('Superbe crête').first()).toBeVisible()
    await expect(page.getByRole('alert')).toHaveCount(0)

    // Modification tant que l'enquête est ouverte : la nouvelle réponse ÉCRASE
    // l'ancienne (id imposé par les règles), elle ne s'y ajoute pas.
    await page.getByRole('button', { name: 'Modifier ma réponse' }).click()
    await page.getByRole('button', { name: 'Note globale : 3 sur 5' }).click()
    await page.getByRole('button', { name: 'Mettre à jour ma réponse' }).click()
    await expect(page.getByText('Retours de la cordée · 1 réponse')).toBeVisible()

    const reponses = (await readCollection('randoSurveys')).filter((r) => r.randoId === '100031')
    expect(reponses).toHaveLength(1)
    expect(reponses[0].rating).toBe(3)
  })

  test("sortie passée sans réponse : l'onglet est là, sans restitution vide", async ({ page }) => {
    // 360px : la barre d'onglets passe à 7 entrées sur une sortie passée,
    // c'est ici qu'un débordement horizontal apparaîtrait.
    await page.setViewportSize({ width: 360, height: 780 })
    await seedRando({ id: 100_032, name: 'Roc des Boeufs', dateStart: localISO(-2), memberVotes: { Wacil: 'oui' } })
    await login(page, { email: MEMBER_EMAIL, name: 'Wacil' })
    await openRando(page, 'Roc des Boeufs')

    await page.getByRole('button', { name: /Enquête/ }).click()
    await expect(page.getByRole('button', { name: 'Envoyer ma réponse' })).toBeVisible()
    await expect(page.getByText(/Retours de la cordée/)).toHaveCount(0)

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow, "débordement horizontal sur l'onglet Enquête").toBeLessThanOrEqual(0)
  })
})
