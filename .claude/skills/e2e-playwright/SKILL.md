---
name: e2e-playwright
description: Ajoute de nouveaux tests E2E Playwright, améliore la couverture de tests d'Altimates, ou diagnostique/répare la CI GitHub Actions quand elle échoue (job "ci" ou job "e2e"). Utilise ce skill dès que l'utilisateur parle de "tests", "couverture de tests", "coverage", "CI qui échoue/rouge/casse", "Playwright", "ajouter un test", "tester cette fonctionnalité", ou demande combien de cas sont couverts — même sans mentionner explicitement "e2e" ou "Playwright" par leur nom.
---

# Tests E2E Playwright (Altimates)

Suite E2E qui tourne contre les **émulateurs Firebase** (Auth + Firestore), jamais la prod :
état isolé et jetable à chaque test, vraies `firestore.rules` appliquées, login via un compte
Google factice servi par l'émulateur (aucun OAuth réel). Voir aussi
[`README.md`](../../../README.md#tests-e2e-playwright--émulateurs-firebase) pour le contexte
général et [`BACKLOG.md`](../../../BACKLOG.md) pour les tâches liées déjà identifiées.

## Inventaire actuel — comment l'obtenir à jour

Les nombres ci-dessous datent du **2026-07-10**. Avant de t'y fier pour une décision (« qu'est-ce
qui manque ? »), regénère-les — la suite évolue vite :

```bash
# Nombre de cas E2E par fichier + total
for f in e2e/tests/*.spec.ts; do echo "$(grep -c '^\s*test(' "$f") | $f"; done
grep -h '^\s*test(' e2e/tests/*.spec.ts | wc -l

# Titres complets (describe + test), lisible tel quel
for f in e2e/tests/*.spec.ts; do echo "### $(basename "$f")"; grep -nE '^\s*test(\.describe)?\(' "$f"; done

# Tests unitaires (Vitest)
npm test 2>&1 | grep -E "Tests |Test Files"
```

### Snapshot au 2026-07-10 : 28 cas E2E (11 fichiers) + 102 tests unitaires (21 fichiers)

| Fichier | Cas | Couvre |
|---|---|---|
| `login.spec.ts` | 5 | connexion Google, rejet hors whitelist, gating onglet Admin (admin codé en dur + admin whitelisté + non-admin) |
| `email-link.spec.ts` | 4 | connexion par lien e-mail sans pop-up (cross-device), rejet hors whitelist, tour guidé pour un nouveau membre, e-mail invalide |
| `admin-access.spec.ts` | 2 | ajout d'un email → accès accordé ; retrait → accès révoqué (whitelist dynamique `config/allowedEmails`) |
| `admin.spec.ts` | 1 | accès au panneau Admin (sections visibles) |
| `sommets.spec.ts` | 4 | proposer une rando, voter "partant"/retirer, exclusivité "peut-être", suppression par le proposeur |
| `basecamp.spec.ts` | 5 | ouverture via l'avatar, configurer/modifier le profil, lien vers Kit, Réinitialiser, Déconnexion |
| `kit.spec.ts` | 1 | onboarding (niveau + mode) → checklist matériel |
| `radio.spec.ts` | 1 | poster un message |
| `idees.spec.ts` | 2 | soumettre une idée, bascule vue Liste/Kanban |
| `navigation.spec.ts` | 2 | smoke sur tous les onglets (zéro erreur JS), déconnexion |
| `tour.spec.ts` | 1 | tour guidé à la première connexion |

### Trous de couverture connus (aucun test E2E)

- **Cordée** (`src/features/cordee/CordeePage.tsx`) : **0 test**. Non couvert : liste des membres,
  checklist de départ (ajouter/assigner/cocher/supprimer un item), copier le lien d'invitation.
