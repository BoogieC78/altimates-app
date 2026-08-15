// Types des collections Firestore existantes (projet altimates-4c37f).
// Modélisés d'après les données réellement écrites par l'ancienne app (index.html v0.2.x).
// Les documents peuvent contenir des champs hérités non listés ici (myVote, _docId, _mock) :
// on ne les lit pas, et on ne fait jamais de set() complet pour ne pas les écraser.

import type { Timestamp } from 'firebase/firestore'

export type VoteValue = 'oui' | 'peut' | 'non'
export type Difficulty = 'Facile' | 'Moyen' | 'Difficile'

/**
 * Visibilité d'une sortie :
 *  - 'potes'  : visible par les membres de la cordée uniquement (défaut).
 *  - 'public' : visible EN PLUS par tout membre connecté de l'app, quelle que
 *               soit sa cordée — jamais par un visiteur anonyme.
 * Champ ABSENT = 'potes' (compat : les randos historiques v0.5.0 n'ont pas ce
 * champ, et les règles Firestore appliquent le même défaut côté serveur).
 */
export type RandoVisibility = 'potes' | 'public'

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
  /** absent = 'potes' (randos historiques) — voir RandoVisibility */
  visibility?: RandoVisibility
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
    /** photo de profil choisie par le membre, en data URL (pas de Storage) */
    photo?: string
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

export interface RavitoItem {
  id: number
  /** nom libre de l'item (ex: "Riz lyophilisé", "Barres de céréales") */
  name: string
  qty: number
  /** prénom du membre qui ramène cet item */
  assignee: string
}

export interface RavitoEntry {
  config: { depart: RavitoDepart; retour: RavitoRetour }
  /** clé = prénom du membre */
  stocks: Record<string, RavitoStock>
  /** répartition nommée : qui ramène quoi, pour éviter les doublons */
  items?: RavitoItem[]
  /** clé = prénom du membre, valeur = nb de pastilles électrolytes/vitamines emportées */
  electrolytes?: Record<string, number>
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

// ── Dépenses partagées d'une sortie (collection expenses, 1 doc par dépense) ──

export interface Expense {
  /** id métier (Date.now() à la création), distinct de l'id du document */
  id: number
  /** id métier de la rando (String(rando.id)), comme les clés de ravito/hydra */
  randoId: string
  /** ce qui a été acheté : 'Lyophilisés', 'Péage A43', 'Refuge' */
  label: string
  /** montant avancé, en CENTIMES (entier) — jamais en euros flottants */
  amount: number
  /** prénom du membre qui a avancé l'argent (profile.name) */
  payer: string
  /** prénoms des membres qui profitent de la dépense ; parts égales */
  beneficiaries: string[]
  createdAt?: Timestamp
}

// ── Transport vers le départ (collection transport, 1 doc par rando+membre) ──

export type TransportMode =
  /** amène sa voiture */
  | 'voiture'
  /** cherche une place dans une voiture */
  | 'passager'
  /** non véhiculé : train/bus à organiser (V2) */
  | 'non-vehicule'

export interface TransportDoc {
  /** id métier de la rando (String(rando.id)) */
  randoId: string
  /** prénom du membre (profile.name), dupliqué pour éviter un join côté client */
  member: string
  mode: TransportMode
  /** places passagers offertes, sacs et matos compris (mode 'voiture' uniquement) */
  seats?: number
  updatedAt?: Timestamp
}

// ── Cordées multiples & parrainage ──
// Un profil, N cordées. L'appartenance = existence de cordees/{cid}/members/{email}
// (source de vérité côté règles). La cordée 'origine' (id fixe CORDEE_ORIGINE_ID)
// porte les données historiques : ses membres accèdent aux collections racines.

export interface Cordee {
  name: string
  /** e-mail du fondateur */
  createdBy: string
  createdAt?: Timestamp
}

export type CordeeMemberVia = 'seed' | 'fondateur' | 'invitation'

/** Doc cordees/{cid}/members/{email} — l'id du doc EST l'e-mail (minuscules). */
export interface CordeeMember {
  /** dupliqué de l'id du doc : les requêtes collectionGroup filtrent dessus */
  email: string
  /** prénom déclaré à l'entrée, si connu */
  name?: string | null
  /** e-mail de qui a fait entrer ce membre (approbateur, fondateur ou admin) */
  addedBy?: string
  via?: CordeeMemberVia
  /** lien de parrainage utilisé (via 'invitation') */
  inviteId?: string
  /** demande d'entrée approuvée (via 'invitation') */
  requestId?: string
  addedAt?: Timestamp
}

/** Doc invites/{inviteId} — l'id du doc est le jeton du lien de parrainage. */
export interface CordeeInvite {
  cordeeId: string
  /** nom dénormalisé : l'invité ne peut pas lire le doc cordée avant approbation */
  cordeeName: string
  /** e-mail du créateur du lien — seul lui approuve les demandes */
  createdBy: string
  createdByName?: string | null
  /** e-mails déjà entrés via ce lien — 6 maximum (quota appliqué par les règles) */
  approved: string[]
  /** base de l'expiration 24 h (serverTimestamp, exigé par les règles) */
  createdAt?: Timestamp
}

/** Doc joinRequests/{inviteId_uid} : demande d'entrée en attente d'approbation. */
export interface CordeeJoinRequest {
  inviteId: string
  cordeeId: string
  cordeeName?: string
  /** e-mail du demandeur (== auth, vérifié par les règles) */
  email: string
  uid: string
  /** prénom déclaré par le demandeur */
  name?: string | null
  createdAt?: Timestamp
}

// ── Photos post-rando (collection randoMedia, 1 doc par photo) ──

export interface RandoMedia {
  /** id métier de la rando (String(rando.id)) */
  randoId: string
  /**
   * id du DOCUMENT rando. Redondant avec randoId côté app, mais indispensable
   * aux règles Firestore : elles ne savent pas requêter, seulement adresser un
   * document par son id — c'est ce qui permet de vérifier côté serveur que
   * l'auteur est bien l'organisateur de la sortie.
   */
  randoDocId: string
  /** prénom du membre qui a posté (profile.name) */
  author: string
  /** uid Firebase de l'auteur — c'est lui que les règles vérifient, pas le prénom */
  authorUid: string
  /** image JPEG compressée côté client, en data URL (≤ ~200 Ko) */
  dataUrl: string
  /** légende libre, facultative */
  caption?: string
  createdAt?: Timestamp
}

// ── Enquête post-rando (collection randoSurveys, 1 doc par rando+membre) ──
// Une réponse par membre et par sortie : l'id du document est imposé
// (`${randoId}_${uid}`), une nouvelle soumission écrase donc la précédente
// au lieu de s'ajouter — l'unicité est garantie par les règles Firestore.

export type SurveyDifficulty = 'facile' | 'comme-prevu' | 'plus-dur'
export type SurveyWeather = 'soleil' | 'nuageux' | 'pluie' | 'neige'

export interface SurveyResponse {
  /** id métier de la rando (String(rando.id)), comme les dépenses et photos */
  randoId: string
  /** prénom du membre (profile.name), dupliqué pour l'affichage nominatif */
  author: string
  /** uid Firebase du répondant — c'est lui que les règles vérifient, pas le prénom */
  authorUid: string
  /** note globale de la sortie, 1 à 5 étoiles */
  rating: number
  /** difficulté ressentie par rapport à ce qui était annoncé */
  difficulty: SurveyDifficulty
  /** météo rencontrée sur place */
  weather: SurveyWeather
  /** qualité de l'organisation, 1 à 5 */
  organization: number
  /** commentaire libre, facultatif et court */
  comment?: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
}
