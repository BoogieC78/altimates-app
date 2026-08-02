import { useCallback, useEffect, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { db } from '../core/firebase/app'
import type { UserProfile } from '../core/types'

export interface MemberNameState {
  /** Prénom du membre : `profile.name` du document users, sinon prénom Google. */
  name: string
  /** Photo de profil (data URL), null si le membre n'en a pas choisi. */
  photo: string | null
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
  // La photo vient du MÊME instantané que le prénom : la lire à part doublerait
  // l'abonnement au document pour une donnée déjà présente ici.
  const [photo, setPhoto] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setProfileName(undefined)
      setPhoto(null)
      return
    }
    return onSnapshot(doc(db, 'users', user.uid), (snap) => {
      const profile = (snap.data() as UserProfile | undefined)?.profile
      const n = profile?.name
      setProfileName(n && n !== 'Anonyme' ? n : null)
      setPhoto(profile?.photo ?? null)
    })
  }, [user])

  const googleName = user?.displayName?.split(' ')[0] || null
  const name = profileName || googleName || 'Anonyme'
  const needsName = !!user && profileName === null && !googleName

  const saveName = useCallback(
    async (raw: string) => {
      if (!user) return
      const trimmed = raw.trim()
      if (!trimmed || trimmed === 'Anonyme') return
      await setDoc(doc(db, 'users', user.uid), { profile: { name: trimmed } }, { merge: true })
    },
    [user],
  )

  // Un membre connecté par Google a un prénom À L'ÉCRAN (son displayName) mais
  // rien en base : la modale de prénom ne s'affiche pas pour lui, et rien
  // n'écrit `profile.name`. Or les règles Firestore identifient l'auteur d'une
  // dépense ou d'une déclaration de transport PAR CE CHAMP : sans lui, le membre
  // se voit refuser l'écriture alors que l'interface l'y invite, et l'échec est
  // muet. On aligne donc la base sur ce qui est affiché, dès la connexion.
  useEffect(() => {
    if (!user || profileName !== null || !googleName) return
    void saveName(googleName).catch((e) => console.warn('adoption du prénom Google:', e))
  }, [user, profileName, googleName, saveName])

  return { name, photo, needsName, saveName }
}
