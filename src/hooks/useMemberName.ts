import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { db } from '../core/firebase/app'
import type { UserProfile } from '../core/types'

/**
 * Prénom du membre tel qu'utilisé comme clé dans memberVotes par l'ancienne app :
 * le `profile.name` du document users, sinon le prénom du compte Google.
 */
export function useMemberName(user: User | null): string {
  const fallback = user?.displayName?.split(' ')[0] ?? 'Anonyme'
  const [name, setName] = useState(fallback)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    getDoc(doc(db, 'users', user.uid)).then((snap) => {
      const profileName = (snap.data() as UserProfile | undefined)?.profile?.name
      if (!cancelled && profileName) setName(profileName)
    })
    return () => {
      cancelled = true
    }
  }, [user, fallback])

  return name
}
