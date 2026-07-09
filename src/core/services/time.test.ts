import { describe, expect, it } from 'vitest'
import { relativeTime } from './time'

const NOW = Date.parse('2026-07-09T18:00:00')

describe('relativeTime', () => {
  it("affiche à l'instant sous une minute", () => {
    expect(relativeTime(NOW - 30_000, NOW)).toBe("à l'instant")
  })
  it('affiche les minutes', () => {
    expect(relativeTime(NOW - 5 * 60_000, NOW)).toBe('il y a 5 min')
  })
  it('affiche les heures', () => {
    expect(relativeTime(NOW - 3 * 3_600_000, NOW)).toBe('il y a 3 h')
  })
  it('affiche la date au-delà de 24 h', () => {
    expect(relativeTime(Date.parse('2026-07-01T10:00:00'), NOW)).toBe('1 juil.')
  })
})
