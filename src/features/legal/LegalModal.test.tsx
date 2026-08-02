import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { LegalLinks, LegalModal } from './LegalModal'
import { CONTACT_EMAIL, LEGAL_DOCS } from './legalContent'

describe('contenu légal', () => {
  it('fournit les trois documents attendus', () => {
    expect(LEGAL_DOCS.map((d) => d.id)).toEqual(['mentions', 'confidentialite', 'cgu'])
  })

  it('ne contient aucun document ni aucune section vide', () => {
    for (const doc of LEGAL_DOCS) {
      expect(doc.sections.length).toBeGreaterThan(0)
      for (const section of doc.sections) {
        expect(section.heading.trim()).not.toBe('')
        expect(section.body.length).toBeGreaterThan(0)
        for (const p of section.body) expect(p.trim().length).toBeGreaterThan(20)
      }
    }
  })

  it('ne laisse aucun trou de rédaction dans les textes publiés', () => {
    // Garde-fou : un « [à compléter] » oublié se retrouverait affiché tel quel
    // dans un document légal public.
    const tout = LEGAL_DOCS.flatMap((d) => d.sections.flatMap((s) => s.body)).join(' ')
    expect(tout).not.toMatch(/\[à compléter|TODO|XXX|lorem/i)
  })

  it('publie une adresse de contact dans les trois documents', () => {
    // Sans point de contact, le droit d'accès et de suppression RGPD annoncé
    // dans la politique de confidentialité n'est pas exerçable.
    for (const doc of LEGAL_DOCS) {
      const texte = doc.sections.flatMap((s) => s.body).join(' ')
      expect(texte, `aucun contact dans « ${doc.title} »`).toContain(CONTACT_EMAIL)
    }
  })

  it('nomme les hébergeurs et les services tiers réellement utilisés', () => {
    // Ces textes doivent suivre le code : si une origine externe est ajoutée à
    // la CSP sans être mentionnée ici, les mentions légales deviennent fausses.
    const mentions = LEGAL_DOCS[0].sections.flatMap((s) => s.body).join(' ')
    for (const tiers of ['Vercel', 'Firebase', 'Brevo', 'open-meteo', 'Google']) {
      expect(mentions, `${tiers} absent des mentions légales`).toContain(tiers)
    }
  })
})

describe('LegalModal', () => {
  it('ouvre le document demandé', () => {
    render(<LegalModal initial="cgu" onClose={() => {}} />)
    expect(screen.getByRole('heading', { name: "Conditions générales d’utilisation" })).toBeTruthy()
  })

  it('permet de passer d\'un document à l\'autre sans refermer', () => {
    render(<LegalModal initial="mentions" onClose={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Confidentialité' }))
    expect(screen.getByRole('heading', { name: 'Politique de confidentialité' })).toBeTruthy()
  })

  it('est une boîte de dialogue fermable', () => {
    let closed = false
    render(<LegalModal initial="mentions" onClose={() => (closed = true)} />)
    expect(screen.getByRole('dialog').getAttribute('aria-modal')).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }))
    expect(closed).toBe(true)
  })
})

describe('LegalLinks', () => {
  it('n\'affiche aucune modale tant qu\'on ne clique pas', () => {
    render(<LegalLinks />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('ouvre le document correspondant au lien cliqué', () => {
    render(<LegalLinks />)
    fireEvent.click(screen.getByRole('button', { name: 'Mentions légales' }))
    expect(screen.getByRole('heading', { name: 'Mentions légales' })).toBeTruthy()
  })

  it('propose les trois documents', () => {
    render(<LegalLinks />)
    for (const doc of LEGAL_DOCS) {
      expect(screen.getByRole('button', { name: doc.short })).toBeTruthy()
    }
  })
})
