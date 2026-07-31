---
title: Pièges connus
type: note
tags: [altimates, technique, pièges, debug]
updated: 2026-07-31
---

# Pièges connus

Bugs et comportements déjà diagnostiqués. **Ne pas les re-chercher de zéro.**

## UI / CSS

- **Popup tronquée ou passant sous la nav** : `.modal-wrap` doit rester en `z-index: 300`,
  `.modal` en `max-height: 85dvh` + safe-area. `Modal.tsx` est rendu en **portal sur `<body>`** —
  ne jamais revenir en arrière : tout ancêtre avec `opacity` (ex. le wrapper des sorties passées,
  `opacity: .6` dans `SommetsPage`) délave la modale **et** piège son z-index.
- **Nav qui bouge** : `.app` en `min-height: 100dvh`, pas `100%` (`#root` n'a pas de hauteur).
- **Éléments `fixed`** (barre « Proposer ») : contraindre à
  `max-width: 480px; left: 50%; transform: translateX(-50%)` et masquer sous modale via
  `body:has(.modal-wrap.open)`.
- **Images externes cassées en déployé mais OK en local** → penser **CSP** (`vercel.json`).
  Cas vécu : `google.com/s2/favicons` redirige vers `tN.gstatic.com`, d'où
  `img-src https://*.gstatic.com`.

## Formulaires

- **Dates au format US / calendrier en anglais** : les navigateurs ignorent `lang` sur
  `<input type="date">` (format **et** langue du picker natif ; `showPicker()` n'y change rien).
  → utiliser `DateField.tsx` : input texte masqué `JJ/MM/AAAA` + calendrier custom français ;
  la valeur FormData est en `JJ/MM/AAAA`, convertir avec `frToIso()` au submit (rejette 31/02).
- **Champ nombre positif** : `type=number` + `min=0` + `onKeyDown` **ne suffit pas** — le collage
  et la notation `-4454.7e2` passent. Pattern retenu (`digitsOnlyInput` dans `AddRandoModal.tsx`) :
  strip des non-chiffres à l'`onInput` + garde `positive()` au submit.
  ⚠️ Contrepartie vécue : le passage à `type=text` en v0.3.4 a fait disparaître les spinners natifs
  (retour Adebola) → retour à `type=number` en v0.3.7 avec tous les garde-fous conservés.

## Identité / affichage des membres

- **Membres affichés « Anonyme »** : un login par lien e-mail n'a pas de `displayName`, et le
  fallback `'Anonyme'` était persisté par l'onboarding Kit. Fix : `NamePromptModal` (modale bloquante
  au premier login), `useMemberName` traite `'Anonyme'` comme absent, `useAuth` persiste
  email/displayName dans `users/{uid}`. Le header affiche le **prénom complet** (`.av-btn`),
  plus d'initiales.
- `useMemberName` est en `onSnapshot` (réactif) — ça impacte aussi la section « Prochaine sortie »
  du Base Camp, dont la clé de vote est `memberName` et non `profile.name`.

## Tests E2E (Playwright)

- **Modal prénom obligatoire** : tout login **par lien e-mail** affiche la modale bloquante avant
  l'app, et une modale ouverte **masque la barre Proposer**. Un test lien e-mail doit saisir le
  prénom (`getByPlaceholder('Ton prénom')` + Enter) avant d'asserter. Les logins Google émulateur
  ne sont pas concernés.
- **`resetEmulators()` vérifie les réponses HTTP** : un `fetch` DELETE ne rejette pas sur un statut
  d'erreur — avant ce durcissement, un reset silencieusement raté laissait fuiter l'état du test
  précédent (flake vécu : un profil 'Ousmane' survivant au `beforeEach`, visible seulement en suite
  complète). Si un test voit les données d'un autre, suspecter ça en premier.
- **« Local vert / CI rouge » peut être une vraie course applicative** : le fix Anonyme est passé
  3× en local puis a cassé en CI, l'assertion arrivant avant ou après l'apparition de la modale
  selon la latence du `onSnapshot`. Attendre explicitement le nouvel état plutôt que de compter
  sur le timing.
- **Bottom-sheets recouverts par la nav fixe** pendant l'animation → `.click()` timeout ou clic au
  mauvais endroit. Soumettre au clavier (`locator('input[name="x"]').press('Enter')`).
- **`getByRole('button', {name: 'Base Camp'})` matche aussi l'avatar** (aria-label « Mon Base Camp »)
  → `{ exact: true }` dès qu'un nom d'onglet est sous-texte d'un autre élément cliquable.
- **`window.confirm()` non géré** fait timeout : `page.once('dialog', d => d.accept())` **avant**
  de cliquer l'action (suppression, retrait whitelist, reset).
- **`preview` doit bind `127.0.0.1`** (`--host 127.0.0.1`), sinon Playwright ne joint pas le serveur
  sur macOS (`localhost` résout en `::1`).
- **Assertions agnostiques de l'état du profil** : l'uid est partagé entre tests (e-mail
  déterministe) → tester `/Ton niveau en rando \?|Indispensables/` plutôt que de présumer un état,
  sauf après un `configure()` explicite.
- **`displayName` non propagé par l'émulateur Auth** → `useMemberName` retombe sur « Anonyme ».
  Ne jamais asserter sur le prénom après un login émulateur brut.
- **Champ date = texte `JJ/MM/AAAA`** depuis v0.3.4 : `fill('20/09/2099')`, jamais l'ISO
  (la valeur serait tronquée par le masque et la date perdue au submit).
- **JDK ≥ 21 requis** pour l'émulateur Firestore.

## Ops

- **File de déploiements prod** : approuver plusieurs runs en attente redéploie dans l'ordre de fin
  des jobs → rollback silencieux. N'approuver que le run le plus récent. Détails dans
  [[Environnements et déploiement]].
- **Rules Firestore non déployées** après modif = protection fantôme.
- **APIs GitHub/Vercel instables** (503, « fetch failed », 403 artefact) : vérifier le log réel
  avant de chercher un bug applicatif.
- **Bouton GPX Komoot** : Komoot a supprimé la recherche texte par URL → construire l'URL discover
  géographique depuis lat/lon avec `toFixed(7)` (Komoot renvoie 404 sans décimale), repli Google
  sans coordonnées.

## Trello (API REST en curl)

- **Toujours `--data-urlencode` par champ**, jamais une query string construite à la main. Un texte
  avec espace/accent/parenthèse fait échouer `curl` (exit 3) **avant l'envoi**, et `jq -r` sur une
  entrée vide sort en code 0 → échec invisible. Vécu : 13 cartes sur 14 « créées » silencieusement
  absentes.
- Vérifier les sorties avec `jq -er` (le `-e` fait échouer jq si le champ est absent/null).
