import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

vi.mock('../../core/firebase/randos', () => ({ addRando: vi.fn(() => Promise.resolve()) }))

import { addRando } from '../../core/firebase/randos'
import { AddRandoModal } from './AddRandoModal'

describe('AddRandoModal', () => {
  it('soumet le formulaire et appelle addRando avec les bons champs', async () => {
    const onClose = vi.fn()
    render(<AddRandoModal memberName="Wacil" onClose={onClose} />)
    fireEvent.change(screen.getByPlaceholderText('ex: Lac Blanc'), { target: { value: 'Mont Thou' } })
    fireEvent.change(screen.getByPlaceholderText('ex: Haute-Savoie'), { target: { value: 'Rhône' } })
    fireEvent.change(screen.getByPlaceholderText('15'), { target: { value: '12' } })
    fireEvent.change(screen.getByPlaceholderText('850'), { target: { value: '600' } })
    fireEvent.click(screen.getByText('Proposer la rando'))

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(addRando).toHaveBeenCalledWith({
      name: 'Mont Thou',
      region: 'Rhône',
      diff: 'Moyen',
      dateStart: undefined,
      dateEnd: undefined,
      km: 12,
      dplus: 600,
      komoot: undefined,
      proposedBy: 'Wacil',
    })
  })

  it('la bascule Journée/Plusieurs jours change les champs de date', () => {
    render(<AddRandoModal memberName="Wacil" onClose={() => {}} />)
    expect(screen.getByText('Date')).toBeTruthy()
    expect(screen.queryByText('Du')).toBeNull()
    fireEvent.click(screen.getByText('Plusieurs jours'))
    expect(screen.queryByText('Date')).toBeNull()
    expect(screen.getByText('Du')).toBeTruthy()
    expect(screen.getByText('Au')).toBeTruthy()
  })

  it('ne soumet pas sans nom', () => {
    render(<AddRandoModal memberName="Wacil" onClose={() => {}} />)
    fireEvent.submit(document.querySelector('form')!)
    expect(addRando).not.toHaveBeenCalled()
  })
})
