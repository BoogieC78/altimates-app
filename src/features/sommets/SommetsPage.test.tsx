import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Rando } from '../../core/types'
import type { WithDocId } from '../../hooks/useCollection'
import { makeRando } from '../../test/factories'

const state = {
  data: [] as WithDocId<Rando>[],
  loading: false,
  error: null as Error | null,
}

vi.mock('../../core/firebase/collections', () => ({ randosCol: {} }))
vi.mock('../../hooks/useCollection', () => ({ useCollection: () => state }))
vi.mock('./RandoCard', () => ({
  RandoCard: ({ rando }: { rando: WithDocId<Rando> }) => <div data-testid="rando">{rando.name}</div>,
}))
vi.mock('./AddRandoModal', () => ({ AddRandoModal: () => null }))

import { SommetsPage } from './SommetsPage'

afterEach(() => {
  state.data = []
  state.loading = false
  state.error = null
})

function rando(name: string, dateStart: string | null): WithDocId<Rando> {
  return makeRando({ docId: name, name, dateStart })
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
})
