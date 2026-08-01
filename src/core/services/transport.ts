// Organisation du trajet jusqu'au parking de départ : combien de voitures il
// faut, combien sont proposées, et ce qui manque. Logique pure, sans Firebase
// ni React.

import type { TransportDoc } from '../types'

/**
 * Personnes par voiture retenues par le groupe : 3, sacs et matos compris.
 * Au-delà, les sacs à dos et le matériel ne rentrent plus dans une voiture
 * de taille moyenne.
 */
export const PLACES_PAR_VOITURE = 3

/** Bornes de réglage du nombre de places offertes par un conducteur. */
export const MIN_SEATS = 1
export const MAX_SEATS = 6

export interface TransportSummary {
  /** participants pris en compte */
  total: number
  /** nombre de voitures nécessaires si tout le monde vient en voiture */
  voituresNecessaires: number
  /** membres ayant déclaré amener leur voiture */
  conducteurs: string[]
  /** membres cherchant une place */
  passagers: string[]
  /** membres non véhiculés (train/bus à organiser) */
  nonVehicules: string[]
  /** membres n'ayant pas encore déclaré leur moyen de transport */
  sansReponse: string[]
  /** places assises offertes par les conducteurs, conducteur compris */
  placesOffertes: number
  /** personnes à transporter en voiture (conducteurs + passagers) */
  personnesEnVoiture: number
  /** places manquantes (0 si le compte est bon) */
  placesManquantes: number
  /** voitures encore à trouver, arrondi au supérieur */
  voituresManquantes: number
}

/**
 * Récapitulatif du transport pour une sortie.
 *
 * `participants` = les partants de la sortie (vote « oui »). Les déclarations
 * d'un membre qui n'est plus partant sont ignorées : il ne doit pas continuer
 * à offrir des places sur une sortie qu'il a quittée.
 */
export function summarizeTransport(participants: string[], docs: TransportDoc[]): TransportSummary {
  const byMember = new Map<string, TransportDoc>()
  for (const doc of docs) {
    if (participants.includes(doc.member)) byMember.set(doc.member, doc)
  }

  const conducteurs: string[] = []
  const passagers: string[] = []
  const nonVehicules: string[] = []
  const sansReponse: string[] = []
  let placesOffertes = 0

  for (const member of participants) {
    const doc = byMember.get(member)
    if (!doc) {
      sansReponse.push(member)
      continue
    }
    if (doc.mode === 'voiture') {
      conducteurs.push(member)
      // Le conducteur occupe une place : une voiture de N places passagers
      // transporte N + 1 personnes.
      placesOffertes += clampSeats(doc.seats) + 1
    } else if (doc.mode === 'passager') {
      passagers.push(member)
    } else {
      nonVehicules.push(member)
    }
  }

  const total = participants.length
  // Les non-véhiculés ne montent pas en voiture depuis le point de départ :
  // ils rejoignent en train/bus (organisation V2), donc hors du compte.
  const personnesEnVoiture = conducteurs.length + passagers.length + sansReponse.length
  const placesManquantes = Math.max(0, personnesEnVoiture - placesOffertes)

  return {
    total,
    voituresNecessaires: Math.ceil(personnesEnVoiture / PLACES_PAR_VOITURE),
    conducteurs,
    passagers,
    nonVehicules,
    sansReponse,
    placesOffertes,
    personnesEnVoiture,
    placesManquantes,
    voituresManquantes: Math.ceil(placesManquantes / PLACES_PAR_VOITURE),
  }
}

/** Ramène un nombre de places dans les bornes acceptées (défaut : 3 - 1 conducteur). */
export function clampSeats(seats: number | undefined): number {
  const n = Number(seats)
  if (!Number.isFinite(n)) return PLACES_PAR_VOITURE - 1
  return Math.min(MAX_SEATS, Math.max(MIN_SEATS, Math.round(n)))
}

/** Id du document transport : une déclaration par (rando, membre). */
export function transportDocId(randoId: string, member: string): string {
  return `${randoId}__${member}`
}
