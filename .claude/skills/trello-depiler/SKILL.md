---
name: trello-depiler
description: Dépile séquentiellement plusieurs cartes d'une liste du board Trello ALTImates (https://trello.com/b/3qpIIJxH) — un sous-agent dédié par carte exécute le travail dans le dépôt, puis commit (jamais de push automatique) et la carte n'est déplacée vers "✅ Déjà fait" qu'après validation de l'utilisateur. Utilise ce skill quand l'utilisateur dit "dépile les bugs Trello", "enchaîne les cartes", "vide la liste Optimisations", "traite les cartes une par une", "drain le board". Pour une seule carte, utiliser trello-kanban.
---

# Trello — dépiler une liste

Traite plusieurs cartes d'une même liste, **une par une, dans l'ordre du board**, chacune dans
un sous-agent au contexte propre.

Identifiants, IDs des listes et pièges curl : voir [`trello-kanban`](../trello-kanban/SKILL.md).

## Règles d'or

- **Séquentiel, jamais parallèle.** Deux cartes touchent le même dépôt : les paralléliser
  produirait des commits mélangés et des conflits.
- **Un sous-agent dédié par carte** (`subagent_type: "general-purpose"`,
  `run_in_background: false`). Le sous-agent n'a pas le droit de commiter, pusher, stash, reset,
  ni de changer de branche.
- **Le commit se fait dans le fil principal**, une fois par carte, message conventionnel
  (`feat:` / `fix:` / `chore:` / `docs:` / `test:`), scope quand il est évident.
- **Jamais de push automatique.** Le push (donc le déclenchement de la CI et du déploiement
  staging) attend un go explicite de l'utilisateur, à la fin du dépilage. Règle générale du
  projet, un dépilage n'est pas une autorisation implicite.
- **Ne jamais détruire du travail non commité** : aucun `git reset --hard`, `git checkout --`,
  `git stash drop`.
- **La carte ne part en ✅ Déjà fait qu'après validation utilisateur** (livré/testé), pas au
  moment du commit. Le board n'a pas de colonne « en cours » : l'avancement se signale par un
  commentaire sur la carte.

## Étape 0 — Vérifications

1. Liste à dépiler : celle nommée par l'utilisateur. Ambigu → demander, ne pas deviner.
   IDs dans `trello-kanban`.
2. `git status --porcelain` : si le working tree n'est pas propre, **s'arrêter**. Le premier
   commit embarquerait des changements qui ne lui appartiennent pas. Ne rien stash ni commiter
   soi-même.
3. Noter la branche courante ; le dépilage y reste du début à la fin. Si la branche est `main`,
   proposer de créer une branche avant de commencer.

## Étape 1 — Lire la file

```bash
KEY=$(jq -r '.key' .claude/trello.local.json)
TOKEN=$(jq -r '.token' .claude/trello.local.json)

curl -s "https://api.trello.com/1/lists/$LIST_ID/cards?key=$KEY&token=$TOKEN&filter=open&fields=id,name,desc,shortUrl" \
  | jq -r '.[] | [.id, .name] | @tsv'
```

Conserver l'ordre renvoyé (haut de liste d'abord) : c'est l'ordre de dépilage. Une carte à
description vide n'est pas dépilable — la laisser en place et la lister dans le rapport.
File vide : le dire et s'arrêter.

Annoncer la file (numéro, titre, première ligne de la description), puis **demander confirmation
avant de commencer** — un dépilage engage plusieurs commits d'affilée.

## Étape 2 — Dépiler, carte par carte

### 2.1 Signaler le démarrage

```bash
curl -sS -X POST "https://api.trello.com/1/cards/$CARD_ID/actions/comments" \
  --data-urlencode "key=$KEY" --data-urlencode "token=$TOKEN" \
  --data-urlencode "text=🔧 En cours (dépilage) — branche $BRANCH"
```

### 2.2 Exécuter dans un sous-agent

Construire le prompt :

