// Photos post-rando : compression côté client avant écriture dans Firestore.
//
// Il n'y a volontairement pas de Firebase Storage (pas de plan Blaze) : chaque
// photo est stockée en data URL dans son propre document Firestore. Un document
// est plafonné à 1 MiB par Firestore, d'où la compression agressive ci-dessous.

/** Nombre maximum de photos par sortie — on partage quelques images, pas une galerie. */
export const MAX_PHOTOS = 6

/** Côté le plus long après redimensionnement, en pixels. */
export const MAX_EDGE = 1280

/** Cible de poids après compression (200 Ko), en octets. */
export const TARGET_BYTES = 200_000

/**
 * Plafond dur accepté par les règles Firestore (400 Ko de data URL). Marge de
 * sécurité sous la limite de 1 MiB d'un document, qui porte aussi les métadonnées.
 */
export const MAX_BYTES = 400_000

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']

/** Types d'images acceptés à l'import (les photos iPhone arrivent en HEIC). */
export function isAcceptedImage(type: string): boolean {
  return ACCEPTED_TYPES.includes(type.toLowerCase())
}

/**
 * Dimensions réduites pour tenir dans un carré de `maxEdge`, en conservant le
 * ratio. Une image déjà plus petite n'est jamais agrandie : ça n'ajouterait que
 * du poids sans gagner en qualité.
 */
export function fitDimensions(width: number, height: number, maxEdge = MAX_EDGE): { width: number; height: number } {
  const longest = Math.max(width, height)
  if (longest <= maxEdge || longest === 0) return { width, height }
  const ratio = maxEdge / longest
  return { width: Math.round(width * ratio), height: Math.round(height * ratio) }
}

/** Poids réel (octets) de la charge utile d'une data URL base64. */
export function dataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(',')
  if (comma === -1) return 0
  const base64 = dataUrl.slice(comma + 1)
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding)
}

/** Message d'erreur si l'ajout doit être refusé, null si tout est bon. */
export function checkCanAdd(currentCount: number, type: string): string | null {
  if (currentCount >= MAX_PHOTOS) return `MAXIMUM ${MAX_PHOTOS} PHOTOS PAR SORTIE`
  if (!isAcceptedImage(type)) return 'FORMAT NON SUPPORTÉ'
  return null
}

/** Paliers de qualité JPEG essayés successivement tant que la cible n'est pas atteinte. */
export const QUALITY_STEPS = [0.82, 0.7, 0.6, 0.5, 0.4]

/**
 * Compresse une image en JPEG sous {@link TARGET_BYTES}, en baissant la qualité
 * par paliers. Renvoie la data URL, ou lève si l'image ne peut pas être lue ou
 * reste au-dessus de {@link MAX_BYTES} même à la qualité la plus basse (les
 * règles Firestore la refuseraient de toute façon).
 */
export async function compressImage(file: File): Promise<string> {
  const bitmap = await loadImage(file)
  const { width, height } = fitDimensions(bitmap.width, bitmap.height)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error("Impossible de préparer l'image")
  ctx.drawImage(bitmap, 0, 0, width, height)

  let dataUrl = ''
  for (const quality of QUALITY_STEPS) {
    dataUrl = canvas.toDataURL('image/jpeg', quality)
    if (dataUrlBytes(dataUrl) <= TARGET_BYTES) return dataUrl
  }
  if (dataUrlBytes(dataUrl) > MAX_BYTES) throw new Error('Photo trop lourde même après compression')
  return dataUrl
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Image illisible"))
    }
    img.src = url
  })
}
