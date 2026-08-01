---
name: trello-carte-en-plan
description: Transforme des cartes brèves du board Trello ALTImates (https://trello.com/b/3qpIIJxH) en plans d'intégration exécutables — un sous-agent par carte analyse le dépôt réel, puis la description de la carte est remplacée par un plan autoportant (objectif, état actuel, étapes fichier par fichier, impacts, vérification). Utilise ce skill quand l'utilisateur dit "convertis les cartes Trello en plans", "enrichis les descriptions des cartes", "fais un plan d'intégration pour ces tickets", "prépare ces cartes pour exécution", "trello convert to plan".
---

# Trello — carte en plan d'intégration

Une carte contient souvent deux lignes d'intention. Ce skill lit cette intention, **analyse le
dépôt réel**, et réécrit la description en un plan qu'une session Claude fraîche peut exécuter
sans poser de question.

Identifiants et règles curl : voir [`trello-kanban`](../trello-kanban/SKILL.md).

## Règles d'or

- **L'utilisateur choisit.** Aucune carte convertie sans avoir été désignée à l'étape 2. Pas de
  « je convertis tout le backlog puisque c'est le but ».
- **La description est écrasée** — opération destructive sur du contenu écrit par l'utilisateur.
  Les descriptions d'origine sont **sauvegardées sur disque avant toute écriture** (étape 4),
  sans exception.
- **Un plan est ancré dans le dépôt réel.** Chemins, modules, commandes de test : vérifiés dans
  le code. Un plan qui invente `src/features/kit/KitPage.tsx` est pire qu'une description brève,
  car il envoie l'exécutant au mauvais endroit avec assurance.
- **Un sous-agent par carte, en parallèle** (`subagent_type: "general-purpose"`), tous lancés
  dans le même message. Les cartes sont indépendantes, chaque analyse est en lecture seule.
- **Les sous-agents ne touchent ni au dépôt ni à Trello.** Ils lisent et renvoient du texte. Les
  écritures Trello sont faites par le fil principal, après contrôle.
- **Seule la description change.** Ni titre, ni liste, ni label, ni position.

## Étape 1 — Lister les cartes

Listes candidates : 🔧 Config manuelle, 🐞 Bugs à corriger, ⚡ Optimisations techniques,
✨ Améliorations / plus tard. Jamais ✅ Déjà fait.

Si l'utilisateur a nommé une liste, s'y limiter. Sinon, lister les quatre.

```bash
KEY=$(jq -r '.key' .claude/trello.local.json)
TOKEN=$(jq -r '.token' .claude/trello.local.json)
BOARD=$(jq -r '.boardId' .claude/trello.local.json)

curl -s "https://api.trello.com/1/boards/$BOARD/lists?key=$KEY&token=$TOKEN&cards=open&card_fields=name,desc,shortUrl&fields=id,name" \
  | jq -r '.[] | .name as $l | .cards[] | [$l, .id, .name] | @tsv'
```

Affecter les identifiants `A`, `B`, `C`, ... dans l'ordre des listes puis des cartes. Une ligne
par carte :

```
A | ⚡ Optimisations | Rate limit sur /api/invite
B | ⚡ Optimisations | Tests E2E du kit
C | ✨ Améliorations | Export GPX des itinéraires   (déjà un plan)
```

Suffixer `(déjà un plan)` les cartes dont la description a manifestement déjà cette structure —
information, pas refus : l'utilisateur peut vouloir la régénérer.

Puis demander quelles cartes convertir et **attendre la réponse**. Aucun sous-agent avant.
Aucune carte ouverte : le dire et s'arrêter.

## Étape 2 — Sélection

Accepter `A`, `A C E`, `A,C,E`, `A-D`, `tout` / `all`, ou un nom de liste (« les optimisations »).

- Identifiant inconnu : ne rien convertir, réafficher la liste, redemander. Ne jamais « corriger »
  vers l'identifiant voisin.
- Carte à description vide : la garder si l'utilisateur l'a choisie, mais l'annoncer — le plan
  reposera sur le seul titre, donc sera pauvre. Proposer qu'il écrive deux lignes d'intention.

## Étape 3 — Analyse en parallèle

Un sous-agent par carte sélectionnée, tous dans le même message. Au-delà de 8 cartes, procéder
par vagues de 8 et le dire. Un sous-agent mort ou vide : sa carte est reportée en échec, les
autres continuent.

Prompt de chaque sous-agent :

```
Tu produis un PLAN D'INTÉGRATION pour une tâche de développement, à partir de
l'analyse réelle du dépôt situé dans /Users/wacil/Desktop/altimates-app.

Carte Trello "<titre>" (<url>), liste <liste>.

Intention exprimée par l'utilisateur (description actuelle, mot pour mot) :
---
<description actuelle, ou "(vide — appuie-toi sur le titre)">
---

Ton travail :
1. Lire le CLAUDE.md du dépôt et les conventions qu'il impose.
2. Analyser le code réellement concerné : composants, hooks, règles Firestore,
   fonctions api/, tests unitaires et E2E, constantes. Ouvre les fichiers, ne devine pas.
3. Écrire le plan selon le gabarit ci-dessous.

Interdits : modifier un fichier, git add/commit/push, écrire dans Trello, lancer un
build ou une commande qui modifie le dépôt. Tu es en LECTURE SEULE.

Contraintes de sortie :
- Markdown, 2000 caractères MAXIMUM (limite dure de l'API Trello). Compte-les.
- Autoportant : aucune référence à cette conversation ni à "la description d'origine".
- Chemins de fichiers réels et vérifiés. Si tu n'as pas trouvé le fichier, écris ce
  que tu as cherché plutôt qu'un chemin plausible.
- Décisions déjà tranchées par l'utilisateur : reprises comme actées, pas rouvertes.
- Ce qui reste ouvert : nommé dans "Points à trancher".

Ta réponse finale est le plan seul, sans préambule ni commentaire.
```

Gabarit à joindre (sections vides supprimées, pas remplies de « N/A ») :

```markdown
## Objectif
Ce qui doit être vrai quand la tâche est finie.

## État actuel
Ce que fait le code aujourd'hui, avec les chemins concernés.

## Plan d'intégration
1. `chemin/du/fichier.ts` — ce qui change, et pourquoi.
2. ...

## Impacts
Règles Firestore, routes api/, tests E2E, i18n, responsive mobile, accessibilité.

## Vérification
Commandes réelles du dépôt (lint, tests unitaires, Playwright, build).

## Points à trancher
Ce qui reste ouvert, s'il y a lieu.
```

## Étape 4 — Sauvegarde des descriptions d'origine

**Avant toute écriture Trello**, écrire les descriptions actuelles dans
`.claude/trello-backup-<horodatage>.md`, une section par carte (identifiant, titre, URL, ID,
description brute).

- Ce motif est ignoré par git (`.gitignore` : `.claude/trello-backup-*.md`). Garder exactement ce
  préfixe de nom, sinon la sauvegarde se retrouve dans le working tree et part au commit suivant.
- Échec d'écriture de la sauvegarde : **s'arrêter avant d'écrire dans Trello**. Sans filet, un
  écrasement de description est une perte sèche.

## Étape 5 — Écriture des cartes

Pour chaque plan retenu :

```bash
curl -sS -X PUT "https://api.trello.com/1/cards/$CARD_ID" \
  --data-urlencode "key=$KEY" --data-urlencode "token=$TOKEN" \
  --data-urlencode "desc=$PLAN" | jq -er '.id'
```

Ne passer ni `name`, ni `idList`, ni `due`.

Contrôles avant chaque appel :

- **Plan > 2048 caractères** : l'appel échouerait. Faire retailler par un sous-agent (cible 1800,
  sacrifier dans l'ordre : Points à trancher, Impacts, État actuel). Ne jamais tronquer au
  caractère — un plan coupé au milieu d'une étape se lit comme un plan complet.
- **Chemins inventés** : si le plan cite un fichier absent du dépôt, ne pas écrire la carte.
  Reporter en échec avec le chemin fautif.
- **Plan générique** (aucun chemin réel, aucune commande du projet) : ne pas écrire, reporter en
  échec. Une description brève vaut mieux qu'un faux plan.

Échec sur une carte : passer à la suivante, les cartes déjà écrites restent en place.

## Rapport final

| Id | Carte | Liste | Résultat |
|---|---|---|---|
| A | Rate limit sur /api/invite | ⚡ Optimisations | plan écrit (1 640 car.) |
| C | Export GPX | ✨ Améliorations | échec — chemin inexistant cité |

Puis, s'il y a lieu : chemin du fichier de sauvegarde, cartes non converties avec la raison, et
les « Points à trancher » qui attendent une décision.

`BACKLOG.md` n'a pas à être touché ici : seul le détail d'exécution change, pas la liste des
tâches.
