// Enquête post-rando : fenêtre d'ouverture calculée côté client (pas de tâche
// planifiée serveur, pas de plan Blaze) et restitution des réponses. Logique
// pure, sans Firebase ni React.

import type { SurveyDifficulty, SurveyResponse, SurveyWeather } from '../types'

/** L'enquête reste ouverte ce nombre de jours après la date de la sortie. */
export const SURVEY_OPEN_DAYS = 14

/** Longueur maximale du commentaire libre (aussi appliquée par les règles). */
export const SURVEY_COMMENT_MAX = 400

export const DIFFICULTY_OPTIONS: { id: SurveyDifficulty; label: string }[] = [
  { id: 'facile', label: 'Facile' },
  { id: 'comme-prevu', label: 'Comme prévu' },
  { id: 'plus-dur', label: 'Plus dur que prévu' },
]

export const WEATHER_OPTIONS: { id: SurveyWeather; emoji: string; label: string }[] = [
  { id: 'soleil', emoji: '☀️', label: 'Grand soleil' },
  { id: 'nuageux', emoji: '⛅', label: 'Nuageux' },
  { id: 'pluie', emoji: '🌧', label: 'Pluie' },
  { id: 'neige', emoji: '❄️', label: 'Neige' },
]

export type SurveyState = 'avant' | 'ouverte' | 'fermee'

/**
 * État de l'enquête d'une sortie au jour `today` (yyyy-mm-dd, heure locale —
 * voir todayLocalISO). Référence : la date de FIN de la sortie (ou de début à
 * défaut), comme isPast. Le jour même de la sortie, l'enquête n'est pas encore
 * ouverte : « à chaud », c'est au retour, pas sur le sentier.
 * Sans date connue, l'enquête n'existe pas ('avant').
 */
export function surveyState(
  rando: { dateStart?: string | null; dateEnd?: string | null },
  today: string,
): SurveyState {
  const ref = rando.dateEnd || rando.dateStart
  if (!ref) return 'avant'
  // Dates ISO jour-seul : Date.parse les lit en minuit UTC des deux côtés,
  // la différence est donc un nombre entier de jours, insensible à l'heure d'été.
  const diffDays = Math.round((Date.parse(today) - Date.parse(ref.slice(0, 10))) / 86400000)
  if (!Number.isFinite(diffDays) || diffDays <= 0) return 'avant'
  return diffDays <= SURVEY_OPEN_DAYS ? 'ouverte' : 'fermee'
}

/** Id du document réponse : une réponse par (rando, membre), imposé par les règles. */
export function surveyDocId(randoId: string, uid: string): string {
  return `${randoId}_${uid}`
}

export interface SurveySummary {
  count: number
  /** moyenne des notes globales, arrondie à une décimale */
  avgRating: number
  /** moyenne des notes d'organisation, arrondie à une décimale */
  avgOrganization: number
  /** répartition des difficultés ressenties (clés absentes si aucun vote) */
  difficulty: Partial<Record<SurveyDifficulty, number>>
  /** répartition des météos rencontrées (clés absentes si aucun vote) */
  weather: Partial<Record<SurveyWeather, number>>
}

/** Moyennes et répartitions pour la restitution. Réponses vides → count 0. */
export function summarizeSurvey(responses: SurveyResponse[]): SurveySummary {
  const count = responses.length
  const difficulty: Partial<Record<SurveyDifficulty, number>> = {}
  const weather: Partial<Record<SurveyWeather, number>> = {}
  let ratingSum = 0
  let orgSum = 0
  for (const r of responses) {
    ratingSum += r.rating
    orgSum += r.organization
    difficulty[r.difficulty] = (difficulty[r.difficulty] ?? 0) + 1
    weather[r.weather] = (weather[r.weather] ?? 0) + 1
  }
  return {
    count,
    avgRating: count ? Math.round((ratingSum / count) * 10) / 10 : 0,
    avgOrganization: count ? Math.round((orgSum / count) * 10) / 10 : 0,
    difficulty,
    weather,
  }
}

/** '4,5' — moyenne affichée en décimale française, sans dépendre de la locale machine. */
export function formatAvg(avg: number): string {
  return String(avg).replace('.', ',')
}
