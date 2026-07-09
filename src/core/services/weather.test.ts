import { describe, expect, it } from 'vitest'
import { weatherIcon, weatherQuality } from './weather'

describe('weatherQuality', () => {
  it('PLUIE pour un code averse ou plus de 5mm', () => {
    expect(weatherQuality(80, 10, 0)).toEqual({ label: 'PLUIE', quality: 'bad' })
    expect(weatherQuality(0, 10, 6)).toEqual({ label: 'PLUIE', quality: 'bad' })
  })
  it('MITIGÉ pour bruine, pluie légère ou vent fort', () => {
    expect(weatherQuality(51, 10, 0)).toEqual({ label: 'MITIGÉ', quality: 'mid' })
    expect(weatherQuality(0, 45, 0)).toEqual({ label: 'MITIGÉ', quality: 'mid' })
    expect(weatherQuality(0, 10, 2)).toEqual({ label: 'MITIGÉ', quality: 'mid' })
  })
  it('VENT entre 25 et 40 km/h sans pluie', () => {
    expect(weatherQuality(0, 30, 0)).toEqual({ label: 'VENT', quality: 'mid' })
  })
  it('BON par temps calme', () => {
    expect(weatherQuality(0, 10, 0)).toEqual({ label: 'BON', quality: 'ok' })
  })
})

describe('weatherIcon', () => {
  it('mappe les codes WMO comme l’ancienne app', () => {
    expect(weatherIcon(0)).toBe('☀️')
    expect(weatherIcon(2)).toBe('⛅')
    expect(weatherIcon(3)).toBe('☁️')
    expect(weatherIcon(45)).toBe('🌫️')
    expect(weatherIcon(61)).toBe('🌧️')
    expect(weatherIcon(71)).toBe('🌨️')
    expect(weatherIcon(80)).toBe('🌦️')
    expect(weatherIcon(95)).toBe('⛈️')
  })
})
