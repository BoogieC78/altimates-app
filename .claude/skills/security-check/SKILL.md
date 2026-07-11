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
- **Whitelist dynamique** : `config/allowedEmails` — écriture admin uniquement, **lecture membres uniquement** (`allow read: if isMember()`). Ne jamais rouvrir la lecture à `request.auth != null` : ça permettrait à n'importe quel compte Google d'énumérer les e-mails membres (corrigé lors de l'audit pré-prod 2026-07). Pas de dépendance circulaire : le `get()` dans `isMember()` ignore les règles de lecture.
- **Nouvelle collection Firestore** = doit être ajoutée explicitement à la liste blanche des rules (`match /{collection}/{doc}` → `collection in [...]`). Une collection accessible sans figurer dans les rules = bloquée par défaut (bien), mais vérifier qu'on n'a pas élargi le pattern.
- **`rateLimits`** : collection serveur (SDK Admin uniquement) — ne JAMAIS l'ajouter à la liste blanche des rules, sinon un client peut réinitialiser ses compteurs.

## 2. Fonctions serverless (api/)

- Chaque endpoint : méthode HTTP restreinte, validation des entrées, **réponse générique** (pas d'énumération d'e-mails membres/non-membres).
- Aucun secret en dur — uniquement `process.env` (FIREBASE_SERVICE_ACCOUNT, GMAIL_USER, GMAIL_APP_PASSWORD).
- Pas de données utilisateur non échappées injectées dans du HTML (voir `escapeHtml` dans `api/_email.ts`).
- **Rate-limiting actif** sur `api/send-signin-link.ts` via `api/_ratelimit.ts` (3/15 min par e-mail, 10/h par IP, fenêtre fixe sur Firestore `rateLimits`). Vérifier : toujours branché, réponse 200 générique quand limité (pas d'oracle), fail-open (une panne Firestore ne casse pas le login). Tout NOUVEL endpoint qui envoie un e-mail ou consomme un quota doit réutiliser `allowRequest()`.

## 3. Secrets et config

- `grep -rniE "(api[_-]?key|password|secret|token)\s*[:=]" src api --include="*.ts" --include="*.tsx"` — seul hit légitime : la config Firebase publique dans `src/core/firebase/app.ts` (publique par design, sécurité = rules).
- Aucun fichier `.env*` avec secrets commité (`.env.e2e` OK : ne contient que `VITE_USE_EMULATOR=1`).
- `.claude/*.local.json` bien ignoré (identifiants locaux).

## 4. XSS / injection côté client

- `grep -rn "dangerouslySetInnerHTML\|innerHTML" src` — seul usage légitime : `src/components/TopoBackground.tsx` (SVG statique, aucune donnée utilisateur). Tout nouvel usage avec donnée dynamique = critique.
- Pas d'`eval`, pas de `document.write`.
- **URLs saisies par les membres** (traces Komoot, futurs liens) : toute URL stockée puis rendue dans un `href` DOIT passer par `safeExternalUrl()` (`src/core/services/url.ts`) — à l'écriture ET au rendu (défense en profondeur : des données historiques peuvent précéder la validation). `grep -rn 'href={' src` et vérifier que chaque href dynamique non construit en dur est sanitizé. Un `.includes('komoot')` ne suffit PAS (`javascript:alert(1)//komoot` passe).
- Liens externes : `target="_blank"` toujours avec `rel="noopener"`.

## 5. Dépendances

- `npm audit --omit=dev` — signaler critique/high. Moderate connues : chaîne firebase-admin (retry-request/teeny-request), à re-vérifier à chaque bump.

## 6. Headers HTTP (vercel.json)

- `vercel.json` doit exister et définir : `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`.
- La CSP est une liste blanche stricte : toute nouvelle origine externe (API, CDN, font, image) doit y être ajoutée EXPLICITEMENT dans la bonne directive — jamais élargir avec `*` ni ajouter `unsafe-inline` à `script-src`.
- Origines actuellement autorisées : Firebase (firestore/identitytoolkit/securetoken/googleapis), open-meteo (connect-src), fonts.googleapis/gstatic, gstatic + google.com + lh3.googleusercontent (img), firebaseapp.com + accounts.google.com (frame-src, popup/iframe auth).

## 7. Émulateurs / E2E

- Le branchement émulateur (`VITE_USE_EMULATOR === '1'`) ne doit jamais être actif dans un build prod (Vercel ne définit pas cette variable — vérifier qu'aucun changement de config ne l'introduit).

## Sortie attendue

Tableau récapitulatif : point vérifié → OK / violation (fichier:ligne, gravité, correctif proposé). Si tout OK, dire "aucune régression sécurité".
