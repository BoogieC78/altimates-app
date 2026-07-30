import { GEAR, type GearItem, type KitMode, type KitStatus } from '../constants/gear'

export function findGearItem(id: string): GearItem | undefined {
  for (const mode of ['trek', 'journee'] as const) {
    for (const cat of ['indispensable', 'recommande', 'facultatif'] as const) {
      const hit = GEAR[mode][cat].find((g) => g.id === id)
      if (hit) return hit
    }
  }
}

export function allItems(mode: KitMode): (GearItem & { cat: string })[] {
  const gear = GEAR[mode]
  return [
    ...gear.indispensable.map((g) => ({ ...g, cat: 'indispensable' })),
    ...gear.recommande.map((g) => ({ ...g, cat: 'recommande' })),
    ...gear.facultatif.map((g) => ({ ...g, cat: 'facultatif' })),
  ]
}

/** Un article compte comme possédé uniquement au statut 'have' (miroir de checked). */
export function isOwned(status: KitStatus | undefined): boolean {
  return status === 'have'
}

export interface Range {
  min: number
  max: number
}

/**
 * Parse une fourchette du type "80–180€" ou "400–800 g" (tiret demi-cadratin).
 * Mêmes règles que l'ancienne app : min = premier nombre, max = second (ou unique).
 */
export function parseRange(range: string): Range {
  const parts = range.split('–')
  const num = (s: string) => parseInt(s.replace(/[^0-9]/g, '')) || 0
  return { min: num(parts[0]), max: num(parts[1] ?? range) }
}

function sumRanges(items: GearItem[], field: (g: GearItem) => string): Range {
  return items.reduce<Range>(
    (acc, g) => {
      const r = parseRange(field(g))
      return { min: acc.min + r.min, max: acc.max + r.max }
    },
    { min: 0, max: 0 },
  )
}

/** Budget des articles manquants, à partir des fourchettes de prix "80–180€". */
export function budgetRange(missing: GearItem[]): Range {
  return sumRanges(missing, (g) => g.price)
}

/** Poids en grammes des articles emportés, à partir des fourchettes "400–800 g". */
export function weightRange(carried: GearItem[]): Range {
  return sumRanges(carried, (g) => g.weight)
}

/**
 * Affichage d'un poids en grammes : "850 g" en dessous du kilo, "9,4 kg" au-dessus.
 * Formatage manuel (pas de toLocaleString) pour rester identique quelle que soit
 * la locale de la machine ou du navigateur.
 */
export function formatWeight(grams: number): string {
  if (grams <= 0) return '—'
  if (grams < 1000) return `${grams} g`
  return `${(grams / 1000).toFixed(1).replace('.', ',')} kg`
}

export interface KitStats {
  done: number
  total: number
  missing: (GearItem & { cat: string })[]
  /** Tout ce qui finit dans le sac : possédé + à acheter + à réfléchir, hors "skip". */
  carried: (GearItem & { cat: string })[]
  pct: number
}

export function kitStats(mode: KitMode, kitStatus: Record<string, KitStatus>): KitStats {
  const all = allItems(mode)
  const done = all.filter((g) => isOwned(kitStatus[g.id])).length
  const missing = all.filter((g) => !isOwned(kitStatus[g.id]) && kitStatus[g.id] !== 'skip')
  const carried = all.filter((g) => kitStatus[g.id] !== 'skip')
  return { done, total: all.length, missing, carried, pct: Math.round((done / all.length) * 100) }
}
