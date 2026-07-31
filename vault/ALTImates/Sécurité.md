---
title: Sécurité
type: note
tags: [altimates, technique, sécurité]
updated: 2026-07-31
---

# Sécurité

Un audit complet a été mené avant la mise en prod (juillet 2026). Les invariants ci-dessous sont
la sortie de cet audit : les casser, c'est ouvrir une faille. Le skill `security-check` rejoue
cette liste avant chaque merge vers `main` ou dès qu'un développement touche l'auth,
`firestore.rules` ou `api/`.

## 1. Invariants du modèle

- **Le contrôle d'accès réel est dans `firestore.rules`**, jamais côté client. La vérification dans
  `core/firebase/auth.ts` n'est que de l'UX. Du code client qui « protège » quelque chose sans
  règle Firestore correspondante = faille.
- **Admins codés en dur à dessein** (ancre anti-lockout : ils restent membres même si la whitelist
  dynamique est vide), dans **3 endroits à garder synchronisés** :
  `firestore.rules` (`isAdmin()`), `src/core/firebase/auth.ts` (`ADMIN_EMAILS`),
  `api/send-signin-link.ts` (`ADMIN_EMAILS`).
- **Whitelist dynamique** `config/allowedEmails` : écriture admin, **lecture membres uniquement**.
  Ne jamais rouvrir la lecture à `request.auth != null` — n'importe quel compte Google pourrait
  alors énumérer les e-mails des membres (c'est exactement le trou corrigé à l'audit pré-prod).
  Pas de dépendance circulaire : le `get()` de `isMember()` s'exécute côté serveur et ignore les
  règles de lecture ; un non-membre reçoit `permission-denied`, ce que le client interprète en
  « non autorisé ».
- **Nouvelle collection = ajout explicite** à la liste blanche des rules. Une collection absente
  est bloquée par défaut (bien) ; le risque est d'élargir le pattern pour la faire passer.
- **`rateLimits` ne doit JAMAIS entrer dans la liste blanche** : c'est une collection serveur
  (SDK Admin). Exposée, un client pourrait remettre ses propres compteurs à zéro.

## 2. Serverless (`api/`)

- Méthode HTTP restreinte, entrées validées, **réponse générique** (pas d'oracle membre/non-membre).
- Aucun secret en dur : uniquement `process.env` (`FIREBASE_SERVICE_ACCOUNT`, `BREVO_API_KEY`,
  `BREVO_SENDER_EMAIL`).
- Aucune donnée utilisateur non échappée dans du HTML (`escapeHtml()` dans `api/_email.ts`).
- Rate-limiting **toujours branché** sur `send-signin-link.ts` ; tout nouvel endpoint qui envoie
  un e-mail ou consomme un quota doit réutiliser `allowRequest()`.

## 3. XSS / injection côté client

- Seul `dangerouslySetInnerHTML` légitime : `src/components/TopoBackground.tsx` (SVG statique).
  Tout nouvel usage avec donnée dynamique = **critique**.
- **Toute URL saisie par un membre** (traces Komoot, futurs liens) doit passer par
  `safeExternalUrl()` (`src/core/services/url.ts`) — **à l'écriture ET au rendu** (défense en
  profondeur : des données historiques précèdent la validation). Un `.includes('komoot')` ne suffit
  pas : `javascript:alert(1)//komoot` passerait.
- Liens externes : `target="_blank"` toujours avec `rel="noopener"`. Pas d'`eval`, pas de `document.write`.

## 4. Bypass de login dev-only

`isDevAutoLoginEnabled` / `devAutoSignIn` dans `core/firebase/auth.ts` sont gatés par
`import.meta.env.DEV && VITE_USE_EMULATOR==='1' && VITE_DEV_AUTOLOGIN==='1'`.

`import.meta.env.DEV` est figé à `false` par Vite pour **tout** `vite build` (donc pour Vercel),
quelle que soit la config d'env : **c'est l'ancre** qui garantit que le bypass ne peut jamais
s'activer en prod, même par erreur de configuration. Ne jamais le faire dépendre uniquement d'une
variable d'env — une var mal placée dans Vercel serait alors le seul rempart.

Vérification après build : `grep -c "devAutoSignIn" dist/assets/*.js` doit renvoyer **0** partout
(le double-check aux call-sites permet l'élimination complète du code, pas juste son inaccessibilité).

Corollaire opérationnel : **jamais d'auto-login déployé**, même en staging. La vraie solution pour
un staging sans connexion est un projet Firebase isolé avec données seedées — voir [[Backlog et priorités]].

## 5. Headers HTTP (`vercel.json`)

`Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`,
`Permissions-Policy`, `Strict-Transport-Security`.

La CSP est une **liste blanche stricte** : toute nouvelle origine externe (API, CDN, font, image)
doit y être ajoutée explicitement dans la bonne directive. Jamais de `*`, jamais de `unsafe-inline`
dans `script-src`.

Origines autorisées aujourd'hui : Firebase (firestore / identitytoolkit / securetoken / googleapis),
open-meteo (`connect-src`), fonts.googleapis + gstatic, gstatic + google.com + lh3.googleusercontent
(`img-src`), firebaseapp.com + accounts.google.com (`frame-src`, popup/iframe auth).

> Symptôme typique d'un oubli CSP : **images cassées en déployé mais OK en local**
> (ex. `google.com/s2/favicons` redirige vers `tN.gstatic.com`). Voir [[Pièges connus]].

## 6. Secrets et dépendances

- `grep -rniE "(api[_-]?key|password|secret|token)\s*[:=]" src api` — seul hit légitime : la config
  Firebase publique dans `src/core/firebase/app.ts` (publique par design, la sécurité vient des rules).
- Aucun `.env*` avec secret commité (`.env.e2e` ne contient que `VITE_USE_EMULATOR=1`).
- `.claude/*.local.json` bien gitignoré (identifiants Trello locaux).
- `npm audit --omit=dev` : 0 critique/high. Moderate connues sur la chaîne firebase-admin
  (retry-request / teeny-request), à re-vérifier à chaque bump.

Voir aussi : [[Environnements et déploiement]] · [[Tests et CI]]
