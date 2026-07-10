import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { Feedback } from '../../core/types'
import type { WithDocId } from '../../hooks/useCollection'

const state = { data: [] as WithDocId<Feedback>[], loading: false, error: null }

vi.mock('../../core/firebase/collections', () => ({ feedbacksCol: {} }))
vi.mock('../../hooks/useCollection', () => ({ useCollection: () => state }))
vi.mock('../../core/firebase/feedbacks', () => ({
  addFeedback: vi.fn(() => Promise.resolve()),
  addFeedbackComment: vi.fn(() => Promise.resolve()),
  deleteFeedback: vi.fn(() => Promise.resolve()),
  deleteFeedbackComment: vi.fn(() => Promise.resolve()),
  setFeedbackStatus: vi.fn(() => Promise.resolve()),
  voteFeedback: vi.fn(() => Promise.resolve()),
}))

import { addFeedback, deleteFeedback, setFeedbackStatus, voteFeedback } from '../../core/firebase/feedbacks'
import { IdeesPage } from './IdeesPage'

afterEach(() => {
  state.data = []
})

function fb(over: Partial<Feedback> & { docId: string }): WithDocId<Feedback> {
  return { id: 1, text: 'idée', cat: 'feature', author: 'Nordine', ts: 'hier', ...over }
}

describe('IdeesPage', () => {
  it('trie les idées par score de votes décroissant', () => {
    state.data = [
      fb({ docId: 'a', text: 'Peu votée', votes: { up: 1, down: 0 } }),
      fb({ docId: 'b', text: 'Très votée', votes: { up: 5, down: 1 } }),
    ]
    const { container } = render(<IdeesPage memberName="Wacil" />)
    const items = [...container.querySelectorAll('.fb-item')].map((e) => e.textContent)
    expect(items[0]).toContain('Très votée')
    expect(items[1]).toContain('Peu votée')
  })

  it('affiche le badge POPULAIRE à partir de 3 votes up', () => {
    state.data = [
      fb({ docId: 'a', text: 'Populaire', votes: { up: 3, down: 0 } }),
      fb({ docId: 'b', text: 'Pas populaire', votes: { up: 2, down: 0 } }),
    ]
    render(<IdeesPage memberName="Wacil" />)
    expect(screen.getAllByText('POPULAIRE')).toHaveLength(1)
  })

  it('le changement de statut appelle setFeedbackStatus', () => {
    state.data = [fb({ docId: 'a', votes: { up: 0, down: 0 } })]
    render(<IdeesPage memberName="Wacil" />)
    fireEvent.click(screen.getAllByText('In progress').pop()!)
    expect(setFeedbackStatus).toHaveBeenCalledWith('a', 'inprogress')
  })

  it('le clic sur le pouce appelle voteFeedback avec le feedback, le membre et le sens', () => {
    const idea = fb({ docId: 'a', votes: { up: 2, down: 0 } })
    state.data = [idea]
    const { container } = render(<IdeesPage memberName="Wacil" />)
    const [up, down] = container.querySelectorAll('.vote-chip')
    fireEvent.click(up)
    expect(voteFeedback).toHaveBeenCalledWith(idea, 'Wacil', 'up')
    fireEvent.click(down)
    expect(voteFeedback).toHaveBeenCalledWith(idea, 'Wacil', 'down')
  })

  it("supprimer une idée n'appelle deleteFeedback qu'après confirmation", () => {
    state.data = [fb({ docId: 'a', votes: { up: 0, down: 0 } })]
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<IdeesPage memberName="Wacil" />)
    fireEvent.click(screen.getByTitle('Supprimer'))
    expect(deleteFeedback).not.toHaveBeenCalled()
    confirmSpy.mockReturnValue(true)
    fireEvent.click(screen.getByTitle('Supprimer'))
    expect(deleteFeedback).toHaveBeenCalledWith('a')
    confirmSpy.mockRestore()
  })

  it("soumettre une idée appelle addFeedback avec l'auteur, le texte et la catégorie", () => {
    render(<IdeesPage memberName="Wacil" />)
    fireEvent.change(screen.getByPlaceholderText('ex: Filtrer par dénivelé max...'), {
      target: { value: 'Mode sombre' },
    })
    fireEvent.change(screen.getByDisplayValue('Fonctionnalité'), { target: { value: 'ux' } })
    fireEvent.click(screen.getByText('Soumettre'))
    expect(addFeedback).toHaveBeenCalledWith('Wacil', 'Mode sombre', 'ux')
  })

  it("affiche l'état vide sans idées", () => {
    render(<IdeesPage memberName="Wacil" />)
    expect(screen.getByText('AUCUNE IDÉE ENCORE')).toBeTruthy()
  })
})
