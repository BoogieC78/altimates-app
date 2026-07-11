---
name: environnements
description: Référence des environnements ALTImates (local, dev-bypass, e2e, staging, production) — URLs, configuration Vercel/Firebase/GitHub, variables d'environnement, flux de déploiement. Utilise ce skill dès que l'utilisateur pose une question sur "les environnements", "le staging", "la preprod", "les URLs", "où est déployé", "quelle config", les variables d'environnement, les secrets CI, ou pour orienter un nouveau développement vers le bon environnement de test.
---

# Environnements ALTImates

## Vue d'ensemble

| Environnement | URL | Backend Firebase | Comment y aller |
|---|---|---|---|
| **Local dev** | http://localhost:5173 | **Prod** (attention : vraies données) | `npm run dev` + login réel |
| **Local dev-bypass** | http://localhost:5173 | Émulateurs locaux | `npm run emulators` + `npm run dev:bypass` — auto-login admin, bandeau jaune |
| **Local e2e** | http://127.0.0.1:4173 | Émulateurs locaux | `npm run test:e2e` (build + preview + Playwright) |
| **Staging** | https://altimates-app-staging.vercel.app | **Prod (partagé)** | push sur `main` (auto, après CI verte) |
| **Production** | https://altimates-app.vercel.app | Prod | approbation manuelle du job `deploy-production` |

Un seul projet Firebase (`altimates-4c37f`) partagé staging/prod → **les données staging = les données prod**. Isolation données = projet Firebase séparé, non fait (amélioration future).

## Flux de déploiement (`.github/workflows/ci.yml`)

```
push main → ci (lint+test+build) + e2e (émulateurs, 28 tests)
         → deploy-staging   (build env "preview", alias stable staging)
         → smoke-staging    (Playwright contre le staging déployé)
         → deploy-production ⏸ BLOQUÉ jusqu'à "Approve" dans l'onglet Actions
                            → rebuild même commit avec env "production" → prod
```

- **Auto-deploy Vercel désactivé sur `main`** (`vercel.json > git.deploymentEnabled.main: false`). Les PR gardent leurs previews Vercel automatiques.
- Le "go" prod = GitHub > Actions > run en attente > Review deployments > Approve (required reviewer : BoogieC78, environnement GitHub `Production`).
- Smoke tests : `playwright.smoke.config.ts` + `e2e/smoke/staging.spec.ts` — non-authentifiés, sans effet de bord (page login, erreurs console/CSP, headers sécurité, validation API). En local : `SMOKE_BASE_URL=<url> npx playwright test --config playwright.smoke.config.ts`.

## Accès au staging

Protégé par le SSO Vercel ("Standard Protection") : un humain doit être connecté à Vercel (membre de la team `altimates`) ; la CI passe par le header `x-vercel-protection-bypass` (secret "Protection Bypass for Automation").

## Configuration par plateforme

### GitHub (repo BoogieC78/altimates-app, public)
- Environnements : `staging` (libre), `Production` (required reviewer = BoogieC78).
- Secrets Actions requis : `VERCEL_TOKEN`, `VERCEL_ORG_ID` (`team_eN8LH1WWtK0aoku1wneXdPdM`), `VERCEL_PROJECT_ID` (`prj_e5C0TNRoPMjcTyQOGRl9TwFOo75n`), `VERCEL_AUTOMATION_BYPASS_SECRET`.

### Vercel (team `altimates`, projet `altimates-app`)
- Env vars serverless à définir dans **Preview ET Production** : `FIREBASE_SERVICE_ACCOUNT`, `GMAIL_USER`, `GMAIL_APP_PASSWORD` (voir `api/send-signin-link.ts`).
- **JAMAIS** `VITE_USE_EMULATOR` ni `VITE_DEV_AUTOLOGIN` côté Vercel.
- Headers sécurité (CSP, HSTS…) : `vercel.json` — toute nouvelle origine externe doit être ajoutée à la CSP.

### Firebase (`altimates-4c37f`)
- Rules : `firestore.rules`, déployées à la main : `npx firebase deploy --only firestore:rules --project altimates-4c37f` (PAS déployées par Vercel/CI).
- Authorized domains (Auth) : inclut `altimates-app.vercel.app` + `altimates-app-staging.vercel.app`. Un nouveau domaine de déploiement doit y être ajouté sinon login Google KO (console Firebase > Authentication > Settings, ou API Identity Toolkit `PATCH /admin/v2/projects/{p}/config?updateMask=authorizedDomains`).

### Modes Vite locaux (fichiers `.env.*` committés, sans secret)
- `.env.e2e` (`--mode e2e`) : `VITE_USE_EMULATOR=1` — app branchée émulateurs.
- `.env.dev-bypass` (`--mode dev-bypass`) : émulateurs + `VITE_DEV_AUTOLOGIN=1` — auto-login admin dev. Ne peut JAMAIS s'activer en prod : gaté par `import.meta.env.DEV`, code éliminé du bundle au build (voir skill security-check).

## Pièges connus

- Rules Firestore modifiées mais non déployées = le client suppose une protection inexistante. Toujours `firebase deploy --only firestore:rules` après modif.
- Émulateurs : JDK ≥ 21 requis (`export PATH="/Library/Java/JavaVirtualMachines/jdk-23.jdk/Contents/Home/bin:$PATH"` sur ce Mac).
- `npm run dev` (sans bypass) tape la **prod** : prudence avec les écritures.
- E-mails de lien de connexion depuis staging : `APP_ORIGIN` de `api/send-signin-link.ts` pointe en dur sur la prod — le lien reçu ramène sur la prod, pas le staging.
- Skills liés : `mise-en-prod` (checklist de release), `security-check` (invariants sécurité), `e2e-playwright` (tests).
