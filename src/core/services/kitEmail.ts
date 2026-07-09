import { GEAR, type KitMode } from '../constants/gear'

// Construction du texte du kit pour l'envoi par email.
// Logique portée verbatim de buildEmailPreview/sendEmail de l'ancienne app (index.html).

const SECTIONS: [keyof (typeof GEAR)['trek'], string][] = [
  ['indispensable', 'INDISPENSABLES'],
  ['recommande', 'RECOMMANDÉS'],
  ['facultatif', 'FACULTATIFS'],
]

/** Libellés de sections, en gras dans la préviz (comme l'ancienne app). */
export const EMAIL_SECTION_LABELS = SECTIONS.map(([, l]) => l)

/** Construit les lignes du texte du kit (préviz et corps du mail). */
export function buildKitEmailLines(
  mode: KitMode,
  checked: Record<string, boolean>,
  name: string,
  date: Date = new Date(),
): string[] {
  const gear = GEAR[mode]
  const lines: string[] = [
    `ALTIMATES · Kit ${mode === 'trek' ? 'Trek' : 'Journée'} · ${name}`,
    date.toLocaleDateString('fr'),
    '',
  ]
  SECTIONS.forEach(([k, l]) => {
    lines.push(l)
    gear[k].forEach((g) => {
      const ch = checked[g.id] ? '[x]' : '[ ]'
      lines.push(`${ch} ${g.name} · ${g.price}${g.note ? ' · ' + g.note : ''}`)
      g.links.forEach((lk) => lines.push(`    → ${lk.l}: ${lk.u}`))
    })
    lines.push('')
  })
  lines.push('---\nALTImates · Plan, gear up, summit together.')
  return lines
}

/** Sujet du mail (identique à l'ancienne app). */
export function kitEmailSubject(mode: KitMode): string {
  return `Mon kit ALTImates · ${mode === 'trek' ? 'Trek' : 'Journée'}`
}

/** URL mailto: complète, prête pour window.location.href. */
export function kitMailtoUrl(
  addr: string,
  mode: KitMode,
  checked: Record<string, boolean>,
  name: string,
): string {
  const body = buildKitEmailLines(mode, checked, name).join('\n')
  return `mailto:${addr.trim()}?subject=${encodeURIComponent(kitEmailSubject(mode))}&body=${encodeURIComponent(body)}`
}
