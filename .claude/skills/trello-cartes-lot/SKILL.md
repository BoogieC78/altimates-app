---
name: trello-cartes-lot
description: Crée plusieurs cartes d'un coup sur le board Trello ALTImates (https://trello.com/b/3qpIIJxH), une carte par tâche/proposition, avec une description autoportante (contexte, objectif, périmètre, critères d'acceptation) et synchro immédiate dans BACKLOG.md. Utilise ce skill dès que l'utilisateur dit "ajoute ça au backlog Trello", "crée des cartes pour ces propositions", "une carte par idée", "mets tout ça dans le board", ou en fin de brainstorming quand plusieurs propositions ont été retenues. Pour une seule carte simple ou pour lire/déplacer des cartes, utiliser plutôt le skill trello-kanban.
---

# Trello — création de cartes en lot

Crée des cartes sur le board **ALTImates — Backlog**, une par tâche, **en bas de la liste
choisie**, dans l'ordre décidé.

Prérequis techniques (identifiants, `--data-urlencode`, IDs des listes) : voir
[`trello-kanban`](../trello-kanban/SKILL.md). Ce skill ne réexplique pas l'authentification,
il s'appuie dessus.

## Règles d'or

- **Une tâche = une carte.** Cinq propositions retenues donnent cinq cartes, pas une carte à
  cinq puces. Une carte fourre-tout n'est ni priorisable ni dépilable.
- **En bas de liste** (`pos=bottom`). Les listes sont des files ordonnées ; insérer en haut
  réordonnerait une priorité déjà posée.
- **Création séquentielle**, une carte après l'autre, pour garantir l'ordre.
- **Aucune carte existante n'est touchée.** Ce skill n'écrit que des créations.
- **Le contexte vient de la session et du dépôt**, jamais de l'imagination. Un fichier, un
  choix technique, une contrainte cités dans la description doivent avoir été dits par
  l'utilisateur ou vérifiés dans le code.
- **BACKLOG.md est mis à jour dans la même session** — c'est la source de vérité versionnée
  (voir "Discipline de synchro" dans `trello-kanban`).

## Étape 1 — Choisir la liste de chaque carte

Le board n'a pas de colonne "BACKLOG" unique : il est **catégorisé**. Chaque carte va dans la
liste qui correspond à sa nature.

| Nature | Liste | ID |
|---|---|---|
| Action bloquante côté utilisateur (secret, console Firebase/Vercel, compte tiers) | 🔧 Config manuelle | `6a511ba092cfae285f268054` |
| Bug constaté | 🐞 Bugs à corriger | `6a511ba092cfae285f268055` |
| Dette technique, perf, sécurité, tests — invisible utilisateur | ⚡ Optimisations techniques | `6a511ba092cfae285f268056` |
| Nice-to-have, fonctionnalité future, dépend d'un prérequis externe | ✨ Améliorations / plus tard | `6a5137d233c4a3c2dbb0d5b3` |

Ne jamais créer dans ✅ Déjà fait. Si la nature d'une carte est ambiguë (ex. « refonte du kit »
= amélioration ou dette technique ?), proposer la liste et laisser l'utilisateur trancher
plutôt que de deviner.

## Étape 2 — Découper

- **Demande explicite** ("crée une carte pour X") : une carte, telle que décrite.
- **Fin de brainstorming** ("les 5 propositions retenues") : une carte par proposition, avec le
  découpage validé par l'utilisateur — ne pas fusionner deux propositions parce qu'elles se
  ressemblent, ne pas en scinder une parce qu'elle paraît grosse.
- **Rien d'identifiable** : s'arrêter et demander. Ne pas inventer de tâches.

Si une tâche est trop floue pour produire une description autoportante (objectif inconnu,
périmètre non tranché), **poser la question avant de créer** : une carte creuse sera relue puis
abandonnée.

## Étape 3 — Rédiger

### Titre

