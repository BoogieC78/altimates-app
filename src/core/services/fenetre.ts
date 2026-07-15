// Logique pure de l'onglet Fenêtre (calendrier de disponibilités).
// Aucune dépendance Firebase : tout est testable unitairement.
// Les dates sont manipulées en composants (année/mois/jour) et en clés ISO
// construites à la main pour être insensibles au fuseau et à la locale.

import type { AvailabilityStatus } from '../types'

export const STATUS_META: Record<AvailabilityStatus, { label: string; short: string; color: string }> = {
  dispo: { label: 'Disponible', short: 'DISPO', color: '#3E7C4F' },
  retour: { label: 'Dispo · retour dimanche soir', short: 'RETOUR DIM.', color: '#C4831A' },
  prolonge: { label: 'Dispo · peut prolonger d’un jour', short: '+1 JOUR', color: '#4A7FA8' },
  indispo: { label: 'Indisponible', short: 'INDISPO', color: '#B3452F' },
}

/** Statuts qui comptent comme « peut partir ». */
export const AVAILABLE_STATUSES: AvailabilityStatus[] = ['dispo', 'retour', 'prolonge']

export const MONTH_LABELS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

export const WEEKDAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

/** Clé ISO yyyy-mm-dd (month 0-indexé, comme Date). */
export function isoDay(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export interface CalendarDay {
  iso: string
  day: number
  /** 0 = lundi … 6 = dimanche */
  weekday: number
  isWeekend: boolean
}

/** Jours du mois (month 0-indexé). Le weekday vient d'un Date local : stable quel que soit le fuseau. */
export function monthDays(year: number, month: number): CalendarDay[] {
  const count = new Date(year, month + 1, 0).getDate()
  return Array.from({ length: count }, (_, i) => {
    const day = i + 1
    const weekday = (new Date(year, month, day).getDay() + 6) % 7
    return { iso: isoDay(year, month, day), day, weekday, isWeekend: weekday >= 5 }
  })
}

export interface MemberDays {
  name: string
  days: Record<string, AvailabilityStatus>
}

export interface WeekendWindow {
  /** ISO du samedi et du dimanche */
  saturday: string
  sunday: string
  /** libellé court, ex. "6–7" */
  label: string
  /** membres dispo les 2 jours (statut ∈ AVAILABLE_STATUSES) */
  available: string[]
  /** parmi eux, ceux qui doivent rentrer dimanche soir */
  mustReturnSunday: string[]
  /** parmi eux, ceux qui peuvent prolonger d'un jour */
  canExtend: string[]
}

/**
 * Week-ends du mois classés par nombre de membres disponibles les deux jours
 * (décroissant), puis par date. C'est la réponse à « quand partir ? ».
 */
export function bestWeekends(year: number, month: number, members: MemberDays[]): WeekendWindow[] {
  const days = monthDays(year, month)
  const windows: WeekendWindow[] = []
  for (const d of days) {
    if (d.weekday !== 5) continue
    const sunday = days.find((x) => x.day === d.day + 1)
    if (!sunday) continue
    const ok = (m: MemberDays, iso: string) => AVAILABLE_STATUSES.includes(m.days[iso])
    const available = members.filter((m) => ok(m, d.iso) && ok(m, sunday.iso))
    windows.push({
      saturday: d.iso,
      sunday: sunday.iso,
      label: `${d.day}–${sunday.day}`,
      available: available.map((m) => m.name),
      mustReturnSunday: available
        .filter((m) => m.days[d.iso] === 'retour' || m.days[sunday.iso] === 'retour')
        .map((m) => m.name),
      canExtend: available
        .filter((m) => m.days[d.iso] === 'prolonge' || m.days[sunday.iso] === 'prolonge')
        .map((m) => m.name),
    })
  }
  return windows.sort((a, b) => b.available.length - a.available.length || a.saturday.localeCompare(b.saturday))
}
