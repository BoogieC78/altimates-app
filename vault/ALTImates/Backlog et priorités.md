---
title: Backlog et priorités
type: note
tags: [altimates, backlog, todo]
updated: 2026-07-31
---

# Backlog et priorités

Source de vérité versionnée : `BACKLOG.md` à la racine du repo.
Vue de travail : [board Trello « ALTImates — Backlog »](https://trello.com/b/3qpIIJxH).
Les deux doivent rester synchronisés — voir [[Process et outils]].

## 🔧 Bloqué par une action manuelle

### E-mail de connexion personnalisé (code en prod, secrets manquants)

Le code est déployé (`api/send-signin-link.ts` + `api/_email.ts`), avec **repli automatique** sur
le mail Firebase par défaut tant que ce n'est pas configuré. Envoi via l'**API Brevo** (SMTP Gmail
écarté : la 2FA a été refusée, donc pas d'App Password possible).

- [x] Adresse dédiée créée : `Contact.altimates@gmail.com`
- [ ] Créer le compte **Brevo** avec cette adresse
- [ ] Vérifier l'expéditeur dans Brevo (Settings → Senders, e-mail de confirmation à cliquer —
      pas de 2FA ni de domaine requis)
- [ ] Récupérer la **clé API** Brevo (Settings → SMTP & API → API Keys)
- [ ] Générer la **clé de compte de service Firebase** (Console → Paramètres → Comptes de service)
- [ ] Ajouter les 3 variables d'env Vercel (Production **et** Preview) puis **redéployer** :
      `FIREBASE_SERVICE_ACCOUNT`, `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`
- [ ] Test bout en bout : demander un lien depuis l'app → recevoir le mail ALTImates stylé

### Divers
- [ ] Renseigner le **Nom public** du projet Firebase = `ALTImates` (améliore les mails de repli et
      l'écran OAuth Google).

## 🐞 Bugs ouverts

- [ ] **Bugs Base Camp** — signalés (« il y a des bugs ») mais **jamais détaillés**.
      Prochaine étape : lister précisément les symptômes (captures) puis corriger, avec le test de
      régression écrit avant ou avec le fix.

## ⚡ Dette technique

- [ ] **Code-splitting `jspdf` + `html2canvas`** (~600 kB) : utiles uniquement pour l'export PDF du kit
      → `import()` dynamique à la demande. Le build affiche déjà l'avertissement « chunks > 500 kB ».
- [ ] **`isMemberEmail` retry** (`src/core/firebase/auth.ts`) : le retry sur échec de lecture de
      `config/allowedEmails` est un contournement — revoir s'il existe une meilleure approche.

## ✨ Améliorations / plus tard

- [ ] **Nom de domaine** (ex. `altimates.fr`, ~10 €/an) → délivrabilité e-mail « pro » (SPF/DKIM),
      arrivée en boîte principale, adresse d'envoi propre. **Prérequis de plusieurs autres items.**
- [ ] **Version riche du mail de connexion** : une fois le domaine pris, remplacer le bandeau texte
      par le design topographique complet (image hébergée). Aperçu de référence déjà conçu.
- [ ] **Staging isolé** : projet Firebase dédié avec données de test seedées + auto-login d'un compte
      de test **en preview uniquement**. C'est la vraie réponse au besoin « tester sans connexion »
      — l'auto-login déployé a été refusé explicitement (invariant de [[Sécurité]]).
- [ ] **Poids : compléter les fiches manquantes** du kit (articles encore `weightEstimated`).
- [ ] **Chiffrage / priorisation** de tous les tickets du board : évaluer chaque carte sur 2-3 axes
      explicites (effort, valeur utilisateur, risque/urgence) plutôt qu'un score unique opaque.
      Ne pas réordonner le board sans validation.

### Idées de la cordée (importées sur Trello le 2026-07-15)

- Filtrer les randos par dénivelé max — *Thomas* ▲3
- Électrolytes / minéraux — *Wacil*
- Ravito « qui ramène quoi » — *Wacil*
- Anciennes sorties → XP — *Wacil*
- Éditer une idée déjà soumise — *Wacil*
- Cost simulator type Tricount — *Nordine*
- Section photos — *Sofia* ▲5

## 🎯 Couverture de tests à renforcer

Voir [[Tests et CI]] pour la liste détaillée. Le meilleur premier ajout : les onglets
**Ravito / Hydra** du détail d'une rando (logique métier non triviale, zéro test E2E).

## 🗺️ Cap long terme

- **App mobile Expo** à 6-12 mois — c'est la raison de la règle « `src/core/` n'importe jamais React ».
- Bascule du domaine `altimates.vercel.app` (migration depuis l'app d'origine).
