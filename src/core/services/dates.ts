const MONTHS_FR = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
]

function parseISO(iso: string): { day: number; month: number } | null {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null
  return { day: Number(m[3]), month: Number(m[2]) - 1 }
}

/**
 * Libellé de date au format de l'ancienne app : '15 juin' ou '6–7 juin'.
 * C'est ce libellé qui est stocké dans le champ `date` des randos.
 */
export function formatDateLabel(dateStart?: string | null, dateEnd?: string | null): string {
  const start = dateStart ? parseISO(dateStart) : null
  if (!start) return 'À venir'
  const end = dateEnd ? parseISO(dateEnd) : null
  if (end && (end.day !== start.day || end.month !== start.month)) {
    if (end.month === start.month) return `${start.day}–${end.day} ${MONTHS_FR[start.month]}`
    return `${start.day} ${MONTHS_FR[start.month]} – ${end.day} ${MONTHS_FR[end.month]}`
  }
  return `${start.day} ${MONTHS_FR[start.month]}`
}

/** Nombre de jours ('1j', '3j') entre deux dates ISO incluses. */
export function durationLabel(dateStart?: string | null, dateEnd?: string | null): string {
  if (!dateStart || !dateEnd) return '1j'
  const days = Math.round((Date.parse(dateEnd) - Date.parse(dateStart)) / 86400000) + 1
  return `${Math.max(1, days)}j`
}

/**
 * Date du jour en heure LOCALE au format yyyy-mm-dd.
 * Ne pas utiliser toISOString() qui est en UTC : entre minuit et 2h (heure d'été
 * française), la date UTC est encore celle de la veille.
 */
export function todayLocalISO(now: Date = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Badge compte à rebours de l'ancienne app : 'J-3', "AUJOURD'HUI", null si passé ou sans date. */
export function jMinus(dateStart: string | null | undefined, today: string): string | null {
  if (!dateStart) return null
  const diff = Math.round((Date.parse(dateStart.slice(0, 10)) - Date.parse(today)) / 86400000)
  if (diff < 0) return null
  if (diff === 0) return "AUJOURD'HUI"
  return `J-${diff}`
}

/**
 * Une rando est "passée" si sa date de fin (ou de début) est avant aujourd'hui.
 * Sans date connue, elle est considérée à venir.
 */
export function isPast(rando: { dateStart?: string | null; dateEnd?: string | null }, today: string): boolean {
  const ref = rando.dateEnd || rando.dateStart
  if (!ref) return false
  return ref.slice(0, 10) < today
}
