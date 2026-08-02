import { describe, expect, it } from 'vitest'
import {
  computeBalances,
  computeSettlements,
  formatCents,
  parseAmountToCents,
  splitAmount,
  totalSpent,
} from './expenses'
import type { Expense } from '../types'

function expense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 1,
    randoId: '42',
    label: 'Lyophilisés',
    amount: 3000,
    payer: 'Nordine',
    beneficiaries: ['Nordine', 'Ismail', 'Sofia'],
    ...overrides,
  }
}

/** Un groupe soldé a toujours une somme de soldes nulle : c'est l'invariant du calcul. */
function sum(balances: Record<string, number>): number {
  return Object.values(balances).reduce((a, b) => a + b, 0)
}

describe('splitAmount', () => {
  it('répartit exactement, reste au centime près sur les premières parts', () => {
    expect(splitAmount(1000, 3)).toEqual([334, 333, 333])
    expect(splitAmount(1000, 3).reduce((a, b) => a + b, 0)).toBe(1000)
  })

  it('répartit sans reste quand le montant est divisible', () => {
    expect(splitAmount(900, 3)).toEqual([300, 300, 300])
  })

  it('rend un tableau vide pour zéro part', () => {
    expect(splitAmount(1000, 0)).toEqual([])
  })
})

describe('computeBalances', () => {
  it('crédite le payeur et débite chaque bénéficiaire de sa part', () => {
    const balances = computeBalances([expense({ amount: 3000 })])
    expect(balances).toEqual({ Nordine: 2000, Ismail: -1000, Sofia: -1000 })
    expect(sum(balances)).toBe(0)
  })

  it('crédite intégralement un payeur absent des bénéficiaires', () => {
    const balances = computeBalances([
      expense({ amount: 2000, payer: 'Wacil', beneficiaries: ['Ismail', 'Sofia'] }),
    ])
    expect(balances).toEqual({ Wacil: 2000, Ismail: -1000, Sofia: -1000 })
    expect(sum(balances)).toBe(0)
  })

  it('gère une dépense pour un seul bénéficiaire', () => {
    const balances = computeBalances([
      expense({ amount: 1500, payer: 'Nordine', beneficiaries: ['Ismail'] }),
    ])
    expect(balances).toEqual({ Nordine: 1500, Ismail: -1500 })
  })

  it('reste équilibré au centime sur des dépenses croisées entre 4 membres', () => {
    const membres = ['Nordine', 'Ismail', 'Sofia', 'Wacil']
    const balances = computeBalances([
      expense({ id: 1, amount: 4999, payer: 'Nordine', beneficiaries: membres }),
      expense({ id: 2, amount: 2333, payer: 'Ismail', beneficiaries: membres }),
      expense({ id: 3, amount: 700, payer: 'Sofia', beneficiaries: ['Sofia', 'Wacil'] }),
    ])
    expect(sum(balances)).toBe(0)
    // 4999 et 2333 ne sont pas divisibles par 4 : les restes doivent être absorbés,
    // pas arrondis — sinon le groupe « perd » ou « crée » des centimes.
    // Sur la 1re dépense (reste de 3 centimes) Wacil est le seul à payer la part
    // basse ; sur la 2e (reste d'un centime) c'est donc lui qui le prend, puisque
    // les trois autres en ont déjà reçu un.
    expect(balances.Nordine).toBe(4999 - 1250 - 583)
    expect(balances.Wacil).toBe(-1249 - 584 - 350)
  })

  it("ne fait jamais payer plus d'un centime d'écart, même sur plusieurs dépenses", () => {
    // Jeu d'essai réel : 90 € puis 60 € avancés par Wacil pour 7 personnes.
    // Avant correction, le premier bénéficiaire cumulait les deux restes et se
    // retrouvait à 21,44 € quand le dernier payait 21,42 € — deux centimes
    // d'écart pour une part censée être identique.
    const groupe = ['Wacil', 'Ousss', 'Anonyme', 'David', 'Ismail', 'Nordine', 'Adebola']
    const balances = computeBalances([
      expense({ id: 1, label: 'Lyophilisé', amount: 9000, payer: 'Wacil', beneficiaries: groupe }),
      expense({ id: 2, label: 'Bettrave', amount: 6000, payer: 'Wacil', beneficiaries: groupe }),
    ])

    expect(sum(balances)).toBe(0)
    // Part réellement supportée par chacun : 15000 / 7 = 2142,857…
    const parts = groupe.map((name) => (name === 'Wacil' ? 15000 - balances.Wacil : -balances[name]))
    expect(Math.max(...parts) - Math.min(...parts)).toBe(1)
    expect(parts.reduce((a, b) => a + b, 0)).toBe(15000)
    expect(new Set(parts)).toEqual(new Set([2142, 2143]))
  })

  it('crédite le payeur même sans bénéficiaire (aucune perte d\'argent)', () => {
    const balances = computeBalances([expense({ amount: 1200, beneficiaries: [] })])
    expect(balances).toEqual({ Nordine: 1200 })
  })

  it('renvoie des soldes vides sans dépense', () => {
    expect(computeBalances([])).toEqual({})
  })
})

