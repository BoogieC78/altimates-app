import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { SurveyResponse } from '../../core/types'
import type { WithDocId } from '../../hooks/useCollection'
import { makeRando } from '../../test/factories'

vi.mock('../../core/firebase/collections', () => ({ randoSurveysCol: { path: 'randoSurveys' } }))

const docs: WithDocId<SurveyResponse>[] = []

vi.mock('../../hooks/useCollection', () => ({
  useCollection: () => ({ data: docs, loading: false, error: null }),
}))

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ user: { uid: 'uid-nordine' }, loading: false, member: true }),
}))

const saveSurveyResponse = vi.fn(() => Promise.resolve())
vi.mock('../../core/firebase/surveys', () => ({
  saveSurveyResponse: (...args: unknown[]) => saveSurveyResponse(...(args as [])),
}))

// Jour fixe : les fenêtres d'ouverture des fixtures ne dépendent pas de l'horloge
// réelle de la machine. Le reste du module (vrai calcul de dates) est conservé.
vi.mock('../../core/services/dates', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../core/services/dates')>()),
  todayLocalISO: () => '2026-08-16',
}))

import { SurveyTab } from './SurveyTab'

function reponse(over: Partial<WithDocId<SurveyResponse>> = {}): WithDocId<SurveyResponse> {
  return {
    docId: `1_${over.authorUid ?? 'uid-x'}`,
    randoId: '1',
    author: 'Sofia',
    authorUid: 'uid-sofia',
    rating: 4,
    difficulty: 'comme-prevu',
    weather: 'soleil',
    organization: 4,
    ...over,
  }
}

// Sortie d'hier : enquête ouverte (J+1) au jour fixé 2026-08-16.
const sortieOuverte = makeRando({ id: 1, dateStart: '2026-08-15', dateEnd: '2026-08-15' })
// Sortie d'il y a 15 jours : enquête fermée.
const sortieFermee = makeRando({ id: 1, dateStart: '2026-08-01', dateEnd: '2026-08-01' })
// Sortie à venir : pas d'enquête (garde-fou, l'onglet n'est pas censé s'ouvrir).
const sortieFuture = makeRando({ id: 1, dateStart: '2026-08-20', dateEnd: '2026-08-20' })

beforeEach(() => {
  saveSurveyResponse.mockImplementation(() => Promise.resolve())
})

afterEach(() => {
  docs.length = 0
})

/** Remplit les 4 questions du formulaire. */
function remplirFormulaire() {
  fireEvent.click(screen.getByRole('button', { name: 'Note globale : 5 sur 5' }))
  fireEvent.click(screen.getByRole('button', { name: 'Plus dur que prévu' }))
  fireEvent.click(screen.getByRole('button', { name: 'Grand soleil' }))
  fireEvent.click(screen.getByRole('button', { name: 'Organisation : 4 sur 5' }))
}

