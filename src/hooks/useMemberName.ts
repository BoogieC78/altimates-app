import { useEffect, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { db } from '../core/firebase/app'
import type { UserProfile } from '../core/types'

export interface MemberNameState {
  /** Prénom du membre : `profile.name` du document users, sinon prénom Google. */
  name: string
  /** true = aucun prénom exploitable (ni profil, ni compte Google) : à demander au membre. */
  needsName: boolean
  /** Enregistre le prénom dans users/{uid}.profile.name. */
  saveName: (name: string) => Promise<void>
}

/**
 * Prénom du membre tel qu'utilisé comme clé dans memberVotes par l'ancienne app.
 * Un `profile.name` valant 'Anonyme' est traité comme absent : c'est l'ancien
 * fallback qui a pu être persisté par l'onboarding Kit pour les comptes connectés
 * par lien e-mail (sans displayName Google) — voir carte Trello FMl7ZRjm.
 */
export function useMemberName(user: User | null): MemberNameState {
  // undefined = pas encore chargé, null = chargé mais sans nom valide
  const [profileName, setProfileName] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    if (!user) {
      setProfileName(undefined)
      return
    }
    return onSnapshot(doc(db, 'users', user.uid), (snap) => {
      const n = (snap.data() as UserProfile | undefined)?.profile?.name
      setProfileName(n && n !== 'Anonyme' ? n : null)
    })
  }, [user])

  const googleName = user?.displayName?.split(' ')[0] || null
  const name = profileName || googleName || 'Anonyme'
  const needsName = !!user && profileName === null && !googleName

  const saveName = async (raw: string) => {
    if (!user) return
    const trimmed = raw.trim()
    if (!trimmed || trimmed === 'Anonyme') return
    await setDoc(doc(db, 'users', user.uid), { profile: { name: trimmed } }, { merge: true })
  }

  return { name, needsName, saveName }
}
