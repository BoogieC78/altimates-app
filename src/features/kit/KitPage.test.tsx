import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { User } from 'firebase/auth'
import type { KitStatus } from '../../core/constants/gear'
import { budgetRange, kitStats } from '../../core/services/kit'
import type { Profile } from '../../hooks/useUserProfile'

const state = {
  profile: null as Profile | null,
  loading: false,
  update: vi.fn(() => Promise.resolve()),
}

vi.mock('../../hooks/useUserProfile', () => ({ useUserProfile: () => state }))
vi.mock('../../core/services/kitPdf', () => ({ generateKitPdf: vi.fn() }))

import { KitPage } from './KitPage'

const user = { uid: 'u1' } as User

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  state.profile = null
  state.loading = false
})

describe('KitPage', () => {
  it("affiche l'onboarding si le profil est incomplet", () => {
    state.profile = { name: 'Wacil' }
    render(<KitPage user={user} memberName="Wacil" />)
    expect(screen.getByText('Ton niveau en rando ?')).toBeTruthy()
    expect(screen.getByText('2 questions · liste personnalisée')).toBeTruthy()
  })

  it("l'onboarding enchaîne niveau puis mode et appelle update", () => {
    state.profile = null
    render(<KitPage user={user} memberName="Wacil" />)
    fireEvent.click(screen.getByText('Débutant'))
    expect(screen.getByText('Plutôt journée ou trek ?')).toBeTruthy()
    fireEvent.click(screen.getByText('Trek (multi-jours)'))
    expect(state.update).toHaveBeenCalledWith({ name: 'Wacil', level: 'newbie', mode: 'trek' })
  })

  it('affiche les stats budget correspondant au kitStatus', () => {
    const kitStatus: Record<string, KitStatus> = { chaussures: 'have', batons: 'have', sac20: 'skip' }
    state.profile = { name: 'Wacil', level: 'expert', mode: 'journee', kitStatus }
    render(<KitPage user={user} memberName="Wacil" />)
    const stats = kitStats('journee', kitStatus)
    const { min, max } = budgetRange(stats.missing)
    expect(screen.getByText(`${stats.done}/${stats.total}`)).toBeTruthy()
    expect(screen.getByText(String(stats.missing.length))).toBeTruthy()
    expect(screen.getByText(`${stats.pct}%`)).toBeTruthy()
    const total = document.querySelector('.budget-total')!.textContent
    expect(total).toContain(`${min}€`)
    expect(total).toContain(`${max}€`)
  })

  it("un clic sur un statut appelle update avec le kitStatus modifié", () => {
    state.profile = { name: 'Wacil', level: 'expert', mode: 'journee', kitStatus: {} }
    render(<KitPage user={user} memberName="Wacil" />)
    // Premier article de la section Indispensables (ouverte par défaut) : chaussures
    fireEvent.click(screen.getAllByText("✓ J'ai")[0])
    expect(state.update).toHaveBeenCalledWith({
      kitStatus: { chaussures: 'have' },
      checked: { chaussures: true },
    })
  })

  it('re-cliquer sur le même statut le retire', () => {
    state.profile = { name: 'Wacil', level: 'expert', mode: 'journee', kitStatus: { chaussures: 'have' } }
    render(<KitPage user={user} memberName="Wacil" />)
    fireEvent.click(screen.getAllByText("✓ J'ai")[0])
    expect(state.update).toHaveBeenCalledWith({ kitStatus: {}, checked: { chaussures: false } })
  })
})
