import { describe, expect, it } from 'vitest'
import { ADMIN_EMAILS, DEFAULT_ALLOWED_EMAILS, isAdminEmail } from './auth'

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
