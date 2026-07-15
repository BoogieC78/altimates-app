import { describe, expect, it } from 'vitest'
import { safeExternalUrl, tourSearchUrl } from './url'

describe('tourSearchUrl', () => {
  it('ouvre la page discover Komoot quand la rando a des coordonnées', () => {
    expect(tourSearchUrl({ name: 'Lac Blanc', region: 'Chamonix', lat: 45.9581, lon: 6.8489 })).toBe(
      'https://www.komoot.com/fr-fr/discover/Lac%20Blanc/@45.9581000,6.8489000/tours?sport=hike&map=true&max_distance=15000',
    )
  })

  it('gère les coordonnées négatives', () => {
    expect(tourSearchUrl({ name: 'X', region: 'Y', lat: -12.5, lon: -3.25 })).toContain('/@-12.5000000,-3.2500000/')
  })

  it('formate les coordonnées entières avec décimales (Komoot 404 sinon)', () => {
    expect(tourSearchUrl({ name: 'X', region: 'Y', lat: 45.5, lon: 6 })).toContain('/@45.5000000,6.0000000/')
  })

  it("replie sur une recherche Google quand il n'y a pas de coordonnées", () => {
    expect(tourSearchUrl({ name: 'Lac Blanc', region: 'Chamonix' })).toBe(
      'https://www.google.com/search?q=Lac%20Blanc%20Chamonix%20komoot',
    )
  })

  it('replie aussi quand une seule coordonnée manque', () => {
    expect(tourSearchUrl({ name: 'X', region: 'Y', lat: 45 })).toContain('google.com/search')
  })
})

describe('safeExternalUrl', () => {
  it('accepte http et https', () => {
    expect(safeExternalUrl('https://www.komoot.com/tour/123')).toBe('https://www.komoot.com/tour/123')
    expect(safeExternalUrl('http://example.com/a?b=c')).toBe('http://example.com/a?b=c')
  })

  it('normalise les espaces autour', () => {
    expect(safeExternalUrl('  https://komoot.com/t/1  ')).toBe('https://komoot.com/t/1')
  })

  it('rejette les schémas dangereux (XSS via href)', () => {
    expect(safeExternalUrl('javascript:alert(1)')).toBeNull()
    // Contourne un simple .includes('komoot') : le schéma reste bloqué.
    expect(safeExternalUrl('javascript:alert(1)//komoot')).toBeNull()
    expect(safeExternalUrl('data:text/html,<script>alert(1)</script>')).toBeNull()
    expect(safeExternalUrl('vbscript:msgbox(1)')).toBeNull()
    expect(safeExternalUrl('file:///etc/passwd')).toBeNull()
  })

  it('rejette les valeurs non-URL, vides ou absentes', () => {
    expect(safeExternalUrl('pas une url')).toBeNull()
    expect(safeExternalUrl('')).toBeNull()
    expect(safeExternalUrl(null)).toBeNull()
    expect(safeExternalUrl(undefined)).toBeNull()
  })
})
