import { useEffect, useState } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from '../core/firebase/app'
import { isMemberEmail, signOut } from '../core/firebase/auth'

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
      })
    })

    return () => {
      mounted = false
      unsub()
    }
  }, [])

  return state
}
