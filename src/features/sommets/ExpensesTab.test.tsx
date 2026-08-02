import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { Expense, UserProfile } from '../../core/types'
import type { WithDocId } from '../../hooks/useCollection'
import { makeRando } from '../../test/factories'

// Les collections sont des sentinelles : useCollection est mocké et renvoie les
// données selon la référence reçue, comme le ferait Firestore.
vi.mock('../../core/firebase/collections', () => ({
  expensesCol: { path: 'expenses' },
  usersCol: { path: 'users' },
}))

const expenses: WithDocId<Expense>[] = []
const users: WithDocId<UserProfile>[] = []

vi.mock('../../hooks/useCollection', () => ({
  useCollection: (ref: { path: string }) => ({
    data: ref.path === 'expenses' ? expenses : users,
    loading: false,
    error: null,
  }),
}))

const addExpense = vi.fn(() => Promise.resolve())
const removeExpense = vi.fn(() => Promise.resolve())
vi.mock('../../core/firebase/expenses', () => ({
  addExpense: (...args: unknown[]) => addExpense(...(args as [])),
  removeExpense: (...args: unknown[]) => removeExpense(...(args as [])),
}))

import { ExpensesTab } from './ExpensesTab'

function expense(over: Partial<WithDocId<Expense>> = {}): WithDocId<Expense> {
  return {
    docId: 'e1',
    id: 1,
    randoId: '1',
    label: 'Lyophilisés',
    amount: 3000,
    payer: 'Nordine',
    beneficiaries: ['Nordine', 'Ismail', 'Sofia'],
    ...over,
  }
}

const rando = makeRando({ id: 1, memberVotes: { Nordine: 'oui', Ismail: 'oui', Sofia: 'oui' } })

afterEach(() => {
  expenses.length = 0
  users.length = 0
})

describe('ExpensesTab', () => {
  it('affiche un état vide sans dépense', () => {
    render(<ExpensesTab rando={rando} memberName="Nordine" />)
    expect(screen.getByText("Aucune dépense pour l'instant.")).toBeTruthy()
  })

  it('affiche les soldes et le remboursement à faire', () => {
    expenses.push(expense())
    render(<ExpensesTab rando={rando} memberName="Ismail" />)

    // 30 € avancés par Nordine pour 3 → chacun lui doit 10 €.
    expect(screen.getByText(/on lui doit 20,00/)).toBeTruthy()
    expect(screen.getAllByText(/doit 10,00/)).toHaveLength(2)
    expect(screen.getByText('Remboursements')).toBeTruthy()
  })

  it('ne montre le bouton supprimer qu\'au membre qui a avancé l\'argent', () => {
    expenses.push(expense({ payer: 'Nordine' }))
    const { unmount } = render(<ExpensesTab rando={rando} memberName="Ismail" />)
    expect(screen.queryByLabelText(/Supprimer la dépense/)).toBeNull()

    unmount()
    render(<ExpensesTab rando={rando} memberName="Nordine" />)
    expect(screen.getByLabelText(/Supprimer la dépense/)).toBeTruthy()
  })

  it('enregistre une dépense saisie, montant converti en centimes', () => {
    render(<ExpensesTab rando={rando} memberName="Nordine" />)

    fireEvent.change(screen.getByLabelText('Libellé de la dépense'), { target: { value: 'Péage A43' } })
    fireEvent.change(screen.getByLabelText('Montant en euros'), { target: { value: '24,60' } })
    fireEvent.click(screen.getByText('Ajouter la dépense'))

    expect(addExpense).toHaveBeenCalledWith({
      randoId: '1',
      label: 'Péage A43',
      amount: 2460,
      payer: 'Nordine',
      beneficiaries: ['Ismail', 'Nordine', 'Sofia'],
    })
  })

  it('refuse un montant invalide et n\'écrit rien', () => {
    render(<ExpensesTab rando={rando} memberName="Nordine" />)

    fireEvent.change(screen.getByLabelText('Libellé de la dépense'), { target: { value: 'Refuge' } })
    fireEvent.change(screen.getByLabelText('Montant en euros'), { target: { value: 'abc' } })
    fireEvent.click(screen.getByText('Ajouter la dépense'))

    expect(screen.getByRole('alert').textContent).toBe('MONTANT INVALIDE')
    expect(addExpense).not.toHaveBeenCalled()
  })

  it('permet de restreindre les bénéficiaires', () => {
    render(<ExpensesTab rando={rando} memberName="Nordine" />)

    fireEvent.change(screen.getByLabelText('Libellé de la dépense'), { target: { value: 'Gaz' } })
    fireEvent.change(screen.getByLabelText('Montant en euros'), { target: { value: '9' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sofia' }))
    fireEvent.click(screen.getByText('Ajouter la dépense'))

    expect(addExpense).toHaveBeenCalledWith(
      expect.objectContaining({ beneficiaries: ['Ismail', 'Nordine'], amount: 900 }),
    )
  })

  it("prévient quand l'enregistrement échoue, sans effacer la saisie", async () => {
    // Un refus des règles Firestore ne remontait qu'en console : le bouton avait
    // l'air inerte et la saisie était perdue. Le membre doit voir la cause et
    // pouvoir réessayer sans tout retaper.
    addExpense.mockImplementationOnce(() => Promise.reject(new Error('permission-denied')))
    render(<ExpensesTab rando={makeRando({ id: 1 })} memberName="Wacil" />)

    fireEvent.change(screen.getByLabelText('Libellé de la dépense'), { target: { value: 'Essence' } })
    fireEvent.change(screen.getByLabelText('Montant en euros'), { target: { value: '42' } })
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter la dépense' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/pas pu être enregistrée/i)
    expect((screen.getByLabelText('Libellé de la dépense') as HTMLInputElement).value).toBe('Essence')
    expect((screen.getByLabelText('Montant en euros') as HTMLInputElement).value).toBe('42')
  })
})