- **Détail d'une rando** (`RandoDetailModal.tsx`, ouvert au clic sur une carte) : seul le flux
  "proposer" est testé. Non couvert : les 3 onglets Info/Ravito/Hydra, gestion des traces
  (ajouter/retirer/voter une variante), édition d'une rando existante (`EditRandoModal.tsx`).
  L'onglet Ravito calcule des besoins en ravitaillement, Hydra en hydratation — logique métier
  non triviale, bonne candidate pour un premier ajout de couverture.
- **Radio** au-delà de l'envoi : épingler/désépingler un message, supprimer, accusés de lecture
  (receipts), filtrage par type (message/position/alerte/confirmation).
- **Idées** au-delà de la soumission : voter, changer de statut (kanban drag ou boutons), ajouter
  un commentaire, supprimer.
- **Admin** au-delà de l'accès : vider une collection (`flushCollection`), reset complet, la
  double confirmation associée.
- **Tour guidé** : seul le "Passer" est testé ; pas la navigation slide par slide jusqu'au bout.
- **Base Camp** : des bugs ont été signalés par l'utilisateur mais pas encore détaillés/reproduits
  (voir `BACKLOG.md`, section 🐞). Une fois détaillés, écrire le test de régression **avant** ou
  en même temps que le fix.

C'est la liste à proposer en premier quand on te demande d'« améliorer la couverture rapidement » —
proposer une carte Trello par item si le skill `trello-kanban` est aussi utilisé.

## Comment lancer les tests

```bash
npx playwright install chromium   # une fois

# Prérequis local : JDK >= 21 sur le PATH (l'émulateur Firestore le refuse sinon)
export JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-23.jdk/Contents/Home  # adapter au JDK dispo
export PATH="$JAVA_HOME/bin:$PATH"

npm run test:e2e                  # build "e2e" + émulateurs + Playwright headless (= ce que fait la CI)
npm run test:e2e:ui               # mode interactif, pratique pour développer un test
```

Pour lancer un seul fichier/nom pendant le développement (plus rapide que la suite complète) :
```bash
npm run build:e2e   # une fois, ou après une modif de src/
npx firebase emulators:exec --only auth,firestore --project altimates-4c37f \
  'npx playwright test sommets --reporter=list'   # filtre par nom de fichier ou de test
```

**Toujours valider la stabilité avant de considérer un test fini** : lance la suite complète
**2-3 fois d'affilée**. Un test qui passe une fois mais flake à la 2e/3e n'est pas terminé — les
causes typiques sont documentées dans "Pièges connus" ci-dessous.

## Ajouter un nouveau test

1. **Choisis le bon fichier** : un fichier par feature/onglet (`e2e/tests/<feature>.spec.ts`). S'il
   n'existe pas encore pour la feature visée (ex. Cordée), crée-le sur ce modèle :
   ```ts
   import { test, expect } from '../fixtures'
   import { login } from '../helpers/auth'

   test.describe('Nom de la feature', () => {
     test('ce que fait le test, au présent', async ({ page }) => {
       await login(page, { name: 'Wacil' })
       await page.getByRole('button', { name: 'Cordée' }).click()
       // ...
     })
   })
   ```
2. **Réutilise les helpers existants** plutôt que d'en récrire :
   - `login(page, { email?, name? })` / `signInWithEmulator` / `logout(page)` — `e2e/helpers/auth.ts`.
     Constantes prêtes : `MEMBER_EMAIL` (membre + admin), `ADMIN_EMAIL`, `NON_ADMIN_EMAIL`
     (membre whitelisté non-admin), `UNAUTHORIZED_EMAIL`.
   - `seedRando(opts)`, `seedDoc(collection, data)`, `seedAllowedEmails(emails?)`,
     `getLatestEmailSignInLink(email)` — `e2e/helpers/emulator.ts`, via l'Admin SDK (bypass les
     règles Firestore, pratique pour préparer un état sans passer par l'UI).
   - `resetEmulators()` tourne automatiquement avant **chaque** test (`e2e/fixtures.ts`,
     `test.beforeEach`) — jamais besoin de l'appeler toi-même.
