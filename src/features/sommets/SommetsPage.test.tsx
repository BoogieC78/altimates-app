import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Rando, RandoMedia } from '../../core/types'
import type { WithDocId } from '../../hooks/useCollection'
import { makeRando } from '../../test/factories'

const state = {
  data: [] as WithDocId<Rando>[],
  loading: false,
  error: null as Error | null,
}

// La page s'abonne à DEUX collections (randos + photos) : un mock qui renverrait
// le même état pour les deux passerait les randos pour des photos.
const mediaState = { data: [] as WithDocId<RandoMedia>[], loading: false, error: null as Error | null }

// `vi.hoisted` : les vi.mock sont remontés au-dessus des const, un simple
// `const MEDIA_COL = ...` serait dans sa zone morte quand la fabrique s'exécute.
const { RANDOS_COL, MEDIA_COL } = vi.hoisted(() => ({
  RANDOS_COL: { id: 'randos' },
  MEDIA_COL: { id: 'randoMedia' },
}))

vi.mock('../../core/firebase/collections', () => ({ randosCol: RANDOS_COL, randoMediaCol: MEDIA_COL }))
vi.mock('../../hooks/useCollection', () => ({
  useCollection: (col: unknown) => (col === MEDIA_COL ? mediaState : state),
}))
vi.mock('./RandoCard', () => ({
  RandoCard: ({ rando, photos }: { rando: WithDocId<Rando>; photos?: unknown[] }) => (
    <div data-testid="rando" data-photos={photos?.length ?? 0}>
      {rando.name}
    </div>
  ),
}))
vi.mock('./AddRandoModal', () => ({ AddRandoModal: () => null }))

import { SommetsPage } from './SommetsPage'

afterEach(() => {
  state.data = []
  state.loading = false
  state.error = null
  mediaState.data = []
})

let nextId = 1
function rando(name: string, dateStart: string | null): WithDocId<Rando> {
  // id métier distinct par rando : les pièces jointes (photos, dépenses…) sont
  // indexées dessus, deux randos partageant un id partageraient leurs données.
  return makeRando({ docId: name, id: nextId++, name, dateStart })
}

describe('SommetsPage', () => {
  it('affiche un état vide quand aucune rando à venir', () => {
    render(<SommetsPage memberName="Wacil" />)
    expect(screen.getByText('Aucune sortie planifiée. Propose la prochaine !')).toBeTruthy()
    expect(screen.queryByText('Sorties passées')).toBeNull()
  })

  it('sépare les randos à venir des sorties passées', () => {
    state.data = [rando('Vieille sortie', '2020-01-01'), rando('Future sortie', '2999-01-01')]
    render(<SommetsPage memberName="Wacil" />)
    expect(screen.getByText('Sorties passées')).toBeTruthy()
    const cards = screen.getAllByTestId('rando').map((c) => c.textContent)
    expect(cards).toEqual(['Future sortie', 'Vieille sortie'])
  })

  it('trie les randos à venir par date croissante, sans date en dernier', () => {
    state.data = [rando('Sans date', null), rando('Loin', '2999-02-01'), rando('Proche', '2999-01-01')]
    render(<SommetsPage memberName="Wacil" />)
    const cards = screen.getAllByTestId('rando').map((c) => c.textContent)
    expect(cards).toEqual(['Proche', 'Loin', 'Sans date'])
  })

  it('affiche le spinner pendant le chargement', () => {
    state.loading = true
    const { container } = render(<SommetsPage memberName="Wacil" />)
    expect(container.querySelector('.spinner')).toBeTruthy()
    expect(screen.getByText('CHARGEMENT…')).toBeTruthy()
  })

  it("affiche le message d'erreur sans aucune carte en cas d'erreur", () => {
    state.data = [rando('Future sortie', '2999-01-01')]
    state.error = new Error('boom')
    render(<SommetsPage memberName="Wacil" />)
    expect(screen.getByText('boom')).toBeTruthy()
    expect(screen.queryAllByTestId('rando')).toHaveLength(0)
  })

  it('remet à chaque carte les photos de SA sortie, et pas celles des autres', () => {
    state.data = [rando('Avec photos', '2999-01-01'), rando('Sans photo', '2999-02-01')]
    const randoId = String(state.data[0].id)
    mediaState.data = [
      { docId: 'p1', randoId, dataUrl: 'data:image/jpeg;base64,a', author: 'Wacil' },
      { docId: 'p2', randoId, dataUrl: 'data:image/jpeg;base64,b', author: 'Wacil' },
    ] as unknown as WithDocId<RandoMedia>[]

    render(<SommetsPage memberName="Wacil" />)
    const counts = screen.getAllByTestId('rando').map((c) => c.getAttribute('data-photos'))
    expect(counts).toEqual(['2', '0'])
  })
})
