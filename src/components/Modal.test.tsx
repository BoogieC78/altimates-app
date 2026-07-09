import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Modal } from './Modal'

afterEach(cleanup)

describe('Modal', () => {
  it('affiche le titre et le contenu', () => {
    render(
      <Modal title="Mon titre" onClose={() => {}}>
        <p>Contenu du modal</p>
      </Modal>,
    )
    expect(screen.getByText('Mon titre')).toBeTruthy()
    expect(screen.getByText('Contenu du modal')).toBeTruthy()
  })

  it('ferme via le bouton ✕', () => {
    const onClose = vi.fn()
    render(
      <Modal title="T" onClose={onClose}>
        <p>x</p>
      </Modal>,
    )
    fireEvent.click(screen.getByLabelText('Fermer'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('ferme via un clic sur l\'overlay mais pas sur le contenu', () => {
    const onClose = vi.fn()
    const { container } = render(
      <Modal title="T" onClose={onClose}>
        <p>Contenu</p>
      </Modal>,
    )
    fireEvent.click(screen.getByText('Contenu'))
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.click(container.querySelector('.modal-wrap')!)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
