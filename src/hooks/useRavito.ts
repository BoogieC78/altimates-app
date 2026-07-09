import { useEffect, useState } from 'react'
import { subscribeHydra, subscribeRavito } from '../core/firebase/ravito'
import type { HydraDoc, RavitoDoc } from '../core/types'

/** Abonnement temps réel au doc partagé ravito/shared. */
export function useRavito(): RavitoDoc {
  const [data, setData] = useState<RavitoDoc>({})
  useEffect(() => subscribeRavito(setData), [])
  return data
}

/** Abonnement temps réel au doc partagé hydra/shared. */
export function useHydra(): HydraDoc {
  const [data, setData] = useState<HydraDoc>({})
  useEffect(() => subscribeHydra(setData), [])
  return data
}
