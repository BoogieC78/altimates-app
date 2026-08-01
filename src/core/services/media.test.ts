import { describe, expect, it } from 'vitest'
import {
  MAX_BYTES,
  MAX_EDGE,
  MAX_PHOTOS,
  TARGET_BYTES,
  checkCanAdd,
  dataUrlBytes,
  fitDimensions,
  isAcceptedImage,
} from './media'

describe('fitDimensions', () => {
  it('réduit le côté le plus long à la limite en gardant le ratio', () => {
    expect(fitDimensions(4032, 3024)).toEqual({ width: 1280, height: 960 })
    expect(fitDimensions(3024, 4032)).toEqual({ width: 960, height: 1280 })
  })

  it('n\'agrandit jamais une image déjà petite', () => {
    expect(fitDimensions(800, 600)).toEqual({ width: 800, height: 600 })
    expect(fitDimensions(MAX_EDGE, 400)).toEqual({ width: MAX_EDGE, height: 400 })
  })

  it('tolère une image de taille nulle sans division par zéro', () => {
    expect(fitDimensions(0, 0)).toEqual({ width: 0, height: 0 })
  })
})

describe('dataUrlBytes', () => {
  it('calcule le poids réel de la charge base64', () => {
    // 'abc' encodé en base64 fait 4 caractères pour 3 octets utiles.
    expect(dataUrlBytes('data:image/jpeg;base64,YWJj')).toBe(3)
    expect(dataUrlBytes('data:image/jpeg;base64,YQ==')).toBe(1)
    expect(dataUrlBytes('data:image/jpeg;base64,YWI=')).toBe(2)
  })

  it('renvoie zéro pour une entrée qui n\'est pas une data URL', () => {
    expect(dataUrlBytes('')).toBe(0)
    expect(dataUrlBytes('https://exemple.fr/photo.jpg')).toBe(0)
  })

  it('reste cohérent avec les seuils du projet', () => {
    expect(TARGET_BYTES).toBeLessThan(MAX_BYTES)
    // La règle Firestore refuse au-delà de 400 000 octets de data URL.
    expect(MAX_BYTES).toBe(400_000)
  })
})

describe('isAcceptedImage', () => {
  it('accepte les formats photo courants, HEIC iPhone compris', () => {
    expect(isAcceptedImage('image/jpeg')).toBe(true)
    expect(isAcceptedImage('image/HEIC')).toBe(true)
    expect(isAcceptedImage('image/webp')).toBe(true)
  })

  it('refuse les vidéos et les fichiers non image', () => {
    expect(isAcceptedImage('video/mp4')).toBe(false)
    expect(isAcceptedImage('application/pdf')).toBe(false)
    expect(isAcceptedImage('')).toBe(false)
  })
})

describe('checkCanAdd', () => {
  it('laisse passer tant que la limite n\'est pas atteinte', () => {
    expect(checkCanAdd(0, 'image/jpeg')).toBeNull()
    expect(checkCanAdd(MAX_PHOTOS - 1, 'image/jpeg')).toBeNull()
  })

  it('refuse la photo au-delà du maximum par sortie', () => {
    expect(checkCanAdd(MAX_PHOTOS, 'image/jpeg')).toBe('MAXIMUM 6 PHOTOS PAR SORTIE')
  })

  it('refuse un format non supporté avec un message explicite', () => {
    expect(checkCanAdd(0, 'video/quicktime')).toBe('FORMAT NON SUPPORTÉ')
  })
})
