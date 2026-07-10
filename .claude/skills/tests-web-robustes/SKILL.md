---
name: tests-web-robustes
description: Écrire et auditer des tests frontend (React/Vue + Vitest/Jest + Testing Library) qui sont robustes — insensibles à la locale, au fuseau horaire et à l'heure d'été, avec des assertions qui peuvent réellement échouer et des mocks fidèles au code de production. Utiliser ce skill dès que l'utilisateur demande d'écrire, ajouter, corriger ou relire des tests de composants ou de pages web, de "durcir" ou stabiliser une suite de tests, d'enquêter sur un test flaky, ou de mettre en place la configuration de tests (vitest.config, setup file, factories) — même s'il dit simplement "ajoute des tests pour X" sans mentionner la robustesse.
---

# Tests web robustes

Ce skill capture les défauts qui rendent une suite de tests frontend verte mais inutile : tests qui échouent selon la machine (locale, fuseau), assertions qui passent même quand la fonctionnalité est cassée, mocks qui divergent silencieusement du code réel. Chaque règle vient d'un bug réellement observé.

Deux modes d'usage :
- **Écrire** : rédiger de nouveaux tests → appliquer les règles ci-dessous dès l'écriture.
- **Auditer** : relire une suite existante → utiliser [references/audit-checklist.md](references/audit-checklist.md) comme grille de lecture, puis corriger.

## 1. Setup projet (à vérifier avant d'écrire le premier test)

Si le projet n'a pas encore de configuration de test propre, la mettre en place d'abord — sinon chaque fichier de test réinvente le même boilerplate et le 12e fichier qui l'oublie provoque des fuites DOM entre tests.

Dans `vite.config.ts` / `vitest.config.ts` :

```ts
test: {
  environment: 'jsdom',
  globals: true,        // active l'auto-cleanup de Testing Library
  clearMocks: true,     // efface les compteurs d'appels entre tests (pas les implémentations)
  setupFiles: ['./src/setupTests.ts'],
}
```

`src/setupTests.ts` :

```ts
import '@testing-library/jest-dom/vitest'
```

Points d'attention :
- `globals: true` active aussi les vérifications `act()` de React : les tests qui rendent un composant dont l'effet de montage lance des promesses doivent les laisser se résoudre (`await screen.findByText(...)`) avant de terminer, sinon warnings `not wrapped in act(...)`.
- `clearMocks` appelle `mockClear()` (compteurs seulement). Une implémentation définie **dans** un test (`mockReturnValue` ponctuel) doit être remise à sa valeur par défaut dans un `beforeEach`.
- jest-dom donne `toBeInTheDocument()`, `toHaveClass()`, etc. — préférer ces matchers aux `toBeTruthy()` nus : les messages d'échec montrent un diff du DOM au lieu de "expected undefined to be truthy".
- Factories de fixtures partagées dans `src/test/factories.ts` plutôt que recopiées par fichier : quand le type grandit d'un champ requis, on corrige un seul endroit, et des défauts divergents entre copies font se comporter différemment des tests identiques en apparence.

## 2. Locale, dates et heure d'été

Les échecs les plus sournois : la suite passe sur la machine du développeur et casse en CI (ou chez un collègue) parce que la locale ou le fuseau diffèrent.

