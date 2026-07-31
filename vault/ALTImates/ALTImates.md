---
title: ALTImates
type: moc
tags: [altimates, projet, moc]
updated: 2026-07-31
---

# ALTImates — carte du projet

> *Plan · Gear up · Summit together.*
> App de randonnée collaborative pour une cordée d'amis : sorties avec météo temps réel,
> votes, kit personnalisé, radio de groupe, calendrier de dispos, export GPX/PDF.

Réécriture en React + TypeScript de [l'app d'origine](https://github.com/hammadounordine/Altimates)
(un monolithe `index.html`). Les deux apps partagent **les mêmes données Firestore** et coexistent
pendant la migration.

| | |
|---|---|
| **Repo** | [BoogieC78/altimates-app](https://github.com/BoogieC78/altimates-app) (public) |
| **Version** | `v0.3.9` (release prod du 2026-07-30) |
| **Prod** | https://altimates-app.vercel.app |
| **Staging** | https://altimates-app-staging.vercel.app |
| **Firebase** | projet `altimates-4c37f` (un seul projet, partagé staging/prod) |
| **Backlog** | `BACKLOG.md` (source de vérité) + [board Trello](https://trello.com/b/3qpIIJxH) |

## Les notes

- [[Produit — fonctionnalités]] — les 8 onglets et ce qu'ils font
- [[Architecture technique]] — stack, arborescence, règles d'architecture
- [[Modèle de données Firestore]] — collections et types
- [[Sécurité]] — invariants à ne jamais casser
- [[Environnements et déploiement]] — local / e2e / staging / prod, pipeline CI
- [[Tests et CI]] — Vitest, Playwright, réparation de la CI
- [[Kit de rando (gear.ts)]] — la liste du matériel, structure et édition
- [[Pièges connus]] — bugs déjà diagnostiqués, à ne pas re-chercher
- [[Historique des releases]] — v0.3.1 → v0.3.9
- [[Backlog et priorités]] — ce qui reste à faire
- [[Process et outils]] — Trello, skills Claude, discipline de travail
- [[Personnes et rôles]] — qui est qui dans la cordée

## En un coup d'œil

- **Stack** : Vite + React 19 + TypeScript 6, Firebase (Auth Google + lien e-mail, Firestore
  temps réel), Vercel, Vitest + Playwright + oxlint.
- **Contrôle d'accès** : whitelist d'e-mails appliquée par les **règles Firestore**
  (`firestore.rules`), jamais par le client → voir [[Sécurité]].
- **Déploiement** : jamais d'auto-deploy Vercel sur `main`. Pipeline GitHub Actions
  `ci` + `e2e` → staging → smoke → **approbation humaine** → prod.
- **Couverture** : 163 tests unitaires (25 fichiers) + 37 cas E2E (13 fichiers) au 2026-07-31.
- **Cap 6-12 mois** : app mobile Expo — d'où la règle « `src/core/` n'importe jamais React ».