3. **N'écris jamais de sélecteur CSS générique** (`.btn`, `div > span`) si un rôle ARIA ou un texte
   suffit : `getByRole('button', { name: ... })`, `getByPlaceholder(...)`, `getByText(...)`. Utilise
   `.locator('.classe-precise')` seulement pour des marqueurs structurels stables (`.rcard`,
   `.admin-row`, `.bc-name`...) déjà utilisés ailleurs dans la suite — grep les specs existants pour
   trouver le pattern déjà en place plutôt que d'en inventer un nouveau.
4. **Isolation entre tests** : l'uid de l'émulateur est **déterministe par email**
   (`wacil78@gmail.com` → toujours le même uid). Le reset Firestore/Auth avant chaque test protège
   des collections partagées, mais **ne mute jamais une donnée partagée par d'autres tests**
   (ex. retirer `NON_ADMIN_EMAIL` de la whitelist dans un test cassait un autre test qui s'y fiait —
   piège vécu, voir `admin-access.spec.ts`). Si un test doit ajouter/retirer un email ou une donnée
   nommée, utilise une valeur **jetable**, jamais une des constantes partagées (`MEMBER_EMAIL`,
   `NON_ADMIN_EMAIL`, etc.) sauf pour de la lecture simple.
5. **Vérifie 2-3 fois d'affilée** (voir section précédente) avant de considérer le test terminé.

## Pièges connus (déjà rencontrés, pour ne pas les répéter)

- **Modal prénom obligatoire** (depuis v0.3.3, `NamePromptModal`) : tout login **par lien e-mail**
  (pas de displayName) affiche une modal bloquante "Comment doit-on t'appeler ?" avant l'app —
  et une modale ouverte **masque la barre Proposer** (`body:has(.modal-wrap.open)` dans topo.css).
  Un test lien e-mail doit saisir le prénom (`getByPlaceholder('Ton prénom')` + Enter) avant
  d'asserter l'app. Les logins Google émulateur ne sont PAS concernés (le widget remplit
  `#display-name-input`). Le header affiche le **prénom complet** dans `.av-btn` (plus d'initiales).
- **`resetEmulators()` vérifie désormais les réponses HTTP** : un `fetch` DELETE ne rejette pas
  sur un statut d'erreur — avant ce durcissement, un reset silencieusement raté laissait fuiter
  l'état du test précédent (flake vécu : profil 'Ousmane' survivant au beforeEach, visible
  uniquement en suite complète). Si un test voit des données d'un autre test, suspecter ce
  mécanisme en premier.
- **Un flake "local vert / CI rouge" peut être une vraie course applicative** : le fix Anonyme
  est passé 3× en local puis a cassé en CI car l'assertion arrivait avant/après l'apparition de
  la modal selon la latence du `onSnapshot`. Toujours rendre le test déterministe vis-à-vis du
  nouvel état (attendre la modal explicitement) plutôt que de compter sur le timing.

- **Bottom-sheets recouverts par la nav fixe** : le bouton submit d'un modal bottom-sheet peut être
  recouvert par la nav pendant l'animation → `.click()` timeout ou clique au mauvais endroit. Fix
  utilisé : soumettre au clavier (`locator('input[name="x"]').press('Enter')`) plutôt que cliquer le
  bouton, insensible au recouvrement.
- **`getByRole('button', { name: 'Base Camp' })` matche aussi l'avatar** (aria-label "Mon Base
  Camp" contient "Base Camp") → ajoute `{ exact: true }` dès qu'un nom de bouton nav est un
  sous-texte d'un autre élément cliquable.
- **`window.confirm()` non géré** fait planter/timeout un test : écoute `page.once('dialog', d =>
  d.accept())` **avant** de cliquer l'action qui déclenche la confirmation (suppression, retrait
  whitelist, reset...).
- **`preview` doit bind `127.0.0.1`** (`--host 127.0.0.1` dans `preview:e2e`), sinon Playwright
  (baseURL `127.0.0.1`) ne joint pas le serveur sur macOS (`localhost` résout en `::1`).
