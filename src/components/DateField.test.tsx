import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { DateField } from './DateField'

describe('DateField', () => {
  it('affiche la date au format français JJ/MM/AAAA quelle que soit la locale', () => {
    render(<DateField name="dateStart" defaultValue="2026-07-17" />)
    // Format construit depuis la chaîne ISO (pas de toLocaleDateString) :
    // insensible à la locale et au fuseau du navigateur.
    expect(screen.getByText('17/07/2026')).toBeTruthy()
  })

  it('affiche le gabarit JJ/MM/AAAA quand vide, puis la date choisie', () => {
    const { container } = render(<DateField name="dateStart" />)
    expect(screen.getByText('JJ/MM/AAAA')).toBeTruthy()
    const input = container.querySelector('input[type="date"]') as HTMLInputElement
    fireEvent.change(input, { target: { value: '2026-12-01' } })
    expect(screen.getByText('01/12/2026')).toBeTruthy()
    expect(input.value).toBe('2026-12-01') // la valeur FormData reste ISO
  })
})
