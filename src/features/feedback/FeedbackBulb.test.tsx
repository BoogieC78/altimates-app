import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

// Seul export consommé par le composant — mock ciblé, exercé par les tests.
vi.mock('../../core/firebase/feedbacks', () => ({
  addFeedback: vi.fn(() => Promise.resolve()),
}))

import { addFeedback } from '../../core/firebase/feedbacks'
import { FeedbackBulb } from './FeedbackBulb'

const fetchMock = vi.fn(() => Promise.resolve(new Response('{"ok":true}')))
vi.stubGlobal('fetch', fetchMock)

beforeEach(() => {
  // clearMocks efface compteurs ET implémentations des vi.fn : on les remet.
  vi.mocked(addFeedback).mockResolvedValue(undefined)
  fetchMock.mockResolvedValue(new Response('{"ok":true}'))
})

function openModal() {
  render(<FeedbackBulb memberName="Wacil" email="wacil78@gmail.com" />)
  fireEvent.click(screen.getByRole('button', { name: 'Boîte à idées' }))
}

describe('FeedbackBulb', () => {
  it("l'ampoule ouvre la modale, absente avant le clic", () => {
    render(<FeedbackBulb memberName="Wacil" email="wacil78@gmail.com" />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Boîte à idées' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByLabelText('Ton message')).toBeInTheDocument()
  })

  it("l'envoi écrit en base (auteur, texte, type) puis relaie vers l'API Trello avec l'e-mail", async () => {
    openModal()
    fireEvent.change(screen.getByLabelText('Type de retour'), { target: { value: 'bug' } })
    fireEvent.change(screen.getByLabelText('Ton message'), {
      target: { value: 'La carte reste blanche' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer' }))

    expect(await screen.findByText(/Ton retour est bien envoyé/)).toBeInTheDocument()
    expect(addFeedback).toHaveBeenCalledWith('Wacil', 'La carte reste blanche', 'bug')
    expect(fetchMock).toHaveBeenCalledWith('/api/send-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'bug',
        text: 'La carte reste blanche',
        email: 'wacil78@gmail.com',
      }),
    })
  })

  it('« En envoyer un autre » revient au formulaire vidé', async () => {
    openModal()
    fireEvent.change(screen.getByLabelText('Ton message'), { target: { value: 'Une idée' } })
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer' }))
    fireEvent.click(await screen.findByRole('button', { name: 'En envoyer un autre' }))
    expect(screen.getByLabelText('Ton message')).toHaveValue('')
  })

  it("un refus d'écriture affiche l'erreur, conserve la saisie et ne relaie pas vers Trello", async () => {
    vi.mocked(addFeedback).mockRejectedValue(new Error('permission-denied'))
    openModal()
    fireEvent.change(screen.getByLabelText('Ton message'), {
      target: { value: 'Texte à ne pas perdre' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/ton texte est conservé/i)
    expect(screen.getByLabelText('Ton message')).toHaveValue('Texte à ne pas perdre')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("l'échec du relais Trello n'empêche pas le message de succès (le feedback est en base)", async () => {
    fetchMock.mockRejectedValue(new Error('network down'))
    openModal()
    fireEvent.change(screen.getByLabelText('Ton message'), { target: { value: 'Une idée' } })
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer' }))
    expect(await screen.findByText(/Ton retour est bien envoyé/)).toBeInTheDocument()
  })

  it("le bouton Envoyer est inactif tant que le message est vide", () => {
    openModal()
    expect(screen.getByRole('button', { name: 'Envoyer' })).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Ton message'), { target: { value: '   ' } })
    expect(screen.getByRole('button', { name: 'Envoyer' })).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Ton message'), { target: { value: 'ok' } })
    expect(screen.getByRole('button', { name: 'Envoyer' })).toBeEnabled()
  })
})
