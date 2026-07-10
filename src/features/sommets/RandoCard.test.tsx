import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { RandoCard } from './RandoCard'
import { todayLocalISO } from '../../core/services/dates'
import type { Weather } from '../../core/services/weather'
import { makeRando } from '../../test/factories'

vi.mock('../../hooks/useWeather', () => ({ useWeather: vi.fn() }))
vi.mock('../../core/firebase/randos', () => ({
  voteRando: vi.fn(() => Promise.resolve()),
  deleteRando: vi.fn(() => Promise.resolve()),
}))
vi.mock('./RandoDetailModal', () => ({ RandoDetailModal: () => null }))

import { deleteRando, voteRando } from '../../core/firebase/randos'
import { useWeather } from '../../hooks/useWeather'

beforeEach(() => {
  // Par défaut : météo en chargement (null). Redéfini dans le test météo.
  vi.mocked(useWeather).mockReturnValue(null)
})

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

  it('PARTANT vote « oui » et PEUT-ÊTRE vote « peut »', () => {
    const rando = makeRando()
    render(<RandoCard rando={rando} memberName="Wacil" />)
    fireEvent.click(screen.getByText('PARTANT'))
    expect(voteRando).toHaveBeenCalledWith(rando, 'Wacil', 'oui')
    fireEvent.click(screen.getByText('PEUT-ÊTRE'))
    expect(voteRando).toHaveBeenCalledWith(rando, 'Wacil', 'peut')
  })

  it("Supprimer n'appelle deleteRando qu'après confirmation", () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<RandoCard rando={makeRando({ proposedBy: 'Wacil' })} memberName="Wacil" />)
    fireEvent.click(screen.getByTitle('Supprimer'))
    expect(deleteRando).not.toHaveBeenCalled()
    confirmSpy.mockReturnValue(true)
    fireEvent.click(screen.getByTitle('Supprimer'))
    expect(deleteRando).toHaveBeenCalledWith('d1')
    confirmSpy.mockRestore()
  })

  it('affiche le badge J-x pour une date future', () => {
    // Arithmétique en jours calendaires locaux (stable au passage heure d'été/hiver)
    const in3days = new Date()
    in3days.setDate(in3days.getDate() + 3)
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
