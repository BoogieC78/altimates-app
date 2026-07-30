import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { User } from 'firebase/auth'
import type { KitStatus } from '../../core/constants/gear'
import { allItems } from '../../core/services/kit'
import type { Profile } from '../../hooks/useUserProfile'

const state = {
  profile: null as Profile | null,
  loading: false,
  update: vi.fn(() => Promise.resolve()),
  resetKit: vi.fn(() => Promise.resolve()),
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
    // → 11 manquants, 15 % (2/13 pertinents, skip hors dénominateur), budget 161–410 €.
    const kitStatus: Record<string, KitStatus> = { chaussures: 'have', batons: 'have', sac20: 'skip' }
    state.profile = { name: 'Wacil', level: 'expert', mode: 'journee', kitStatus }
    render(<KitPage user={user} memberName="Wacil" />)
    expect(screen.getByText('2/14')).toBeTruthy()
    expect(screen.getByText('11')).toBeTruthy()
    expect(screen.getByText('15%')).toBeTruthy()
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
    // 'have' sur un article porté sur soi : ne change ni le sac ni son poids,
    // mais évite le triage express (réservé au kit 100 % vierge).
    state.profile = { name: 'Wacil', level: 'expert', mode: 'journee', kitStatus: { chaussures: 'have' } }
    render(<KitPage user={user} memberName="Wacil" />)
    const poids = document.querySelector('.budget-weight-val')!.textContent
    expect(poids).toContain('2,7 kg')
    expect(poids).toContain('3,7 kg')
    expect(screen.getByText(/9 articles dans le sac/)).toBeTruthy()
  })

  it('signale par un astérisque que le porté-sur-soi est exclu', () => {
    state.profile = { name: 'Wacil', level: 'expert', mode: 'journee', kitStatus: { chaussures: 'have' } }
    render(<KitPage user={user} memberName="Wacil" />)
    const note = document.querySelector('.budget-weight-note')!.textContent!
    expect(note).toContain('dans le sac')
    expect(note).toContain('porté sur soi')
    // La note nomme ce qui est exclu, sinon l'astérisque n'explique rien.
    expect(note).toContain('bâtons')
    expect(note).toContain('chaussures')
  })

  it("un clic sur un statut appelle update avec le kitStatus modifié", () => {
    state.profile = { name: 'Wacil', level: 'expert', mode: 'journee', kitStatus: { batons: 'have' } }
    render(<KitPage user={user} memberName="Wacil" />)
    // Premier article de la section Indispensables (ouverte par défaut) : chaussures
    fireEvent.click(screen.getAllByText("✓ J'ai")[0])
    expect(state.update).toHaveBeenCalledWith({
      kitStatus: { batons: 'have', chaussures: 'have' },
      checked: { chaussures: true },
    })
  })

  it('re-cliquer sur le même statut le retire', () => {
    state.profile = { name: 'Wacil', level: 'expert', mode: 'journee', kitStatus: { chaussures: 'have' } }
    render(<KitPage user={user} memberName="Wacil" />)
    fireEvent.click(screen.getAllByText("✓ J'ai")[0])
    expect(state.update).toHaveBeenCalledWith({ kitStatus: {}, checked: { chaussures: false } })
  })

  it('kit vierge : le triage express démarre à la place de la liste', () => {
    state.profile = { name: 'Wacil', level: 'expert', mode: 'journee', kitStatus: {} }
    render(<KitPage user={user} memberName="Wacil" />)
    expect(screen.getByText('TRIAGE · 1/14')).toBeTruthy()
    // La liste classique n'est pas rendue derrière.
    expect(document.querySelector('.gear-item')).toBeNull()
  })

  it("triage : « J'ai » écrit le statut et passe à l'article suivant", () => {
    state.profile = { name: 'Wacil', level: 'expert', mode: 'journee', kitStatus: {} }
    render(<KitPage user={user} memberName="Wacil" />)
    fireEvent.click(screen.getByText("✓ J'ai"))
    expect(state.update).toHaveBeenCalledWith({
      kitStatus: { chaussures: 'have' },
      checked: { chaussures: true },
    })
    expect(screen.getByText('TRIAGE · 2/14')).toBeTruthy()
  })

  it('triage : « Pas besoin » écrit skip, « Décider plus tard » ne touche à rien', () => {
    state.profile = { name: 'Wacil', level: 'expert', mode: 'journee', kitStatus: {} }
    render(<KitPage user={user} memberName="Wacil" />)
    fireEvent.click(screen.getByText('✕ Pas besoin'))
    expect(state.update).toHaveBeenCalledWith({
      kitStatus: { chaussures: 'skip' },
      checked: { chaussures: false },
    })
    state.update.mockClear()
    fireEvent.click(screen.getByText('Décider plus tard →'))
    expect(state.update).not.toHaveBeenCalled()
    expect(screen.getByText('TRIAGE · 3/14')).toBeTruthy()
  })

  it('triage : « Voir la liste » sort vers la checklist classique', () => {
    state.profile = { name: 'Wacil', level: 'expert', mode: 'journee', kitStatus: {} }
    render(<KitPage user={user} memberName="Wacil" />)
    fireEvent.click(screen.getByText('Voir la liste →'))
    expect(screen.getByText('Indispensables')).toBeTruthy()
    // Le bouton de relance affiche le nombre d'articles non triés.
    expect(screen.getByText('Trier (14)')).toBeTruthy()
  })

  it('kit déjà entamé : pas de triage, mais bouton « Trier (N) » pour les restants', () => {
    state.profile = { name: 'Wacil', level: 'expert', mode: 'journee', kitStatus: { chaussures: 'have' } }
    render(<KitPage user={user} memberName="Wacil" />)
    expect(screen.queryByText(/^TRIAGE/)).toBeNull()
    fireEvent.click(screen.getByText('Trier (13)'))
    // Le triage relancé ne repropose pas les articles déjà statués.
    expect(screen.getByText('TRIAGE · 1/13')).toBeTruthy()
  })

  it('« Tout retrier » relance le triage sur TOUS les articles, statués compris', () => {
    state.profile = { name: 'Wacil', level: 'expert', mode: 'journee', kitStatus: { chaussures: 'have' } }
    render(<KitPage user={user} memberName="Wacil" />)
    fireEvent.click(screen.getByText('Tout retrier'))
    expect(screen.getByText('TRIAGE · 1/14')).toBeTruthy()
  })

  it("triage : répondre « J'ai » sur un article déjà possédé le GARDE (pas de toggle)", () => {
    state.profile = { name: 'Wacil', level: 'expert', mode: 'journee', kitStatus: { chaussures: 'have' } }
    render(<KitPage user={user} memberName="Wacil" />)
    fireEvent.click(screen.getByText('Tout retrier'))
    // Carte 1 = chaussures, déjà 'have' : setStatus togglerait vers rien, le triage non.
    fireEvent.click(screen.getByText("✓ J'ai"))
    expect(state.update).toHaveBeenCalledWith({
      kitStatus: { chaussures: 'have' },
      checked: { chaussures: true },
    })
  })

  it('kit complet : « Trier (N) » disparaît mais « Tout retrier » reste', () => {
    const kitStatus: Record<string, KitStatus> = {}
    for (const g of allItems('journee')) kitStatus[g.id] = 'have'
    state.profile = { name: 'Wacil', level: 'expert', mode: 'journee', kitStatus }
    render(<KitPage user={user} memberName="Wacil" />)
    expect(screen.queryByText(/^Trier \(/)).toBeNull()
    expect(screen.getByText('Tout retrier')).toBeTruthy()
  })

  it('« Réinitialiser mon kit » appelle resetKit après confirmation', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    state.profile = { name: 'Wacil', level: 'expert', mode: 'journee', kitStatus: { chaussures: 'have' } }
    render(<KitPage user={user} memberName="Wacil" />)
    fireEvent.click(screen.getByText('Réinitialiser mon kit'))
    expect(state.resetKit).toHaveBeenCalledOnce()
    confirmSpy.mockRestore()
  })

  it('« Réinitialiser mon kit » annulé ne touche à rien', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    state.profile = { name: 'Wacil', level: 'expert', mode: 'journee', kitStatus: { chaussures: 'have' } }
    render(<KitPage user={user} memberName="Wacil" />)
    fireEvent.click(screen.getByText('Réinitialiser mon kit'))
    expect(state.resetKit).not.toHaveBeenCalled()
    confirmSpy.mockRestore()
  })
})
