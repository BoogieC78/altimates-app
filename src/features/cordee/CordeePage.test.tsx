import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
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
  withdrawDepartItem: vi.fn(() => Promise.resolve()),
}))

import { assignDepartItem, toggleDepartDone, withdrawDepartItem } from '../../core/firebase/depart'
import { CordeePage } from './CordeePage'

afterEach(() => {
  state.users = []
  state.departItems = []
})

describe('CordeePage', () => {
  it('liste les membres avec leurs stats et leur niveau', () => {
    state.users = [
      {
        docId: 'u1',
        email: 'wacil@example.com',
        profile: { name: 'Wacil', level: 'expert', km: 120, dplus: 4500, sorties: 8 },
      } as unknown as WithDocId<UserProfile>,
    ]
    render(<CordeePage memberName="Wacil" />)
    expect(screen.getByText('Wacil')).toBeTruthy()
    // Séparateur de milliers dépendant de la locale : espace, point, virgule…
    expect(screen.getByText(/120KM · \+4[\s.,]?500M · 8 sorties/)).toBeTruthy()
    expect(screen.getByText('Expert')).toBeTruthy()
  })

  it('le bouton d\'état « À préparer » passe l\'item à prêt via toggleDepartDone', () => {
    state.departItems = [{ docId: 'd1', id: 1, name: 'Tente', done: false }]
    render(<CordeePage memberName="Wacil" />)
    fireEvent.click(screen.getByText('À préparer'))
    expect(toggleDepartDone).toHaveBeenCalledWith('d1', true)
  })

  it('le bouton d\'état « ✓ Prêt » repasse l\'item à préparer', () => {
    state.departItems = [{ docId: 'd1', id: 1, name: 'Tente', done: true }]
    render(<CordeePage memberName="Wacil" />)
    fireEvent.click(screen.getByText('✓ Prêt'))
    expect(toggleDepartDone).toHaveBeenCalledWith('d1', false)
  })

  it("« Prendre en charge » assigne l'item, « Me retirer » désassigne ET remet à préparer", () => {
    state.departItems = [
      { docId: 'd1', id: 1, name: 'Tente', done: false },
      { docId: 'd2', id: 2, name: 'Réchaud', done: true, assignee: 'Wacil' },
    ]
    render(<CordeePage memberName="Wacil" />)
    fireEvent.click(screen.getByText('Prendre en charge'))
    expect(assignDepartItem).toHaveBeenCalledWith('d1', 'Wacil')
    fireEvent.click(screen.getByText('Me retirer'))
    expect(withdrawDepartItem).toHaveBeenCalledWith('d2')
    expect(assignDepartItem).toHaveBeenCalledTimes(1)
  })

  it("la ligne d'état combine assignation et préparation", () => {
    state.departItems = [
      { docId: 'd1', id: 1, name: 'Tente', done: false, assignee: 'Wacil' },
      { docId: 'd2', id: 2, name: 'Réchaud', done: true, assignee: 'Adebola' },
      { docId: 'd3', id: 3, name: 'Corde', done: false },
    ]
    render(<CordeePage memberName="Wacil" />)
    expect(screen.getByText("Wacil s'en occupe · pas encore prêt")).toBeTruthy()
    expect(screen.getByText("Adebola s'en occupe · prêt")).toBeTruthy()
    expect(screen.getByText('Personne dessus')).toBeTruthy()
  })

  it('affiche AUCUN ARTICLE quand la checklist est vide', () => {
    render(<CordeePage memberName="Wacil" />)
    expect(screen.getByText('AUCUN ARTICLE')).toBeTruthy()
  })
})
