import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { PhotoLightbox, type LightboxPhoto } from './PhotoLightbox'

function photos(n: number): LightboxPhoto[] {
  const authors = ['Nordine', 'Wacil', 'Sofia']
  return Array.from({ length: n }, (_, i) => ({
    docId: `p${i + 1}`,
    dataUrl: `data:image/jpeg;base64,photo${i + 1}`,
    author: authors[i % authors.length],
  }))
}

/** Source de l'image actuellement affichée en grand (la seule <img> de la vue). */
function shown(): string {
  return screen.getByRole('dialog').querySelector('img')?.getAttribute('src') ?? ''
}

describe('PhotoLightbox', () => {
  it('affiche la photo par laquelle on est entré, pas la première de la série', () => {
    render(<PhotoLightbox photos={photos(3)} startIndex={2} onClose={vi.fn()} />)
    expect(shown()).toBe('data:image/jpeg;base64,photo3')
    expect(screen.getByText(/3\/3/)).toBeTruthy()
  })

  it('navigue au clic sur les flèches', () => {
    render(<PhotoLightbox photos={photos(3)} startIndex={0} onClose={vi.fn()} />)
    fireEvent.click(screen.getByLabelText('Photo suivante'))
    expect(shown()).toBe('data:image/jpeg;base64,photo2')
    fireEvent.click(screen.getByLabelText('Photo précédente'))
    expect(shown()).toBe('data:image/jpeg;base64,photo1')
  })

  it('navigue au clavier et boucle aux extrémités', () => {
    render(<PhotoLightbox photos={photos(3)} startIndex={0} onClose={vi.fn()} />)
    const dialog = screen.getByRole('dialog')
    fireEvent.keyDown(dialog, { key: 'ArrowLeft' })
    expect(shown()).toBe('data:image/jpeg;base64,photo3')
    fireEvent.keyDown(dialog, { key: 'ArrowRight' })
    expect(shown()).toBe('data:image/jpeg;base64,photo1')
  })

  it("ne ferme pas la vue quand on change de photo", () => {
    // Le fond ferme au clic : sans arrêt de propagation sur les flèches, appuyer
    // sur « suivant » refermerait la vue au lieu de naviguer.
    const onClose = vi.fn()
    render(<PhotoLightbox photos={photos(2)} startIndex={0} onClose={onClose} />)
    fireEvent.click(screen.getByLabelText('Photo suivante'))
    expect(onClose).not.toHaveBeenCalled()
    expect(shown()).toBe('data:image/jpeg;base64,photo2')
  })

  it('ferme au clavier, au bouton, et au clic sur le fond', () => {
    const onClose = vi.fn()
    const { unmount } = render(<PhotoLightbox photos={photos(2)} startIndex={0} onClose={onClose} />)
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByLabelText('Fermer la photo'))
    expect(onClose).toHaveBeenCalledTimes(2)
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).toHaveBeenCalledTimes(3)
    unmount()
  })

  it("n'affiche pas de navigation pour une seule photo", () => {
    render(<PhotoLightbox photos={photos(1)} startIndex={0} onClose={vi.fn()} />)
    expect(screen.queryByLabelText('Photo suivante')).toBeNull()
    expect(screen.queryByLabelText('Photo précédente')).toBeNull()
  })

  it('est une boîte de dialogue annoncée, qui prend le focus', () => {
    render(<PhotoLightbox photos={photos(2)} startIndex={0} onClose={vi.fn()} />)
    const dialog = screen.getByRole('dialog', { name: /photo 1 sur 2, partagée par nordine/i })
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    expect(document.activeElement).toBe(dialog)
  })

  it('rend le focus à l\'élément déclencheur en se fermant', () => {
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    trigger.focus()

    const { unmount } = render(<PhotoLightbox photos={photos(1)} startIndex={0} onClose={vi.fn()} />)
    expect(document.activeElement).not.toBe(trigger)
    unmount()
    expect(document.activeElement).toBe(trigger)

    trigger.remove()
  })

  it('se referme si la dernière photo est supprimée pendant la consultation', () => {
    const onClose = vi.fn()
    const { rerender } = render(<PhotoLightbox photos={photos(1)} startIndex={0} onClose={onClose} />)
    rerender(<PhotoLightbox photos={[]} startIndex={0} onClose={onClose} />)
    expect(onClose).toHaveBeenCalled()
  })

  it("retombe sur la dernière photo restante quand celle affichée est supprimée", () => {
    // Sans le garde-fou sur l'index, l'écran deviendrait noir : on pointerait
    // une photo qui n'existe plus.
    const { rerender } = render(<PhotoLightbox photos={photos(3)} startIndex={2} onClose={vi.fn()} />)
    rerender(<PhotoLightbox photos={photos(2)} startIndex={2} onClose={vi.fn()} />)
    expect(shown()).toBe('data:image/jpeg;base64,photo2')
  })
})
