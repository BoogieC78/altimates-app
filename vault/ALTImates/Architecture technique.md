---
title: Architecture technique
type: note
tags: [altimates, technique, architecture]
updated: 2026-07-31
---

# Architecture technique

## Stack

- **Vite 8** + **React 19** + **TypeScript 6** (`type: module`)
- **Firebase 12** : Auth (Google + lien e-mail sans mot de passe) et Firestore temps réel
  (`onSnapshot` partout), projet `altimates-4c37f`
- **firebase-admin 14** côté serverless (`api/`)
- **jspdf** pour l'export PDF du kit
- **Vitest 4** (unitaires, jsdom) · **Playwright 1.61** (E2E) · **oxlint** (lint)
- **Vercel** pour l'hébergement (preset Vite) + fonctions serverless `api/`

## Arborescence

```
src/
├── core/          # Logique métier SANS React (réutilisable en React Native/Expo)
│   ├── types/     # Types des collections Firestore (index.ts)
│   ├── firebase/  # app, auth + whitelist, collections, admin, randos, messages,
│   │              # availability, depart, feedbacks, ravito
│   ├── services/  # weather, gpx/url, dates, time, votes, kit, kitEmail, kitPdf,
│   │              # ravito, fenetre
│   └── constants/ # gear.ts (le kit)
├── features/      # Un dossier par onglet : sommets, kit, radio, fenetre, idees,
│                  # cordee, basecamp, admin
├── components/    # UI partagée : Modal, DateField, GuidedTour, NamePromptModal,
│                  # TopoBackground, icons
├── hooks/         # useAuth, useCollection (listeners Firestore), useMemberName
└── test/          # setup Vitest
api/               # Serverless Vercel : send-signin-link.ts, _email.ts, _ratelimit.ts
e2e/               # Playwright : tests/, smoke/, helpers/, fixtures.ts
```

## Règles d'architecture (à ne pas casser)

1. **`src/core/` n'importe jamais React.** C'est ce qui rendra le code réutilisable dans l'app
   mobile Expo prévue à 6-12 mois. Un `import ... from 'react'` dans `core/` est une régression.
2. **Les noms de collections Firestore vivent uniquement dans `core/firebase/collections.ts`**
   (références typées via `typedCollection<T>()`). Ne jamais écrire `collection(db, '...')` ailleurs.
3. **Une feature = un dossier = une PR.**
4. Les documents Firestore peuvent contenir des **champs hérités** de l'ancienne app
   (`myVote`, `_docId`, `_mock`) : on ne les lit pas et on ne fait **jamais de `set()` complet**,
   sous peine de les écraser.

## Fonctions serverless (`api/`)

- **`send-signin-link.ts`** : génère et envoie le lien de connexion par e-mail avec un design
  ALTImates, via l'**API Brevo** (pas de SMTP Gmail : la 2FA a été refusée, donc pas d'App Password).
  Si la fonction est absente ou en erreur, l'app **retombe automatiquement** sur le mail Firebase
  par défaut — aucun login cassé.
  ⚠️ `APP_ORIGIN` pointe en dur sur la prod : un lien demandé depuis le staging ramène sur la prod.
- **`_email.ts`** : template HTML de l'e-mail, avec `escapeHtml()` sur toute donnée utilisateur.
- **`_ratelimit.ts`** : `allowRequest()` — fenêtre fixe sur la collection Firestore `rateLimits`,
  3 envois / 15 min par e-mail, 10 / h par IP, **fail-open** (une panne Firestore ne casse pas le login),
  réponse 200 générique quand limité (pas d'oracle d'énumération).

## Workflow git

- Branches `wacil/<sujet>` ou `nordine/<sujet>`, PR vers `main`.
- CI (lint + tests + build) sur chaque PR, preview Vercel automatique sur les PR.
- Commits conventionnels (`feat(kit): …`, `fix(kit): …`, `ci: …`, `docs(backlog): …`).
- **Jamais de commit/push sans confirmation explicite** de l'utilisateur, et jamais directement
  sur `main` pour un travail en cours.

Voir aussi : [[Sécurité]] · [[Environnements et déploiement]] · [[Modèle de données Firestore]]
