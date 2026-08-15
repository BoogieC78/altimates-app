import { describe, expect, it } from 'vitest'
import { initials } from './messages'
import { BROADCAST_CHANNEL_ID, messagesColForChannel } from './collections'

describe('initials', () => {
  it('prend les deux premières lettres en majuscules', () => {
    expect(initials('Wacil')).toBe('WA')
    expect(initials('nordine')).toBe('NO')
  })
})

describe('messagesColForChannel', () => {
  it('le canal broadcast pointe la collection racine historique (aucune migration)', () => {
    expect(messagesColForChannel(BROADCAST_CHANNEL_ID).path).toBe('messages')
  })

  it('un canal de cordée pointe la sous-collection de la cordée', () => {
    expect(messagesColForChannel('abc123').path).toBe('cordees/abc123/messages')
  })
})
