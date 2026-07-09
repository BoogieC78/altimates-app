import { useEffect, useState } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from '../core/firebase/app'
import { isAllowed, signOut } from '../core/firebase/auth'

interface AuthState {
  user: User | null
  loading: boolean
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ user: null, loading: true })

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      if (user && !isAllowed(user.email)) {
        void signOut()
        setState({ user: null, loading: false })
        return
      }
      setState({ user, loading: false })
    })
  }, [])

  return state
}
