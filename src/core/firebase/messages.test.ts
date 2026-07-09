import { describe, expect, it } from 'vitest'
import { initials } from './messages'

describe('initials', () => {
  it('prend les deux premières lettres en majuscules', () => {
    expect(initials('Wacil')).toBe('WA')
    expect(initials('nordine')).toBe('NO')
  })
})
