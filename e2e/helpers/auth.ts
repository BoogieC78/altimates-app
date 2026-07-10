import { expect, type Page } from '@playwright/test'

// Emails de la whitelist (voir src/core/firebase/auth.ts).
export const MEMBER_EMAIL = 'wacil78@gmail.com' // membre ET admin
export const ADMIN_EMAIL = 'hammadou.nordine@gmail.com'
// Membre whitelisté mais NON admin (pour tester le gating de l'onglet Admin).
export const NON_ADMIN_EMAIL = 'ousa.chac@gmail.com'
export const UNAUTHORIZED_EMAIL = 'intrus@gmail.com'

export interface SignInOptions {
  email?: string
  /** Prénom affiché → devient le memberName (clé des votes) quand users/{uid} n'existe pas. */
  name?: string
}

/**
 * Déclenche le vrai flux `signInWithPopup` de l'app, servi par l'émulateur Auth :
 * celui-ci affiche une page où l'on crée un compte Google factice à la volée.
 * Aucun OAuth Google réel n'est déclenché. Ne fait AUCUNE assertion sur l'état
 * de l'app après connexion (tour guidé, rejet whitelist, etc.).
 */
export async function signInWithEmulator(page: Page, opts: SignInOptions = {}): Promise<void> {
  const email = opts.email ?? MEMBER_EMAIL
  const name = opts.name ?? 'Wacil'

  await page.goto('/')
  await expect(page.getByRole('button', { name: /Continuer avec Google/i })).toBeVisible()

  const popupPromise = page.waitForEvent('popup')
  await page.getByRole('button', { name: /Continuer avec Google/i }).click()
  const popup = await popupPromise
  await popup.waitForLoadState('domcontentloaded')

  // Widget de l'émulateur : bouton "Add new account" puis formulaire.
  await popup.locator('.js-new-account, button:has-text("Add new account")').first().click()
  await popup.locator('#email-input').fill(email)
  await popup.locator('#display-name-input').fill(name)
  await popup.locator('#sign-in, button:has-text("Sign in with Google.com")').first().click()
}

export interface LoginOptions extends SignInOptions {
  /** true si l'email est hors whitelist : on vérifie le rejet et le retour à l'écran de login. */
  expectRejected?: boolean
}

/** Connexion complète : sign-in + attente de l'app (onglet Sommets). */
export async function login(page: Page, opts: LoginOptions = {}): Promise<void> {
  await signInWithEmulator(page, opts)

  if (opts.expectRejected) {
    await expect(page.getByText(/Accès réservé à la cordée/i)).toBeVisible()
    return
  }

  await expect(page.getByRole('button', { name: /Proposer une rando/i })).toBeVisible()
}
