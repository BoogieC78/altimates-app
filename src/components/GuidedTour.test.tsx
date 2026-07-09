import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { GuidedTour, shouldShowTour } from './GuidedTour'

afterEach(cleanup)
beforeEach(() => localStorage.clear())

describe('GuidedTour', () => {
  it('affiche la première slide et navigue avec Suivant', () => {
    render(<GuidedTour onDone={() => {}} />)
    expect(screen.getByText('Bienvenue sur ALTImates').className).toContain('tuto-title')
    expect(document.querySelector('.tuto-slide.active')!.textContent).toContain('Bienvenue sur ALTImates')
    fireEvent.click(screen.getByText('Suivant →'))
    expect(document.querySelector('.tuto-slide.active')!.textContent).toContain('Planifie les Sommets')
  })

  it('permet de revenir en arrière avec ←', () => {
    render(<GuidedTour onDone={() => {}} />)
    fireEvent.click(screen.getByText('Suivant →'))
    fireEvent.click(screen.getByText('←'))
    expect(document.querySelector('.tuto-slide.active')!.textContent).toContain('Bienvenue sur ALTImates')
  })

  it("« C'est parti » sur la dernière slide appelle onDone et écrit le localStorage", () => {
    const onDone = vi.fn()
    render(<GuidedTour onDone={onDone} />)
    for (let i = 0; i < 4; i++) fireEvent.click(screen.getByText('Suivant →'))
    fireEvent.click(screen.getByText("C'est parti →"))
    expect(onDone).toHaveBeenCalledTimes(1)
    expect(localStorage.getItem('altimates-tuto-done')).toBe('1')
    expect(shouldShowTour()).toBe(false)
  })

  it('« Passer » termine aussi le tour', () => {
    const onDone = vi.fn()
    render(<GuidedTour onDone={onDone} />)
    fireEvent.click(screen.getByText('Passer →'))
    expect(onDone).toHaveBeenCalledTimes(1)
    expect(localStorage.getItem('altimates-tuto-done')).toBe('1')
  })
})
