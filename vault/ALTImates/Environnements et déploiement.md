---
title: Environnements et déploiement
type: note
tags: [altimates, technique, ops, déploiement]
updated: 2026-07-31
---

# Environnements et déploiement

## Vue d'ensemble

| Environnement | URL | Backend Firebase | Comment y aller |
|---|---|---|---|
| **Local dev** | http://localhost:5173 | **Prod** ⚠️ vraies données | `npm run dev` + login réel |
| **Local dev-bypass** | http://localhost:5173 | Émulateurs | `npm run emulators` + `npm run dev:bypass` — auto-login admin, bandeau jaune |
| **Local e2e** | http://127.0.0.1:4173 | Émulateurs | `npm run test:e2e` |
| **Staging** | https://altimates-app-staging.vercel.app | **Prod (partagé)** | push sur `main`, auto après CI verte |
| **Production** | https://altimates-app.vercel.app | Prod | approbation manuelle du job `deploy-production` |

> **Un seul projet Firebase** (`altimates-4c37f`) partagé staging/prod → **les données staging
> sont les données prod**. L'isolation demanderait un projet Firebase dédié : pas fait, c'est
> une amélioration listée dans [[Backlog et priorités]].

## Pipeline (`.github/workflows/ci.yml`)

```
push main → ci (lint + test + build)  +  e2e (émulateurs)
         → deploy-staging    (build env "preview", alias stable staging)
         → smoke-staging     (Playwright contre le staging réel)
         → deploy-production ⏸ BLOQUÉ jusqu'à "Approve" dans l'onglet Actions
                             → rebuild du même commit en env "production" → prod
```

- **Auto-deploy Vercel désactivé sur `main`** (`vercel.json > git.deploymentEnabled.main: false`).
  Les PR gardent leurs previews automatiques.
- Le « go » prod = GitHub > Actions > run en attente > *Review deployments* > **Approve**
  (required reviewer : BoogieC78, environnement GitHub `Production`).
- **QA manuelle sur le staging AVANT d'approuver.** Rejeter = bouton *Reject* (le commit reste en staging).
- `concurrency: {group: deploy-production, cancel-in-progress: true}` : **un seul déploiement prod
  en attente à la fois** (voir le piège ci-dessous).

### ⚠️ Le piège de la file d'attente (vécu le 2026-07-17)

9 runs non approuvés s'étaient empilés sur l'environnement `production`. Approuver plusieurs runs
les déploie **dans l'ordre de fin des jobs** : un vieux run terminé en dernier réécrit les alias
prod **et** staging avec du code antérieur → rollback silencieux, v0.3.4 a écrasé v0.3.5.

- **Règle** : ne jamais approuver qu'**un seul** run, le plus récent.
- **Restauration** : `npx vercel promote <url-du-bon-deploy>` pour la prod + rebuild/re-alias staging.
- **Correctif structurel** : le `concurrency` ci-dessus (commit `b6cf451`) — un nouveau push annule
  le run encore en attente. Les 8 runs périmés ont été purgés. La gate humaine reste inchangée.

## Accès au staging

Protégé par le SSO Vercel (« Standard Protection ») : un humain doit être connecté à Vercel
(membre de la team `altimates`). Un **302 en anonyme est normal**. La CI traverse via le header
`x-vercel-protection-bypass` (secret « Protection Bypass for Automation »).

## Configuration par plateforme

### GitHub (`BoogieC78/altimates-app`, public)
- Environnements : `staging` (libre), `Production` (required reviewer = BoogieC78).
- Secrets Actions : `VERCEL_TOKEN`, `VERCEL_ORG_ID` (`team_eN8LH1WWtK0aoku1wneXdPdM`),
  `VERCEL_PROJECT_ID` (`prj_e5C0TNRoPMjcTyQOGRl9TwFOo75n`), `VERCEL_AUTOMATION_BYPASS_SECRET`.