describe('computeSettlements', () => {
  it('solde un cas simple en un seul virement', () => {
    expect(computeSettlements({ Nordine: 1000, Ismail: -1000 })).toEqual([
      { from: 'Ismail', to: 'Nordine', amount: 1000 },
    ])
  })

  it('solde tout le monde en au plus N-1 virements', () => {
    const balances = computeBalances([
      expense({ id: 1, amount: 6000, payer: 'Nordine', beneficiaries: ['Nordine', 'Ismail', 'Sofia', 'Wacil'] }),
      expense({ id: 2, amount: 2000, payer: 'Sofia', beneficiaries: ['Nordine', 'Ismail', 'Sofia', 'Wacil'] }),
    ])
    const settlements = computeSettlements(balances)
    expect(settlements.length).toBeLessThanOrEqual(3)

    // Après application des virements, tous les soldes tombent à zéro.
    const after = { ...balances }
    for (const s of settlements) {
      after[s.from] += s.amount
      after[s.to] -= s.amount
    }
    for (const value of Object.values(after)) expect(value).toBe(0)
  })

  it('ne propose aucun virement quand tout est déjà soldé', () => {
    expect(computeSettlements({ Nordine: 0, Ismail: 0 })).toEqual([])
    expect(computeSettlements({})).toEqual([])
  })
})

describe('totalSpent', () => {
  it('additionne les montants avancés', () => {
    expect(totalSpent([expense({ amount: 1000 }), expense({ id: 2, amount: 250 })])).toBe(1250)
  })
})

describe('formatCents', () => {
  it('formate en euros avec deux décimales', () => {
    // Espace insécable étroit inséré par Intl entre le montant et le symbole :
    // on compare sur les chiffres pour ne pas dépendre de la version d'ICU.
    expect(formatCents(1250)).toMatch(/^12,50/)
    expect(formatCents(0)).toMatch(/^0,00/)
    expect(formatCents(-1250)).toMatch(/^-12,50/)
  })
})

describe('parseAmountToCents', () => {
  it('accepte le point et la virgule décimale', () => {
    expect(parseAmountToCents('12,50')).toBe(1250)
    expect(parseAmountToCents('12.50')).toBe(1250)
    expect(parseAmountToCents('12')).toBe(1200)
    expect(parseAmountToCents(' 12,5 ')).toBe(1250)
  })

  it('arrondit au centime plutôt que de tronquer', () => {
    expect(parseAmountToCents('0,005')).toBe(1)
    expect(parseAmountToCents('19,999')).toBe(2000)
  })

  it('rejette les saisies non numériques, vides ou négatives', () => {
    expect(parseAmountToCents('')).toBeNull()
    expect(parseAmountToCents('abc')).toBeNull()
    expect(parseAmountToCents('-5')).toBeNull()
    expect(parseAmountToCents('0')).toBeNull()
    expect(parseAmountToCents('1,2,3')).toBeNull()
  })
})
