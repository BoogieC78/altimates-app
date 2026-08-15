import { describe, expect, it } from 'vitest'
import type { SurveyResponse } from '../types'
import { formatAvg, summarizeSurvey, surveyDocId, surveyState } from './survey'

function resp(over: Partial<SurveyResponse> = {}): SurveyResponse {
  return {
    randoId: '1',
    author: 'Nordine',
    authorUid: 'uid-nordine',
    rating: 4,
    difficulty: 'comme-prevu',
    weather: 'soleil',
    organization: 4,
    ...over,
  }
}

describe('surveyState', () => {
  const today = '2026-08-16'

  it("reste 'avant' sans date connue", () => {
    expect(surveyState({}, today)).toBe('avant')
    expect(surveyState({ dateStart: null, dateEnd: null }, today)).toBe('avant')
  })

  it("reste 'avant' le jour même de la sortie", () => {
    expect(surveyState({ dateStart: '2026-08-16' }, today)).toBe('avant')
  })

  it("reste 'avant' avant la sortie", () => {
    expect(surveyState({ dateStart: '2026-08-20' }, today)).toBe('avant')
  })

  it("s'ouvre le lendemain de la sortie", () => {
    expect(surveyState({ dateStart: '2026-08-15' }, today)).toBe('ouverte')
  })

  it('reste ouverte 14 jours après la date, fermée le 15e', () => {
    expect(surveyState({ dateStart: '2026-08-02' }, today)).toBe('ouverte') // J+14
    expect(surveyState({ dateStart: '2026-08-01' }, today)).toBe('fermee') // J+15
  })

  it('se base sur la date de FIN pour une sortie multi-jours', () => {
    // Départ il y a longtemps mais retour hier : l'enquête vient d'ouvrir.
    expect(surveyState({ dateStart: '2026-08-01', dateEnd: '2026-08-15' }, today)).toBe('ouverte')
  })

  it("franchit un changement d'heure sans décalage (dates jour-seul)", () => {
    // Le passage à l'heure d'hiver (25 oct. 2026) est entre les deux dates :
    // J+14 doit rester J+14, pas J+13,96 arrondi de travers.
    expect(surveyState({ dateStart: '2026-10-20' }, '2026-11-03')).toBe('ouverte')
    expect(surveyState({ dateStart: '2026-10-20' }, '2026-11-04')).toBe('fermee')
  })
})

describe('surveyDocId', () => {
  it('impose une réponse par (rando, membre)', () => {
    expect(surveyDocId('1748600000000', 'abc123')).toBe('1748600000000_abc123')
  })
})

describe('summarizeSurvey', () => {
  it('rend count 0 et moyennes 0 sans réponse', () => {
    expect(summarizeSurvey([])).toEqual({
      count: 0,
      avgRating: 0,
      avgOrganization: 0,
      difficulty: {},
      weather: {},
    })
  })

  it('calcule moyennes arrondies à une décimale et répartitions', () => {
    const s = summarizeSurvey([
      resp({ rating: 5, organization: 3, difficulty: 'facile', weather: 'soleil' }),
      resp({ authorUid: 'uid-wacil', rating: 4, organization: 4, difficulty: 'plus-dur', weather: 'soleil' }),
      resp({ authorUid: 'uid-sofia', rating: 3, organization: 5, difficulty: 'plus-dur', weather: 'pluie' }),
    ])
    expect(s.count).toBe(3)
    expect(s.avgRating).toBe(4) // (5+4+3)/3
    expect(s.avgOrganization).toBe(4) // (3+4+5)/3
    expect(s.difficulty).toEqual({ facile: 1, 'plus-dur': 2 })
    expect(s.weather).toEqual({ soleil: 2, pluie: 1 })
  })

  it('arrondit 4,333… à 4,3', () => {
    const s = summarizeSurvey([resp({ rating: 5 }), resp({ rating: 4 }), resp({ rating: 4 })])
    expect(s.avgRating).toBe(4.3)
  })
})

describe('formatAvg', () => {
  it('affiche la décimale à la française, indépendamment de la locale machine', () => {
    expect(formatAvg(4.5)).toBe('4,5')
    expect(formatAvg(4)).toBe('4')
  })
})
