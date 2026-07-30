import { describe, expect, it } from 'vitest'
import { allItems, budgetRange, formatWeight, kitStats, parseRange, weightRange } from './kit'
import { GEAR, type GearItem } from '../constants/gear'

const item = (over: Partial<GearItem> & { id: string }): GearItem => ({
  name: over.id.toUpperCase(),
  note: null,
  price: '0€',
  weight: '0 g',
  links: [],
  ...over,
})

describe('allItems', () => {
  it('concatène les trois catégories', () => {
    const g = GEAR.trek
    expect(allItems('trek')).toHaveLength(
      g.indispensable.length + g.recommande.length + g.facultatif.length,
    )
  })
})

describe('parseRange', () => {
  it('sépare les deux bornes d’une fourchette', () => {
    expect(parseRange('80–180€')).toEqual({ min: 80, max: 180 })
    expect(parseRange('400–800 g')).toEqual({ min: 400, max: 800 })
  })
  it('répète la valeur unique quand il n’y a pas de fourchette', () => {
    expect(parseRange('15€')).toEqual({ min: 15, max: 15 })
  })
})

describe('budgetRange', () => {
  it('additionne les fourchettes de prix', () => {
    const { min, max } = budgetRange([item({ id: 'a', price: '80–180€' }), item({ id: 'b', price: '30–90€' })])
    expect(min).toBe(110)
    expect(max).toBe(270)
  })
  it('gère un prix sans fourchette', () => {
    const { min, max } = budgetRange([item({ id: 'a', price: '15€' })])
    expect(min).toBe(15)
    expect(max).toBe(15)
  })
})

describe('weightRange', () => {
  it('additionne les fourchettes de poids en grammes', () => {
    const { min, max } = weightRange([
      item({ id: 'a', weight: '800–1400 g' }),
      item({ id: 'b', weight: '50–100 g' }),
    ])
    expect(min).toBe(850)
    expect(max).toBe(1500)
  })
  it('ignore le prix (fourchettes lues sur le bon champ)', () => {
    const { min, max } = weightRange([item({ id: 'a', price: '999–999€', weight: '60–120 g' })])
    expect(min).toBe(60)
    expect(max).toBe(120)
  })
  it('vaut 0 sur une liste vide', () => {
    expect(weightRange([])).toEqual({ min: 0, max: 0 })
  })
  it('additionne tous les articles du kit trek sans en oublier', () => {
    // Toutes les entrées GEAR doivent porter un poids exploitable : si un article
    // arrive sans champ `weight` valide, il pèse 0 et fausse silencieusement le total.
    const trek = allItems('trek')
    expect(trek.every((g) => parseRange(g.weight).min > 0)).toBe(true)
    expect(allItems('journee').every((g) => parseRange(g.weight).min > 0)).toBe(true)
  })
})

describe('formatWeight', () => {
  it('affiche les grammes en dessous du kilo', () => {
    expect(formatWeight(850)).toBe('850 g')
    expect(formatWeight(999)).toBe('999 g')
  })
  it('bascule en kilos avec une décimale et une virgule', () => {
    expect(formatWeight(1000)).toBe('1,0 kg')
    expect(formatWeight(9360)).toBe('9,4 kg')
    expect(formatWeight(12040)).toBe('12,0 kg')
  })
  it('affiche un tiret quand il n’y a rien à porter', () => {
    expect(formatWeight(0)).toBe('—')
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

  it('carried garde le possédé et le manquant, mais jamais le skip', () => {
    const sac = allItems('journee').find((g) => g.id === 'sac20')!
    const solaire = allItems('journee').find((g) => g.id === 'solaire')!
    const powerbank = allItems('journee').find((g) => g.id === 'powerbank')!
    const stats = kitStats('journee', { [sac.id]: 'have', [solaire.id]: 'skip', [powerbank.id]: 'want' })
    const ids = stats.carried.map((g) => g.id)
    expect(ids).toContain(sac.id)
    expect(ids).toContain(powerbank.id)
    expect(ids).not.toContain(solaire.id)
  })

  it('exclut du sac ce qui est porté sur soi', () => {
    const stats = kitStats('journee', {})
    const carried = stats.carried.map((g) => g.id)
    // Chaussures aux pieds et bâtons en main : retenus dans le kit, absents du sac.
    expect(carried).not.toContain('chaussures')
    expect(carried).not.toContain('batons')
    expect(stats.worn.map((g) => g.id)).toContain('chaussures')
    expect(stats.worn.map((g) => g.id)).toContain('batons')
    // Le sac à dos lui-même, lui, pèse bien sur le dos.
    expect(carried).toContain('sac20')
    expect(stats.carried.length + stats.worn.length).toBe(allItems('journee').length)
  })

  it('skipper un article porté sur soi ne change pas le poids du sac', () => {
    const avant = weightRange(kitStats('journee', {}).carried)
    const apres = weightRange(kitStats('journee', { chaussures: 'skip' }).carried)
    expect(apres).toEqual(avant)
  })

  it('retirer un article du sac allège le poids estimé', () => {
    const lourd = allItems('trek').find((g) => g.id === 'sac50')!
    const complet = weightRange(kitStats('trek', {}).carried)
    const sansSac = weightRange(kitStats('trek', { sac50: 'skip' }).carried)
    expect(complet.min - sansSac.min).toBe(parseRange(lourd.weight).min)
    expect(sansSac.min).toBeLessThan(complet.min)
  })
})

describe('placement des articles dans le kit', () => {
  const ids = (mode: 'trek' | 'journee', cat: 'indispensable' | 'recommande' | 'facultatif') =>
    GEAR[mode][cat].map((g) => g.id)

  it('la cuillère et l’oreiller sont indispensables en trek', () => {
    expect(ids('trek', 'indispensable')).toContain('cuillere')
    expect(ids('trek', 'indispensable')).toContain('oreiller')
    expect(ids('trek', 'recommande')).not.toContain('cuillere')
    expect(ids('trek', 'facultatif')).not.toContain('oreiller')
  })

  it('l’oreiller ne fait pas partie du kit journée', () => {
    expect(allItems('journee').map((g) => g.id)).not.toContain('oreiller')
  })

  it('la protection solaire est recommandée dans les deux modes', () => {
    expect(ids('trek', 'recommande')).toContain('solaire')
    expect(ids('journee', 'recommande')).toContain('solaire')
  })
})
