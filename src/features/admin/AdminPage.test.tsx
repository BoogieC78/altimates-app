import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { UserProfile } from '../../core/types'

vi.mock('../../core/firebase/admin', () => ({
  FLUSHABLE_COLLECTIONS: ['randos', 'messages', 'feedbacks', 'departItems'],
  countCollection: vi.fn((name: string) => Promise.resolve(name === 'randos' ? 4 : 2)),
  flushCollection: vi.fn(() => Promise.resolve()),
  getAllowedEmails: vi.fn(() => Promise.resolve(['wacil@example.com'])),
  addAllowedEmail: vi.fn(() => Promise.resolve()),
  removeAllowedEmail: vi.fn(() => Promise.resolve()),
  listUsers: vi.fn(() =>
    Promise.resolve([
      { docId: 'u1', email: 'hammadou.nordine@gmail.com', profile: { name: 'Nordine' } },
    ] as (UserProfile & { docId: string })[]),
  ),
}))
vi.mock('../../core/firebase/auth', () => ({ ADMIN_EMAIL: 'hammadou.nordine@gmail.com' }))

import { addAllowedEmail } from '../../core/firebase/admin'
import { AdminPage } from './AdminPage'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('AdminPage', () => {
  it('rend les sections principales', async () => {
    render(<AdminPage memberName="Wacil" />)
    expect(screen.getByText('PANNEAU ADMIN')).toBeTruthy()
    expect(screen.getByText('Données Firestore')).toBeTruthy()
    expect(screen.getByText('Membres')).toBeTruthy()
    expect(await screen.findByText('Nordine')).toBeTruthy()
  })

  it('affiche les compteurs de collections via countCollection', async () => {
    render(<AdminPage memberName="Wacil" />)
    expect(await screen.findByText('4 entrées')).toBeTruthy()
    expect((await screen.findAllByText('2 entrées')).length).toBe(3)
  })

  it("marque l'utilisateur admin avec le badge ADMIN", async () => {
    render(<AdminPage memberName="Wacil" />)
    await screen.findByText('Nordine')
    // Un badge dans le bandeau + un sur le membre admin
    expect(screen.getAllByText('ADMIN')).toHaveLength(2)
  })

  it("l'ajout d'un email appelle addAllowedEmail (normalisé en minuscules)", async () => {
    render(<AdminPage memberName="Wacil" />)
    await screen.findByText('wacil@example.com')
    fireEvent.change(screen.getByPlaceholderText('Ajouter un email…'), {
      target: { value: '  Nouveau@Mail.com ' },
    })
    fireEvent.click(screen.getByText('Ajouter'))
    expect(addAllowedEmail).toHaveBeenCalledWith('nouveau@mail.com')
  })

  it("refuse un email invalide sans appeler addAllowedEmail", async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    render(<AdminPage memberName="Wacil" />)
    fireEvent.change(screen.getByPlaceholderText('Ajouter un email…'), { target: { value: 'pasunemail' } })
    fireEvent.click(screen.getByText('Ajouter'))
    expect(alertSpy).toHaveBeenCalled()
    expect(addAllowedEmail).not.toHaveBeenCalled()
    alertSpy.mockRestore()
  })
})