describe('SurveyTab', () => {
  it("n'ouvre pas l'enquête avant la date de la sortie", () => {
    render(<SurveyTab rando={sortieFuture} memberName="Nordine" />)
    expect(screen.getByText("L'enquête ouvrira une fois la sortie passée.")).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Envoyer ma réponse' })).toBeNull()
  })

  it('propose le formulaire une fois la date passée, tant que le membre n’a pas répondu', () => {
    render(<SurveyTab rando={sortieOuverte} memberName="Nordine" />)
    expect(screen.getByRole('button', { name: 'Envoyer ma réponse' })).toBeInTheDocument()
    // Personne n'a répondu : aucune restitution vide.
    expect(screen.queryByText(/Retours de la cordée/)).toBeNull()
  })

  it('refuse un envoi incomplet avec une erreur à l’écran', () => {
    render(<SurveyTab rando={sortieOuverte} memberName="Nordine" />)
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer ma réponse' }))
    expect(screen.getByRole('alert')).toHaveTextContent('NOTE GLOBALE REQUISE')
    expect(saveSurveyResponse).not.toHaveBeenCalled()
  })

  it('enregistre la réponse complète avec l’identité du membre courant', async () => {
    render(<SurveyTab rando={sortieOuverte} memberName="Nordine" />)
    remplirFormulaire()
    fireEvent.change(screen.getByLabelText('Commentaire libre'), { target: { value: 'Superbe crête' } })
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer ma réponse' }))
    await waitFor(() =>
      expect(saveSurveyResponse).toHaveBeenCalledWith({
        randoId: '1',
        author: 'Nordine',
        authorUid: 'uid-nordine',
        rating: 5,
        difficulty: 'plus-dur',
        weather: 'soleil',
        organization: 4,
        comment: 'Superbe crête',
      }),
    )
  })

  it('affiche le refus d’écriture Firestore à l’écran, pas seulement en console', async () => {
    saveSurveyResponse.mockImplementation(() => Promise.reject(new Error('permission-denied')))
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(<SurveyTab rando={sortieOuverte} memberName="Nordine" />)
    remplirFormulaire()
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer ma réponse' }))
    expect(
      await screen.findByText("Ta réponse n'a pas pu être enregistrée. Vérifie ta connexion et réessaie."),
    ).toBeInTheDocument()
    warn.mockRestore()
  })

  it('remplace le formulaire par « Ta réponse » quand le membre a déjà répondu', () => {
    docs.push(reponse({ authorUid: 'uid-nordine', author: 'Nordine', rating: 5, organization: 3 }))
    render(<SurveyTab rando={sortieOuverte} memberName="Nordine" />)
    expect(screen.queryByRole('button', { name: 'Envoyer ma réponse' })).toBeNull()
    expect(screen.getByText('Ta réponse')).toBeInTheDocument()
    // Modifiable tant que l'enquête est ouverte, préremplie avec sa réponse.
    fireEvent.click(screen.getByRole('button', { name: 'Modifier ma réponse' }))
    expect(screen.getByRole('button', { name: 'Note globale : 5 sur 5' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Mettre à jour ma réponse' })).toBeInTheDocument()
  })

  it('ne permet plus de répondre ni de modifier une fois l’enquête fermée', () => {
    docs.push(reponse({ authorUid: 'uid-nordine', author: 'Nordine' }))
    render(<SurveyTab rando={sortieFermee} memberName="Nordine" />)
    expect(screen.queryByRole('button', { name: 'Envoyer ma réponse' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Modifier ma réponse' })).toBeNull()
  })

  it('restitue moyennes et réponses nominatives à la cordée', () => {
    docs.push(
      reponse({ authorUid: 'uid-sofia', author: 'Sofia', rating: 5, organization: 3, weather: 'pluie', comment: 'Trempés mais heureux' }),
      reponse({ authorUid: 'uid-wacil', author: 'Wacil', rating: 4, organization: 4, difficulty: 'plus-dur' }),
      // Réponse d'une AUTRE sortie : ne doit pas entrer dans la restitution.
      reponse({ docId: '2_uid-marc', randoId: '2', authorUid: 'uid-marc', author: 'Marc', rating: 1 }),
    )
    render(<SurveyTab rando={sortieOuverte} memberName="Nordine" />)
    expect(screen.getByText('Retours de la cordée · 2 réponses')).toBeInTheDocument()
    expect(screen.getByText('4,5★')).toBeInTheDocument() // (5+4)/2, décimale française
    expect(screen.getByText('3,5/5')).toBeInTheDocument()
    expect(screen.getByText(/Sofia/)).toBeInTheDocument()
    expect(screen.getByText('Trempés mais heureux')).toBeInTheDocument()
    expect(screen.queryByText(/Marc/)).toBeNull()
  })

  it("annonce l'absence de retours quand l'enquête ferme sans réponse", () => {
    render(<SurveyTab rando={sortieFermee} memberName="Nordine" />)
    expect(screen.getByText('Aucun retour recueilli pour cette sortie.')).toBeInTheDocument()
    expect(screen.queryByText(/Retours de la cordée/)).toBeNull()
  })
})
