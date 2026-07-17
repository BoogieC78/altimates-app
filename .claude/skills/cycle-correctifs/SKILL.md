---
name: cycle-correctifs
description: Boucle de traitement des retours de bugs/UI d'ALTImates — de la capture d'écran de Wacil jusqu'à la livraison en staging puis en prod. Utilise ce skill dès que l'utilisateur envoie une liste de bugs, une capture d'écran annotée, dit "à fixer", "corrige ce bug", "livre en preprod/staging", ou demande de passer des correctifs validés en production.
---

# Cycle de correctifs ALTImates

Boucle rodée (session 2026-07-15, release v0.3.1). Dérouler dans l'ordre pour CHAQUE lot de retours.

## 1. Cartes Trello d'abord

**Une carte par point relevé**, avant de coder (règle posée par Wacil). Skill `trello-kanban` :
liste 🐞 `6a511ba092cfae285f268055` pour les bugs, ✨ `6a5137d233c4a3c2dbb0d5b3` pour les
améliorations. Toujours `--data-urlencode`, vérifier avec `jq -er`. Ajouter cause + fichiers
dans la description dès qu'on les connaît.

## 2. Diagnostiquer puis corriger

Pièges UI déjà rencontrés (ne pas re-diagnostiquer de zéro) :
- **Popup tronquée / sous la nav** : `.modal-wrap` doit rester z-index 300 ; `.modal` en
  `max-height:85dvh` + safe-area. Le composant [Modal.tsx](../../../src/components/Modal.tsx)
  est rendu en **portal sur `<body>`** — ne jamais revenir en arrière : tout ancêtre avec
  `opacity` (ex. wrapper sorties passées, opacity .6 dans SommetsPage) délave la modale et
  piège son z-index.
- **Nav qui bouge** : `.app` en `min-height:100dvh` (pas `100%` — `#root` n'a pas de hauteur).
- **Éléments fixed** (barre Proposer) : contraindre à `max-width:480px;left:50%;transform:translateX(-50%)`
  et masquer sous modale via `body:has(.modal-wrap.open)`.
- **Images externes cassées en déployé mais OK en local** : penser CSP (`vercel.json`).
  `google.com/s2/favicons` redirige vers `tN.gstatic.com` → `img-src https://*.gstatic.com`.
- **Dates au format US / calendrier en anglais** : les navigateurs ignorent `lang` pour
  `<input type="date">` (format ET langue du picker natif — `showPicker()` n'y change rien).
  Utiliser [DateField.tsx](../../../src/components/DateField.tsx) (v0.3.4) : input texte
  masqué JJ/MM/AAAA + calendrier custom en français ; la valeur FormData est en JJ/MM/AAAA,
  convertir avec `frToIso()` au submit (rejette les dates inexistantes type 31/02).
- **Champ nombre positif** : `type=number` + `min=0` + `onKeyDown` ne suffisent PAS — le
  collage et la notation `-4454.7e2` passent. Pattern retenu (`digitsOnlyInput` dans
  AddRandoModal.tsx) : `type=text inputMode=numeric` + strip des non-chiffres à l'`onInput`,
  et garde `positive()` au submit.
- Votes rando : `VoteValue = 'oui' | 'peut' | 'non'` — boutons ✅ PARTANT / 🤔 PEUT-ÊTRE / 🇨🇳 PAS PARTANT.

## 3. Vérifier

```bash
npx tsc -b && npm run lint && npm test          # 109+ tests
export PATH="/Library/Java/JavaVirtualMachines/jdk-23.jdk/Contents/Home/bin:$PATH"
npm run test:e2e                                 # 28+ tests, émulateurs
```
Puis **vérif visuelle** en dev-bypass (`npm run emulators` + preview `altimates-dev-bypass`),
viewport mobile ET desktop large (plusieurs bugs n'apparaissent qu'en desktop).
Mettre à jour les tests impactés (unitaires + specs Playwright) dans le même commit.

## 4. Livrer en staging

Commit conventionnel + push `main`. **Depuis le 2026-07-17 les secrets GitHub sont configurés** :
la CI enchaîne ci+e2e → deploy-staging → smoke-staging automatiquement (plus besoin de la CLI
Vercel locale, qui reste un fallback — skill `environnements`). Si un job deploy/smoke est rouge
avec ci+e2e verts : souvent un transitoire GitHub/Vercel (503, "fetch failed", 403 artefact) —
vérifier le log réel puis `gh run rerun <id> --failed`. Ensuite, **commentaire sur chaque carte
Trello** : "🚀 Livré en staging (URL) le JJ/MM, commit abc1234 — en attente de validation".

Rappels staging : partage la base **prod** ; protégé SSO Vercel (302 anonyme = normal) ;
jamais d'auto-login déployé (invariant sécurité — refusé explicitement, voir carte 6W9BQWgd
pour la vraie solution staging isolé).

Piège UI supplémentaire (session 2026-07-17) : **membres "Anonyme"** — un login par lien e-mail
n'a pas de displayName ; le prénom vient de `NamePromptModal` (modal bloquante au premier login),
`useMemberName` traite 'Anonyme' comme absent, et `useAuth` persiste email/displayName dans
`users/{uid}`. Le header affiche le prénom complet (`.av-btn`), plus d'initiales.

## 5. Passer en prod (sur demande explicite de Wacil uniquement)

Dérouler le skill `mise-en-prod` (checklist complète). En résumé : tests verts, `npm audit`,
rules Firestore déployées si modifiées, bump `APP_VERSION` (AdminPage) + `npm version` + tag,
deploy CLI `--prod`, vérifier headers + console prod, smoke tests
(`SMOKE_BASE_URL=https://altimates-app.vercel.app npx playwright test --config playwright.smoke.config.ts`).
Puis : cartes Trello → liste ✅ Déjà fait (`6a5137d2368e8b0689574844`) + `dueComplete=true` +
commentaire "✅ Livré en PRODUCTION — release vX.Y.Z", et cocher les items dans BACKLOG.md.
