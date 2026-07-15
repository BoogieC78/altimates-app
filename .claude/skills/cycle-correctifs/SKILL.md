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
- **Dates au format US** : les navigateurs ignorent `lang` pour `<input type="date">`.
  Utiliser [DateField.tsx](../../../src/components/DateField.tsx) (affichage JJ/MM/AAAA, valeur ISO).
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

Commit conventionnel + push `main`. La CI ci+e2e tourne mais **deploy-staging échoue tant que
les secrets GitHub manquent** (carte cgDN7iPJ) → déployer via CLI Vercel locale : procédure
exacte dans le skill `environnements` (§ CLI Vercel). Ensuite, **commentaire sur chaque carte
Trello** : "🚀 Livré en staging (URL) le JJ/MM, commit abc1234 — en attente de validation".

Rappels staging : partage la base **prod** ; protégé SSO Vercel (302 anonyme = normal) ;
jamais d'auto-login déployé (invariant sécurité — refusé explicitement, voir carte 6W9BQWgd
pour la vraie solution staging isolé).

## 5. Passer en prod (sur demande explicite de Wacil uniquement)

Dérouler le skill `mise-en-prod` (checklist complète). En résumé : tests verts, `npm audit`,
rules Firestore déployées si modifiées, bump `APP_VERSION` (AdminPage) + `npm version` + tag,
deploy CLI `--prod`, vérifier headers + console prod, smoke tests
(`SMOKE_BASE_URL=https://altimates-app.vercel.app npx playwright test --config playwright.smoke.config.ts`).
Puis : cartes Trello → liste ✅ Déjà fait (`6a5137d2368e8b0689574844`) + `dueComplete=true` +
commentaire "✅ Livré en PRODUCTION — release vX.Y.Z", et cocher les items dans BACKLOG.md.
