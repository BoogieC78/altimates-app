import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { User } from 'firebase/auth'
import type { CordeeMember, RadioMessage, UserProfile } from '../../core/types'
import type { WithDocId } from '../../hooks/useCollection'

const state = {
  /** Messages du canal de la cordée active ('origine' par défaut dans ces tests). */
  messages: [] as WithDocId<RadioMessage>[],
  /** Messages du canal broadcast (collection racine historique). */
  broadcast: [] as WithDocId<RadioMessage>[],
  users: [] as WithDocId<UserProfile>[],
  members: [] as WithDocId<CordeeMember>[],
}

vi.mock('../../core/firebase/collections', () => ({
  usersCol: { path: 'users' },
  BROADCAST_CHANNEL_ID: 'broadcast',
  CORDEE_ORIGINE_ID: 'origine',
  cordeeMembersCol: (cid: string) => ({ path: `cordees/${cid}/members` }),
  messagesColForChannel: (ch: string) => ({
    path: ch === 'broadcast' ? 'messages' : `cordees/${ch}/messages`,
  }),
}))
vi.mock('../../hooks/useCollection', () => ({
  useCollection: (ref: { path: string }) => ({
    data:
      ref.path === 'messages'
        ? state.broadcast
        : ref.path === 'users'
          ? state.users
          : ref.path.endsWith('/messages')
            ? state.messages
            : state.members,
    loading: false,
    error: null,
  }),
}))
vi.mock('../../core/firebase/cordees', () => ({
  listMyCordees: vi.fn(() =>
    Promise.resolve([{ docId: 'origine', name: 'Cordée origine' }]),
  ),
  getActiveCordeeId: vi.fn(() => 'origine'),
  setActiveCordeeId: vi.fn(),
  normalizeEmail: (e: string) => e.trim().toLowerCase(),
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
import { setActiveCordeeId } from '../../core/firebase/cordees'
import { RadioPage } from './RadioPage'

const fakeUser = { email: 'wacil78@gmail.com' } as User

/** Rendu + attente du chargement des cordées (sélecteur de canal affiché). */
async function renderPage() {
  const r = render(<RadioPage user={fakeUser} memberName="Wacil" />)
  await screen.findByRole('button', { name: 'Cordée origine' })
  return r
}

afterEach(() => {
  state.messages = []
  state.broadcast = []
  state.users = []
  state.members = []
  vi.clearAllMocks()
})

function msg(over: Partial<RadioMessage> & { docId: string }): WithDocId<RadioMessage> {
  return { id: 1, author: 'Nordine', text: 'hello', type: 'message', time: 'hier', ...over }
}

describe('RadioPage', () => {
  it('affiche les messages triés par id croissant', async () => {
    state.messages = [
      msg({ docId: 'b', id: 2, text: 'Deuxième' }),
      msg({ docId: 'a', id: 1, text: 'Premier' }),
    ]
    const { container } = await renderPage()
    const texts = [...container.querySelectorAll('.msg-text')].map((e) => e.textContent)
    expect(texts).toEqual(['Premier', 'Deuxième'])
  })

  it('place les messages épinglés dans la section Épinglés', async () => {
    state.messages = [
      msg({ docId: 'a', id: 1, text: 'Message normal' }),
      msg({ docId: 'b', id: 2, text: 'Message épinglé', pinned: true }),
    ]
    const { container } = await renderPage()
    expect(screen.getByText('Épinglés')).toBeTruthy()
    expect(container.querySelector('.msg-pinned .msg-pinned-text')!.textContent).toBe('Message épinglé')
    const feed = [...container.querySelectorAll('.msg-text')].map((e) => e.textContent)
    expect(feed).toEqual(['Message normal'])
  })

  it("l'envoi appelle sendMessage avec le canal (cordée active), l'auteur, le texte et le type actif", async () => {
    await renderPage()
    fireEvent.click(screen.getByText('Alerte'))
    fireEvent.change(screen.getByPlaceholderText('Ton message...'), { target: { value: 'Orage en vue' } })
    fireEvent.click(screen.getByLabelText('Envoyer'))
    expect(sendMessage).toHaveBeenCalledWith('origine', 'Wacil', 'Orage en vue', 'alerte')
  })

  it("marque comme lus uniquement les messages où mes initiales manquent, sur le bon canal", async () => {
    state.messages = [
      msg({ docId: 'a', id: 1, text: 'Non lu', reads: ['NO'] }),
      msg({ docId: 'b', id: 2, text: 'Déjà lu', reads: ['WA'] }),
    ]
    await renderPage()
    expect(markRead).toHaveBeenCalledTimes(1)
    expect(markRead).toHaveBeenCalledWith('origine', 'a', 'WA')
  })

  it('affiche la pastille du type de message', async () => {
    state.messages = [msg({ docId: 'a', id: 1, type: 'position', text: 'Au col' })]
    const { container } = await renderPage()
    const badge = container.querySelector('.msg-type.type-position')
    expect(badge).toBeTruthy()
    expect(badge!.textContent).toContain('Position')
  })

  it("n'envoie pas un message vide", async () => {
    await renderPage()
    fireEvent.click(screen.getByLabelText('Envoyer'))
    expect(sendMessage).not.toHaveBeenCalled()
  })

  it('le sélecteur bascule sur le canal Broadcast (collection racine) sans en faire la cordée active', async () => {
    state.messages = [msg({ docId: 'a', id: 1, text: 'Message de cordée' })]
    state.broadcast = [msg({ docId: 'z', id: 9, text: 'Cherche 3 randonneurs pour le Toubkal' })]
    await renderPage()
    expect(screen.getByText('Message de cordée')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: '📢 Broadcast' }))
    expect(screen.getByText('Cherche 3 randonneurs pour le Toubkal')).toBeTruthy()
    expect(screen.queryByText('Message de cordée')).toBeNull()
    expect(screen.getByText("Visible par tous les membres de l'app")).toBeTruthy()
    // Le broadcast n'est pas une cordée : la cordée active ne change pas.
    expect(setActiveCordeeId).not.toHaveBeenCalled()

    // Retour sur le canal de la cordée : celui-ci redevient la cordée active.
    fireEvent.click(screen.getByRole('button', { name: 'Cordée origine' }))
    expect(screen.getByText('Message de cordée')).toBeTruthy()
    expect(setActiveCordeeId).toHaveBeenCalledWith('origine')
  })

  it("l'envoi depuis le canal Broadcast écrit dans le canal broadcast", async () => {
    await renderPage()
    fireEvent.click(screen.getByRole('button', { name: '📢 Broadcast' }))
    fireEvent.change(screen.getByPlaceholderText('Ton message...'), {
      target: { value: 'Cherche 3 randonneurs pour le Mont Toubkal' },
    })
    fireEvent.click(screen.getByLabelText('Envoyer'))
    expect(sendMessage).toHaveBeenCalledWith(
      'broadcast',
      'Wacil',
      'Cherche 3 randonneurs pour le Mont Toubkal',
      'message',
    )
  })
})
