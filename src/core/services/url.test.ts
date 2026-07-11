import { describe, expect, it } from 'vitest'
import { safeExternalUrl } from './url'

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
