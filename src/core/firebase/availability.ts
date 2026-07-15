import { deleteField, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { availabilityCol } from './collections'
import type { AvailabilityStatus } from '../types'

/**
 * Écrit (ou efface, si status = null) la disponibilité d'un jour pour le
 * membre courant. Un doc par uid — les règles Firestore n'autorisent que
 * l'écriture de son propre doc. Le merge ne touche que la clé du jour visé.
 */
export async function setDayAvailability(
  uid: string,
  name: string,
  iso: string,
  status: AvailabilityStatus | null,
): Promise<void> {
  await setDoc(
    doc(availabilityCol, uid),
    {
      name,
      days: { [iso]: status ?? deleteField() },
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}
