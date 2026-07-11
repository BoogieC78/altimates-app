import { FieldValue, getFirestore } from 'firebase-admin/firestore'

// Rate-limiting minimaliste sur Firestore (fenêtre fixe), pour les fonctions
// serverless Vercel (sans état). Collection `rateLimits` : accessible uniquement
// via le SDK Admin — elle n'est pas dans la liste blanche de firestore.rules,
// donc les clients ne peuvent ni la lire ni la falsifier.
//
// Fichier privé (préfixe _), non routé par Vercel.

interface RateLimitDoc {
  count: number
  windowStart: number // epoch ms
}

/**
 * Incrémente le compteur de `key` et renvoie true si la requête est autorisée
 * (compteur ≤ limit dans la fenêtre courante). Fenêtre fixe : au-delà de
 * `windowMs` depuis windowStart, le compteur repart de zéro.
 *
 * En cas d'erreur Firestore, on AUTORISE (fail-open) : le rate-limit est une
 * protection anti-abus, pas un contrôle d'accès — ne jamais casser le login.
 */
export async function allowRequest(key: string, limit: number, windowMs: number): Promise<boolean> {
  const db = getFirestore()
  // Les clés contiennent e-mails/IP : on encode pour rester un id de doc valide
  // (pas de '/') et éviter de stocker l'e-mail en clair dans l'id.
  const id = Buffer.from(key).toString('base64url')
  const ref = db.collection('rateLimits').doc(id)
  try {
    return await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref)
      const now = Date.now()
      const data = snap.data() as RateLimitDoc | undefined
      if (!data || now - data.windowStart > windowMs) {
        tx.set(ref, { count: 1, windowStart: now, updatedAt: FieldValue.serverTimestamp() })
        return true
      }
      tx.update(ref, { count: data.count + 1, updatedAt: FieldValue.serverTimestamp() })
      return data.count + 1 <= limit
    })
  } catch (err) {
    console.error('ratelimit:', err)
    return true
  }
}

/** Première IP de x-forwarded-for (renseigné par Vercel), sinon 'unknown'. */
export function clientIp(headers: Record<string, string | string[] | undefined>): string {
  const xff = headers['x-forwarded-for']
  const first = Array.isArray(xff) ? xff[0] : xff
  return first?.split(',')[0]?.trim() || 'unknown'
}
