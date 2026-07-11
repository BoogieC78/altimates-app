---
name: mise-en-prod
description: Checklist de mise en production d'ALTImates (Vercel + Firebase) — à dérouler avant chaque déploiement prod ou release. Utilise ce skill quand l'utilisateur parle de "déployer", "mise en prod", "release", "go live", "pousser en production", ou demande si l'app est prête pour la prod.
---

# Mise en production ALTImates

## Pipeline staging → prod (depuis juillet 2026)

Le déploiement passe par la CI GitHub Actions (`.github/workflows/ci.yml`), plus JAMAIS par l'auto-deploy Vercel (désactivé pour `main` dans `vercel.json > git.deploymentEnabled`) :

1. **push sur `main`** → jobs `ci` + `e2e` (émulateurs)
2. verts → **deploy-staging** : build env "preview" + alias stable **https://altimates-app-staging.vercel.app** (protégé par SSO Vercel — se connecter avec le compte Vercel pour y accéder en humain)
3. **smoke-staging** : Playwright contre le staging réel (`playwright.smoke.config.ts`, `e2e/smoke/`) — page login, headers sécurité, validation API ; traverse le SSO via le secret `VERCEL_AUTOMATION_BYPASS_SECRET`
4. **deploy-production** : BLOQUÉ en "Waiting" jusqu'à approbation manuelle (onglet Actions > Review deployments > Approve) — c'est le "go" ; puis rebuild du même commit avec l'env "production" et déploiement prod

QA manuelle : tester sur l'URL staging AVANT d'approuver. Rejeter = bouton "Reject" (le commit reste en staging).

Secrets GitHub Actions requis (Settings > Secrets and variables > Actions) : `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `VERCEL_AUTOMATION_BYPASS_SECRET` (Vercel > Settings > Deployment Protection > Protection Bypass for Automation). Environnement GitHub `production` = required reviewer (protection du go).

Lancer les smoke en local contre n'importe quel environnement :
```bash
SMOKE_BASE_URL=https://altimates-app.vercel.app npx playwright test --config playwright.smoke.config.ts
```

## Checklist pré-release (avant d'approuver le go prod)

Dérouler dans l'ordre. Un point rouge = STOP, corriger avant de déployer.

## 1. Qualité du code

```bash
npm run build        # tsc + vite — doit passer sans erreur
npm run lint         # oxlint — pas de nouvelle erreur
npm run test         # vitest — 100% vert
```

E2E (émulateurs Firebase, JDK ≥ 21 requis sur PATH — sur ce Mac :
`export PATH="/Library/Java/JavaVirtualMachines/jdk-23.jdk/Contents/Home/bin:$PATH"`) :

```bash
npm run test:e2e     # 100% vert
```

## 2. Sécurité

Lancer le skill **security-check** (audit invariants complet). Aucune violation critique/moyenne tolérée avant prod. En plus :

```bash
npm audit --omit=dev          # 0 critique/high
git status                    # aucun fichier secret non-ignoré
```

## 3. Firestore rules — déploiement OBLIGATOIRE si modifiées

Les rules ne se déploient PAS avec Vercel. Si `firestore.rules` a changé depuis le dernier déploiement :

```bash
npx firebase deploy --only firestore:rules --project altimates-4c37f
```

(ou via console Firebase > Firestore > Règles). Une rules modifiée localement mais non déployée = le code client suppose une protection qui n'existe pas en prod.

## 4. Variables d'environnement Vercel

Vérifier dans Vercel > Settings > Environment Variables (Production) :

- `FIREBASE_SERVICE_ACCOUNT` — JSON du compte de service (une ligne)
- `GMAIL_USER` — expéditeur des liens de connexion
- `GMAIL_APP_PASSWORD` — mot de passe d'application Google (16 caractères)
- **JAMAIS** `VITE_USE_EMULATOR` en prod (branchement émulateurs)

## 5. Headers de sécurité

`vercel.json` présent avec CSP + HSTS + X-Frame-Options etc. Après déploiement, vérifier :

```bash
curl -sI https://altimates-app.vercel.app | grep -iE "content-security|frame|transport"
```

Puis ouvrir l'app en prod et vérifier la console navigateur : **aucune erreur CSP** (une origine oubliée casse silencieusement fonts/auth/météo).

## 6. Smoke test post-déploiement

Sur https://altimates-app.vercel.app :

1. Login Google (admin) → arrive sur l'app.
2. Login par lien e-mail → e-mail reçu (design ALTImates), lien fonctionne.
3. Onglets principaux s'affichent (Sommets, Kit, Radio, Base Camp).
4. Météo se charge (appel open-meteo à travers la CSP).
5. Panneau Admin visible pour un admin, invisible pour un membre.

## 7. Traçabilité

- Bump `APP_VERSION` dans `src/features/admin/AdminPage.tsx` si release notable.
- Commit propre + tag éventuel ; BACKLOG.md/Trello à jour.

## Sortie attendue

Checklist récapitulative point par point : OK / KO (avec correctif). Conclure GO ou NO-GO explicite.
