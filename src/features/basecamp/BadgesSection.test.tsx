import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { makeRando } from '../../test/factories'
import { BadgesSection } from './BadgesSection'

// 2999 : les tests restent valides quel que soit le jour d'exécution.
const PAST = { dateStart: '2020-01-10' }
const FUTURE = { dateStart: '2999-01-10' }

describe('BadgesSection', () => {
  it('rend les 10 médaillons de la collection avec leur aria-label', () => {
    const { container } = render(<BadgesSection randos={[]} memberName="Wacil" />)
    const medals = container.querySelectorAll('.badge-grid .badge-medal')
    expect(medals).toHaveLength(10)
    expect(screen.getByRole('img', { name: 'Écureuil roux — 1 sortie, à débloquer' })).toBeTruthy()
    expect(screen.getByRole('img', { name: 'Aigle royal — 180 sorties, à débloquer' })).toBeTruthy()
  })

  it('sans sortie faite : tout est grisé et l\'état vide est affiché', () => {
    const { container } = render(
      <BadgesSection randos={[makeRando({ ...FUTURE, memberVotes: { Wacil: 'oui' } })]} memberName="Wacil" />,
    )
    expect(container.querySelectorAll('.badge-grid .badge-locked')).toHaveLength(10)
    expect(screen.getByText('Aucun badge pour l’instant')).toBeTruthy()
    expect(screen.getByText('Prochain palier : Écureuil roux, encore 1 sortie')).toBeTruthy()
  })

  it('3 sorties faites : Écureuil et Renard acquis, le reste grisé', () => {
    const randos = [1, 2, 3].map((id) =>
      makeRando({ docId: `d${id}`, id, ...PAST, memberVotes: { Wacil: 'oui' } }),
    )
    const { container } = render(<BadgesSection randos={randos} memberName="Wacil" />)
    const acquired = [...container.querySelectorAll('.badge-grid .badge-acquired')]
    expect(acquired.map((m) => m.getAttribute('data-rank'))).toEqual(['1', '2'])
    expect(container.querySelectorAll('.badge-grid .badge-locked')).toHaveLength(8)
    // Badge courant en grand : le Renard, avec son anneau de progression.
    const hero = container.querySelector('.badge-hero .badge-medal')!
    expect(hero.getAttribute('data-rank')).toBe('2')
    // « Renard » apparaît deux fois : en titre du hero et sous son médaillon.
    expect(screen.getAllByText('Renard')).toHaveLength(2)
    expect(screen.getByText('Prochain palier : Tétras-lyre, encore 5 sorties')).toBeTruthy()
  })

  it('ne compte ni les votes non-partant ni les sorties des autres', () => {
    const randos = [
      makeRando({ docId: 'a', id: 1, ...PAST, memberVotes: { Wacil: 'peut' } }),
      makeRando({ docId: 'b', id: 2, ...PAST, memberVotes: { Marc: 'oui' } }),
    ]
    render(<BadgesSection randos={randos} memberName="Wacil" />)
    expect(screen.getByText('Aucun badge pour l’instant')).toBeTruthy()
  })

  it('liseré doré si le membre a organisé au moins une sortie', () => {
    const randos = [makeRando({ ...PAST, memberVotes: { Wacil: 'oui' }, proposedBy: 'Wacil' })]
    const { container } = render(<BadgesSection randos={randos} memberName="Wacil" />)
    expect(container.querySelectorAll('.badge-gold-ring').length).toBeGreaterThan(0)
    expect(screen.getByText(/Partageur/)).toBeTruthy()
  })

  it('pas de liseré doré sans sortie organisée', () => {
    const randos = [makeRando({ ...PAST, memberVotes: { Wacil: 'oui' }, proposedBy: 'Marc' })]
    const { container } = render(<BadgesSection randos={randos} memberName="Wacil" />)
    expect(container.querySelector('.badge-gold-ring')).toBeNull()
  })
})