**Nombres formatés.** `toLocaleString()` sans locale explicite produit `4,500` (en-US), `4 500` avec espace insécable étroit U+202F (fr-FR), `4.500` (de-DE). Deux pièges distincts :
- Comparer une chaîne construite avec le **même** `toLocaleString()` que le composant ne suffit pas : Testing Library normalise le texte du DOM (U+202F → espace ASCII) mais compare la chaîne attendue telle quelle — le test échoue en fr-FR alors que les deux côtés appellent la même fonction.
- Une regex tolérante doit couvrir **tous** les séparateurs : `[\s.,]?` (le `.` de de-DE est celui qu'on oublie).

```ts
// Fragile — casse selon la locale de la machine :
expect(screen.getByText(`+${(4500).toLocaleString()}`)).toBeInTheDocument()
// Robuste :
expect(screen.getByText(/^\+4[\s.,]?500$/)).toBeInTheDocument()
```

**Arithmétique de dates.** `Date.now() + N * 86400000` ajoute 24 h × N de temps réel, pas N jours calendaires : autour d'un changement d'heure, un test lancé près de minuit atterrit sur J+2 ou J+4 au lieu de J+3. Utiliser l'arithmétique calendaire :

```ts
// Fragile (DST) :                        // Robuste :
new Date(Date.now() + 3 * 86400000)       const d = new Date(); d.setDate(d.getDate() + 3)
```

**Vérification.** Après avoir écrit des tests touchant nombres formatés ou dates, prouver la robustesse en relançant sous plusieurs locales — le script fourni le fait en une commande :

```bash
bash <chemin-du-skill>/scripts/vitest-locales.sh [fichiers de test...]
```

## 3. Assertions qui peuvent échouer

Avant de valider un test, faire la **mutation mentale** : « quelle modification du composant ferait échouer ce test ? » Si casser la fonctionnalité que le nom du test annonce le laisse vert, le test ment. Cas récurrents :

- **Oracle tautologique** : calculer la valeur attendue en appelant la même fonction de production que le composant (`expect(x).toBe(computeStats(input).pct)`). Un bug dans la fonction déplace l'attendu et le rendu à l'identique → toujours vert. Utiliser des **valeurs littérales** calculées une fois à la main pour la fixture (`expect(screen.getByText('14%')).toBeInTheDocument()`), et couvrir la fonction elle-même par un test unitaire à valeurs littérales.
- **Fixture sans contraste** : tester « le badge s'affiche pour l'admin » avec une fixture ne contenant *que* l'admin ne distingue pas « badge conditionnel » de « badge sur tout le monde ». Toujours inclure au moins un cas négatif dans la fixture (un non-admin) et asserter que lui n'a *pas* le badge.
- **Élément non épinglé** : `getAllByText('8').length > 0` passe si un '8' existe n'importe où sur la page. Si la valeur testée apparaît ailleurs, scoper la requête (`within(section)`) sur la zone visée. Le simple fait de devoir écrire `getAllByText` au lieu de `getByText` est déjà un signal de doublon.
- **Assertion avant/après identique** : asserter un texte après un clic alors qu'il était déjà présent avant (mock statique) ne prouve rien. Déplacer l'assertion d'état *avant* l'action, et vérifier l'*effet* de l'action sur le mock appelé.
- **Moitié de nom non testée** : si le test s'appelle « affiche les stats et le niveau », il doit asserter les deux. Sinon renommer ou compléter.

## 4. Mocks fidèles

Un mock qui diverge du module réel produit des tests verts sur un code qui n'existe plus.

- **Ne jamais recopier une constante ou une fonction pure dans un mock.** Utiliser un mock partiel qui garde le vrai module et ne remplace que les effets de bord :

```ts
vi.mock('../../core/firebase/admin', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../core/firebase/admin')>()),
  countCollection: vi.fn(() => Promise.resolve(4)),   // seuls les I/O sont stubbés
}))
```

  Une copie manuelle (`FLUSHABLE_COLLECTIONS: ['a','b']`, réimplémentation d'un helper) devient obsolète en silence quand l'original change.
- **Chaque fonction mockée doit être exercée par au moins un test** (appel vérifié via `toHaveBeenCalledWith`). Une fonction mockée que personne ne déclenche est un trou de couverture déguisé : l'inversion d'une garde (`markRead` sur les messages déjà lus, `confirm()` supprimé avant un delete) passe inaperçue. Si on ne compte pas la tester, ne pas la mocker fonction par fonction — laisser le module entier mocké et le noter.
- **Vérifier les arguments réels du site d'appel**, pas ceux qu'on imagine : lire le composant avant d'écrire le `toHaveBeenCalledWith` (ordre des arguments, normalisation trim/lowercase, objet vs id).
- Les fixtures doivent utiliser des **valeurs que l'application produit réellement** (pas `level: 2` quand l'app n'écrit que `'newbie'|'expert'`) — sinon le test exerce le chemin de repli, pas le chemin nominal.

## 5. Validation finale

Avant de conclure (écriture comme audit) :

1. `npx vitest run` → vert, **et zéro warning** `not wrapped in act` dans stderr.
2. `bash <chemin-du-skill>/scripts/vitest-locales.sh` sur les fichiers touchant nombres/dates.
3. Typecheck du projet (`npx tsc --noEmit` ou le script du repo).
4. Repasser la mutation mentale sur chaque nouveau test : « qu'est-ce qui le ferait échouer ? »

Pour un audit complet d'une suite existante, dérouler [references/audit-checklist.md](references/audit-checklist.md).
