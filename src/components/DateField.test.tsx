import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { DateField, frToIso } from './DateField'

describe('frToIso', () => {
  it('convertit JJ/MM/AAAA en ISO', () => {
    expect(frToIso('17/07/2026')).toBe('2026-07-17')
  })

  it('rejette les dates inexistantes ou mal formées', () => {
    expect(frToIso('31/02/2026')).toBe('')
    expect(frToIso('2026-07-17')).toBe('')
    expect(frToIso('7/7/2026')).toBe('')
    expect(frToIso('')).toBe('')
  })
})

describe('DateField', () => {
  it('affiche la valeur initiale ISO au format français JJ/MM/AAAA', () => {
    render(<DateField name="dateStart" defaultValue="2026-07-17" />)
    // Format construit depuis la chaîne ISO (pas de toLocaleDateString) :
    // insensible à la locale et au fuseau du navigateur.
    expect(screen.getByLabelText<HTMLInputElement>('Date').value).toBe('17/07/2026')
  })

  it('permet la saisie au clavier avec masque automatique JJ/MM/AAAA', () => {
    render(<DateField name="dateStart" />)
    const input = screen.getByLabelText<HTMLInputElement>('Date')
    expect(input.placeholder).toBe('JJ/MM/AAAA')
    fireEvent.change(input, { target: { value: '01122026' } })
    expect(input.value).toBe('01/12/2026')
    // Les caractères non numériques sont ignorés par le masque
    fireEvent.change(input, { target: { value: '-1a/b2' } })
    expect(input.value).toBe('12')
  })

  it('ouvre un calendrier en français et sélectionner un jour remplit le champ', () => {
    render(<DateField name="dateStart" defaultValue="2026-07-17" />)
    fireEvent.click(screen.getByLabelText('Ouvrir le calendrier'))
    // Mois affiché en français, jours de semaine français
    expect(screen.getByText('juillet 2026')).toBeTruthy()
    expect(screen.getByText('lun')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '25' }))
    expect(screen.getByLabelText<HTMLInputElement>('Date').value).toBe('25/07/2026')
  })

  it('navigue entre les mois (année comprise)', () => {
    render(<DateField name="dateStart" defaultValue="2026-01-15" />)
    fireEvent.click(screen.getByLabelText('Ouvrir le calendrier'))
    fireEvent.click(screen.getByLabelText('Mois précédent'))
    expect(screen.getByText('décembre 2025')).toBeTruthy()
  })
})
