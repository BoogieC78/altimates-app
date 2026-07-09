import { describe, expect, it } from 'vitest'
import { durationLabel, formatDateLabel, isPast } from './dates'

describe('formatDateLabel', () => {
  it('formate une date simple', () => {
    expect(formatDateLabel('2026-06-15')).toBe('15 juin')
  })
  it('formate un trek dans le même mois', () => {
    expect(formatDateLabel('2026-06-06', '2026-06-07')).toBe('6–7 juin')
  })
  it('formate un trek à cheval sur deux mois', () => {
    expect(formatDateLabel('2026-06-30', '2026-07-02')).toBe('30 juin – 2 juil.')
  })
  it('retourne À venir sans date', () => {
    expect(formatDateLabel(null)).toBe('À venir')
  })
})

describe('durationLabel', () => {
  it('compte les jours inclus', () => {
    expect(durationLabel('2026-06-06', '2026-06-07')).toBe('2j')
    expect(durationLabel('2026-06-06', '2026-06-06')).toBe('1j')
    expect(durationLabel('2026-06-06', null)).toBe('1j')
  })
})

describe('isPast', () => {
  const today = '2026-07-09'
  it('détecte une rando passée', () => {
    expect(isPast({ dateStart: '2026-06-15' }, today)).toBe(true)
  })
  it('utilise la date de fin pour un trek', () => {
    expect(isPast({ dateStart: '2026-07-08', dateEnd: '2026-07-10' }, today)).toBe(false)
  })
  it('considère à venir une rando sans date', () => {
    expect(isPast({}, today)).toBe(false)
  })
  it('considère à venir une rando aujourd’hui', () => {
    expect(isPast({ dateStart: '2026-07-09' }, today)).toBe(false)
  })
})
