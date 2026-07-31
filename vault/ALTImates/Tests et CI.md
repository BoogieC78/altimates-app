---
title: Tests et CI
type: note
tags: [altimates, technique, tests, ci]
updated: 2026-07-31
---

# Tests et CI

## Trois niveaux

1. **Unitaires (Vitest + Testing Library)** — `src/**/*.test.ts(x)`. **163 cas dans 25 fichiers**
   au 2026-07-31. `npm test`.
2. **E2E (Playwright + émulateurs Firebase)** — `e2e/tests/`. **37 cas dans 13 fichiers**.
   Tourne contre les **émulateurs Auth + Firestore**, jamais la prod : état jetable à chaque test,
   vraies `firestore.rules` appliquées, login via un compte Google factice servi par l'émulateur
   (aucun OAuth réel). `npm run test:e2e`.
3. **Smoke (Playwright contre un environnement déployé)** — `e2e/smoke/staging.spec.ts` +
   `playwright.smoke.config.ts`. Non authentifiés, sans effet de bord : page de login, erreurs
   console/CSP, headers de sécurité, validation de l'API. Traverse le SSO Vercel via
   `VERCEL_AUTOMATION_BYPASS_SECRET`.

```bash
SMOKE_BASE_URL=https://altimates-app.vercel.app npx playwright test --config playwright.smoke.config.ts
```

## Inventaire E2E (2026-07-31)

| Fichier | Cas | Couvre |
|---|---|---|
| `login.spec.ts` | 5 | connexion Google, rejet hors whitelist, gating de l'onglet Admin |
| `email-link.spec.ts` | 5 | lien magique sans pop-up (cross-device), rejet hors whitelist, tour guidé, e-mail invalide |
| `basecamp.spec.ts` | 5 | ouverture via l'avatar, configurer/modifier le profil, lien Kit, Réinitialiser, Déconnexion |
| `sommets.spec.ts` | 4 | proposer une rando, voter/retirer, exclusivité « peut-être », suppression par le proposeur |
| `cordee.spec.ts` | 3 | checklist de départ (chip « À préparer / ✓ Prêt », « Me retirer ») |
| `fenetre.spec.ts` | 3 | calendrier de dispos |
| `kit.spec.ts` | 3 | onboarding (niveau + mode) → checklist matériel |
| `admin-access.spec.ts` | 2 | whitelist dynamique : ajout → accès accordé, retrait → révoqué |
| `admin.spec.ts` | 2 | accès au panneau Admin |
| `navigation.spec.ts` | 2 | smoke tous onglets (zéro erreur JS), déconnexion |
| `idees.spec.ts` | 1 | soumettre une idée |
| `radio.spec.ts` | 1 | poster un message |
| `tour.spec.ts` | 1 | tour guidé à la première connexion |

Régénérer les chiffres plutôt que de faire confiance à ce tableau :

```bash
for f in e2e/tests/*.spec.ts; do echo "$(grep -c '^\s*test(' "$f") | $f"; done
grep -h '^\s*test(' e2e/tests/*.spec.ts | wc -l
npm test 2>&1 | grep -E "Tests |Test Files"
```

## Trous de couverture connus

- **Détail d'une rando** (`RandoDetailModal.tsx`) : seul « proposer » est testé. Non couvert :
  les onglets **Info / Ravito / Hydra** (calculs métier non triviaux — **meilleure candidate**),
  la gestion des traces (ajouter/retirer/voter une variante), l'édition (`EditRandoModal.tsx`).
- **Radio** au-delà de l'envoi : épingler, supprimer, accusés de lecture, filtrage par type.
- **Idées** au-delà de la soumission : voter, changer de statut, commenter, supprimer.
- **Admin** au-delà de l'accès : `flushCollection`, reset complet, double confirmation.
- **Tour guidé** : seul « Passer » est testé, pas la navigation slide par slide.
- **Base Camp** : des bugs ont été signalés sans être détaillés — écrire le test de régression
  **avant ou avec** le fix, une fois les symptômes précisés.

## Écrire un test E2E

- Un fichier par feature : `e2e/tests/<feature>.spec.ts`, importer `{ test, expect }` depuis
  `../fixtures` et `login` depuis `../helpers/auth`.
- **Réutiliser les helpers** : `login(page, {email?, name?})`, `signInWithEmulator`, `logout` ;
  constantes `MEMBER_EMAIL` (membre + admin), `ADMIN_EMAIL`, `NON_ADMIN_EMAIL`, `UNAUTHORIZED_EMAIL` ;
  seeds via l'Admin SDK — `seedRando`, `seedDoc`, `seedAllowedEmails`, `getLatestEmailSignInLink`.
- `resetEmulators()` tourne **automatiquement** en `beforeEach` (`e2e/fixtures.ts`) — jamais à appeler.
- **Sélecteurs** : rôle ARIA ou texte (`getByRole('button', {name})`, `getByPlaceholder`), pas de CSS
  générique. `.locator('.classe')` seulement pour des marqueurs structurels déjà utilisés ailleurs
  (`.rcard`, `.admin-row`, `.bc-name`).
- **Isolation** : l'uid de l'émulateur est **déterministe par e-mail**. Ne jamais muter une donnée
  partagée (retirer `NON_ADMIN_EMAIL` de la whitelist cassait un autre test) — utiliser des valeurs
  jetables.
- **Lancer la suite complète 2-3 fois d'affilée** avant de considérer un test terminé. Un test qui
  passe une fois et flake ensuite n'est pas fini.

## Réparer la CI

Deux jobs disjoints dans `.github/workflows/ci.yml` (Node 22) :

- **`ci`** : `npm run lint` → `npm test` → `npm run build`. Rapide, sans émulateurs.
- **`e2e`** : JDK 21 (`actions/setup-java`) + Chromium, puis `npm run test:e2e`. Upload le rapport
  HTML Playwright en artefact (`playwright-report/`, 14 jours) **même en cas d'échec**.

Démarche :

1. Identifier **quel job** échoue — `ci` et `e2e` échouent pour des raisons disjointes.
2. `ci` → `lint` : `npm run lint` en local (oxlint pointe le fichier exact).
   `test` : `npx vitest run <chemin>` sur le fichier fautif ; suspecter un composant partagé
   (ex. le renommage `ADMIN_EMAIL` → `ADMIN_EMAILS` a cassé tous les `vi.mock` qui en dépendaient).
   `build` : erreur de typage, le message TS est explicite.
3. `e2e` → ouvrir l'artefact `playwright-report`, ou reproduire en local.
   - Flake CI mais jamais en local → course de timing, reproduire en lançant la **suite complète**
     plusieurs fois (l'identité déterministe partagée ne casse qu'en suite complète).
   - Tout casse d'un coup après un changement de libellé → `grep -rn "ancien texte" e2e/`.
   - Erreur Java/émulateurs → problème d'environnement, pas de régression produit.
4. Après le fix : suite complète 2-3 fois en local **avant** de pousser.

> Après toute modif de `src/` touchant l'UI ou l'auth, relancer au minimum les specs concernées.
> Un changement « cosmétique » invalide régulièrement des sélecteurs Playwright.

Pièges spécifiques aux tests → [[Pièges connus]].
