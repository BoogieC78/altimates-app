import { describe, expect, it } from 'vitest'
import {
  calcBesoins,
  calcHydraBesoins,
  calcStockTotal,
  defaultHydraEntry,
  parseJours,
} from './ravito'

describe('calcBesoins', () => {
  it('journée : intersection départ/retour x membres', () => {
    // départ matin ∩ retour après-midi = petitdej 1, lunch 1, snack 1, diner 0
    expect(calcBesoins(1, 5, { depart: 'matin', retour: 'apresmidi' })).toEqual({
      petitdej: 5,
      lunch: 5,
      snack: 5,
      diner: 0,
    })
  })

  it('trek 3j : jour départ + jour complet + jour retour', () => {
    // départ matin (1,1,1,1) + 1 jour complet (1,1,2,1) + retour soir (1,1,1,1), x2 membres
    expect(calcBesoins(3, 2, { depart: 'matin', retour: 'soir' })).toEqual({
      petitdej: 6,
      lunch: 6,
      snack: 8,
      diner: 6,
    })
  })
})

describe('calcStockTotal', () => {
  it('somme les stocks de tous les membres', () => {
    const total = calcStockTotal({
      Wacil: { petitdej: 2, lunch: 1, snack: 0, diner: 1 },
      Nordine: { petitdej: 1, lunch: 0, snack: 3, diner: 0 },
    })
    expect(total).toEqual({ petitdej: 3, lunch: 1, snack: 3, diner: 1 })
  })
})

describe('calcHydraBesoins', () => {
  it('journée : conso x heures + toilette, pas de cuisine', () => {
    const b = calcHydraBesoins(1, 5, defaultHydraEntry())
    expect(b.parPersonneParJour).toBe(500 * 6 + 500)
    expect(b.total).toBe(3500 * 5)
    expect(b.capaciteTotal).toBe(2000 * 5)
  })

  it('trek : ajoute la cuisine du soir', () => {
    const b = calcHydraBesoins(2, 3, defaultHydraEntry())
    expect(b.parPersonneParJour).toBe(500 * 6 + 1000 + 500)
    expect(b.total).toBe(4500 * 3 * 2)
  })
})

describe('parseJours', () => {
  it("parse le libellé de durée, 1 par défaut", () => {
    expect(parseJours('3j')).toBe(3)
    expect(parseJours(undefined)).toBe(1)
    expect(parseJours('trek')).toBe(1)
  })
})
