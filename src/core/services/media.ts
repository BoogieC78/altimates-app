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

/**
 * Photo de profil : côté du carré, en pixels. Bien plus petite que les photos de
 * sortie — elle n'est jamais affichée au-delà de ~64px, et elle vit dans le
 * document `users/{uid}` qui porte déjà le kit et les stats. Un document
 * Firestore est plafonné à 1 Mio : une photo lourde y ferait échouer TOUTES les
 * écritures de profil, pas seulement l'ajout de la photo.
 */
export const AVATAR_EDGE = 256

/** Cible de poids d'une photo de profil après compression (40 Ko). */
export const AVATAR_TARGET_BYTES = 40_000

/** Plafond dur d'une photo de profil, aligné sur la règle Firestore (80 Ko). */
export const AVATAR_MAX_BYTES = 80_000

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

/**
 * Cadrage carré centré : les coordonnées de la source à recopier pour remplir un
 * carré sans déformer l'image. Une photo de profil est toujours rendue dans un
 * rond — étirer un portrait pour le rendre carré écraserait les visages.
 */
export function squareCrop(width: number, height: number): { x: number; y: number; size: number } {
  const size = Math.min(width, height)
  return { x: Math.round((width - size) / 2), y: Math.round((height - size) / 2), size }
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
  if (!ctx) throw new Error("Impossible de préparer la photo. Recharge la page et réessaie.")
  ctx.drawImage(bitmap, 0, 0, width, height)

  let dataUrl = ''
  for (const quality of QUALITY_STEPS) {
    dataUrl = canvas.toDataURL('image/jpeg', quality)
    if (dataUrlBytes(dataUrl) <= TARGET_BYTES) return dataUrl
  }
  if (dataUrlBytes(dataUrl) > MAX_BYTES) {
    throw new Error('Photo trop lourde même après compression. Choisis une photo moins grande.')
  }
  return dataUrl
}

/**
 * Compresse une image en vignette carrée pour servir de photo de profil.
 * Même principe que {@link compressImage}, mais avec un cadrage carré centré et
 * des seuils bien plus bas ({@link AVATAR_TARGET_BYTES}).
 */
export async function compressAvatar(file: File): Promise<string> {
  const bitmap = await loadImage(file)
  const { x, y, size } = squareCrop(bitmap.width, bitmap.height)
  const edge = Math.min(size, AVATAR_EDGE)

  const canvas = document.createElement('canvas')
  canvas.width = edge
  canvas.height = edge
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Impossible de préparer la photo. Recharge la page et réessaie.')
  ctx.drawImage(bitmap, x, y, size, size, 0, 0, edge, edge)

  let dataUrl = ''
  for (const quality of QUALITY_STEPS) {
    dataUrl = canvas.toDataURL('image/jpeg', quality)
    if (dataUrlBytes(dataUrl) <= AVATAR_TARGET_BYTES) return dataUrl
  }
  if (dataUrlBytes(dataUrl) > AVATAR_MAX_BYTES) {
    throw new Error('Photo trop lourde même après compression. Choisis une photo moins grande.')
  }
  return dataUrl
}

/**
 * Charge le fichier dans un élément Image.
 *
 * Le fichier est lu en data URL et NON via `URL.createObjectURL` : la CSP du
 * projet autorise `data:` dans `img-src` mais pas `blob:`, si bien que l'URL
 * d'objet était bloquée par le navigateur et faisait échouer tout ajout de photo
 * (constaté en staging le 2026-08-02). Passer par `data:` évite d'élargir la CSP.
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Impossible de lire ce fichier. Réessaie avec une autre photo.'))
    reader.onload = () => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error(undecodableMessage(file.type)))
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Message d'échec de décodage. Le cas courant est la photo iPhone en HEIC : le
 * fichier est valide, mais aucun navigateur de bureau ne sait l'afficher. Dire
 * « image illisible » laisse l'utilisateur sans issue — on nomme la cause et la
 * manœuvre de sortie.
 */
function undecodableMessage(type: string): string {
  if (/heic|heif/i.test(type)) {
    return "Ton iPhone a enregistré cette photo en HEIC, un format que le navigateur ne sait pas ouvrir. Dans Réglages > Appareil photo > Formats, choisis « Plus compatible », ou partage la photo par mail pour obtenir un JPEG."
  }
  return "Ce fichier n'est pas une photo que le navigateur sait ouvrir. Réessaie avec un JPEG ou un PNG."
}
