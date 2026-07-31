---
title: Historique des releases
type: note
tags: [altimates, historique, releases]
updated: 2026-07-31
---

# Historique des releases

Version affichée dans `APP_VERSION` (`src/features/admin/AdminPage.tsx`).

## v0.3.9 — 2026-07-30 (prod)

Grosse release : le contenu de trois chantiers d'un coup.

- **Kit — poids du sac estimé** : fourchette `weight` par article, total recalculé dynamiquement
  comme le budget, repris dans le PDF et l'e-mail du kit. Drapeau `worn` pour distinguer le porté
  sur soi du porté dans le sac.
- **Kit — références produit réelles** : chaque article porte une référence Decathlon nommée et son
  lien ; poids repris de la fiche technique quand elle a pu être trouvée, sinon `weightEstimated`.
- **Kit — triage express du starter pack** (variante A validée le 30/07), boutons « Tout retrier » /
  « Réinitialiser mon kit », une réponse obligatoire par carte, % complet et « à acheter » excluant
  les articles skip/réfléchir.
- **Onglet Fenêtre** en production (livré en staging le 2026-07-15).
- **Audits accessibilité + responsive** en production (menés le 2026-07-19).
- **CI — un seul déploiement prod en attente à la fois** (`concurrency` + purge de 8 runs périmés).
- Reclassements kit (cuillère pliable, oreiller gonflable en Indispensables trek).

## v0.3.8

- **Modifier profil** : champ « Nom » renommé en « **Prénom** » dans le modal Base Camp ; les
  5 champs de stats (Km saison, D+ saison, Sorties, Best km, Best D+) laissaient passer des
  caractères non numériques (`--71`) → saisie filtrée aux chiffres.
- **Fenêtre — refonte UX du bloc « Mon statut »** : les 4 boutons pilules (DISPO / RETOUR DIM. /
  +1 JOUR / INDISPO) n'expliquaient ni leur sens ni la visibilité → cartes empilées
  (icône + titre + explication courte) + rappel « Visible par la cordée sur le calendrier, à ton nom ».
  Maquette validée (option B sur 3 propositions).

## v0.3.7

- **Flèches Distance/Dénivelé restaurées** : le durcissement v0.3.4 (`type=text`) avait supprimé les
  spinners natifs (retour Adebola) → retour à `type=number` (min=1, step=1) avec tous les garde-fous
  conservés (blocage clavier `e . - + ,`, nettoyage au collage, entier positif au submit).

## v0.3.6

- **« Modifier mon profil » mis en avant** : le bouton était noyé en bas du Base Camp → bouton
  primaire pleine largeur (ink/gold, icône crayon) sous les Personal Bests, Déconnexion /
  Réinitialiser côte à côte en dessous.

## v0.3.5

- **Checklist départ clarifiée** : la checkbox nue se confondait avec la prise en charge
  (retour Adebola) → chip explicite « À préparer / ✓ Prêt », ligne d'état combinée
  (« Wacil s'en occupe · pas encore prêt »), et « Me retirer » remet aussi l'article à préparer.
  Première spec E2E Cordée (3 cas).

## v0.3.4

- **Proposer une rando — date et saisies durcies** : calendrier custom en français (le picker natif
  suit la langue du navigateur, `lang` ignoré), masque `JJ/MM/AAAA` au clavier (`frToIso()` au submit,
  31/02 rejeté), distance/dénivelé limités aux entiers positifs y compris au collage.
- ⚠️ Épisode du **rollback silencieux** : v0.3.4 a écrasé v0.3.5 en prod à cause de la file de runs
  en attente approuvés en masse (voir [[Environnements et déploiement]]).

## v0.3.3 — 2026-07-17

- **Fix « Anonyme »** : modal prénom obligatoire au premier login, `'Anonyme'` traité comme absent,
  email/displayName persistés dans `users/{uid}`.
- **Header** : prénom complet en pastille au lieu de l'avatar « AN » incompréhensible (retour Adebola).
- **Pipeline complet vérifié de bout en bout** : secrets GitHub configurés, deploy-staging +
  smoke-staging + deploy-production verts.

## v0.3.2

- **Bouton GPX Komoot réparé** : Komoot a supprimé la recherche texte par URL → URL discover
  géographique depuis lat/lon (`toFixed(7)`), repli Google sans coordonnées.

## v0.3.1 — 2026-07-15

Premier gros lot de correctifs après retours utilisateurs :

- Popups tronquées (kit, détail trek, hydratation) — z-index, `dvh`, portal.
- Popup rando délavée sur les sorties passées + barre « Proposer » par-dessus.
- Barre de navigation instable.
- Logos marchands absents en déployé (CSP `img-src *.gstatic.com`).
- Dates au format JJ/MM/AAAA (composant `DateField`).
- Votes rando ✅ Partant / 🤔 Peut-être / ❌ Pas partant.
- Vue Kanban des Idées supprimée (remplacée par le board Trello).
- Admin : modifier/supprimer n'importe quelle rando.

## Socle (avant v0.3.1)

- Auth Google + whitelist, tabs, listeners Firestore temps réel.
- **Connexion par lien e-mail** en français, sans pop-up (adresse embarquée dans le lien).
- **Whitelist dynamique** gérable depuis le portail Admin (`config/allowedEmails`).
- Écran compte / **Base Camp** via l'avatar (parité avec l'app d'origine).
- Suite **Playwright E2E** + intégration CI.
- Auto-déploiement GitHub → Vercel, puis remplacé par le pipeline à gate humaine (juillet 2026).
- Fonction d'envoi d'e-mail personnalisé codée (pivot Gmail SMTP → **API Brevo**, commit `42c02b0`).
