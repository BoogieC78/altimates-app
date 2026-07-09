# Altimates

Plan · Gear up · Summit together. App de randonnée collaborative : sorties avec météo temps réel, votes, kit personnalisé, radio de groupe, export GPX.

Réécriture de [l'app d'origine](https://github.com/hammadounordine/Altimates) (monolithe index.html) en React + TypeScript. **Mêmes données Firestore** : les deux apps coexistent pendant la migration.

## Stack

- **Vite + React 19 + TypeScript**
- **Firebase** (Auth Google + Firestore temps réel), projet `altimates-4c37f`
- **Vitest** (tests unitaires), **oxlint** (lint)
- Déploiement **Vercel** (framework preset : Vite)

## Démarrer

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # tests unitaires
npm run lint
npm run build
```

## Architecture

```
src/
├── core/          # Logique métier SANS React (réutilisable en React Native plus tard)
│   ├── types/     # Types des collections Firestore
│   ├── firebase/  # init, auth + whitelist, références de collections
│   └── services/  # météo, GPX, calculs (à venir)
├── features/      # Un dossier par onglet (sommets, kit, radio, idées, cordée, basecamp, admin)
├── components/    # UI partagée
└── hooks/         # useAuth, useCollection (listeners Firestore)
```

Règles à respecter :

- `src/core/` n'importe **jamais** React. C'est ce qui rendra le code réutilisable dans l'app mobile (Expo) prévue à 6-12 mois.
- Les noms de collections Firestore vivent uniquement dans `core/firebase/collections.ts`.
- Une feature = un dossier = une PR.

## Sécurité

Le contrôle d'accès (whitelist d'emails) est appliqué par les **règles Firestore**, versionnées dans [firestore.rules](firestore.rules). La vérification côté client dans `core/firebase/auth.ts` n'est que de l'UX. Pour ajouter un membre : modifier la whitelist dans les deux fichiers ET redéployer les règles.

## Workflow

- Branches : `wacil/<sujet>` ou `nordine/<sujet>`, PR vers `main`.
- CI (lint + tests + build) sur chaque PR, preview Vercel automatique.

## Migration depuis l'ancienne app

- [x] Socle : auth Google + whitelist, tabs, listeners Firestore
- [x] Sommets en lecture seule
- [ ] Sommets : votes, météo open-meteo, ajout/édition, détail (ravito, partants)
- [ ] Radio
- [ ] Kit (checklist + export PDF)
- [ ] Cordée
- [ ] Base Camp
- [ ] Idées
- [ ] Admin
- [ ] Bascule du domaine altimates.vercel.app
