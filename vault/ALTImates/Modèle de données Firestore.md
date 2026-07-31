---
title: Modèle de données Firestore
type: note
tags: [altimates, technique, firestore, données]
updated: 2026-07-31
---

# Modèle de données Firestore

Projet `altimates-4c37f`. Types dans `src/core/types/index.ts`, références typées dans
`src/core/firebase/collections.ts`. Modèle hérité de l'ancienne app (`index.html` v0.2.x) :
les documents portent des champs legacy qu'on ne lit pas et qu'on ne doit pas écraser.

## Collections

| Collection | Type | Contenu |
|---|---|---|
| `randos` | `Rando` | Sorties proposées |
| `messages` | `RadioMessage` | Fil Radio |
| `feedbacks` | `Feedback` | Idées de la cordée |
| `departItems` | `DepartItem` | Checklist de départ (Cordée) |
| `users` | `UserProfile` | Profil + état de la checklist kit, id = uid |
| `config` | `AppConfig` | Config, dont `config/allowedEmails` (la whitelist) |
| `ravito` | `RavitoDoc` | Ravitaillement par rando |
| `hydra` | `HydraDoc` | Hydratation par rando |
| `availability` | `AvailabilityDoc` | Dispos Fenêtre, 1 doc par uid |
| `rateLimits` | *(serveur)* | Compteurs anti-abus — **SDK Admin uniquement**, jamais exposée aux règles |

## Formes principales

**`Rando`** — `id` (id métier historique = `Date.now()`, distinct de l'id du document), `name`,
`region`, `diff` (`Facile|Moyen|Difficile`), `km`, `dplus`, `dur` (`'1j'`, `'2j'`), `lat`/`lon`,
`date` (libellé affiché) + `dateStart`/`dateEnd` en ISO, `desc`, `proposedBy`, `komoot`,
`traces[]` (`{id, label, url, votes: string[]}`), `alert`, `votes` (compteurs `{oui, peut, non}`)
et `memberVotes` (**clé = prénom du membre**, `profile.name`, pas l'uid).

> ⚠️ La clé de vote est le **prénom**, pas l'uid — d'où l'importance du `NamePromptModal` et
> de `useMemberName` (passé en `onSnapshot` pour être réactif).

**`VoteValue`** = `'oui' | 'peut' | 'non'` → UI ✅ PARTANT / 🤔 PEUT-ÊTRE / ❌ PAS PARTANT
(le 🇨🇳 initial a été remplacé par ❌ à l'audit accessibilité du 2026-07-19).

**`RadioMessage`** — `author`, `text`, `type` (`message|alerte|position|confirmation`), `pinned`,
`reads[]` (initiales des lecteurs), `createdAt`.

**`Feedback`** — `text`, `cat`, `author`, `votes {up, down}`, `voters` (par membre),
`status` (`backlog|todo|inprogress|done|wontdo`), `comments[]`.

**`DepartItem`** — `id` (number pour les ajouts, string pour les items seedés type `'tente'`),
`name`, `assignee`, `done`.

**`UserProfile`** — `email`, `displayName`, `photoURL`, `profile {name, level, km, dplus, sorties}`,
`kitChecked` (map id article → coché).

**`AvailabilityDoc`** — statuts `dispo` (🟢) / `retour` (🟠, retour impératif dimanche soir) /
`prolonge` (🔵, peut prolonger d'un jour) / indispo.

## Règles d'accès

Détaillées dans [[Sécurité]]. En résumé : `users` (lecture membres, écriture = son propre doc ou admin),
`config/allowedEmails` (lecture **membres uniquement**, écriture admin), `availability`
(écriture = son propre doc), `feedbacks` (tout membre sauf `text`/`cat` réservés à l'auteur),
et une liste blanche explicite `['randos','messages','departItems','ravito','hydra']` pour le reste.
Toute **nouvelle collection** doit être ajoutée explicitement aux règles.
