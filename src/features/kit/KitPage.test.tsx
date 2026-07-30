import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { User } from 'firebase/auth'
import type { KitStatus } from '../../core/constants/gear'
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
    // Mode journée (14 articles) : 2 'have' (chaussures, batons), 1 'skip' (sac20)
    // → 11 manquants, 14 %, budget 161–410 € (sommes des fourchettes de gear.ts).
    const kitStatus: Record<string, KitStatus> = { chaussures: 'have', batons: 'have', sac20: 'skip' }
    state.profile = { name: 'Wacil', level: 'expert', mode: 'journee', kitStatus }
    render(<KitPage user={user} memberName="Wacil" />)
    expect(screen.getByText('2/14')).toBeTruthy()
    expect(screen.getByText('11')).toBeTruthy()
    expect(screen.getByText('14%')).toBeTruthy()
    const total = document.querySelector('.budget-total')!.textContent
    expect(total).toContain('161€')
    expect(total).toContain('410€')
  })

  it('affiche le poids du sac estimé, hors articles skippés', () => {
    // Mode journée : 14 articles, dont 5 portés sur soi (chaussures, bâtons, casquette,
    // t-shirt, chaussettes) exclus du sac. sac20 (1100–1270 g) skippé → 8 articles dans
    // le sac, soit 1560–2470 g (sommes des fourchettes `weight` de gear.ts).
    state.profile = { name: 'Wacil', level: 'expert', mode: 'journee', kitStatus: { sac20: 'skip' } }
    render(<KitPage user={user} memberName="Wacil" />)
    const poids = document.querySelector('.budget-weight-val')!.textContent
    expect(poids).toContain('1,6 kg')
    expect(poids).toContain('2,5 kg')
    expect(screen.getByText(/8 articles dans le sac/)).toBeTruthy()
  })

  it('le poids augmente quand on ré-intègre un article au sac', () => {
    // Contraste avec le test précédent : sans skip, le sac à dos revient dans le total.
    state.profile = { name: 'Wacil', level: 'expert', mode: 'journee', kitStatus: {} }
    render(<KitPage user={user} memberName="Wacil" />)
    const poids = document.querySelector('.budget-weight-val')!.textContent
    expect(poids).toContain('2,7 kg')
    expect(poids).toContain('3,7 kg')
    expect(screen.getByText(/9 articles dans le sac/)).toBeTruthy()
  })

  it('signale par un astérisque que le porté-sur-soi est exclu', () => {
    state.profile = { name: 'Wacil', level: 'expert', mode: 'journee', kitStatus: {} }
    render(<KitPage user={user} memberName="Wacil" />)
    const note = document.querySelector('.budget-weight-note')!.textContent!
    expect(note).toContain('dans le sac')
    expect(note).toContain('porté sur soi')
    // La note nomme ce qui est exclu, sinon l'astérisque n'explique rien.
    expect(note).toContain('bâtons')
    expect(note).toContain('chaussures')
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