Quelques mots-clés, groupe nominal ou impératif, lisible dans la largeur d'une colonne Trello.

- Bon : `Rate limit sur /api/invite`, `Migrer les toasts vers le portail modal`, `Tests E2E du kit`.
- Mauvais : `Amélioration` (creux) ; `Il faudrait voir si le kit ne pourrait pas être retrié
  après réinitialisation` (c'est la description).

### Description

Garder les sections qui portent une information réelle, **supprimer les vides** plutôt que
d'écrire « N/A » :

```markdown
## Contexte
Le problème observé, la décision prise, ce qui a déclenché la demande.

## Objectif
Ce qui doit être vrai quand la tâche est finie.

## Périmètre
Ce qui est inclus, et — si la limite a été discutée — ce qui est hors périmètre.

## Pistes techniques
Fichiers et modules concernés (chemins réels, vérifiés dans le dépôt).
Approche retenue, alternatives écartées avec leur raison.

## Contraintes
Conventions du projet (voir CLAUDE.md), invariants de sécurité, compatibilité mobile,
ce qui ne doit pas casser.

## Critères d'acceptation
- [ ] Vérifiable, pas « ça marche »
```

Points de rédaction :

- **Autoportante.** Aucun « comme on vient de le dire », « la discussion ci-dessus ». Le lecteur
  n'a pas la session.
- **Chemins réels.** `src/core/constants/gear.ts`, pas « le fichier du kit ». Vérifier le chemin
  avant de l'écrire : un chemin faux envoie le futur exécutant au mauvais endroit avec assurance.
- **Décisions déjà prises = actées**, pas rouvertes comme des options.
- **Incertitudes explicites**, dans une ligne dédiée, jamais déguisées en instruction.
- **Limite dure : 2048 caractères** (`desc` de l'API Trello) — au-delà l'appel échoue. Si ça ne
  tient pas : couper dans les pistes techniques et les alternatives, garder Contexte / Objectif /
  Critères. Si ça déborde encore, la tâche vaut deux cartes : proposer le découpage.

## Étape 4 — Créer

Une carte à la fois, dans l'ordre, en attendant chaque retour :

```bash
KEY=$(jq -r '.key' .claude/trello.local.json)
TOKEN=$(jq -r '.token' .claude/trello.local.json)

curl -sS -X POST "https://api.trello.com/1/cards" \
  --data-urlencode "key=$KEY" \
  --data-urlencode "token=$TOKEN" \
  --data-urlencode "idList=$LIST_ID" \
  --data-urlencode "pos=bottom" \
  --data-urlencode "name=$NAME" \
  --data-urlencode "desc=$DESC" \
  | jq -er '.shortUrl'
```

`--data-urlencode` par champ est obligatoire (accents, espaces, parenthèses cassent une query
string construite à la main) et `jq -er` fait échouer bruyamment si la carte n'a pas été créée —
piège vécu documenté dans `trello-kanban`.

Échec d'une création (desc trop longue, réseau, permissions) : ne pas réessayer en boucle, ne
pas tronquer la description en silence. Continuer avec les suivantes, reporter l'échec ; les
cartes déjà créées restent en place.

Pas de label, pas de membre, pas de date d'échéance sauf demande explicite.

## Étape 5 — Synchroniser BACKLOG.md

Ajouter les mêmes entrées dans `BACKLOG.md`, dans la section correspondant à la liste Trello, à
la granularité déjà en place dans le fichier. Une carte créée sans entrée BACKLOG.md est une
divergence — ne jamais terminer sans cette étape.

## Rapport final

| # | Carte | Liste | URL |
|---|---|---|---|
| 1 | Rate limit sur /api/invite | ⚡ Optimisations | https://trello.com/c/... |

Puis, seulement s'il y a lieu : cartes non créées avec la raison, questions restées ouvertes,
confirmation que `BACKLOG.md` a été mis à jour.
