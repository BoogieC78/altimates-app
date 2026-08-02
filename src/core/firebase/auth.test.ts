import { FirebaseError } from 'firebase/app'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ADMIN_EMAILS, DEFAULT_ALLOWED_EMAILS, isAdminEmail, isMemberEmail } from './auth'

// Effets de bord uniquement : on stubbe l'app Firebase (pas d'init réseau en test)
// et les I/O Firestore. Tout le reste de ./auth s'exécute en vrai.
// vi.hoisted : les factories vi.mock sont remontées en tête de fichier et ne
// peuvent pas référencer des variables top-level ordinaires.
const { getIdToken, authStateReady, getDoc } = vi.hoisted(() => ({
  getIdToken: vi.fn<(force?: boolean) => Promise<string>>(),
  authStateReady: vi.fn<() => Promise<void>>(),
  getDoc: vi.fn<() => Promise<{ data: () => unknown }>>(),
}))

vi.mock('./app', () => ({
  auth: {
    get currentUser() {
      return { getIdToken }
    },
    authStateReady,
    languageCode: 'fr',
  },
  db: {},
}))

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({})),
  getDoc: () => getDoc(),
}))

describe('isAdminEmail', () => {
  it('accepte chaque admin', () => {
    for (const email of ADMIN_EMAILS) {
      expect(isAdminEmail(email)).toBe(true)
    }
  })

  it('refuse un non-admin, null et undefined', () => {
    expect(isAdminEmail('mrbouchemoua.ismail@gmail.com')).toBe(false)
    expect(isAdminEmail('intrus@gmail.com')).toBe(false)
    expect(isAdminEmail(null)).toBe(false)
    expect(isAdminEmail(undefined)).toBe(false)
  })
})

describe('DEFAULT_ALLOWED_EMAILS (liste d\'amorçage)', () => {
  it('contient les admins (jamais de lockout au seed)', () => {
    for (const admin of ADMIN_EMAILS) {
      expect(DEFAULT_ALLOWED_EMAILS).toContain(admin)
    }
  })
})

describe('isMemberEmail', () => {
  const MEMBER = 'mrbouchemoua.ismail@gmail.com'
  const snapWith = (emails: string[]) => ({ data: () => ({ emails }) })

  beforeEach(() => {
    // clearMocks efface compteurs ET implémentations ponctuelles → défauts ici.
    authStateReady.mockResolvedValue(undefined)
    getIdToken.mockResolvedValue('jeton')
    getDoc.mockResolvedValue(snapWith([MEMBER]))
  })

  it('refuse null/undefined/vide sans lecture Firestore', async () => {
    await expect(isMemberEmail(null)).resolves.toBe(false)
    await expect(isMemberEmail(undefined)).resolves.toBe(false)
    await expect(isMemberEmail('')).resolves.toBe(false)
    expect(getDoc).not.toHaveBeenCalled()
  })

  it('accepte un admin sans lecture Firestore', async () => {
    await expect(isMemberEmail(ADMIN_EMAILS[0])).resolves.toBe(true)
    expect(getDoc).not.toHaveBeenCalled()
  })

  it('attend l\'état d\'auth et le jeton avant de lire la whitelist', async () => {
    await expect(isMemberEmail(MEMBER)).resolves.toBe(true)
    expect(authStateReady).toHaveBeenCalled()
    expect(getIdToken).toHaveBeenCalled()
    expect(getDoc).toHaveBeenCalledTimes(1)
    // L'ordre compte : le jeton doit être émis AVANT la lecture Firestore.
    expect(getIdToken.mock.invocationCallOrder[0]).toBeLessThan(
      getDoc.mock.invocationCallOrder[0],
    )
  })

  it('refuse un email absent de la whitelist (une seule lecture)', async () => {
    await expect(isMemberEmail('intrus@gmail.com')).resolves.toBe(false)
    expect(getDoc).toHaveBeenCalledTimes(1)
  })

  it('réessaie une fois avec jeton forcé sur permission-denied transitoire', async () => {
    getDoc
      .mockRejectedValueOnce(new FirebaseError('permission-denied', 'jeton pas encore propagé'))
      .mockResolvedValueOnce(snapWith([MEMBER]))
    await expect(isMemberEmail(MEMBER)).resolves.toBe(true)
    expect(getDoc).toHaveBeenCalledTimes(2)
    expect(getIdToken).toHaveBeenCalledWith(true) // rafraîchissement forcé
  })

  it('refuse après un permission-denied persistant (deux lectures max)', async () => {
    getDoc.mockRejectedValue(new FirebaseError('permission-denied', 'non membre'))
    await expect(isMemberEmail('intrus@gmail.com')).resolves.toBe(false)
    expect(getDoc).toHaveBeenCalledTimes(2)
  })

  it('refuse sans réessayer sur une erreur non permission-denied', async () => {
    getDoc.mockRejectedValue(new Error('réseau coupé'))
    await expect(isMemberEmail(MEMBER)).resolves.toBe(false)
    expect(getDoc).toHaveBeenCalledTimes(1)
  })

  it('tranche via la lecture même si l\'attente du jeton échoue', async () => {
    getIdToken.mockRejectedValue(new Error('token indisponible'))
    await expect(isMemberEmail(MEMBER)).resolves.toBe(true)
    expect(getDoc).toHaveBeenCalledTimes(1)
  })
})
