import { test, expect } from '../fixtures'
import type { Page } from '@playwright/test'
import { login } from '../helpers/auth'
import { seedDoc } from '../helpers/emulator'

// Checklist départ de l'onglet Cordée : état "prêt" (chip) et prise en charge (assignee)
// sont deux notions distinctes mais liées — "Me retirer" remet aussi l'article à préparer
// (retour utilisateur : un retrait doit décocher, carte Trello 6a5a58d0).
//
// Toutes les assertions sont scopées à la ligne .gear-item de l'article du test : une
// écriture client d'un test précédent peut atterrir APRÈS le reset des émulateurs
// (addDepartItem n'est pas awaité par l'UI) et faire apparaître un item parasite —
// flake vécu en suite complète, jamais en fichier isolé.
const itemRow = (page: Page, name: string) => page.locator('.gear-item', { hasText: name })

test.describe('Cordée — checklist départ', () => {
  test('liste les membres et ajoute un article à la checklist', async ({ page }) => {
    await login(page, { name: 'Wacil' })
    await page.getByRole('button', { name: 'Cordée' }).click()

    await expect(page.getByText('Membres', { exact: true })).toBeVisible()
    await expect(page.getByText('AUCUN ARTICLE')).toBeVisible()

    // Soumission au clavier (bouton parfois recouvert par la nav fixe en mobile).
    await page.getByPlaceholder('Ajouter un article…').fill('Mousqueton')
    await page.getByPlaceholder('Ajouter un article…').press('Enter')

    const row = itemRow(page, 'Mousqueton')
    await expect(row).toBeVisible()
    await expect(row.getByRole('button', { name: 'À préparer' })).toBeVisible()
    await expect(row.getByText('Personne dessus')).toBeVisible()
  })

  test('prendre en charge puis marquer prêt combine les deux états', async ({ page }) => {
    await seedDoc('departItems', { id: 1, name: 'Tente', assignee: null, done: false })
    await login(page, { name: 'Wacil' })
    await page.getByRole('button', { name: 'Cordée' }).click()

    const row = itemRow(page, 'Tente')
    await row.getByRole('button', { name: 'Prendre en charge' }).click()
    await expect(row.getByText("Wacil s'en occupe · pas encore prêt")).toBeVisible()

    await row.getByRole('button', { name: 'À préparer' }).click()
    await expect(row.getByRole('button', { name: '✓ Prêt' })).toBeVisible()
    await expect(row.getByText("Wacil s'en occupe · prêt")).toBeVisible()
  })

  test('« Me retirer » désassigne ET remet l\'article à préparer', async ({ page }) => {
    await seedDoc('departItems', { id: 1, name: 'Réchaud', assignee: 'Wacil', done: true })
    await login(page, { name: 'Wacil' })
    await page.getByRole('button', { name: 'Cordée' }).click()

    const row = itemRow(page, 'Réchaud')
    await expect(row.getByText("Wacil s'en occupe · prêt")).toBeVisible()
    await row.getByRole('button', { name: 'Me retirer' }).click()

    await expect(row.getByRole('button', { name: 'À préparer' })).toBeVisible()
    await expect(row.getByText('Personne dessus')).toBeVisible()
    await expect(row.getByRole('button', { name: 'Prendre en charge' })).toBeVisible()
  })
})
