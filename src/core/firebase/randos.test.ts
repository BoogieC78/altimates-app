import { describe, expect, it } from 'vitest'
import { parseKomootCoords } from './randos'

describe('parseKomootCoords', () => {
  it('extrait lat/lon du fragment @lat,lon', () => {
    expect(parseKomootCoords('https://www.komoot.com/tour/123@45.93,6.87')).toEqual({
      lat: 45.93,
      lon: 6.87,
    })
  })
  it('gère les coordonnées négatives', () => {
    expect(parseKomootCoords('https://x.com/@-12.50,-3.25')).toEqual({ lat: -12.5, lon: -3.25 })
  })
  it('retourne null sans fragment', () => {
    expect(parseKomootCoords('https://www.komoot.com/tour/123')).toBeNull()
  })
})
