---
title: Process et outils
type: note
tags: [altimates, process, outils, trello]
updated: 2026-07-31
---

# Process et outils

## Le cycle de correctifs (rodé depuis la session du 2026-07-15)

Boucle à dérouler **dans l'ordre** pour chaque lot de retours (capture annotée, liste de bugs) :

1. **Cartes Trello d'abord** — une carte par point relevé, **avant de coder** (règle posée par Wacil).
   Ajouter cause + fichiers concernés dans la description dès qu'ils sont connus.
2. **Diagnostiquer puis corriger** — commencer par [[Pièges connus]], la plupart des symptômes UI
   y sont déjà expliqués.
3. **Vérifier** : `npx tsc -b && npm run lint && npm test` puis `npm run test:e2e` (JDK ≥ 21).
   Puis **vérification visuelle** en dev-bypass, viewport **mobile ET desktop large** — plusieurs
   bugs n'apparaissent qu'en desktop. Mettre à jour les tests impactés dans le même commit.
4. **Livrer en staging** : commit conventionnel + push `main` → la CI enchaîne automatiquement.
   Puis **commentaire sur chaque carte Trello** : « 🚀 Livré en staging (URL) le JJ/MM, commit abc1234
   — en attente de validation ».
5. **Passer en prod** — uniquement sur demande explicite de Wacil, en déroulant la checklist de
   [[Environnements et déploiement]]. Ensuite : cartes → liste « ✅ Déjà fait » + `dueComplete=true`
   + commentaire « ✅ Livré en PRODUCTION — release vX.Y.Z », et cocher les items dans `BACKLOG.md`.

## Board Trello

[ALTImates — Backlog](https://trello.com/b/3qpIIJxH). Accès via l'**API REST en curl** (jamais un MCP,
pour ne pas consommer de tokens). Identifiants dans `.claude/trello.local.json` — **gitignored**
(`.claude/*.local.json`), jamais commité ni affiché.

| Liste | ID | Rôle |
|---|---|---|
| 🔧 Config manuelle | `6a511ba092cfae285f268054` | Actions bloquantes nécessitant l'utilisateur |
| 🐞 Bugs à corriger | `6a511ba092cfae285f268055` | Bugs signalés |
| ⚡ Optimisations techniques | `6a511ba092cfae285f268056` | Dette, perf, sécurité — invisible utilisateur |
| ✨ Améliorations / plus tard | `6a5137d233c4a3c2dbb0d5b3` | Nice-to-have, souvent dépendant d'un prérequis |
| ✅ Déjà fait | `6a5137d2368e8b0689574844` | Historique, cartes en `dueComplete=true` |

Pas de liste « En cours » : c'est un backlog **catégorisé**, pas un board de statut. Le suivi se fait
par commentaire sur la carte + déplacement vers « Déjà fait » une fois livré.

⚠️ **Toujours `--data-urlencode` par champ**, jamais de query string construite à la main, et vérifier
avec `jq -er` — détails dans [[Pièges connus]].

### Discipline de synchro Trello ↔ `BACKLOG.md`

- `BACKLOG.md` est **versionné** (revu en PR, historique git) → **source de vérité** en cas de divergence.
- Trello est la **vue de travail** (checklist interactive, commentaires de progression).
- Toute tâche ajoutée / terminée / reformulée d'un côté doit être répercutée de l'autre **dans la
  même session**. Si seul Trello est mentionné (« j'ai ajouté une carte X »), aller la lire via l'API
  et la répercuter soi-même dans `BACKLOG.md`.

## Skills Claude du projet (`.claude/skills/`)

Le savoir opérationnel est encodé en skills, chacun déclenché par le vocabulaire de l'utilisateur :

| Skill | Sert à |
|---|---|
| `cycle-correctifs` | La boucle bug → staging → prod ci-dessus |
| `environnements` | Référence des environnements, URLs, config, secrets |
| `mise-en-prod` | Checklist de release, GO / NO-GO |
| `security-check` | Audit des invariants de [[Sécurité]] |
| `e2e-playwright` | Écrire des tests E2E, réparer la CI |
| `tests-web-robustes` | Tests frontend robustes (locale, fuseau, mocks fidèles) |
| `kit-rando` | Éditer `gear.ts` → [[Kit de rando (gear.ts)]] |
| `trello-kanban` | Lire/écrire le board via l'API REST |

## Règles de collaboration

- **Jamais de commit ni de push sans confirmation explicite.** Prendre une carte Trello n'est **pas**
  une autorisation implicite de pousser.
- Travailler sur une branche dédiée, jamais directement sur `main`.
- Message de commit qui explique le **pourquoi**, pas une description mécanique du diff.
- Ne pas prétendre avoir vérifié visuellement ce qui ne l'a pas été (l'app est derrière l'écran de
  connexion Firebase, sans compte de test automatique) — dire ce qui a réellement été vérifié.
- Sur une décision **éditoriale** (catégorie d'un article de kit, formulation UI), proposer un choix
  argumenté plutôt que trancher en silence.
- Les maquettes/options UI sont validées par Wacil avant implémentation (cf. option B du bloc
  « Mon statut », variante A du triage kit).
