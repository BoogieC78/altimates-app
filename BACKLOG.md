# Backlog ALTImates

Tâches reportées et pistes d'optimisation. Cochez au fur et à mesure.
Dernière mise à jour : 2026-07-10.

---

## 🔧 En attente d'une action manuelle (config / accès)

### E-mail de connexion personnalisé (fonction déjà codée, en attente des secrets)
Le code est en prod ([api/send-signin-link.ts](api/send-signin-link.ts) + [api/_email.ts](api/_email.ts)),
avec **repli automatique** sur le mail Firebase par défaut tant que ce n'est pas configuré.

- [ ] **Créer une adresse e-mail dédiée** à l'envoi (ex. `cordee.altimates@gmail.com`) — ne pas utiliser d'adresse perso.
- [ ] Activer la **validation en 2 étapes** sur ce compte Google.
- [ ] Générer un **mot de passe d'application** Gmail (https://myaccount.google.com/apppasswords).
- [ ] Générer la **clé de compte de service Firebase** (Console → Paramètres → Comptes de service → Générer une clé privée).
- [ ] Ajouter les **3 variables d'env Vercel** (Production + Preview) puis **redéployer** :
  - `FIREBASE_SERVICE_ACCOUNT` = le JSON complet de la clé de service
  - `GMAIL_USER` = l'adresse dédiée
  - `GMAIL_APP_PASSWORD` = les 16 caractères
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
- [ ] **Gate CI → déploiement Vercel** : aujourd'hui Vercel déploie à chaque push **même si la CI échoue**.
  Configurer Vercel pour attendre les checks GitHub (ou required status checks) avant de promouvoir en prod.
- [ ] **Rate-limiting** basique sur [api/send-signin-link.ts](api/send-signin-link.ts) (anti-abus d'envoi).
- [ ] **Revue de sécurité** (`/security-review`) sur le flux d'auth (email-link, whitelist dynamique)
  et la fonction serverless (gestion de la clé de service, endpoint public).
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