- **Si la description commence par `/`** : c'est une slash command. Résoudre dans cet ordre :
  1. skill du dépôt (`/cycle-correctifs`, `/e2e-playwright`, `/security-check`, ...) → demander
     au sous-agent de l'invoquer via `Skill`, reste de la ligne en arguments ;
  2. `~/.claude/commands/<nom>.md` existe → lui demander de lire ce fichier et d'en suivre les
     instructions, `$ARGUMENTS` = reste de la ligne ;
  3. sinon, commande intégrée ou de plugin (`/simplify`, `/review`, ...) → passer la ligne telle
     quelle. Leur absence de `~/.claude/commands` n'est pas un échec.
  - Nom manifestement inexistant : ne pas inventer de substitut, reporter la carte en échec.
  - Ce qui suit la première ligne reste du contexte à transmettre.
- **Sinon** : la description est le prompt, mot pour mot. Ne pas la reformuler ni la résumer.

Ajouter systématiquement en fin de prompt :

```
Contexte : tu traites la carte Trello "<titre>" (<url>).
Travaille dans /Users/wacil/Desktop/altimates-app, sur la branche <branche>.
Respecte le CLAUDE.md du projet.

Interdits : git commit, git push, git stash, git reset, git checkout d'un fichier,
changement de branche, création de worktree. Le commit est fait par l'appelant.

Avant de conclure FAIT, fais passer ce qui s'applique à ton changement :
lint, tests unitaires, build, et les tests E2E Playwright si tu as touché un
parcours utilisateur.

Quand tu as fini, renvoie :
- FAIT ou ÉCHEC
- un message de commit conventionnel (feat: / fix: / chore: / docs: / test:)
- 3 lignes max sur ce qui a changé
- ce qui reste à vérifier à la main, s'il y a lieu
```

### 2.3 Commit

Sur retour **FAIT** :

1. `git status --porcelain` puis `git diff --stat`.
   - Aucun changement : ne pas commiter. Le signaler, commenter la carte, ne pas la déplacer —
     le sous-agent a pu conclure qu'il n'y avait rien à faire, l'utilisateur tranche.
2. `git add` restreint à ce qui relève de la carte (pas de `git add -A` aveugle : le dépôt peut
   contenir des fichiers de travail sans rapport).
3. Commit avec le message renvoyé, corrigé si le format conventionnel n'est pas respecté.
4. **Pas de push.** Commenter la carte avec le SHA court et le message.

### 2.4 Fin de carte

- **FAIT + commit** : laisser la carte dans sa liste, avec un commentaire « commité, en attente
  de livraison ». Elle ne bouge vers ✅ Déjà fait qu'à l'étape 3, après validation.
- **ÉCHEC**, sous-agent mort, ou commande introuvable : **arrêter le dépilage**. Ne rien
  commiter. Un working tree sale se déverserait dans le commit de la carte suivante. Reporter
  l'échec avec le message du sous-agent.

Puis carte suivante.

## Étape 3 — Fin de dépilage

1. Présenter le récapitulatif (tableau ci-dessous) et **demander le go** pour :
   - `git push` (déclenche CI + staging) ;
   - le déplacement des cartes traitées vers ✅ Déjà fait (`idList` + `dueComplete=true`, voir
     `trello-kanban`).
2. Une fois le go donné : pousser, puis déplacer les cartes, puis mettre à jour `BACKLOG.md`
   (section « ✅ Déjà fait ») dans la même session.
3. Mise en production : hors périmètre de ce skill. Voir `cycle-correctifs` et `mise-en-prod`.

Pas de relance automatique sur les cartes arrivées pendant le dépilage : les annoncer, laisser
l'utilisateur décider d'un second tour. Tenir la liste des IDs déjà traités pour ne jamais
dépiler deux fois la même carte dans un run.

## Rapport final

| # | Carte | Résultat | Commit |
|---|---|---|---|
| 1 | Rate limit sur /api/invite | commité, en attente de livraison | `a1b2c3d fix(api): ...` |
| 2 | Tests E2E du kit | ÉCHEC — dépilage arrêté | — |

Puis : cartes non dépilables (description vide), cartes arrivées pendant le run, et l'état
push / déplacement Trello / `BACKLOG.md`.
