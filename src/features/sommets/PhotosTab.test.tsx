import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { RandoMedia } from '../../core/types'
import type { WithDocId } from '../../hooks/useCollection'
import { makeRando } from '../../test/factories'

vi.mock('../../core/firebase/collections', () => ({ randoMediaCol: { path: 'randoMedia' } }))

const photos: WithDocId<RandoMedia>[] = []
const authUser = { uid: 'uid-nordine', email: 'nordine@exemple.fr' }
const currentUser = { value: authUser as { uid: string; email: string } | null }

vi.mock('../../hooks/useCollection', () => ({
  useCollection: () => ({ data: photos, loading: false, error: null }),
}))
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ user: currentUser.value, loading: false }),
}))
vi.mock('../../core/firebase/auth', () => ({
  isAdmin: (u: { email?: string } | null) => u?.email === 'wacil78@gmail.com',
}))

const addRandoMedia = vi.fn(() => Promise.resolve())
const removeRandoMedia = vi.fn(() => Promise.resolve())
vi.mock('../../core/firebase/randoMedia', () => ({
  addRandoMedia: (...args: unknown[]) => addRandoMedia(...(args as [])),
  removeRandoMedia: (...args: unknown[]) => removeRandoMedia(...(args as [])),
}))

const compressImage = vi.fn(() => Promise.resolve('data:image/jpeg;base64,YWJj'))
vi.mock('../../core/services/media', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../core/services/media')>()
  return { ...actual, compressImage: (...args: unknown[]) => compressImage(...(args as [])) }
})

import { PhotosTab } from './PhotosTab'
import { MAX_PHOTOS } from '../../core/services/media'

const rando = makeRando({ id: 1, proposedBy: 'Nordine' })

function photo(over: Partial<WithDocId<RandoMedia>> = {}): WithDocId<RandoMedia> {
  return {
    docId: 'p1',
    randoId: '1',
    author: 'Nordine',
    authorUid: 'uid-nordine',
    dataUrl: 'data:image/jpeg;base64,YWJj',
    ...over,
  }
}

function jpeg(name = 'photo.jpg'): File {
  return new File(['x'], name, { type: 'image/jpeg' })
}

afterEach(() => {
  photos.length = 0
  currentUser.value = authUser
})

describe('PhotosTab', () => {
  it('affiche un état vide sans photo', () => {
    render(<PhotosTab rando={rando} memberName="Nordine" />)
    expect(screen.getByText('Aucune photo pour cette sortie.')).toBeTruthy()
  })

  it('ne propose l\'ajout qu\'à l\'organisateur', () => {
    const { unmount } = render(<PhotosTab rando={rando} memberName="Ismail" />)
    expect(screen.queryByLabelText('Ajouter une photo de la sortie')).toBeNull()
    expect(screen.getByText(/seul l'organisateur peut ajouter des photos/)).toBeTruthy()

    unmount()
    render(<PhotosTab rando={rando} memberName="Nordine" />)
    expect(screen.getByLabelText('Ajouter une photo de la sortie')).toBeTruthy()
  })

  it('compresse puis enregistre la photo choisie', async () => {
    render(<PhotosTab rando={rando} memberName="Nordine" />)
    fireEvent.change(screen.getByLabelText('Ajouter une photo de la sortie'), { target: { files: [jpeg()] } })

    await waitFor(() => expect(addRandoMedia).toHaveBeenCalled())
    expect(compressImage).toHaveBeenCalled()
    expect(addRandoMedia).toHaveBeenCalledWith({
      randoId: '1',
      author: 'Nordine',
      authorUid: 'uid-nordine',
      dataUrl: 'data:image/jpeg;base64,YWJj',
    })
  })

  it('refuse la photo au-delà du maximum, avec un message', async () => {
    for (let i = 0; i < MAX_PHOTOS; i++) photos.push(photo({ docId: `p${i}` }))
    render(<PhotosTab rando={rando} memberName="Nordine" />)
    fireEvent.change(screen.getByLabelText('Ajouter une photo de la sortie'), { target: { files: [jpeg()] } })

    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('MAXIMUM 6 PHOTOS PAR SORTIE'))
    expect(addRandoMedia).not.toHaveBeenCalled()
  })

  it('remonte l\'échec de compression sans écrire', async () => {
    compressImage.mockRejectedValueOnce(new Error('Photo trop lourde même après compression'))
    render(<PhotosTab rando={rando} memberName="Nordine" />)
    fireEvent.change(screen.getByLabelText('Ajouter une photo de la sortie'), { target: { files: [jpeg()] } })

    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('PHOTO TROP LOURDE MÊME APRÈS COMPRESSION'))
    expect(addRandoMedia).not.toHaveBeenCalled()
  })

  it('ne montre la suppression qu\'à l\'auteur de la photo', () => {
    photos.push(photo({ authorUid: 'uid-autre', author: 'Ismail' }))
    const { unmount } = render(<PhotosTab rando={rando} memberName="Nordine" />)
    expect(screen.queryByLabelText(/Supprimer la photo/)).toBeNull()

    unmount()
    photos.length = 0
    photos.push(photo())
    render(<PhotosTab rando={rando} memberName="Nordine" />)
    fireEvent.click(screen.getByLabelText('Supprimer la photo de Nordine'))
    expect(removeRandoMedia).toHaveBeenCalledWith('p1')
  })

  it('laisse un admin ajouter et supprimer sans être organisateur', () => {
    currentUser.value = { uid: 'uid-wacil', email: 'wacil78@gmail.com' }
    photos.push(photo({ authorUid: 'uid-nordine' }))
    render(<PhotosTab rando={rando} memberName="Wacil" />)
    expect(screen.getByLabelText('Ajouter une photo de la sortie')).toBeTruthy()
    expect(screen.getByLabelText('Supprimer la photo de Nordine')).toBeTruthy()
  })
})