- **Assertions agnostiques de l'état du profil** : un profil peut être déjà configuré (uid partagé
  entre tests via l'émail déterministe) ou vierge selon l'ordre d'exécution → teste
  `/Ton niveau en rando \?|Indispensables/` plutôt que de présumer un seul état, sauf si le test
  vient justement de le mettre dans un état connu (ex. après un `configure()` explicite).
- **`displayName` non propagé par l'émulateur Auth** → `useMemberName` retombe sur "Anonyme". Ne
  jamais asserter sur le prénom/les initiales affichées après un login émulateur brut ; passer par
  la configuration de profil (Base Camp → Configurer) si le nom affiché doit être vérifié.
- **JDK ≥ 21 requis** pour l'émulateur Firestore (`firebase-tools` refuse < 21, erreur explicite).
  La CI le gère via `actions/setup-java`. En local, il faut l'avoir sur le PATH.

## Réparer la CI quand elle échoue

Deux jobs séparés dans `.github/workflows/ci.yml` :
- **`ci`** : `npm run lint` → `npm test` (Vitest) → `npm run build`. Rapide, pas d'émulateurs.
- **`e2e`** : installe JDK 21 + Chromium, puis `npm run test:e2e` (build e2e + émulateurs + Playwright).
  Upload le rapport HTML Playwright en artefact (`playwright-report/`) même en cas d'échec.

### Démarche de diagnostic

1. **Identifie le job en échec** dans l'onglet Actions du repo GitHub — `ci` et `e2e` échouent pour
   des raisons disjointes, ne pas les confondre.
2. **Si `ci` échoue** :
   - `lint` → lance `npm run lint` en local, corrige (oxlint est rapide, le message pointe le fichier
     exact).
   - `test` (Vitest) → lance `npm test` en local. Si un seul fichier échoue, relance-le seul :
     `npx vitest run <chemin>`. Vérifie si l'échec est lié à une modif de composant partagé
     (ex. `core/firebase/auth.ts` exports renommés → tous les mocks `vi.mock(...)` qui en dépendent
     cassent, comme vécu lors du passage `ADMIN_EMAIL` → `ADMIN_EMAILS`).
   - `build` (tsc + vite build) → erreur de typage la plupart du temps ; le message TS est explicite.
3. **Si `e2e` échoue** :
   - Télécharge/ouvre l'artefact `playwright-report` depuis le run GitHub Actions échoué, ou
     reproduis en local avec `npm run test:e2e` (mêmes commandes que la CI).
   - **Un seul test flake en CI mais jamais en local** → généralement une course de timing
     (assertion qui ne wait pas assez, ou dépend d'un ordre d'exécution). Reproduis en lançant la
     suite **complète** plusieurs fois en local (pas juste le fichier isolé) — les flakes de ce type
     n'apparaissent souvent qu'en suite complète à cause du partage d'identité déterministe entre
     tests (voir "Isolation entre tests" plus haut).
   - **Tout casse d'un coup après un changement d'UI/texte** (ex. renommage d'un bouton, nouveau
     libellé de message d'erreur) → grep le texte changé dans `e2e/` pour trouver toutes les
     assertions à mettre à jour d'un coup (`grep -rn "ancien texte" e2e/`).
   - **Erreur liée à Java/émulateurs** (`Java version before 21`, timeout de démarrage) → problème
     d'environnement, pas de régression produit ; vérifie la version du job `setup-java` dans le
     workflow plutôt que de chercher un bug applicatif.
4. **Après le fix**, relance la suite complète 2-3 fois en local avant de pousser (voir plus haut) —
   ne pousse jamais un fix de flake sans l'avoir vu passer plusieurs fois d'affilée.

## Après tout changement de fichier source touchant l'UI/auth

Une modif dans `src/` peut invalider des assertions E2E qui pointaient l'ancien état (texte,
libellé de bouton, structure). Après toute modif de ce type, lance au minimum les specs du dossier
concerné avant de considérer le travail terminé — ne présume jamais qu'un changement "cosmétique"
n'a aucun effet sur les sélecteurs Playwright.
