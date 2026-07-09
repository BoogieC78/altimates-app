import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { User } from 'firebase/auth'
import { GEAR } from '../../core/constants/gear'
import type { Rando } from '../../core/types'
import type { Profile } from '../../hooks/useUserProfile'
import type { WithDocId } from '../../hooks/useCollection'

const profileState = {
  profile: null as Profile | null,
  loading: false,
  update: vi.fn(() => Promise.resolve()),
}
const randosState = { data: [] as WithDocId<Rando>[], loading: false, error: null }

vi.mock('../../core/firebase/collections', () => ({ randosCol: {} }))
vi.mock('../../hooks/useUserProfile', () => ({ useUserProfile: () => profileState }))
vi.mock('../../hooks/useCollection', () => ({ useCollection: () => randosState }))

import { BasecampPage } from './BasecampPage'

const user = { uid: 'u1' } as User

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  profileState.profile = null
  randosState.data = []
})

function rando(over: Partial<Rando> & { docId: string; name: string }): WithDocId<Rando> {
  return { id: 1, region: 'Alpes', votes: { oui: 0, peut: 0 }, ...over }
}

describe('BasecampPage', () => {
  it('affiche les stats du hero (km, D+, sorties)', () => {
    profileState.profile = { name: 'Wacil', level: 'expert', mode: 'trek', km: 120, dplus: 4500, sorties: 8 }
    render(<BasecampPage user={user} memberName="Wacil" onGoKit={() => {}} />)
    expect(screen.getByText('120')).toBeTruthy()
    expect(screen.getByText(`+${(4500).toLocaleString()}`)).toBeTruthy()
    expect(screen.getAllByText('8').length).toBeGreaterThan(0)
    expect(screen.getByText('Wacil').className).toBe('bc-name')
  })

  it('affiche la prochaine sortie : vote oui + date future la plus proche', () => {
    profileState.profile = { name: 'Wacil', level: 'expert', mode: 'trek' }
    randosState.data = [
      rando({ docId: 'a', name: 'Pas votée', dateStart: '2999-01-01' }),
      rando({ docId: 'b', name: 'Votée lointaine', dateStart: '2999-06-01', memberVotes: { Wacil: 'oui' } }),
      rando({ docId: 'c', name: 'Votée proche', dateStart: '2999-02-01', memberVotes: { Wacil: 'oui' } }),
      rando({ docId: 'd', name: 'Votée passée', dateStart: '2020-01-01', memberVotes: { Wacil: 'oui' } }),
    ]
    const { container } = render(<BasecampPage user={user} memberName="Wacil" onGoKit={() => {}} />)
    expect(container.querySelector('.bc-next-title')!.textContent).toBe('Votée proche')
  })

  it("n'affiche pas de prochaine sortie sans vote oui à venir", () => {
    profileState.profile = { name: 'Wacil', level: 'expert', mode: 'trek' }
    randosState.data = [rando({ docId: 'a', name: 'Pas votée', dateStart: '2999-01-01' })]
    render(<BasecampPage user={user} memberName="Wacil" onGoKit={() => {}} />)
    expect(screen.queryByText('Prochaine sortie')).toBeNull()
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
