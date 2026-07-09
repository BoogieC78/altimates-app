import { describe, expect, it } from 'vitest'
import { allItems, budgetRange, kitStats } from './kit'
import { GEAR } from '../constants/gear'

describe('allItems', () => {
  it('concatène les trois catégories', () => {
    const g = GEAR.trek
    expect(allItems('trek')).toHaveLength(
      g.indispensable.length + g.recommande.length + g.facultatif.length,
    )
  })
})

describe('budgetRange', () => {
  it('additionne les fourchettes de prix', () => {
    const { min, max } = budgetRange([
      { id: 'a', name: 'A', note: null, price: '80–180€', links: [] },
      { id: 'b', name: 'B', note: null, price: '30–90€', links: [] },
    ])
    expect(min).toBe(110)
    expect(max).toBe(270)
  })
  it('gère un prix sans fourchette', () => {
    const { min, max } = budgetRange([{ id: 'a', name: 'A', note: null, price: '15€', links: [] }])
    expect(min).toBe(15)
    expect(max).toBe(15)
  })
})

describe('kitStats', () => {
  it('compte les possédés et exclut les skip des manquants', () => {
    const first = allItems('journee')[0]
    const second = allItems('journee')[1]
    const stats = kitStats('journee', { [first.id]: 'have', [second.id]: 'skip' })
    expect(stats.done).toBe(1)
    expect(stats.missing.find((g) => g.id === first.id)).toBeUndefined()
    expect(stats.missing.find((g) => g.id === second.id)).toBeUndefined()
    expect(stats.total).toBe(allItems('journee').length)
  })
})
