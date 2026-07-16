import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { NamePromptModal } from './NamePromptModal'

describe('NamePromptModal', () => {
  it('désactive le bouton tant que le prénom est vide ou blanc', () => {
    const onSave = vi.fn()
    render(<NamePromptModal onSave={onSave} />)

    const btn = screen.getByRole('button', { name: "C'est parti" })
    expect(btn).toBeDisabled()

    fireEvent.change(screen.getByPlaceholderText('Ton prénom'), { target: { value: '   ' } })
    expect(btn).toBeDisabled()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('envoie le prénom trimé à la soumission', () => {
    const onSave = vi.fn()
    render(<NamePromptModal onSave={onSave} />)

    fireEvent.change(screen.getByPlaceholderText('Ton prénom'), { target: { value: '  Ismail  ' } })
    fireEvent.click(screen.getByRole('button', { name: "C'est parti" }))

    expect(onSave).toHaveBeenCalledWith('Ismail')
  })

  it("n'a pas de bouton fermer : la saisie est obligatoire", () => {
    render(<NamePromptModal onSave={vi.fn()} />)
    expect(screen.queryByRole('button', { name: 'Fermer' })).not.toBeInTheDocument()
  })
})
