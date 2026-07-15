import type { Rando, VoteValue } from '../types'

export interface VoteTransition {
  memberVotes: Record<string, VoteValue>
  votes: { oui: number; peut: number; non: number }
  /** null si le membre vient de retirer son vote */
  myVote: VoteValue | null
}

/**
 * Reproduit la logique de vote de l'ancienne app : cliquer sur son vote actuel
 * le retire, cliquer sur l'autre le remplace. Les compteurs `votes` restent
 * le miroir des changements (ils peuvent inclure un offset historique des
 * données mock, on ne les recalcule donc pas depuis zéro).
 */
export function applyVote(rando: Rando, memberName: string, value: VoteValue): VoteTransition {
  const memberVotes: Record<string, VoteValue> = { ...(rando.memberVotes ?? {}) }
  const votes = { oui: rando.votes?.oui ?? 0, peut: rando.votes?.peut ?? 0, non: rando.votes?.non ?? 0 }
  const current = memberVotes[memberName] ?? null

  if (current === value) {
    delete memberVotes[memberName]
    votes[value] = Math.max(0, votes[value] - 1)
    return { memberVotes, votes, myVote: null }
  }

  if (current) {
    delete memberVotes[memberName]
    votes[current] = Math.max(0, votes[current] - 1)
  }
  memberVotes[memberName] = value
  votes[value] += 1
  return { memberVotes, votes, myVote: value }
}

export function votersFor(rando: Rando, value: VoteValue): string[] {
  return Object.entries(rando.memberVotes ?? {})
    .filter(([, v]) => v === value)
    .map(([name]) => name)
}
