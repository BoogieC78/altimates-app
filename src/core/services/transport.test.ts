import { describe, expect, it } from 'vitest'
import { clampSeats, summarizeTransport, transportDocId } from './transport'
import type { TransportDoc } from '../types'

function decl(member: string, mode: TransportDoc['mode'], seats?: number): TransportDoc {
  return { randoId: '1', member, mode, ...(seats !== undefined ? { seats } : {}) }
}

describe('summarizeTransport', () => {
  it('compte 3 voitures pour 7 partants (règle 1 voiture pour 3)', () => {
    const participants = ['Nordine', 'Ismail', 'Sofia', 'Wacil', 'Thomas', 'Lea', 'Marc']
    const summary = summarizeTransport(participants, [])
    expect(summary.voituresNecessaires).toBe(3)
    expect(summary.sansReponse).toHaveLength(7)
  })

  it('signale le manque quand 2 voitures ne suffisent pas pour 7', () => {
    const participants = ['Nordine', 'Ismail', 'Sofia', 'Wacil', 'Thomas', 'Lea', 'Marc']
    const summary = summarizeTransport(participants, [
      decl('Nordine', 'voiture', 2),
      decl('Ismail', 'voiture', 2),
      decl('Sofia', 'passager'),
      decl('Wacil', 'passager'),
      decl('Thomas', 'passager'),
      decl('Lea', 'passager'),
      decl('Marc', 'passager'),
    ])
    // 2 voitures × (2 passagers + conducteur) = 6 places pour 7 personnes.
    expect(summary.placesOffertes).toBe(6)
    expect(summary.personnesEnVoiture).toBe(7)
    expect(summary.placesManquantes).toBe(1)
    expect(summary.voituresManquantes).toBe(1)
  })

  it('ne signale aucun manque quand les places suffisent', () => {
    const summary = summarizeTransport(['Nordine', 'Ismail', 'Sofia'], [
      decl('Nordine', 'voiture', 2),
      decl('Ismail', 'passager'),
      decl('Sofia', 'passager'),
    ])
    expect(summary.placesOffertes).toBe(3)
    expect(summary.placesManquantes).toBe(0)
    expect(summary.voituresManquantes).toBe(0)
  })

  it('exclut les non-véhiculés du calcul des voitures', () => {
    const summary = summarizeTransport(['Nordine', 'Ismail', 'Sofia'], [
      decl('Nordine', 'voiture', 2),
      decl('Ismail', 'passager'),
      decl('Sofia', 'non-vehicule'),
    ])
    expect(summary.nonVehicules).toEqual(['Sofia'])
    expect(summary.personnesEnVoiture).toBe(2)
    expect(summary.placesManquantes).toBe(0)
  })

  it('compte les membres sans réponse comme à transporter', () => {
    const summary = summarizeTransport(['Nordine', 'Ismail', 'Sofia'], [decl('Nordine', 'voiture', 1)])
    expect(summary.sansReponse).toEqual(['Ismail', 'Sofia'])
    expect(summary.personnesEnVoiture).toBe(3)
    expect(summary.placesOffertes).toBe(2)
    expect(summary.placesManquantes).toBe(1)
  })

  it('ignore la déclaration d\'un membre qui n\'est plus partant', () => {
    const summary = summarizeTransport(['Nordine'], [
      decl('Nordine', 'passager'),
      decl('Parti', 'voiture', 4),
    ])
    expect(summary.conducteurs).toEqual([])
    expect(summary.placesOffertes).toBe(0)
    expect(summary.total).toBe(1)
  })

  it('renvoie un récapitulatif vide sans participant', () => {
    const summary = summarizeTransport([], [])
    expect(summary.voituresNecessaires).toBe(0)
    expect(summary.placesManquantes).toBe(0)
  })
})

describe('clampSeats', () => {
  it('applique 2 places par défaut (3 personnes conducteur compris)', () => {
    expect(clampSeats(undefined)).toBe(2)
    expect(clampSeats(NaN)).toBe(2)
  })

  it('borne les valeurs extrêmes', () => {
    expect(clampSeats(0)).toBe(1)
    expect(clampSeats(99)).toBe(6)
    expect(clampSeats(3)).toBe(3)
  })
})

describe('transportDocId', () => {
  it('associe une seule déclaration à un couple rando/membre', () => {
    expect(transportDocId('42', 'Nordine')).toBe('42__Nordine')
    expect(transportDocId('42', 'Nordine')).toBe(transportDocId('42', 'Nordine'))
  })
})
