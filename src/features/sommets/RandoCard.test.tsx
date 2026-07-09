import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { RandoCard } from './RandoCard'
import { todayLocalISO } from '../../core/services/dates'
import type { Weather } from '../../core/services/weather'
import type { Rando } from '../../core/types'
import type { WithDocId } from '../../hooks/useCollection'

vi.mock('../../hooks/useWeather', () => ({ useWeather: vi.fn(() => null) }))
vi.mock('../../core/firebase/randos', () => ({
  voteRando: vi.fn(() => Promise.resolve()),
  deleteRando: vi.fn(() => Promise.resolve()),
}))
vi.mock('./RandoDetailModal', () => ({ RandoDetailModal: () => null }))

import { useWeather } from '../../hooks/useWeather'

afterEach(() => {
  cleanup()
  vi.mocked(useWeather).mockReturnValue(null)
})

function makeRando(over: Partial<Rando> = {}): WithDocId<Rando> {
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

describe('RandoCard', () => {
  it('affiche le nom, la région et les stats', () => {
    render(<RandoCard rando={makeRando()} memberName="Wacil" />)
    expect(screen.getByText('Lac Blanc')).toBeTruthy()
    expect(screen.getByText('Haute-Savoie')).toBeTruthy()
    expect(screen.getByText('15km')).toBeTruthy()
    expect(screen.getByText('+850m')).toBeTruthy()
  })

  it('affiche « ✓ VOTÉ » si le membre a déjà voté oui, sinon PARTANT', () => {
    const { rerender } = render(
      <RandoCard rando={makeRando({ memberVotes: { Wacil: 'oui' } })} memberName="Wacil" />,
    )
    expect(screen.getByText('✓ VOTÉ')).toBeTruthy()
    rerender(<RandoCard rando={makeRando({ memberVotes: { Nordine: 'oui' } })} memberName="Wacil" />)
    expect(screen.getByText('PARTANT')).toBeTruthy()
  })

  it('affiche le badge J-x pour une date future', () => {
    const in3days = new Date(Date.now() + 3 * 86400000)
    render(
      <RandoCard rando={makeRando({ dateStart: todayLocalISO(in3days) })} memberName="Wacil" />,
    )
    expect(screen.getByText('J-3')).toBeTruthy()
  })

  it('affiche le spinner météo en chargement puis N/A en erreur puis les données', () => {
    const { rerender, container } = render(
      <RandoCard rando={makeRando({ lat: 45.9, lon: 6.8 })} memberName="Wacil" />,
    )
    expect(container.querySelector('.rcard-wx .spinner')).toBeTruthy()

    vi.mocked(useWeather).mockReturnValue('error')
    rerender(<RandoCard rando={makeRando({ lat: 45.9, lon: 6.8 })} memberName="Wacil" />)
    expect(screen.getByText('N/A')).toBeTruthy()

    const weather: Weather = {
      temp: 18,
      wind: 12,
      icon: '☀️',
      label: 'BON',
      quality: 'ok',
      forecast: [],
    }
    vi.mocked(useWeather).mockReturnValue(weather)
    rerender(<RandoCard rando={makeRando({ lat: 45.9, lon: 6.8 })} memberName="Wacil" />)
    expect(screen.getByText('18°')).toBeTruthy()
    expect(screen.getByText('BON')).toBeTruthy()
  })

  it('affiche le bouton supprimer uniquement pour le proposeur', () => {
    const { rerender } = render(
      <RandoCard rando={makeRando({ proposedBy: 'Wacil' })} memberName="Wacil" />,
    )
    expect(screen.getByTitle('Supprimer')).toBeTruthy()
    rerender(<RandoCard rando={makeRando({ proposedBy: 'Nordine' })} memberName="Wacil" />)
    expect(screen.queryByTitle('Supprimer')).toBeNull()
  })
})
