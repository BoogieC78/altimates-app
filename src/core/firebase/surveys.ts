// Réponses à l'enquête post-rando : un document par (rando, membre) dans la
// collection randoSurveys, id = `${randoId}_${uid}`. Comme transport : chacun
// n'écrit que sa propre réponse, ce que les règles Firestore imposent (elles
// vérifient l'uid, jamais le prénom). Une resoumission écrase la précédente —
// c'est ce qui rend la réponse modifiable tant que l'enquête est ouverte.

import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { randoSurveysCol } from './collections'
import { surveyDocId } from '../services/survey'
import type { SurveyDifficulty, SurveyResponse, SurveyWeather } from '../types'

export interface NewSurveyResponse {
  randoId: string
  author: string
  /** uid Firebase : c'est lui que vérifient les règles, pas le prénom */
  authorUid: string
  rating: number
  difficulty: SurveyDifficulty
  weather: SurveyWeather
  organization: number
  comment?: string
}

/** Enregistre (ou remplace) la réponse du membre pour une sortie. */
export async function saveSurveyResponse(input: NewSurveyResponse): Promise<void> {
  const comment = input.comment?.trim()
  await setDoc(
    doc(randoSurveysCol, surveyDocId(input.randoId, input.authorUid)),
    {
      randoId: input.randoId,
      author: input.author,
      authorUid: input.authorUid,
      rating: input.rating,
      difficulty: input.difficulty,
      weather: input.weather,
      organization: input.organization,
      // Champ absent plutôt que chaîne vide : la restitution teste sa présence.
      ...(comment ? { comment } : {}),
      updatedAt: serverTimestamp(),
    } as unknown as SurveyResponse,
    { merge: false },
  )
}
