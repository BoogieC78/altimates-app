// Types des collections Firestore existantes (projet altimates-4c37f).
// Modélisés d'après les données réellement écrites par l'ancienne app (index.html v0.2.x).
// Les documents peuvent contenir des champs hérités non listés ici (myVote, _docId, _mock) :
// on ne les lit pas, et on ne fait jamais de set() complet pour ne pas les écraser.

import type { Timestamp } from 'firebase/firestore'

export type VoteValue = 'oui' | 'peut' | 'non'
export type Difficulty = 'Facile' | 'Moyen' | 'Difficile'

export interface RandoTrace {
  id: number
  label: string
  url: string
  /** prénoms des membres qui préfèrent cette trace */
  votes: string[]
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
  votes: { oui: number; peut: number; non?: number }
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

export interface FeedbackComment {
  author: string
  text: string
  ts?: string
}

export interface Feedback {
  id: number
  text: string
  cat: string
  author: string
  votes?: { up: number; down: number }
  /** vote par membre (nouveau champ, ignoré par l'ancienne app ; les compteurs restent la référence) */
  voters?: Record<string, 'up' | 'down'>
  status?: FeedbackStatus
  comments?: FeedbackComment[]
  /** libellé statique hérité ("à l'instant") */
  ts?: string
  createdAt?: Timestamp
}


export interface DepartItem {
  /** number (Date.now()) pour les ajouts, string ('tente') pour les items seedés */
  id: number | string
  name: string
  assignee?: string | null
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

// ── Fenêtre : disponibilités des membres (collection availability, 1 doc par uid) ──

export type AvailabilityStatus =
  /** 🟢 disponible */
  | 'dispo'
  /** 🟠 disponible mais retour impératif dimanche soir */
  | 'retour'
  /** 🔵 disponible et peut prolonger d'un jour */
  | 'prolonge'
  /** 🔴 indisponible */
  | 'indispo'

export interface AvailabilityDoc {
  /** prénom affiché (profile.name), dupliqué ici pour éviter un join côté client */
  name: string
  /** clé = date ISO (yyyy-mm-dd), valeur = statut ; jour absent = non renseigné */
  days: Record<string, AvailabilityStatus>
  updatedAt?: Timestamp
}

export interface AppConfig {
  /** doc config/allowedEmails : whitelist des emails autorisés */
  emails?: string[]
}

// ── Ravito / Hydratation (docs partagés ravito/shared et hydra/shared) ──

export type RavitoDepart = 'matin' | 'midi' | 'apresmidi'
export type RavitoRetour = 'midi' | 'apresmidi' | 'soir'
export type MealId = 'petitdej' | 'lunch' | 'snack' | 'diner'

/** Stock lyophilisé d'un membre : nb de repas par catégorie */
export type RavitoStock = Record<MealId, number>

export interface RavitoEntry {
  config: { depart: RavitoDepart; retour: RavitoRetour }
  /** clé = prénom du membre */
  stocks: Record<string, RavitoStock>
}

/** Doc ravito/shared : clé = id métier de la rando (String) */
export type RavitoDoc = Record<string, RavitoEntry>

export type WaterSourceId = 'refuge' | 'ruisseau' | 'aucun'

export interface HydraSegment {
  id: number
  label: string
  source: WaterSourceId
  km?: number
}

export interface HydraEntry {
  /** ml/h/personne */
  conso: number
  /** heures de marche/jour */
  heures: number
  /** ml/personne/soir si bivouac */
  cuisine: number
  /** ml/personne/jour optionnel */
  toilette: number
  /** ml capacité totale contenants/personne */
  capacite: number
  filtreDisponible: boolean
  segments: HydraSegment[]
}

/** Doc hydra/shared : clé = id métier de la rando (String) */
export type HydraDoc = Record<string, HydraEntry>
