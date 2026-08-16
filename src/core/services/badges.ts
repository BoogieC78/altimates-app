// Échelle animalière de badges de progression (Base Camp).
//
// Tout est DÉRIVÉ des randos existantes : une « sortie faite » est une rando
// dont la date est passée (isPast, réf. date de fin) ET où le membre a voté
// « Partant » (memberVotes[prénom] === 'oui'). Aucune collection Firestore
// dédiée, aucune règle à changer.

import type { Rando } from '../types'
import { isPast } from './dates'

/**
 * Étage de végétation, du plus bas au plus haut. Chaque zone a sa couleur de
 * médaillon : le feedback visuel doit marcher sans lire le nom de l'animal.
 */
export type BadgeZone = 'verte' | 'bleu-vert' | 'ambre'

export interface BadgeTier {
  /** rang du palier, 1 à 10 */
  rank: number
  animal: string
  /** nombre de sorties FAITES nécessaires */
  threshold: number
  /** altitude affichée sur le médaillon / la fiche */
  altitude: string
  zone: BadgeZone
}

/** Les 10 paliers, du plus bas au plus haut. Seuils validés, ne pas retoucher. */
export const BADGE_TIERS: readonly BadgeTier[] = [
  { rank: 1, animal: 'Écureuil roux', threshold: 1, altitude: '800 m', zone: 'verte' },
  { rank: 2, animal: 'Renard', threshold: 3, altitude: '1 200 m', zone: 'verte' },
  { rank: 3, animal: 'Tétras-lyre', threshold: 8, altitude: '1 800 m', zone: 'verte' },
  { rank: 4, animal: 'Marmotte', threshold: 15, altitude: '2 000 m', zone: 'bleu-vert' },
  { rank: 5, animal: 'Hermine', threshold: 25, altitude: '2 300 m', zone: 'bleu-vert' },
  { rank: 6, animal: 'Chamois', threshold: 40, altitude: '2 500 m', zone: 'bleu-vert' },
  { rank: 7, animal: 'Lagopède alpin', threshold: 60, altitude: '2 700 m', zone: 'bleu-vert' },
  { rank: 8, animal: 'Bouquetin', threshold: 90, altitude: '3 000 m', zone: 'ambre' },
  { rank: 9, animal: 'Gypaète barbu', threshold: 130, altitude: '3 500 m', zone: 'ambre' },
  { rank: 10, animal: 'Aigle royal', threshold: 180, altitude: 'au-dessus de tout', zone: 'ambre' },
]

/** Nom de l'étage montagnard associé à chaque zone de couleur. */
export const ZONE_LABELS: Record<BadgeZone, string> = {
  verte: 'Étage montagnard',
  'bleu-vert': 'Étage alpin',
  ambre: 'Étage nival',
}

/** Nom court de la zone, pour les textes « avant l'ambre ». */
const ZONE_SHORT: Record<BadgeZone, string> = {
  verte: 'le vert',
  'bleu-vert': 'le bleu-vert',
  ambre: "l'ambre",
}

/**
 * Sorties FAITES du membre : date passée (réf. date de fin, comme isPast)
 * ET vote « Partant » (oui). Une sortie future ou un vote peut/non ne compte pas.
 */
export function countDoneOutings(randos: readonly Rando[], memberName: string, today: string): number {
  return randos.filter((r) => isPast(r, today) && r.memberVotes?.[memberName] === 'oui').length
}

/**
 * Liseré doré « partageur » : le membre a organisé/proposé au moins une sortie.
 * Bonus visuel uniquement — ce n'est pas un critère de palier.
 */
export function hasOrganized(randos: readonly Rando[], memberName: string): boolean {
  return randos.some((r) => r.proposedBy === memberName)
}

/** Palier atteint pour un nombre de sorties faites (null si aucune). */
export function badgeForCount(count: number): BadgeTier | null {
  let current: BadgeTier | null = null
  for (const tier of BADGE_TIERS) {
    if (count >= tier.threshold) current = tier
  }
  return current
}

/** Palier suivant à débloquer (null si Aigle royal atteint). */
export function nextBadgeFor(count: number): BadgeTier | null {
  return BADGE_TIERS.find((tier) => count < tier.threshold) ?? null
}

export interface BadgeProgress {
  current: BadgeTier | null
  next: BadgeTier | null
  /** sorties restantes avant le palier suivant (0 si dernier palier atteint) */
  remaining: number
  /** progression 0..1 vers le palier suivant, pour l'anneau du médaillon */
  ratio: number
  /** texte de progression prêt à afficher */
  label: string
}

function sorties(n: number): string {
  return `${n} sortie${n > 1 ? 's' : ''}`
}

/** État complet de progression pour un nombre de sorties faites. */
export function badgeProgress(count: number): BadgeProgress {
  const current = badgeForCount(count)
  const next = nextBadgeFor(count)

  if (!next) {
    // Dernier palier : l'Aigle royal plane au-dessus de tout.
    return { current, next: null, remaining: 0, ratio: 1, label: 'Aigle royal — au-dessus de tout' }
  }

  const base = current?.threshold ?? 0
  const remaining = next.threshold - count
  const ratio = Math.max(0, Math.min(1, (count - base) / (next.threshold - base)))

  // Au passage d'étage, on annonce la couleur ; sinon le prochain animal.
  const label =
    current && next.zone !== current.zone
      ? `${ZONE_LABELS[current.zone]} — plus que ${sorties(remaining)} avant ${ZONE_SHORT[next.zone]}`
      : `Prochain palier : ${next.animal}, encore ${sorties(remaining)}`

  return { current, next, remaining, ratio, label }
}
