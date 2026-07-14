# Backlog ALTImates

Tâches reportées et pistes d'optimisation. Cochez au fur et à mesure.
Dernière mise à jour : 2026-07-10.

---

## 🔧 En attente d'une action manuelle (config / accès)

### E-mail de connexion personnalisé (fonction déjà codée, en attente des secrets)
Le code est en prod ([api/send-signin-link.ts](api/send-signin-link.ts) + [api/_email.ts](api/_email.ts)),
avec **repli automatique** sur le mail Firebase par défaut tant que ce n'est pas configuré.

Envoi via **API Brevo** (pas SMTP Gmail — 2FA refusée par Wacil, App Password Gmail impossible
sans elle). Adresse dédiée créée : `Contact.altimates@gmail.com`.

- [x] Créer une adresse e-mail dédiée à l'envoi — `Contact.altimates@gmail.com`.
- [ ] Créer un compte **Brevo** (https://www.brevo.com) avec cette adresse.
- [ ] Vérifier l'expéditeur dans Brevo (Settings → Senders, e-mail de confirmation à cliquer —
  pas de 2FA, pas de domaine requis).
- [ ] Récupérer la **clé API** Brevo (Settings → SMTP & API → API Keys → Generate a new API key).
- [ ] Générer la **clé de compte de service Firebase** (Console → Paramètres → Comptes de service → Générer une clé privée).
- [ ] Ajouter les **3 variables d'env Vercel** (Production + Preview) puis **redéployer** :
  - `FIREBASE_SERVICE_ACCOUNT` = le JSON complet de la clé de service
  - `BREVO_API_KEY` = la clé API Brevo
  - `BREVO_SENDER_EMAIL` = `Contact.altimates@gmail.com`
- [ ] Test de bout en bout : demander un lien depuis l'app → vérifier réception du **mail ALTImates stylé** en boîte de réception.

### Firebase / divers
- [ ] Renseigner le **Nom public** du projet Firebase = `ALTImates` (Console → Paramètres du projet → Nom public).
  Améliore les mails de repli et l'écran OAuth Google.

---

## 🐞 Bugs à corriger

- [ ] **Bugs Base Camp** — signalés (« il y a des bugs ») mais pas encore détaillés.
  → À faire : lister précisément les symptômes (captures) puis corriger.

---

## ⚡ Optimisations techniques

- [ ] **Code-splitting `jspdf` + `html2canvas`** (~600 kB) : ne sont utiles que pour l'export PDF du kit.
  Les charger en `import()` dynamique à la demande → bundle initial nettement allégé.
  (Le build affiche déjà l'avertissement « chunks > 500 kB ».)
- [ ] **`useMemberName` réactif** ([src/hooks/useMemberName.ts](src/hooks/useMemberName.ts)) : actuellement
  un `getDoc` unique → le prénom ne se met pas à jour après édition du profil. Passer en `onSnapshot`.
  Impacte aussi la section « Prochaine sortie » du Base Camp (clé de vote = `memberName` vs `profile.name`).
- [x] **Gate CI → déploiement Vercel** — fait (juillet 2026) : auto-deploy Vercel désactivé sur `main`,
  pipeline GitHub Actions ci+e2e → staging (https://altimates-app-staging.vercel.app, SSO Vercel) →
  smoke E2E → approbation manuelle (environnement GitHub `production`) → prod. Voir skill `mise-en-prod`.
- [x] **Rate-limiting** basique sur [api/send-signin-link.ts](api/send-signin-link.ts) (anti-abus d'envoi) —
  fait à l'audit pré-prod 2026-07 via [api/_ratelimit.ts](api/_ratelimit.ts) (3/15 min par e-mail, 10/h par IP).
- [x] **Revue de sécurité** sur le flux d'auth et la fonction serverless — audit complet pré-prod 2026-07 :
  lecture `config/allowedEmails` restreinte aux membres, `safeExternalUrl()` sur les URLs de traces,
  headers sécurité (CSP/HSTS) dans [vercel.json](vercel.json). Invariants documentés dans le skill `security-check`,
  checklist de déploiement dans le skill `mise-en-prod`.
- [ ] **`isMemberEmail` retry** ([src/core/firebase/auth.ts](src/core/firebase/auth.ts)) : le retry sur échec
  de lecture `config/allowedEmails` est un contournement — revoir si une meilleure approche existe.

---

## ✨ Améliorations / plus tard

- [ ] **Nom de domaine** (ex. `altimates.fr`, ~10 €/an) → délivrabilité e-mail « pro » (SPF/DKIM),
  arrivée en boîte principale garantie, et adresse d'envoi propre.
- [ ] **Version riche du mail de connexion** : une fois le domaine pris, remplacer le bandeau texte par le
  design topographique complet (image hébergée). Aperçu de référence déjà conçu (bandeau topo + ligne de crête).
- [ ] **Audit accessibilité / responsive** de l'app (contrastes, focus clavier, mobile).

---

## ✅ Déjà fait (contexte)

- Suite de tests **Playwright E2E** + intégration CI (login Google/e-mail, propositions, votes, admin, Base Camp…).
- **Whitelist dynamique** gérable depuis le portail Admin (`config/allowedEmails`) — règles Firestore déployées.
- **wacil78** ajouté comme **admin**.
- Écran **compte / Base Camp** via l'avatar (parité app d'origine).
- **Connexion par e-mail** (lien magique) : activée, en français, **sans pop-up** (adresse embarquée dans le lien).
- **Auto-déploiement GitHub → Vercel** connecté.
- Fonction d'envoi d'e-mail personnalisé **codée** (en attente des secrets ci-dessus).
