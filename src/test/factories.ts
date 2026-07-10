import type { Rando } from '../core/types'
import type { WithDocId } from '../hooks/useCollection'

/** Fabrique de rando partagée entre les tests de composants. */
export function makeRando(over: Partial<WithDocId<Rando>> = {}): WithDocId<Rando> {
  return {
    docId: 'd1',
    id: 1,
    name: 'Lac Blanc',
    region: 'Haute-Savoie',
    km: 15,
    dplus: 850,
    dur: '1j',
    votes: { oui: 2, peut: 1 },
    ...over,
  }
}
