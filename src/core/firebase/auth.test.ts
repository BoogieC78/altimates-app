import { describe, expect, it } from 'vitest'
import { ALLOWED_EMAILS, isAllowed } from './auth'

describe('isAllowed', () => {
  it('accepte chaque email de la whitelist', () => {
    for (const email of ALLOWED_EMAILS) {
      expect(isAllowed(email)).toBe(true)
    }
  })

  it('refuse un email hors whitelist', () => {
    expect(isAllowed('intrus@gmail.com')).toBe(false)
  })

  it('refuse null et undefined', () => {
    expect(isAllowed(null)).toBe(false)
    expect(isAllowed(undefined)).toBe(false)
  })
})
