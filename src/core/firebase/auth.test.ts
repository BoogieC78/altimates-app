import { FirebaseError } from 'firebase/app'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ADMIN_EMAILS, DEFAULT_ALLOWED_EMAILS, isAdminEmail, isMemberEmail } from './auth'

// Effets de bord uniquement : on stubbe l'app Firebase (pas d'init réseau en test)
// et les I/O Firestore. Tout le reste de ./auth s'exécute en vrai.
// vi.hoisted : les factories vi.mock sont remontées en tête de fichier et ne
// peuvent pas référencer des variables top-level ordinaires.
const { getIdToken, authStateReady, getDoc, getDocs } = vi.hoisted(() => ({
  getIdToken: vi.fn<(force?: boolean) => Promise<string>>(),
  authStateReady: vi.fn<() => Promise<void>>(),
  getDoc: vi.fn<() => Promise<{ data: () => unknown }>>(),
  // Requête collectionGroup "mes cordées" (appartenance par parrainage) :
  // par défaut, aucune appartenance.
  getDocs: vi.fn<() => Promise<{ empty: boolean; docs: unknown[] }>>(),
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
  getDocs: () => getDocs(),
  // Le graphe d'import de ./auth passe désormais par ./cordees et ./collections
  // (cordées multiples) : tout import nommé doit exister, même inutilisé ici.
  collection: vi.fn(() => ({})),
  collectionGroup: vi.fn(() => ({})),
  query: vi.fn(() => ({})),
  where: vi.fn(() => ({})),
  limit: vi.fn(() => ({})),
  setDoc: vi.fn(() => Promise.resolve()),
  deleteDoc: vi.fn(() => Promise.resolve()),
  serverTimestamp: vi.fn(() => ({})),
  writeBatch: vi.fn(() => ({ set: vi.fn(), update: vi.fn(), delete: vi.fn(), commit: vi.fn() })),
  arrayUnion: vi.fn(() => ({})),
  arrayRemove: vi.fn(() => ({})),
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
    getDocs.mockResolvedValue({ empty: true, docs: [] })
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
    // Jeton pas encore propagé : la whitelist ET la requête cordées sont refusées.
    getDoc
      .mockRejectedValueOnce(new FirebaseError('permission-denied', 'jeton pas encore propagé'))
      .mockResolvedValueOnce(snapWith([MEMBER]))
    getDocs.mockRejectedValueOnce(new FirebaseError('permission-denied', 'jeton pas encore propagé'))
    await expect(isMemberEmail(MEMBER)).resolves.toBe(true)
    expect(getDoc).toHaveBeenCalledTimes(2)
    expect(getIdToken).toHaveBeenCalledWith(true) // rafraîchissement forcé
  })

  it('refuse après un permission-denied persistant (deux lectures max)', async () => {
    getDoc.mockRejectedValue(new FirebaseError('permission-denied', 'non membre'))
    getDocs.mockRejectedValue(new FirebaseError('permission-denied', 'non membre'))
    await expect(isMemberEmail('intrus@gmail.com')).resolves.toBe(false)
    expect(getDoc).toHaveBeenCalledTimes(2)
  })

  it("accepte un membre entré par parrainage (hors whitelist, membre d'une cordée)", async () => {
    // Non-membre de la whitelist : sa lecture est refusée (permission-denied
    // attendu), mais la requête collectionGroup sur SES appartenances aboutit.
    getDoc.mockRejectedValue(new FirebaseError('permission-denied', 'non whitelisté'))
    getDocs.mockResolvedValue({ empty: false, docs: [{}] })
    await expect(isMemberEmail('parraine@gmail.com')).resolves.toBe(true)
  })

  it("refuse un email hors whitelist ET sans cordée (requête cordées vide)", async () => {
    getDoc.mockResolvedValue(snapWith([MEMBER]))
    await expect(isMemberEmail('intrus@gmail.com')).resolves.toBe(false)
    expect(getDocs).toHaveBeenCalledTimes(1)
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
