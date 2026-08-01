import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { TransportDoc } from '../../core/types'
import type { WithDocId } from '../../hooks/useCollection'
import { makeRando } from '../../test/factories'

vi.mock('../../core/firebase/collections', () => ({ transportCol: { path: 'transport' } }))

const docs: WithDocId<TransportDoc>[] = []

vi.mock('../../hooks/useCollection', () => ({
  useCollection: () => ({ data: docs, loading: false, error: null }),
}))

const setTransport = vi.fn(() => Promise.resolve())
const clearTransport = vi.fn(() => Promise.resolve())
vi.mock('../../core/firebase/transport', () => ({
  setTransport: (...args: unknown[]) => setTransport(...(args as [])),
  clearTransport: (...args: unknown[]) => clearTransport(...(args as [])),
}))

import { TransportTab } from './TransportTab'

function decl(member: string, mode: TransportDoc['mode'], seats?: number): WithDocId<TransportDoc> {
  return { docId: `1__${member}`, randoId: '1', member, mode, ...(seats !== undefined ? { seats } : {}) }
}

const septPartants = makeRando({
  id: 1,
  memberVotes: {
    Nordine: 'oui',
    Ismail: 'oui',
    Sofia: 'oui',
    Wacil: 'oui',
    Thomas: 'oui',
    Lea: 'oui',
    Marc: 'oui',
  },
})

afterEach(() => {
  docs.length = 0
})

describe('TransportTab', () => {
  it('annonce 3 voitures nécessaires pour 7 partants', () => {
    render(<TransportTab rando={septPartants} memberName="Nordine" />)
    expect(screen.getByText('Voitures nécessaires')).toBeTruthy()
    expect(screen.getByText('3')).toBeTruthy()
  })

  it('signale le manque quand 2 voitures ne couvrent pas 7 personnes', () => {
    docs.push(decl('Nordine', 'voiture', 2), decl('Ismail', 'voiture', 2))
    render(<TransportTab rando={septPartants} memberName="Sofia" />)
    expect(screen.getByText('Il manque 1 voiture (1 place)')).toBeTruthy()
  })

  it('confirme quand tout le monde a une place', () => {
    const rando = makeRando({ id: 1, memberVotes: { Nordine: 'oui', Ismail: 'oui', Sofia: 'oui' } })
    docs.push(decl('Nordine', 'voiture', 2), decl('Ismail', 'passager'), decl('Sofia', 'passager'))
    render(<TransportTab rando={rando} memberName="Sofia" />)
    expect(screen.getByText('Tout le monde a une place')).toBeTruthy()
  })

  it('enregistre la déclaration du membre courant', () => {
    render(<TransportTab rando={septPartants} memberName="Nordine" />)
    fireEvent.click(screen.getByRole('button', { name: "J'amène ma voiture" }))
    expect(setTransport).toHaveBeenCalledWith('1', 'Nordine', 'voiture', 2)
  })

  it('retire la déclaration si le membre reclique son mode actuel', () => {
    docs.push(decl('Nordine', 'passager'))
    render(<TransportTab rando={septPartants} memberName="Nordine" />)
    fireEvent.click(screen.getByRole('button', { name: 'Je cherche une place' }))
    expect(clearTransport).toHaveBeenCalledWith('1', 'Nordine')
    expect(setTransport).not.toHaveBeenCalled()
  })

  it('ne propose le réglage des places qu\'au conducteur', () => {
    docs.push(decl('Nordine', 'passager'))
    const { unmount } = render(<TransportTab rando={septPartants} memberName="Nordine" />)
    expect(screen.queryByLabelText(/Places passagers/)).toBeNull()

    unmount()
    docs.length = 0
    docs.push(decl('Nordine', 'voiture', 3))
    render(<TransportTab rando={septPartants} memberName="Nordine" />)
    expect(screen.getByLabelText(/Places passagers/)).toBeTruthy()
  })

  it('exclut les non-véhiculés et le signale', () => {
    const rando = makeRando({ id: 1, memberVotes: { Nordine: 'oui', Sofia: 'oui' } })
    docs.push(decl('Nordine', 'voiture', 2), decl('Sofia', 'non-vehicule'))
    render(<TransportTab rando={rando} memberName="Nordine" />)
    expect(screen.getByText(/Sofia sans voiture/)).toBeTruthy()
    expect(screen.getByText('Tout le monde a une place')).toBeTruthy()
  })
})