- ✅ Secrets configurés et pipeline vérifié de bout en bout depuis le **2026-07-17** (release v0.3.3).
- L'approbation prod passe **uniquement par l'UI GitHub** (l'API `pending_deployments` est bloquée —
  gate humaine voulue).
- **APIs GitHub/Vercel parfois instables** (503, « fetch failed », 403 sur upload-artifact) : un job
  deploy/smoke rouge avec `ci` + `e2e` verts → vérifier d'abord le log réel avant de chercher un bug,
  puis relancer les jobs échoués.

### Vercel (team `altimates`, projet `altimates-app`)
- Env vars serverless à définir en **Preview ET Production** : `FIREBASE_SERVICE_ACCOUNT`,
  `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`.
- **JAMAIS** `VITE_USE_EMULATOR` ni `VITE_DEV_AUTOLOGIN` côté Vercel.
- Headers sécurité dans `vercel.json` → [[Sécurité]].

### Firebase (`altimates-4c37f`)
- **Les rules ne sont PAS déployées par Vercel/CI.** À la main :
  `npx firebase deploy --only firestore:rules --project altimates-4c37f`.
  Une rule modifiée localement mais non déployée = le client suppose une protection inexistante.
- *Authorized domains* (Auth) : doit contenir `altimates-app.vercel.app` **et**
  `altimates-app-staging.vercel.app`. Un nouveau domaine non déclaré = login Google KO.

### Modes Vite locaux (fichiers `.env.*` commités, sans secret)
- `.env.e2e` (`--mode e2e`) : `VITE_USE_EMULATOR=1`.
- `.env.dev-bypass` (`--mode dev-bypass`) : émulateurs + `VITE_DEV_AUTOLOGIN=1`.

## Déploiement CLI Vercel (fallback)

Reproduit exactement les jobs CI, à utiliser seulement si la CI est indisponible ou si le go a été
donné en conversation :

```bash
# Staging (après push main + ci/e2e verts)
npx vercel pull --yes --environment=preview
npx vercel build
url=$(npx vercel deploy --prebuilt 2>/dev/null | jq -r '.deployment.url // .url' | tail -1)
npx vercel alias set "$url" altimates-app-staging.vercel.app

# Production (après validation humaine du staging)
npx vercel pull --yes --environment=production
npx vercel build --prod
npx vercel deploy --prebuilt --prod
```

`vercel deploy` sort du JSON : **toujours extraire l'URL avec `jq`**, jamais passer la sortie brute
à `alias set`. Après un deploy CLI, le run GitHub reste en « waiting » → demander un **Reject**
(surtout pas Approve, ça redéploierait).

## Pièges connus

- Rules modifiées mais non déployées → protection fantôme.
- Émulateurs : **JDK ≥ 21 requis** sur le PATH (`firebase-tools` refuse en dessous).
- `npm run dev` (sans bypass) tape la **prod** : prudence avec les écritures.
- E-mails de lien de connexion depuis le staging : `APP_ORIGIN` pointe en dur sur la prod, le lien
  reçu ramène donc sur la prod.

## Checklist pré-release (résumé)

1. `npm run build` / `npm run lint` / `npm test` / `npm run test:e2e` — tous verts
2. Audit sécurité complet + `npm audit --omit=dev` + `git status` propre
3. **Rules Firestore déployées** si `firestore.rules` a changé
4. Variables d'env Vercel Production vérifiées
5. Headers présents (`curl -sI`) + **aucune erreur CSP** dans la console prod
6. Smoke post-déploiement : login Google, login lien e-mail, onglets, météo, gating Admin
7. Bump `APP_VERSION` (`src/features/admin/AdminPage.tsx`) + `npm version` + tag, BACKLOG.md et
   Trello à jour

Conclure par un **GO ou NO-GO explicite**.

Voir aussi : [[Tests et CI]] · [[Sécurité]] · [[Process et outils]]
