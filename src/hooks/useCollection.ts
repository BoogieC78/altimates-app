import { useEffect, useState } from 'react'
import {
  onSnapshot,
  query,
  type CollectionReference,
  type QueryConstraint,
} from 'firebase/firestore'

export type WithDocId<T> = T & { docId: string }

interface CollectionState<T> {
  data: WithDocId<T>[]
  loading: boolean
  error: Error | null
}

/**
 * Abonnement temps réel à une collection Firestore (équivaut aux onSnapshot
 * de l'ancienne app). L'id du document est exposé en `docId` pour ne pas
 * écraser le champ métier `id` des anciens documents.
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
        const data = snap.docs.map((d) => ({ ...d.data(), docId: d.id }))
        setState({ data, loading: false, error: null })
      },
      (error) => setState({ data: [], loading: false, error }),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref.path])

  return state
}
