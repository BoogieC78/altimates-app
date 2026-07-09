const MONTHS_FR = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
]

/** Horodatage relatif façon messagerie : "à l'instant", "il y a 5 min", "il y a 2 h", "12 juil.". */
export function relativeTime(dateMs: number, nowMs: number): string {
  const diffMin = Math.floor((nowMs - dateMs) / 60000)
  if (diffMin < 1) return "à l'instant"
  if (diffMin < 60) return `il y a ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `il y a ${diffH} h`
  const d = new Date(dateMs)
  return `${d.getDate()} ${MONTHS_FR[d.getMonth()]}`
}
