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

/**
 * Budget des articles manquants, à partir des fourchettes de prix "80–180€".
 * Mêmes règles que l'ancienne app : min = premier nombre, max = second (ou unique).
 */
export function budgetRange(missing: GearItem[]): { min: number; max: number } {
  const min = missing.reduce((acc, g) => {
    const p = g.price.split('–')[0].replace(/[^0-9]/g, '')
    return acc + (parseInt(p) || 0)
  }, 0)
  const max = missing.reduce((acc, g) => {
    const p = g.price.split('–')[1] || g.price
    return acc + (parseInt(p.replace(/[^0-9]/g, '')) || 0)
  }, 0)
  return { min, max }
}

export interface KitStats {
  done: number
  total: number
  missing: (GearItem & { cat: string })[]
  pct: number
}

export function kitStats(mode: KitMode, kitStatus: Record<string, KitStatus>): KitStats {
  const all = allItems(mode)
  const done = all.filter((g) => isOwned(kitStatus[g.id])).length
  const missing = all.filter((g) => !isOwned(kitStatus[g.id]) && kitStatus[g.id] !== 'skip')
  return { done, total: all.length, missing, pct: Math.round((done / all.length) * 100) }
}
