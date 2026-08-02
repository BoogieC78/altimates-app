import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Avatar, avatarColor } from './Avatar'

describe('Avatar', () => {
  it('affiche la photo quand le membre en a une', () => {
    const { container } = render(<Avatar name="Nordine" photo="data:image/jpeg;base64,abc" size={32} />)
    const img = container.querySelector('img')
    expect(img?.getAttribute('src')).toBe('data:image/jpeg;base64,abc')
  })

  it('retombe sur les initiales quand aucune photo', () => {
    const { container } = render(<Avatar name="Nordine" photo={null} />)
    expect(container.querySelector('img')).toBeNull()
    expect(screen.getByText('NO')).toBeTruthy()
  })

  it('reste invisible aux lecteurs d\'écran : le prénom est déjà écrit à côté', () => {
    const { container } = render(<Avatar name="Nordine" photo="data:image/jpeg;base64,abc" />)
    expect(container.querySelector('img')?.getAttribute('aria-hidden')).toBe('true')
    expect(container.querySelector('img')?.getAttribute('alt')).toBe('')
  })
})

describe('avatarColor', () => {
  it('donne toujours la même couleur au même prénom', () => {
    // C'est tout l'intérêt du repère visuel : une couleur dérivée d'un index de
    // boucle changerait dès qu'un membre s'ajoute ou qu'un tri bouge.
    expect(avatarColor('Nordine')).toBe(avatarColor('Nordine'))
  })

  it('distingue des prénoms différents', () => {
    const noms = ['Wacil', 'Nordine', 'Sofia', 'Adebola', 'Ismail']
    expect(new Set(noms.map(avatarColor)).size).toBeGreaterThan(1)
  })

  it('renvoie une couleur exploitable même pour un nom vide', () => {
    expect(avatarColor('')).toMatch(/^#[0-9A-Fa-f]{6}$/)
  })
})
