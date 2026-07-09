// Types des 6 collections Firestore existantes (projet altimates-4c37f).
// Modélisés d'après les données réelles écrites par l'ancienne app (index.html v0.2.x).

import type { Timestamp } from 'firebase/firestore'

export type DurType = 'day' | 'trek'

export interface Rando {
  id: string
  name: string
  region: string
  lat: number
  lon: number
  durType: DurType
  /** Date ISO (jour) ou date de début (trek) */
  date: string
  /** Date de fin, uniquement pour les treks */
  dateEnd?: string
  dplus: number
  komoot?: string
  alert?: { text: string }
  /** vote par membre : clé = nom du membre, valeur = 'oui' | 'peut-etre' | 'non' */
  memberVotes?: Record<string, string>
  createdAt?: Timestamp
}

export type MessageType = 'message' | 'alerte' | 'position' | 'confirmation'

export interface RadioMessage {
  id: string
  author: string
  text: string
  type: MessageType
  pinned?: boolean
  reads?: string[]
  createdAt?: Timestamp
}

export type FeedbackStatus = 'backlog' | 'todo' | 'inprogress' | 'done' | 'wontdo'

export interface Feedback {
  id: string
  text: string
  cat: string
  author: string
  votes?: { up: string[]; down: string[] }
  status: FeedbackStatus
  comments?: { author: string; text: string; createdAt?: Timestamp }[]
  createdAt?: Timestamp
}

export interface DepartItem {
  id: string
  name: string
  assignee?: string
  done: boolean
  createdAt?: Timestamp
}

export interface UserProfile {
  email: string
  displayName?: string
  photoURL?: string
  profile?: {
    name: string
    level: number
    km: number
    dplus: number
    sorties: number
  }
  /** état de la checklist kit : clé = id article, valeur = coché */
  kitChecked?: Record<string, boolean>
  createdAt?: Timestamp
}

export interface AppConfig {
  allowedEmails: string[]
}
