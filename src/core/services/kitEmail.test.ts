import { describe, expect, it } from 'vitest'
import { buildKitEmailLines, kitMailtoUrl } from './kitEmail'

describe('buildKitEmailLines', () => {
  it('génère l’en-tête, les sections et les cases cochées', () => {
    const lines = buildKitEmailLines('trek', { chaussures: true }, 'Wacil', new Date(2026, 6, 9))
    expect(lines[0]).toBe('ALTIMATES · Kit Trek · Wacil')
    expect(lines[1]).toBe('09/07/2026')
    expect(lines).toContain('INDISPENSABLES')
    expect(lines).toContain('RECOMMANDÉS')
    expect(lines).toContain('FACULTATIFS')
    // Article coché vs non coché, avec prix et note
    expect(lines).toContain('[x] Chaussures de rando · 80–180€ · Gore-Tex si saison humide · Vibram recommandée')
    expect(lines.some((l) => l.startsWith('[ ] Bâtons de rando'))).toBe(true)
    // Les liens sont indentés sous l’article
    expect(lines.some((l) => l.startsWith('    → MT900 · 50+10L: https://'))).toBe(true)
    expect(lines[lines.length - 1]).toBe('---\nALTImates · Plan, gear up, summit together.')
  })
})

describe('kitMailtoUrl', () => {
  it('construit un mailto: avec sujet et corps encodés', () => {
    const url = kitMailtoUrl(' test@example.com ', 'journee', {}, 'Wacil')
    expect(url.startsWith('mailto:test@example.com?subject=')).toBe(true)
    expect(url).toContain(encodeURIComponent('Mon kit ALTImates · Journée'))
    expect(url).toContain(encodeURIComponent('ALTIMATES · Kit Journée · Wacil'))
  })
})
