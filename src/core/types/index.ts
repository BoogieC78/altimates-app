// Types des collections Firestore existantes (projet altimates-4c37f).
// Modélisés d'après les données réellement écrites par l'ancienne app (index.html v0.2.x).
// Les documents peuvent contenir des champs hérités non listés ici (myVote, _docId, _mock) :
// on ne les lit pas, et on ne fait jamais de set() complet pour ne pas les écraser.

import type { Timestamp } from 'firebase/firestore'

export type VoteValue = 'oui' | 'peut'
export type Difficulty = 'Facile' | 'Moyen' | 'Difficile'

export interface RandoTrace {
  id: number
  label: string
  url: string
  votes: unknown[]
}

export interface Rando {
  /** id métier historique (Date.now() de l'ancienne app), distinct de l'id du document */
  id: number
  name: string
  region: string
  diff?: Difficulty
  km?: number | null
  dplus?: number | null
  /** durée affichée : '1j', '2j', ... */
  dur?: string
  lat?: number
  lon?: number
  /** libellé de date affiché : '15 juin', '6–7 juin', 'À venir' */
  date?: string
  /** dates ISO (yyyy-mm-dd) ; absentes sur certaines vieilles randos */
  dateStart?: string | null
  dateEnd?: string | null
  desc?: string
  proposedBy?: string | null
  komoot?: string
  traces?: RandoTrace[]
  alert?: { text: string; src?: string } | null
  /** compteurs affichés, maintenus en miroir de memberVotes */
  votes: { oui: number; peut: number }
  /** vote par membre : clé = prénom du membre (profile.name) */
  memberVotes?: Record<string, VoteValue>
  createdAt?: Timestamp
}

export type MessageType = 'message' | 'alerte' | 'position' | 'confirmation'

export interface RadioMessage {
  id: number
  author: string
  text: string
  type: MessageType
  pinned?: boolean
  /** initiales (2 lettres) des membres ayant lu */
  reads?: string[]
  /** libellé statique hérité de l'ancienne app ("à l'instant") ; préférer createdAt */
  time?: string
  createdAt?: Timestamp
}

export type FeedbackStatus = 'backlog' | 'todo' | 'inprogress' | 'done' | 'wontdo'

export interface Feedback {
  id: number
  text: string
  cat: string
  author: string
  votes?: { up: number; down: number }
  status?: FeedbackStatus
  comments?: { author: string; text: string; ts?: string }[]
  createdAt?: Timestamp
}

export interface DepartItem {
  id: number
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
    level?: number
    km?: number
    dplus?: number
    sorties?: number
  }
  /** état de la checklist kit : clé = id article, valeur = coché */
  kitChecked?: Record<string, boolean>
  createdAt?: Timestamp
}

export interface AppConfig {
  allowedEmails: string[]
}
