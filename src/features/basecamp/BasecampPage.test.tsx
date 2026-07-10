import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { User } from 'firebase/auth'
import { GEAR } from '../../core/constants/gear'
import type { Rando } from '../../core/types'
import type { Profile } from '../../hooks/useUserProfile'
import type { WithDocId } from '../../hooks/useCollection'
import { makeRando } from '../../test/factories'

const profileState = {
  profile: null as Profile | null,
  loading: false,
  update: vi.fn(() => Promise.resolve()),
  reset: vi.fn(() => Promise.resolve()),
}
const randosState = { data: [] as WithDocId<Rando>[], loading: false, error: null }

vi.mock('../../core/firebase/collections', () => ({ randosCol: {} }))
vi.mock('../../hooks/useUserProfile', () => ({ useUserProfile: () => profileState }))
vi.mock('../../hooks/useCollection', () => ({ useCollection: () => randosState }))
// La modale de détail (ouverte au clic sur le hero) n'est pas testée ici et tire
// des dépendances Firestore non mockées → on la neutralise.
vi.mock('../sommets/RandoDetailModal', () => ({ RandoDetailModal: () => null }))

import { BasecampPage } from './BasecampPage'

const user = { uid: 'u1' } as User

afterEach(() => {
  profileState.profile = null
  randosState.data = []
})

describe('BasecampPage', () => {
  it('affiche les stats du hero (km, D+, sorties)', () => {
    profileState.profile = { name: 'Wacil', level: 'expert', mode: 'trek', km: 120, dplus: 4500, sorties: 8 }
    const { container } = render(<BasecampPage user={user} memberName="Wacil" onGoKit={() => {}} />)
    expect(screen.getByText('120')).toBeTruthy()
    // Séparateur de milliers dépendant de la locale : espace, point, virgule…
    expect(screen.getByText(/^\+4[\s.,  ]?500$/)).toBeTruthy()
    const heroStats = [...container.querySelectorAll('.bc-stat-val')].map((e) => e.textContent)
    expect(heroStats[2]).toBe('8')
    expect(screen.getByText('Wacil').className).toBe('bc-name')
  })

  it('affiche la prochaine sortie : vote oui + date future la plus proche', () => {
    profileState.profile = { name: 'Wacil', level: 'expert', mode: 'trek' }
    randosState.data = [
      makeRando({ docId: 'a', name: 'Pas votée', dateStart: '2999-01-01' }),
      makeRando({ docId: 'b', name: 'Votée lointaine', dateStart: '2999-06-01', memberVotes: { Wacil: 'oui' } }),
      makeRando({ docId: 'c', name: 'Votée proche', dateStart: '2999-02-01', memberVotes: { Wacil: 'oui' } }),
      makeRando({ docId: 'd', name: 'Votée passée', dateStart: '2020-01-01', memberVotes: { Wacil: 'oui' } }),
    ]
    const { container } = render(<BasecampPage user={user} memberName="Wacil" onGoKit={() => {}} />)
    expect(container.querySelector('.bc-next-title')!.textContent).toBe('Votée proche')
  })

  it("n'affiche pas de prochaine sortie sans vote oui à venir", () => {
    profileState.profile = { name: 'Wacil', level: 'expert', mode: 'trek' }
    randosState.data = [makeRando({ docId: 'a', name: 'Pas votée', dateStart: '2999-01-01' })]
    render(<BasecampPage user={user} memberName="Wacil" onGoKit={() => {}} />)
    expect(screen.queryByText('Prochaine sortie')).toBeNull()
  })

  it('affiche l\'état vide et le bouton Configurer sans profil', () => {
    profileState.profile = null
    render(<BasecampPage user={user} memberName="Wacil" onGoKit={() => {}} />)
    expect(screen.getByText('Installe ton Base Camp')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Configurer' })).toBeTruthy()
  })

  it('Réinitialiser appelle reset() après confirmation', () => {
    profileState.profile = { name: 'Wacil', level: 'expert', mode: 'trek' }
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<BasecampPage user={user} memberName="Wacil" onGoKit={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Réinitialiser' }))
    expect(profileState.reset).toHaveBeenCalledOnce()
    confirmSpy.mockRestore()
  })

  it('Réinitialiser ne fait rien si l\'utilisateur annule', () => {
    profileState.profile = { name: 'Wacil', level: 'expert', mode: 'trek' }
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<BasecampPage user={user} memberName="Wacil" onGoKit={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Réinitialiser' }))
    expect(profileState.reset).not.toHaveBeenCalled()
    confirmSpy.mockRestore()
  })

  it('expose un bouton Déconnexion', () => {
    profileState.profile = { name: 'Wacil', level: 'expert', mode: 'trek' }
    render(<BasecampPage user={user} memberName="Wacil" onGoKit={() => {}} />)
    expect(screen.getByRole('button', { name: 'Déconnexion' })).toBeTruthy()
  })

  it('calcule le pourcentage de kit complété', () => {
    const gear = GEAR.journee
    const all = [...gear.indispensable, ...gear.recommande, ...gear.facultatif]
    const checked = Object.fromEntries(all.slice(0, 3).map((g) => [g.id, true]))
    profileState.profile = { name: 'Wacil', level: 'newbie', mode: 'journee', checked }
    render(<BasecampPage user={user} memberName="Wacil" onGoKit={() => {}} />)
    const pct = Math.round((3 / all.length) * 100)
    expect(screen.getByText(`${pct}%`)).toBeTruthy()
    expect(screen.getByText(`3/${all.length} équipements`)).toBeTruthy()
  })
})
