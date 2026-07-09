import { describe, expect, it } from 'vitest'
import { applyVote, votersFor } from './votes'
import type { Rando } from '../types'

function rando(overrides: Partial<Rando> = {}): Rando {
  return {
    id: 1,
    name: 'Test',
    region: 'Alpes',
    votes: { oui: 2, peut: 1 },
    memberVotes: { Nordine: 'oui', Ismail: 'peut' },
    ...overrides,
  }
}

describe('applyVote', () => {
  it('ajoute un nouveau vote et incrémente le compteur', () => {
    const t = applyVote(rando(), 'Wacil', 'oui')
    expect(t.memberVotes.Wacil).toBe('oui')
    expect(t.votes).toEqual({ oui: 3, peut: 1 })
    expect(t.myVote).toBe('oui')
  })

  it('retire le vote quand on reclique sur le même', () => {
    const t = applyVote(rando(), 'Nordine', 'oui')
    expect(t.memberVotes.Nordine).toBeUndefined()
    expect(t.votes).toEqual({ oui: 1, peut: 1 })
    expect(t.myVote).toBeNull()
  })

  it('bascule oui -> peut en ajustant les deux compteurs', () => {
    const t = applyVote(rando(), 'Nordine', 'peut')
    expect(t.memberVotes.Nordine).toBe('peut')
    expect(t.votes).toEqual({ oui: 1, peut: 2 })
  })

  it('gère une rando sans memberVotes ni compteurs', () => {
    const t = applyVote(rando({ memberVotes: undefined, votes: undefined as never }), 'Wacil', 'peut')
    expect(t.memberVotes).toEqual({ Wacil: 'peut' })
    expect(t.votes).toEqual({ oui: 0, peut: 1 })
  })

  it('ne descend jamais un compteur sous zéro', () => {
    const t = applyVote(rando({ votes: { oui: 0, peut: 0 } }), 'Nordine', 'oui')
    expect(t.votes.oui).toBe(0)
  })
})

describe('votersFor', () => {
  it('liste les partants', () => {
    expect(votersFor(rando(), 'oui')).toEqual(['Nordine'])
    expect(votersFor(rando(), 'peut')).toEqual(['Ismail'])
  })
})
