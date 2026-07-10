import { useEffect, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { db } from '../core/firebase/app'
import type { KitMode, KitStatus, Level } from '../core/constants/gear'

// Forme du champ `profile` des documents users, héritée de l'ancienne app
// (elle y stockait son objet `user` local entier).
export interface Profile {
  name?: string
  level?: Level
  mode?: KitMode
  checked?: Record<string, boolean>
  kitStatus?: Record<string, KitStatus>
  kitShare?: Record<string, { shared: boolean; capacity: number }>
  km?: number
  dplus?: number
  sorties?: number
  bestKm?: number
  bestDplus?: number
}

interface UserProfileState {
  profile: Profile | null
  loading: boolean
  /** Fusionne des champs dans profile (+ maintient kitChecked en miroir, comme l'ancienne app). */
  update: (patch: Partial<Profile>) => Promise<void>
  /** Réinitialise le profil (efface profile + kitChecked), équivalent de resetUser(). */
  reset: () => Promise<void>
}

export function useUserProfile(user: User | null): UserProfileState {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    return onSnapshot(doc(db, 'users', user.uid), (snap) => {
      setProfile((snap.data()?.profile as Profile | undefined) ?? null)
      setLoading(false)
    })
  }, [user])

  const update = async (patch: Partial<Profile>) => {
    if (!user) return
    const next = { ...(profile ?? {}), ...patch }
    await setDoc(
      doc(db, 'users', user.uid),
      { profile: next, kitChecked: next.checked ?? {} },
      { merge: true },
    )
  }

  const reset = async () => {
    if (!user) return
    await setDoc(doc(db, 'users', user.uid), { profile: null, kitChecked: {} }, { merge: true })
  }

  return { profile, loading, update, reset }
}
