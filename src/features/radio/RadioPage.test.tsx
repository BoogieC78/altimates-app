import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { RadioMessage, UserProfile } from '../../core/types'
import type { WithDocId } from '../../hooks/useCollection'

const { messagesCol, usersCol } = vi.hoisted(() => ({
  messagesCol: { path: 'messages' },
  usersCol: { path: 'users' },
}))
const state = {
  messages: [] as WithDocId<RadioMessage>[],
  users: [] as WithDocId<UserProfile>[],
}

vi.mock('../../core/firebase/collections', () => ({ messagesCol, usersCol }))
vi.mock('../../hooks/useCollection', () => ({
  useCollection: (ref: unknown) => ({
    data: ref === messagesCol ? state.messages : state.users,
    loading: false,
    error: null,
  }),
}))
vi.mock('../../core/firebase/messages', async (importOriginal) => ({
  // Garde le vrai `initials`, ne stubbe que les écritures Firestore.
  ...(await importOriginal<typeof import('../../core/firebase/messages')>()),
  sendMessage: vi.fn(() => Promise.resolve()),
  markRead: vi.fn(() => Promise.resolve()),
  togglePin: vi.fn(() => Promise.resolve()),
  deleteMessage: vi.fn(() => Promise.resolve()),
}))

import { markRead, sendMessage } from '../../core/firebase/messages'
import { RadioPage } from './RadioPage'

afterEach(() => {
  state.messages = []
  state.users = []
})

function msg(over: Partial<RadioMessage> & { docId: string }): WithDocId<RadioMessage> {
  return { id: 1, author: 'Nordine', text: 'hello', type: 'message', time: 'hier', ...over }
}

describe('RadioPage', () => {
  it('affiche les messages triés par id croissant', () => {
    state.messages = [
      msg({ docId: 'b', id: 2, text: 'Deuxième' }),
      msg({ docId: 'a', id: 1, text: 'Premier' }),
    ]
    const { container } = render(<RadioPage memberName="Wacil" />)
    const texts = [...container.querySelectorAll('.msg-text')].map((e) => e.textContent)
    expect(texts).toEqual(['Premier', 'Deuxième'])
  })

  it('place les messages épinglés dans la section Épinglés', () => {
    state.messages = [
      msg({ docId: 'a', id: 1, text: 'Message normal' }),
      msg({ docId: 'b', id: 2, text: 'Message épinglé', pinned: true }),
    ]
    const { container } = render(<RadioPage memberName="Wacil" />)
    expect(screen.getByText('Épinglés')).toBeTruthy()
    expect(container.querySelector('.msg-pinned .msg-pinned-text')!.textContent).toBe('Message épinglé')
    const feed = [...container.querySelectorAll('.msg-text')].map((e) => e.textContent)
    expect(feed).toEqual(['Message normal'])
  })

  it("l'envoi appelle sendMessage avec l'auteur, le texte et le type actif", () => {
    render(<RadioPage memberName="Wacil" />)
    fireEvent.click(screen.getByText('Alerte'))
    fireEvent.change(screen.getByPlaceholderText('Ton message...'), { target: { value: 'Orage en vue' } })
    fireEvent.click(screen.getByLabelText('Envoyer'))
    expect(sendMessage).toHaveBeenCalledWith('Wacil', 'Orage en vue', 'alerte')
  })

  it("marque comme lus uniquement les messages où mes initiales manquent", () => {
    state.messages = [
      msg({ docId: 'a', id: 1, text: 'Non lu', reads: ['NO'] }),
      msg({ docId: 'b', id: 2, text: 'Déjà lu', reads: ['WA'] }),
    ]
    render(<RadioPage memberName="Wacil" />)
    expect(markRead).toHaveBeenCalledTimes(1)
    expect(markRead).toHaveBeenCalledWith('a', 'WA')
  })

  it('affiche la pastille du type de message', () => {
    state.messages = [msg({ docId: 'a', id: 1, type: 'position', text: 'Au col' })]
    const { container } = render(<RadioPage memberName="Wacil" />)
    const badge = container.querySelector('.msg-type.type-position')
    expect(badge).toBeTruthy()
    expect(badge!.textContent).toContain('Position')
  })

  it("n'envoie pas un message vide", () => {
    render(<RadioPage memberName="Wacil" />)
    fireEvent.click(screen.getByLabelText('Envoyer'))
    expect(sendMessage).not.toHaveBeenCalled()
  })
})
