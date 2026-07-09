import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { DepartItem, UserProfile } from '../../core/types'
import type { WithDocId } from '../../hooks/useCollection'

const { usersCol, departItemsCol } = vi.hoisted(() => ({
  usersCol: { path: 'users' },
  departItemsCol: { path: 'departItems' },
}))
const state = {
  users: [] as WithDocId<UserProfile>[],
  departItems: [] as WithDocId<DepartItem>[],
}

vi.mock('../../core/firebase/collections', () => ({ usersCol, departItemsCol }))
vi.mock('../../hooks/useCollection', () => ({
  useCollection: (ref: unknown) => ({
    data: ref === usersCol ? state.users : state.departItems,
    loading: false,
    error: null,
  }),
}))
vi.mock('../../core/firebase/depart', () => ({
  addDepartItem: vi.fn(() => Promise.resolve()),
  assignDepartItem: vi.fn(() => Promise.resolve()),
  deleteDepartItem: vi.fn(() => Promise.resolve()),
  toggleDepartDone: vi.fn(() => Promise.resolve()),
}))

import { assignDepartItem, toggleDepartDone } from '../../core/firebase/depart'
import { CordeePage } from './CordeePage'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  state.users = []
  state.departItems = []
})

describe('CordeePage', () => {
  it('liste les membres avec leurs stats et leur niveau', () => {
    state.users = [
      {
        docId: 'u1',
        email: 'wacil@example.com',
        profile: { name: 'Wacil', level: 2, km: 120, dplus: 4500, sorties: 8 },
      } as unknown as WithDocId<UserProfile>,
    ]
    render(<CordeePage memberName="Wacil" />)
    expect(screen.getByText('Wacil')).toBeTruthy()
    expect(screen.getByText(/120KM · \+4[\s ,]?500M · 8 sorties/)).toBeTruthy()
  })

  it('le toggle de la checklist départ appelle toggleDepartDone', () => {
    state.departItems = [{ docId: 'd1', id: 1, name: 'Tente', done: false }]
    const { container } = render(<CordeePage memberName="Wacil" />)
    fireEvent.click(container.querySelector('.gear-check')!)
    expect(toggleDepartDone).toHaveBeenCalledWith('d1', true)
  })

  it("« Prendre en charge » assigne l'item au membre, « Me retirer » le désassigne", () => {
    state.departItems = [
      { docId: 'd1', id: 1, name: 'Tente', done: false },
      { docId: 'd2', id: 2, name: 'Réchaud', done: false, assignee: 'Wacil' },
    ]
    render(<CordeePage memberName="Wacil" />)
    fireEvent.click(screen.getByText('Prendre en charge'))
    expect(assignDepartItem).toHaveBeenCalledWith('d1', 'Wacil')
    fireEvent.click(screen.getByText('Me retirer'))
    expect(assignDepartItem).toHaveBeenCalledWith('d2', null)
    expect(screen.getByText('Pris en charge par Wacil')).toBeTruthy()
  })

  it('affiche AUCUN ARTICLE quand la checklist est vide', () => {
    render(<CordeePage memberName="Wacil" />)
    expect(screen.getByText('AUCUN ARTICLE')).toBeTruthy()
  })
})
