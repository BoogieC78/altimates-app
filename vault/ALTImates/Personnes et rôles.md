---
title: Personnes et rôles
type: note
tags: [altimates, équipe, personnes]
updated: 2026-07-31
---

# Personnes et rôles

Ce que le projet laisse voir des personnes impliquées (commits, backlog, cartes Trello, règles
Firestore). Volontairement factuel : rien d'inféré au-delà de ce qui est écrit dans le repo.

## Admins (codés en dur dans `firestore.rules`, `auth.ts` et `api/send-signin-link.ts`)

- **Wacil** — `wacil78@gmail.com`. Compte GitHub `BoogieC78`, propriétaire du repo.
  Donne les validations produit (maquettes, variantes UI), le « go » de mise en production
  (seul *required reviewer* de l'environnement GitHub `Production`), et pose les règles de process
  (« une carte Trello par point avant de coder »).
- **Nordine** — `hammadou.nordine@gmail.com`. Auteur de [l'app d'origine](https://github.com/hammadounordine/Altimates)
  dont ALTImates est la réécriture. Compte Vercel sur lequel la CLI locale est loggée.

> Les deux restent membres même si la whitelist dynamique est vide — c'est l'ancre anti-lockout.

## Membres de la cordée cités

Sources : retours de bugs et idées importées sur Trello le 2026-07-15.

- **Adebola** — auteur de plusieurs retours UI qui ont donné lieu à des correctifs :
  avatar « AN » incompréhensible (v0.3.3), checklist de départ ambiguë (v0.3.5),
  disparition des flèches Distance/Dénivelé (v0.3.7).
- **Thomas** — idée : filtrer les randos par dénivelé max.
- **Sofia** — idée : section photos.
- **Ousmane** — apparaît comme profil de test dans un flake E2E documenté.

## Rôles techniques

- Branches nommées `wacil/<sujet>` ou `nordine/<sujet>` → les deux contribuent au code.
- L'approbation de production est **humaine et non déléguée** : l'API `pending_deployments` est
  volontairement bloquée, seul le passage par l'UI GitHub compte.
- Adresse d'envoi dédiée : `Contact.altimates@gmail.com` (compte Brevo à créer, voir
  [[Backlog et priorités]]).
