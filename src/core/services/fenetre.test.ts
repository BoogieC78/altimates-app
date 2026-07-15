import { describe, expect, it } from 'vitest'
import { bestWeekends, isoDay, monthDays } from './fenetre'
import type { AvailabilityStatus } from '../types'

describe('isoDay', () => {
  it('pad mois et jour sur 2 chiffres (mois 0-indexé)', () => {
    expect(isoDay(2026, 7, 1)).toBe('2026-08-01')
    expect(isoDay(2026, 11, 25)).toBe('2026-12-25')
  })
})

describe('monthDays', () => {
  it('août 2026 : 31 jours, le 1er est un samedi', () => {
    const days = monthDays(2026, 7)
    expect(days).toHaveLength(31)
    expect(days[0]).toMatchObject({ iso: '2026-08-01', weekday: 5, isWeekend: true })
  })

  it('gère février bissextile', () => {
    expect(monthDays(2028, 1)).toHaveLength(29)
    expect(monthDays(2026, 1)).toHaveLength(28)
  })
})

describe('bestWeekends', () => {
  const member = (name: string, days: Record<string, AvailabilityStatus>) => ({ name, days })

  it('classe les week-ends par nombre de membres dispo les 2 jours', () => {
    // Août 2026 : week-ends 1–2, 8–9, 15–16, 22–23, 29–30.
    const oussama = member('Oussama', { '2026-08-08': 'dispo', '2026-08-09': 'dispo' })
    const wacil = member('Wacil', {
      '2026-08-08': 'dispo',
      '2026-08-09': 'retour',
      '2026-08-15': 'dispo',
      '2026-08-16': 'prolonge',
    })
    const windows = bestWeekends(2026, 7, [oussama, wacil])
    expect(windows[0]).toMatchObject({
      label: '8–9',
      available: ['Oussama', 'Wacil'],
      mustReturnSunday: ['Wacil'],
      canExtend: [],
    })
    expect(windows[1]).toMatchObject({ label: '15–16', available: ['Wacil'], canExtend: ['Wacil'] })
  })

  it("un seul jour dispo sur deux ne compte pas, indispo non plus", () => {
    const m = member('X', { '2026-08-08': 'dispo', '2026-08-09': 'indispo', '2026-08-15': 'dispo' })
    const windows = bestWeekends(2026, 7, [m])
    expect(windows.every((w) => w.available.length === 0)).toBe(true)
  })

  it('ignore un samedi de fin de mois sans dimanche dans le même mois', () => {
    // Mai 2026 : le 31 est un dimanche, le samedi 30 a bien son dimanche ; mais
    // janvier 2027 finit un dimanche 31 → samedi 30 inclus. On teste plutôt un
    // mois finissant un samedi : octobre 2026 (le 31 est un samedi).
    const windows = bestWeekends(2026, 9, [])
    expect(windows.every((w) => !w.saturday.endsWith('-31'))).toBe(true)
  })

  it('à égalité, trie par date croissante', () => {
    const m = member('X', {
      '2026-08-15': 'dispo',
      '2026-08-16': 'dispo',
      '2026-08-08': 'dispo',
      '2026-08-09': 'dispo',
    })
    const windows = bestWeekends(2026, 7, [m])
    expect(windows[0].label).toBe('8–9')
    expect(windows[1].label).toBe('15–16')
  })
})
