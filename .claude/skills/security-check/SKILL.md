---
name: security-check
description: Check sécurité récurrent d'ALTImates — à lancer avant chaque merge vers main ou dès qu'un nouveau développement touche l'auth, les règles Firestore, ou les fonctions serverless (api/). Vérifie les invariants de sécurité du projet et détecte les régressions.
---

# Check sécurité ALTImates

Passer chaque point. Signaler toute violation avec fichier:ligne et gravité (critique/moyenne/mineure).

## 1. Invariants du modèle de sécurité (ne jamais casser)

- **Le contrôle d'accès réel est dans `firestore.rules`**, jamais côté client. Tout nouveau code client qui "protège" quelque chose sans règle Firestore correspondante = faille.
- **Admins codés en dur** dans 3 endroits qui doivent rester synchronisés :
  - `firestore.rules` (`isAdmin()`)
  - `src/core/firebase/auth.ts` (`ADMIN_EMAILS`)
  - `api/send-signin-link.ts` (`ADMIN_EMAILS`)
- **Whitelist dynamique** : `config/allowedEmails` — écriture admin uniquement dans les rules. Vérifier qu'aucune nouvelle règle ne l'ouvre.
- **Nouvelle collection Firestore** = doit être ajoutée explicitement à la liste blanche des rules (`match /{collection}/{doc}` → `collection in [...]`). Une collection accessible sans figurer dans les rules = bloquée par défaut (bien), mais vérifier qu'on n'a pas élargi le pattern.

## 2. Fonctions serverless (api/)

- Chaque endpoint : méthode HTTP restreinte, validation des entrées, **réponse générique** (pas d'énumération d'e-mails membres/non-membres).
- Aucun secret en dur — uniquement `process.env` (FIREBASE_SERVICE_ACCOUNT, GMAIL_USER, GMAIL_APP_PASSWORD).
- Pas de données utilisateur non échappées injectées dans du HTML (voir `escapeHtml` dans `api/_email.ts`).
- Rate-limiting : point ouvert connu sur `api/send-signin-link.ts` (BACKLOG). Vérifier statut.

## 3. Secrets et config

- `grep -rniE "(api[_-]?key|password|secret|token)\s*[:=]" src api --include="*.ts" --include="*.tsx"` — seul hit légitime : la config Firebase publique dans `src/core/firebase/app.ts` (publique par design, sécurité = rules).
- Aucun fichier `.env*` avec secrets commité (`.env.e2e` OK : ne contient que `VITE_USE_EMULATOR=1`).
- `.claude/*.local.json` bien ignoré (identifiants locaux).

## 4. XSS / injection côté client

- `grep -rn "dangerouslySetInnerHTML\|innerHTML" src` — seul usage légitime : `src/components/TopoBackground.tsx` (SVG statique, aucune donnée utilisateur). Tout nouvel usage avec donnée dynamique = critique.
- Pas d'`eval`, pas de `document.write`.

## 5. Dépendances

- `npm audit --omit=dev` — signaler critique/high. Moderate connues : chaîne firebase-admin (retry-request/teeny-request), à re-vérifier à chaque bump.

## 6. Émulateurs / E2E

- Le branchement émulateur (`VITE_USE_EMULATOR === '1'`) ne doit jamais être actif dans un build prod (Vercel ne définit pas cette variable — vérifier qu'aucun changement de config ne l'introduit).

## Sortie attendue

Tableau récapitulatif : point vérifié → OK / violation (fichier:ligne, gravité, correctif proposé). Si tout OK, dire "aucune régression sécurité".
