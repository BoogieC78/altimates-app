import { useEffect, useState } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../core/firebase/app'
import { devAutoSignIn, isDevAutoLoginEnabled, isMemberEmail, signOut } from '../core/firebase/auth'

interface AuthState {
  user: User | null
  loading: boolean
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ user: null, loading: true })

  useEffect(() => {
    let seq = 0
    let mounted = true

    const unsub = onAuthStateChanged(auth, (user) => {
      const my = ++seq
      if (!user) {
        // Dev/QA local uniquement (voir isDevAutoLoginEnabled) : pas de login manuel,
        // onAuthStateChanged se redéclenche automatiquement une fois connecté.
        if (import.meta.env.DEV && isDevAutoLoginEnabled()) {
          devAutoSignIn().catch((e) => console.error('devAutoSignIn:', e))
          return
        }
        if (mounted) setState({ user: null, loading: false })
        return
      }
      // Appartenance dynamique (config/allowedEmails) : lecture asynchrone.
      // On n'applique que la résolution du dernier événement d'auth (my === seq).
      void isMemberEmail(user.email).then((ok) => {
        if (!mounted || my !== seq) return
        if (!ok) {
          void signOut()
          setState({ user: null, loading: false })
          return
        }
        setState({ user, loading: false })
        // Identité de contact sur le document users : permet à l'Admin/Cordée
        // d'identifier un membre même sans profil configuré (les comptes
        // connectés par lien e-mail n'ont pas de displayName Google).
        void setDoc(
          doc(db, 'users', user.uid),
          { email: user.email ?? null, displayName: user.displayName ?? null },
          { merge: true },
        ).catch((e) => console.warn('users identity:', e))
      })
    })

    return () => {
      mounted = false
      unsub()
    }
  }, [])

  return state
}
