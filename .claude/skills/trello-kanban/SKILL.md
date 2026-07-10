---
name: trello-kanban
description: Lit, exécute et met à jour les tâches du board Trello "ALTImates — Backlog" (https://trello.com/b/3qpIIJxH) via l'API REST Trello en curl (jamais de MCP, pour ne pas consommer de tokens). Utilise ce skill dès que l'utilisateur mentionne le "Trello", le "kanban", le "board", demande de "prendre une carte", "faire le prochain ticket", "avancer sur le backlog", de synchroniser BACKLOG.md avec Trello, d'ajouter/déplacer/clôturer une carte, ou de chiffrer/prioriser les tâches du board.
---

# Board Trello ALTImates — Backlog

Board : https://trello.com/b/3qpIIJxH ("ALTImates — Backlog"). C'est la vue *travail au
quotidien* du backlog ; [`BACKLOG.md`](../../../BACKLOG.md) à la racine du repo reste la
**source de référence versionnée**. Les deux doivent rester synchronisés — voir
"Discipline de synchro" plus bas.

## Identifiants — ne jamais commiter

Clé et token Trello vivent dans `.claude/trello.local.json` (gitignored, voir `.gitignore` :
`.claude/*.local.json`). **Avant toute commande**, vérifie que ce fichier existe :

```bash
cat .claude/trello.local.json 2>/dev/null || echo "MANQUANT"
```

S'il est absent (nouvelle machine, nouveau collaborateur), demande à l'utilisateur de générer
une clé + un token :
1. Clé : https://trello.com/app-key (copier le champ **"Key"**, pas "Secret").
2. Token : ouvrir `https://trello.com/1/authorize?expiration=never&scope=read,write&response_type=token&name=ALTImates&key=<LA_CLE>`,
   autoriser, copier la valeur affichée (commence par `ATTA`).
3. Écrire `.claude/trello.local.json` avec `{key, token, boardShortLink, boardId}` — jamais
   dans un fichier suivi par git, jamais affiché tel quel dans une réponse ou un commit.

Dans chaque commande, charge les identifiants avec `jq` plutôt que de les recopier à la main :
```bash
KEY=$(jq -r '.key' .claude/trello.local.json)
TOKEN=$(jq -r '.token' .claude/trello.local.json)
BOARD=$(jq -r '.boardId' .claude/trello.local.json)
```

## ⚠️ Piège vécu : toujours `--data-urlencode`, jamais de query string à la main

En créant les cartes initiales, une fonction bash construisait l'URL en interpolant
`name=$2&desc=$3` directement dans la query string. Dès qu'un texte contenait un espace, un
accent ou une parenthèse, `curl` échouait immédiatement (`exit code 3`, URL malformée) **avant
même d'envoyer la requête** — et `jq -r` sur une entrée vide sortait en code 0 sans erreur
visible, donc l'échec passait inaperçu (13 cartes sur 14 "créées" silencieusement absentes).

**Règle** : pour tout `POST`/`PUT` avec du texte libre (nom de carte, description, commentaire),
utilise systématiquement `--data-urlencode` par champ, jamais une URL construite à la main :

```bash
curl -sS -X POST "https://api.trello.com/1/cards" \
  --data-urlencode "key=$KEY" \
  --data-urlencode "token=$TOKEN" \
  --data-urlencode "idList=$LIST_ID" \
  --data-urlencode "name=$NAME" \
  --data-urlencode "desc=$DESC"
```

Et vérifie toujours la sortie avec `jq -er` (le `-e` fait échouer jq si le champ attendu est
absent/null) plutôt que `jq -r` seul, pour ne jamais laisser un échec passer silencieusement.

## Structure du board

| Liste | ID | Rôle |
|---|---|---|
| 🔧 Config manuelle | `6a511ba092cfae285f268054` | Actions bloquantes qui nécessitent l'utilisateur (secrets, comptes tiers, console Firebase/Vercel) |
| 🐞 Bugs à corriger | `6a511ba092cfae285f268055` | Bugs signalés, à corriger |
| ⚡ Optimisations techniques | `6a511ba092cfae285f268056` | Dette technique, perf, sécurité — pas visible utilisateur |
| ✨ Améliorations / plus tard | `6a5137d233c4a3c2dbb0d5b3` | Nice-to-have, dépend souvent d'un prérequis externe (ex. nom de domaine) |
| ✅ Déjà fait | `6a5137d2368e8b0689574844` | Historique des livraisons, cartes marquées `dueComplete=true` |

Pas de liste "En cours" : ce board est un backlog catégorisé, pas un board de statut. Le suivi
d'avancement se fait par commentaire sur la carte + déplacement vers "Déjà fait" une fois livré
(voir workflow ci-dessous).

## Lire les cartes

```bash
# Toutes les listes + leurs cartes (vue d'ensemble)
curl -s "https://api.trello.com/1/boards/$BOARD/lists?key=$KEY&token=$TOKEN&cards=open&card_fields=name,desc,due,dueComplete&fields=id,name" \
  | jq -r '.[] | "## " + .name, (.cards[] | "- [" + .id + "] " + .name), ""'

# Une carte précise avec sa description + ses checklists
CARD_ID="..."
curl -s "https://api.trello.com/1/cards/$CARD_ID?key=$KEY&token=$TOKEN&checklists=all&fields=name,desc,due,dueComplete" | jq .
```

## Exécuter une tâche depuis une carte

1. **Lire la carte en entier** (description + checklist) avant de commencer — c'est le contexte
   complet de la tâche, écrit lors de la création du board.
2. **Travailler normalement** : c'est une tâche d'ingénierie comme une autre. Utilise
   `TaskCreate`/`TaskUpdate` pour le suivi interne de la session, écris le code, teste, vérifie
   (lint/unit/E2E/build selon ce que la carte touche).
3. **Ne jamais commit/push sans confirmation explicite** de l'utilisateur (règle générale du
   projet) — le fait de "prendre une carte" n'est pas une autorisation implicite de push.
