# Grille d'audit d'une suite de tests frontend

Utiliser cette grille pour relire une suite existante (revue de PR de tests, chasse au flaky, durcissement). Pour chaque fichier de test, lire aussi le composant/module sous test — la moitié des défauts ne se voient qu'en comparant les deux.

## A. Flakiness d'environnement

- [ ] Aucune assertion ne compare une chaîne issue de `toLocaleString()` / `Intl.*` sans locale explicite. Chercher : `toLocaleString`, `toLocaleDateString`, `NumberFormat`. Corriger par regex tolérante `[\s.,]?` ou locale explicite.
- [ ] Aucune date construite par `Date.now() + N * 86400000` ou `+ N * 24 * 60 * 60 * 1000`. Corriger par `setDate(getDate() + N)`.
- [ ] Si des tests dépendent de « aujourd'hui », vérifier qu'un passage à minuit ou un changement d'heure pendant l'exécution ne les casse pas (sinon : fake timers `vi.setSystemTime`).
- [ ] Preuve : relancer les fichiers concernés sous `LANG=de_DE.UTF-8`, `LANG=fr_FR.UTF-8` (script `scripts/vitest-locales.sh`).

## B. Assertions vacuoles (le test peut-il échouer ?)

Pour chaque `it(...)`, faire la mutation mentale : casser dans sa tête la fonctionnalité nommée et vérifier qu'une assertion échouerait.

- [ ] Pas d'oracle tautologique : la valeur attendue n'est pas calculée par la même fonction de production que le composant. Chercher les imports de services de prod dans les fichiers de test.
- [ ] Les fixtures ont du contraste : tout test « X s'affiche pour Y » a au moins un cas non-Y dans la fixture, avec assertion négative.
- [ ] Les valeurs assertées sont épinglées à l'élément visé (pas de `getAllByText(...).length > 0` satisfiable par un doublon ailleurs sur la page).
- [ ] Aucune assertion post-action qui était déjà vraie avant l'action (mocks statiques : le DOM ne change pas après le clic).
- [ ] Le nom de chaque test correspond à ce qu'il asserte réellement (les « et » dans les noms sont suspects).

## C. Mocks

- [ ] Aucune constante ni fonction pure recopiée dans une factory `vi.mock` → mock partiel `importOriginal`.
- [ ] Chaque fonction mockée en `vi.fn()` est exercée par au moins un test (sinon : trou de couverture — gardes `confirm()`, effets `markRead`, votes… souvent oubliés).
- [ ] Les `toHaveBeenCalledWith` reflètent le site d'appel réel (relire le composant : ordre, normalisation, objet vs id).
- [ ] Les fixtures utilisent des valeurs que l'app produit vraiment (types unions respectés, pas de valeurs magiques qui tombent dans un fallback).
- [ ] Les mocks fournissent tous les exports que le composant (et ses enfants rendus) consomme — un export manquant = `undefined` → TypeError différée.
- [ ] Aucun fichier de test n'importe transitivement un module d'init coûteux non mocké (Firebase `initializeApp`, SDK réseau…).

## D. Hygiène de suite

- [ ] Pas de boilerplate `afterEach(cleanup)` / `vi.clearAllMocks()` recopié par fichier si la config peut le faire (`globals: true`, `clearMocks: true`, `setupFiles`).
- [ ] Zéro warning `not wrapped in act` sur la suite complète (tests async : `await findBy*` après render quand l'effet de montage lance des promesses).
- [ ] Factories de fixtures partagées, pas dupliquées avec des défauts divergents.
- [ ] Les états déclarés dans les fixtures (`error`, `loading`) sont tous exercés par au moins un test — un champ `error: null as Error | null` jamais mis à autre chose que null signale une branche non couverte.
- [ ] jest-dom branché si installé (`toBeInTheDocument` plutôt que `toBeTruthy`).

## Restitution

Classer les constats : (1) flakiness d'environnement, (2) tests qui ne peuvent pas échouer, (3) trous de couverture, (4) hygiène. Pour chaque constat, donner le scénario d'échec concret (« sur une machine de-DE, X échoue » / « inverser la garde Y laisse la suite verte ») — pas seulement la règle violée. Corriger dans cet ordre, puis dérouler la validation finale du SKILL.md.
