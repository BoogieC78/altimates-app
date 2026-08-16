import { describe, expect, it } from 'vitest'
import type { Rando } from '../types'
import {
  BADGE_TIERS,
  badgeForCount,
  badgeProgress,
  countDoneOutings,
  hasOrganized,
  nextBadgeFor,
} from './badges'

const TODAY = '2026-08-16'

function rando(over: Partial<Rando> = {}): Rando {
  return {
    id: 1,
    name: 'Lac Blanc',
    region: 'Haute-Savoie',
    votes: { oui: 0, peut: 0 },
    ...over,
  }
}

describe('BADGE_TIERS', () => {
  it('contient 10 paliers aux seuils croissants validés', () => {
    expect(BADGE_TIERS.map((t) => t.threshold)).toEqual([1, 3, 8, 15, 25, 40, 60, 90, 130, 180])
    expect(BADGE_TIERS.map((t) => t.rank)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })

  it('découpe les zones : verte 1-3, bleu-vert 4-7, ambre 8-10', () => {
    expect(BADGE_TIERS.map((t) => t.zone)).toEqual([
      'verte', 'verte', 'verte',
      'bleu-vert', 'bleu-vert', 'bleu-vert', 'bleu-vert',
      'ambre', 'ambre', 'ambre',
    ])
  })
})

describe('badgeForCount — seuils exacts', () => {
  it('0 sortie = aucun badge', () => {
    expect(badgeForCount(0)).toBeNull()
  })

  it('1 sortie = Écureuil roux', () => {
    expect(badgeForCount(1)?.animal).toBe('Écureuil roux')
  })

  it('2 sorties = toujours Écureuil roux (le Renard est à 3)', () => {
    expect(badgeForCount(2)?.animal).toBe('Écureuil roux')
  })

  it('3 sorties = Renard', () => {
    expect(badgeForCount(3)?.animal).toBe('Renard')
  })

  it('179 sorties = Gypaète barbu', () => {
    expect(badgeForCount(179)?.animal).toBe('Gypaète barbu')
  })

  it("180 sorties = Aigle royal (et au-delà aussi)", () => {
    expect(badgeForCount(180)?.animal).toBe('Aigle royal')
    expect(badgeForCount(500)?.animal).toBe('Aigle royal')
  })
})

describe('nextBadgeFor', () => {
  it('0 sortie → prochain palier Écureuil roux', () => {
    expect(nextBadgeFor(0)?.animal).toBe('Écureuil roux')
  })

  it('89 sorties → prochain palier Bouquetin', () => {
    expect(nextBadgeFor(89)?.animal).toBe('Bouquetin')
  })

  it('180 sorties → plus de palier suivant', () => {
    expect(nextBadgeFor(180)).toBeNull()
  })
})

describe('countDoneOutings', () => {
  it('compte les sorties passées où le membre a voté oui', () => {
    const randos = [
      rando({ id: 1, dateStart: '2026-01-10', memberVotes: { Wacil: 'oui' } }),
      rando({ id: 2, dateStart: '2026-02-01', dateEnd: '2026-02-02', memberVotes: { Wacil: 'oui', Marc: 'oui' } }),
    ]
    expect(countDoneOutings(randos, 'Wacil', TODAY)).toBe(2)
    expect(countDoneOutings(randos, 'Marc', TODAY)).toBe(1)
  })

  it('exclut une sortie future même votée oui', () => {
    const randos = [rando({ dateStart: '2999-01-01', memberVotes: { Wacil: 'oui' } })]
    expect(countDoneOutings(randos, 'Wacil', TODAY)).toBe(0)
  })

  it("exclut la sortie du jour même (réf. date de fin, comme isPast)", () => {
    const randos = [rando({ dateStart: TODAY, memberVotes: { Wacil: 'oui' } })]
    expect(countDoneOutings(randos, 'Wacil', TODAY)).toBe(0)
  })

  it('exclut un vote non-partant (peut / non) et une absence de vote', () => {
    const randos = [
      rando({ id: 1, dateStart: '2026-01-10', memberVotes: { Wacil: 'peut' } }),
      rando({ id: 2, dateStart: '2026-01-11', memberVotes: { Wacil: 'non' } }),
      rando({ id: 3, dateStart: '2026-01-12' }),
    ]
    expect(countDoneOutings(randos, 'Wacil', TODAY)).toBe(0)
  })

  it('exclut une rando sans date (considérée à venir)', () => {
    const randos = [rando({ memberVotes: { Wacil: 'oui' } })]
    expect(countDoneOutings(randos, 'Wacil', TODAY)).toBe(0)
  })
})

describe('hasOrganized — liseré doré', () => {
  it('vrai si le membre a proposé au moins une sortie', () => {
    const randos = [rando({ proposedBy: 'Wacil' }), rando({ id: 2 })]
    expect(hasOrganized(randos, 'Wacil')).toBe(true)
  })

  it("faux sinon (autre organisateur ou champ absent)", () => {
    const randos = [rando({ proposedBy: 'Marc' }), rando({ id: 2, proposedBy: null })]
    expect(hasOrganized(randos, 'Wacil')).toBe(false)
  })
})

describe('badgeProgress', () => {
  it('sans sortie : pas de badge, prochain Écureuil, ratio 0', () => {
    const p = badgeProgress(0)
    expect(p.current).toBeNull()
    expect(p.next?.animal).toBe('Écureuil roux')
    expect(p.remaining).toBe(1)
    expect(p.ratio).toBe(0)
    expect(p.label).toBe('Prochain palier : Écureuil roux, encore 1 sortie')
  })

  it('au milieu d\'une zone : « Prochain palier : … »', () => {
    const p = badgeProgress(30) // Hermine (25) → Chamois (40)
    expect(p.current?.animal).toBe('Hermine')
    expect(p.next?.animal).toBe('Chamois')
    expect(p.remaining).toBe(10)
    expect(p.ratio).toBeCloseTo(5 / 15)
    expect(p.label).toBe('Prochain palier : Chamois, encore 10 sorties')
  })

  it("au passage d'étage : annonce la couleur suivante", () => {
    const p = badgeProgress(85) // Lagopède (60, bleu-vert) → Bouquetin (90, ambre)
    expect(p.label).toBe("Étage alpin — plus que 5 sorties avant l'ambre")
  })

  it('dernier palier : Aigle royal, ratio plein', () => {
    const p = badgeProgress(200)
    expect(p.current?.animal).toBe('Aigle royal')
    expect(p.next).toBeNull()
    expect(p.ratio).toBe(1)
    expect(p.label).toBe('Aigle royal — au-dessus de tout')
  })
})
