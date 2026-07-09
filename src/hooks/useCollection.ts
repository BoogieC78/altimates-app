import { useEffect, useState } from 'react'
import {
  onSnapshot,
  query,
  type CollectionReference,
  type QueryConstraint,
} from 'firebase/firestore'

interface CollectionState<T> {
  data: (T & { id: string })[]
  loading: boolean
  error: Error | null
}

/**
 * Abonnement temps réel à une collection Firestore (équivaut aux onSnapshot
 * de l'ancienne app). Se désabonne automatiquement au démontage.
 */
export function useCollection<T>(
  ref: CollectionReference<T>,
  ...constraints: QueryConstraint[]
): CollectionState<T> {
  const [state, setState] = useState<CollectionState<T>>({
    data: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    return onSnapshot(
      query(ref, ...constraints),
      (snap) => {
        const data = snap.docs.map((d) => ({ ...d.data(), id: d.id }))
        setState({ data, loading: false, error: null })
      },
      (error) => setState({ data: [], loading: false, error }),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref.path])

  return state
}