4. **Progression visible sur Trello pendant le travail** — utile si la tâche est longue :
   ```bash
   curl -sS -X POST "https://api.trello.com/1/cards/$CARD_ID/actions/comments" \
     --data-urlencode "key=$KEY" --data-urlencode "token=$TOKEN" \
     --data-urlencode "text=🔧 En cours : <résumé court de ce qui est fait>"
   ```
5. **Cocher les items de checklist** au fur et à mesure (si la carte en a une) :
   ```bash
   # Lister les items pour récupérer leurs IDs
   curl -s "https://api.trello.com/1/cards/$CARD_ID/checklists?key=$KEY&token=$TOKEN" | jq -r '.[].checkItems[] | .id + " " + .name'
   # Cocher un item
   curl -sS -X PUT "https://api.trello.com/1/cards/$CARD_ID/checkItem/$ITEM_ID?key=$KEY&token=$TOKEN&state=complete"
   ```
6. **Une fois la tâche livrée** (mergée/déployée selon ce que l'utilisateur a validé) :
   ```bash
   # Déplacer vers "Déjà fait" + marquer complète
   DONE_LIST=$(jq -r '.doneListId // "6a5137d2368e8b0689574844"' .claude/trello.local.json 2>/dev/null || echo "6a5137d2368e8b0689574844")
   curl -sS -X PUT "https://api.trello.com/1/cards/$CARD_ID?key=$KEY&token=$TOKEN&idList=$DONE_LIST&dueComplete=true"
   ```
7. **Mettre à jour `BACKLOG.md`** en conséquence (déplacer l'item vers la section "✅ Déjà fait",
   avec la même granularité que ce qui existe déjà dans ce fichier). Voir "Discipline de synchro".

## Ajouter une nouvelle carte

Quand une idée/bug/tâche apparaît en cours de travail et que l'utilisateur veut la garder pour
plus tard (plutôt que de la traiter immédiatement) :

```bash
curl -sS -X POST "https://api.trello.com/1/cards" \
  --data-urlencode "key=$KEY" --data-urlencode "token=$TOKEN" \
  --data-urlencode "idList=$LIST_ID" \
  --data-urlencode "name=<titre court et actionnable>" \
  --data-urlencode "desc=<contexte : pourquoi, fichiers concernés, lien vers la conversation/PR si pertinent>"
```

Choisis la liste selon la nature (bug → 🐞, dette technique → ⚡, nice-to-have → ✨). Ajoute la
même entrée dans `BACKLOG.md` au même moment, pas seulement sur Trello (source de référence).

## Discipline de synchro Trello ↔ BACKLOG.md

- `BACKLOG.md` est **versionné** (revu en PR, historique git) → c'est la source de vérité en
  cas de divergence.
- Trello est la **vue de travail** (checklist interactive, déplacement visuel, commentaires de
  progression) → pratique au quotidien mais pas versionné.
- Toute tâche ajoutée/terminée/reformulée d'un côté doit être répercutée de l'autre **dans la
  même session** — ne laisse jamais les deux diverger silencieusement plus d'une conversation.
- Si l'utilisateur ne mentionne que Trello ("j'ai ajouté une carte X"), va la lire via l'API et
  répercute-la dans `BACKLOG.md` toi-même plutôt que d'attendre qu'il te la redécrive.

## Chiffrage / priorisation (futur)

L'utilisateur prévoit de demander une passe de **chiffrage et priorisation** des tickets
(pertinence, valeur produit, intérêt pour le projet). Pas encore implémenté — quand la demande
arrive :
- Évalue chaque carte ouverte (hors "Déjà fait") sur 2-3 axes explicites (ex. effort, valeur
  utilisateur, risque/urgence) plutôt qu'un score unique opaque — plus utile pour trancher.
- Restitue le résultat de façon lisible (tableau dans la réponse, et/ou en enrichissant chaque
  carte : commentaire de synthèse, ou un label Trello par niveau de priorité si l'utilisateur
  valide cette approche — les labels du board sont à créer, aucun n'existe pour l'instant).
- Ne réordonne pas les listes/positions des cartes sans validation : proposer d'abord un
  classement, laisser l'utilisateur confirmer avant de toucher au board.
