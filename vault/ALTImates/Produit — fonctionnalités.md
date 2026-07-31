---
title: Produit — fonctionnalités
type: note
tags: [altimates, produit]
updated: 2026-07-31
---

# Produit — fonctionnalités

L'app est une navigation à onglets (barre du bas), pensée mobile d'abord (360–430 px), avec
un écran compte accessible par l'avatar du header.

## Les 7 onglets + Admin

Déclarés dans `src/App.tsx` (`TABS`). L'onglet **Admin** n'apparaît que pour un admin.

| Onglet | Dossier | Ce qu'il fait |
|---|---|---|
| **Sommets** | `src/features/sommets/` | Liste des randos proposées. Proposer une sortie (nom, région, dates, distance, D+, difficulté, trace), voter ✅ Partant / 🤔 Peut-être / ❌ Pas partant, détail d'une rando en modale avec onglets **Info / Ravito / Hydra**, météo open-meteo, traces GPX (Komoot), édition/suppression. |
| **Kit** | `src/features/kit/` | Checklist de matériel personnalisée. Onboarding (niveau + mode **trek** ou **journée**), triage express du starter pack, budget estimé, **poids du sac** estimé (hors articles portés sur soi), fiches conseil + liens marchands par article, export PDF et e-mail du kit. Voir [[Kit de rando (gear.ts)]]. |
| **Radio** | `src/features/radio/` | Fil de messages de groupe typés : `message`, `alerte`, `position`, `confirmation`. Épinglage, accusés de lecture. |
| **Fenêtre** | `src/features/fenetre/` | Calendrier de disponibilités : chacun pose ses jours (`dispo` / `retour dimanche` / `+1 jour` / `indispo`), l'app calcule les **meilleures fenêtres communes** de la cordée. Livré en prod avec v0.3.9. |
| **Idées** | `src/features/idees/` | Boîte à idées de la cordée : soumettre, voter 👍/👎, commenter, statut. La vue Kanban a été retirée (remplacée par le board Trello). |
| **Cordée** | `src/features/cordee/` | Liste des membres, **checklist de départ** (qui apporte quoi : ajouter un item, se l'assigner, le marquer prêt), lien d'invitation. |
| **Base Camp** | `src/features/basecamp/` | Écran compte, ouvert via l'avatar. Profil (prénom, niveau), stats de saison (km, D+, sorties), Personal Bests, prochaine sortie, bouton « Modifier mon profil » mis en avant, déconnexion / réinitialisation. |
| **Admin** | `src/features/admin/` | Réservé aux admins : gestion de la **whitelist dynamique** (`config/allowedEmails`), vidage de collections, reset complet (double confirmation), version de l'app (`APP_VERSION`). |

## Éléments transverses

- **Tour guidé** (`src/components/GuidedTour.tsx`) : lancé à la première connexion, avec un bouton Passer.
- **Modal prénom obligatoire** (`NamePromptModal.tsx`, depuis v0.3.3) : un login par lien e-mail
  n'a pas de `displayName` → modale bloquante « Comment doit-on t'appeler ? » avant l'app.
  Sans ça, les membres s'affichaient « Anonyme ». Piège E2E connu → [[Pièges connus]].
- **DateField** (`src/components/DateField.tsx`, depuis v0.3.4) : input texte masqué `JJ/MM/AAAA`
  + calendrier custom en français. Les navigateurs ignorent `lang` sur `<input type="date">`,
  d'où le composant maison.
- **Modal** (`src/components/Modal.tsx`) : rendu en **portal sur `<body>`** — indispensable, voir [[Pièges connus]].
- **TopoBackground** : fond SVG topographique (seul usage légitime de `dangerouslySetInnerHTML`).
- **Accessibilité / responsive** : deux audits complets menés le 2026-07-19 (WCAG 2.1 AA : 34 constats ;
  responsive 360–430 px : 29 constats), corrigés et livrés en prod avec v0.3.9 — modales accessibles
  (dialog / focus trap / Escape), `aria-pressed`, contrastes, focus visible, safe-area iPhone,
  inputs 16 px (anti-zoom iOS), 8 onglets tenant en 360 px, zéro débordement horizontal.

## Identité visuelle

Palette « ink / gold », fond topographique, vocabulaire montagne assumé partout dans l'UI
(Sommets, Cordée, Base Camp, Fenêtre, Radio).

Voir aussi : [[Architecture technique]] · [[Modèle de données Firestore]]
