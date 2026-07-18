// Calculs ravito et hydratation, portés de l'ancienne app (calcBesoins,
// calcStockTotal, calcHydraBesoins). Logique pure, sans Firebase ni React.

import type {
  HydraEntry,
  MealId,
  RavitoEntry,
  RavitoStock,
  WaterSourceId,
} from '../types'

export const MEAL_CATS: { id: MealId; label: string }[] = [
  { id: 'petitdej', label: 'Petit déj' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'snack', label: 'Snack' },
  { id: 'diner', label: 'Dîner' },
]

// Repas selon heure de départ
const DEPART_MEALS: Record<string, RavitoStock> = {
  matin: { petitdej: 1, lunch: 1, snack: 1, diner: 1 },
  midi: { petitdej: 0, lunch: 1, snack: 1, diner: 1 },
  apresmidi: { petitdej: 0, lunch: 0, snack: 1, diner: 1 },
}
// Repas selon heure de retour
const RETOUR_MEALS: Record<string, RavitoStock> = {
  midi: { petitdej: 1, lunch: 1, snack: 0, diner: 0 },
  apresmidi: { petitdej: 1, lunch: 1, snack: 1, diner: 0 },
  soir: { petitdej: 1, lunch: 1, snack: 1, diner: 1 },
}
// Repas d'un jour complet (jours intermédiaires d'un trek)
const FULL_MEALS: RavitoStock = { petitdej: 1, lunch: 1, snack: 2, diner: 1 }

export function defaultRavitoEntry(): RavitoEntry {
  return { config: { depart: 'matin', retour: 'apresmidi' }, stocks: {}, items: [], electrolytes: {} }
}

/** Noms d'items (normalisés) ramenés par au moins 2 membres différents — doublon probable. */
export function duplicateItemNames(items: RavitoEntry['items']): Set<string> {
  const byName = new Map<string, Set<string>>()
  for (const item of items ?? []) {
    const key = item.name.trim().toLowerCase()
    if (!key) continue
    const assignees = byName.get(key) ?? new Set<string>()
    assignees.add(item.assignee)
    byName.set(key, assignees)
  }
  const dupes = new Set<string>()
  byName.forEach((assignees, key) => {
    if (assignees.size > 1) dupes.add(key)
  })
  return dupes
}

/** Nombre de jours à partir du libellé de durée ('1j', '3j'). */
export function parseJours(dur: string | undefined): number {
  return parseInt(dur ?? '', 10) || 1
}

/** Besoins en repas par catégorie pour toute la cordée. */
export function calcBesoins(jours: number, nMembres: number, config: RavitoEntry['config']): RavitoStock {
  const dm = DEPART_MEALS[config.depart] || DEPART_MEALS.matin
  const rm = RETOUR_MEALS[config.retour] || RETOUR_MEALS.apresmidi
  const besoins: RavitoStock = { petitdej: 0, lunch: 0, snack: 0, diner: 0 }
  if (jours === 1) {
    // Journée : l'intersection départ/retour
    MEAL_CATS.forEach((c) => {
      besoins[c.id] = Math.min(dm[c.id] || 0, rm[c.id] || 0) * nMembres
    })
  } else {
    // Jour 1 (départ) + jours intermédiaires + dernier jour (retour)
    const jInter = Math.max(0, jours - 2)
    MEAL_CATS.forEach((c) => {
      besoins[c.id] = ((dm[c.id] || 0) + jInter * (FULL_MEALS[c.id] || 0) + (rm[c.id] || 0)) * nMembres
    })
  }
  return besoins
}

/** Somme des stocks de tous les membres, par catégorie. */
export function calcStockTotal(stocks: RavitoEntry['stocks']): RavitoStock {
  const total: RavitoStock = { petitdej: 0, lunch: 0, snack: 0, diner: 0 }
  Object.values(stocks ?? {}).forEach((s) => {
    MEAL_CATS.forEach((c) => {
      total[c.id] += Number(s[c.id]) || 0
    })
  })
  return total
}

// ── Hydratation ──────────────────────────────────────

export const WATER_SOURCES: { id: WaterSourceId; label: string; desc: string; needsFilter: boolean }[] = [
  { id: 'refuge', label: 'Refuge', desc: 'Eau potable au robinet', needsFilter: false },
  { id: 'ruisseau', label: 'Ruisseau/Lac', desc: 'Filtrante recommandée', needsFilter: true },
  { id: 'aucun', label: 'Aucun', desc: "Pas de point d'eau", needsFilter: false },
]

export function defaultHydraEntry(): HydraEntry {
  return {
    conso: 500,
    heures: 6,
    cuisine: 1000,
    toilette: 500,
    capacite: 2000,
    filtreDisponible: false,
    segments: [{ id: 1, label: 'Départ → Point 1', source: 'ruisseau', km: 0 }],
  }
}

export interface HydraBesoins {
  parPersonneParJour: number
  total: number
  capaciteTotal: number
}

/** Besoins en eau (ml) : par personne/jour, total cordée, capacité d'emport. */
export function calcHydraBesoins(jours: number, nMembres: number, cfg: HydraEntry): HydraBesoins {
  const besoinsJour = cfg.conso * cfg.heures + (jours > 1 ? cfg.cuisine : 0) + cfg.toilette
  return {
    parPersonneParJour: besoinsJour,
    total: besoinsJour * nMembres * jours,
    capaciteTotal: cfg.capacite * nMembres,
  }
}
