import { useEffect, useState } from 'react'
import { deleteField, doc, onSnapshot, setDoc } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { db } from '../core/firebase/app'
import type { KitMode, KitStatus, Level } from '../core/constants/gear'

export interface PastOuting {
  id: number
  name: string
  km?: number
  dplus?: number
}

// Forme du champ `profile` des documents users, héritée de l'ancienne app
// (elle y stockait son objet `user` local entier).
export interface Profile {
  name?: string
  /**
   * Photo de profil, en data URL. Stockée dans le document `users/{uid}` faute
   * de Firebase Storage (pas de plan Blaze) — d'où la compression agressive de
   * `compressAvatar` et le plafond de taille imposé par les règles Firestore.
   */
  photo?: string
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
  /** sorties faites avant ALTImates, saisies manuellement (historique / XP) */
  pastOutings?: PastOuting[]
}

interface UserProfileState {
  profile: Profile | null
  loading: boolean
  /** Fusionne des champs dans profile (+ maintient kitChecked en miroir, comme l'ancienne app). */
  update: (patch: Partial<Profile>) => Promise<void>
  /**
   * Enregistre la photo de profil, ou la retire avec `null`. Passer par `update`
   * ne permettrait pas le retrait : `setDoc(..., {merge:true})` ignore un champ
   * absent et refuse `undefined`, seul `deleteField()` efface réellement.
   */
  setPhoto: (dataUrl: string | null) => Promise<void>
  /** Réinitialise le profil (efface profile + kitChecked), équivalent de resetUser(). */
  reset: () => Promise<void>
  /** Réinitialise uniquement le kit (statuts + niveau/mode) — les stats perso survivent. */
  resetKit: () => Promise<void>
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

  const setPhoto = async (dataUrl: string | null) => {
    if (!user) return
    await setDoc(
      doc(db, 'users', user.uid),
      { profile: { photo: dataUrl ?? deleteField() } },
      { merge: true },
    )
  }

  const reset = async () => {
    if (!user) return
    await setDoc(doc(db, 'users', user.uid), { profile: null, kitChecked: {} }, { merge: true })
  }

  const resetKit = async () => {
    if (!user) return
    // setDoc merge fusionne les maps en profondeur : écrire `{}` ne viderait rien,
    // il faut supprimer les champs explicitement (deleteField) pour revenir au vierge.
    await setDoc(
      doc(db, 'users', user.uid),
      {
        profile: {
          level: deleteField(),
          mode: deleteField(),
          kitStatus: deleteField(),
          checked: deleteField(),
          kitShare: deleteField(),
        },
        kitChecked: deleteField(),
      },
      { merge: true },
    )
  }

  return { profile, loading, update, setPhoto, reset, resetKit }
}
