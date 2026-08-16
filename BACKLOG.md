# Backlog ALTImates

> **Miroir du board Trello.** La source de vérité est le board
> [ALTImates — Backlog](https://trello.com/b/3qpIIJxH) : ce fichier en est le reflet versionné,
> régénéré depuis l'API à chaque synchro. En cas de divergence, **c'est Trello qui fait foi** —
> corriger la carte, puis régénérer ce fichier. Ne jamais résoudre un écart en éditant ce
> markdown à la main : la prochaine régénération l'écraserait. Voir le skill `trello-kanban`.
>
> Chaque entrée porte le lien de sa carte, pour retrouver commentaires et historique.

Dernière synchro : 2026-08-16.

---

## 🔧 Config manuelle (7)

### [E-mail de connexion personnalisé — secrets à configurer (Brevo)](https://trello.com/c/mKsewYrP)

Pivot Gmail SMTP -> API Brevo (2FA refusée sur Contact.altimates@gmail.com, App Password Gmail impossible sans elle). Code déjà en prod (api/send-signin-link.ts, api/_email.ts), repli auto sur mail Firebase tant que non configuré. Voir BACKLOG.md section config manuelle.

### [Staging : supprimer le SSO Vercel (tester sans se reconnecter)](https://trello.com/c/6KA850Mg)

**Objectif** : ne plus avoir à se connecter à Vercel à chaque test sur https://altimates-app-staging.vercel.app

**Pourquoi pas d'auto-login dev sur staging** : le staging utilise la base Firebase de PROD (mêmes données). L'auto-login déployé = accès admin public aux vraies données. Interdit par les invariants sécurité du projet.

**La bonne solution (2 clics)** : désactiver la protection Vercel sur les previews.
1. https://vercel.com/altimates/altimates-app/settings/deployment-protection
2. Vercel Authentication → passer de « Standard Protection » à « Only Production » (ou « Disabled »)
3. Sauvegarder

**Résultat** : staging accessible directement. L'app garde son propre login Google (whitelist membres) — tu te connectes UNE fois, la session Firebase persiste dans le navigateur. Même niveau de sécurité que la prod (qui est déjà publique avec ce même login).

**Alternative sans toucher au réglage** : Vercel > deployment > menu ⋯ > Share → lien partageable qui bypasse le SSO.

### [Configurer les secrets Vercel dans GitHub Actions](https://trello.com/c/cgDN7iPJ)

**Problème** : le job deploy-staging du pipeline GitHub Actions échoue — aucun secret configuré dans le repo (« gh secret list » vide). Tant que non fait : pas de déploiement staging automatique après push sur main, pas d'approbation prod depuis l'onglet Actions. (Le staging du 15/07 a été déployé à la main via CLI Vercel locale.)

**À faire — 4 secrets dans GitHub** (repo BoogieC78/altimates-app > Settings > Secrets and variables > Actions > New repository secret) :

1. **VERCEL_TOKEN** — à générer : https://vercel.com/account/settings/tokens > Create Token (scope : team altimates, expiration : No Expiration ou 1 an). Copier la valeur immédiatement.
2. **VERCEL_ORG_ID** — valeur : team_eN8LH1WWtK0aoku1wneXdPdM
3. **VERCEL_PROJECT_ID** — valeur : prj_e5C0TNRoPMjcTyQOGRl9TwFOo75n
4. **VERCEL_AUTOMATION_BYPASS_SECRET** — sur https://vercel.com/altimates/altimates-app/settings/deployment-protection > section « Protection Bypass for Automation » > Add secret, puis copier la valeur. (Sert aux smoke tests E2E contre le staging protégé. Si tu désactives le SSO via l'autre carte, ce secret reste utile mais non bloquant.)

**Vérification** : relancer le run CI raté (Actions > run « fix(ui): popups tronquées… » > Re-run failed jobs) — deploy-staging doit passer au vert, puis smoke-staging, puis attente d'approbation prod.

Cf. skill environnements + BACKLOG.md pour le détail du pipeline.

### [Prérequis V2 premium : Blaze + Stripe + licence IGN](https://trello.com/c/3Umpcb2X)

## Contexte
Le projet V2 premium (GPX + cartes IGN) exige trois démarches que seul Wacil peut faire. Tout le développement des cartes « Mode payant » et « Base GPX + cartes IGN » est bloqué ou dégradé tant que ce n'est pas fait.

## Actions
- [ ] **Plan Firebase Blaze** : ajouter une CB dans la console Firebase (stockage des GPX + marge sur Firestore). Configurer une alerte budget (ex. 5 €) dès l'activation.
- [ ] **Compte Stripe** : créer le compte, activer le mode test, récupérer les clés (test + live) et les mettre dans les env Vercel (voir skill environnements — jamais dans le repo).
- [ ] **Licence IGN SCAN 25** : contacter l'IGN (offre professionnelle Géoplateforme) pour la diffusion du SCAN 25 dans un service payant : conditions, tarifs, quotas. Sans contrat → on reste sur Plan IGN v2 (libre), qui suffit pour lancer.

## Ordre
Blaze et Stripe débloquent le dev ; la licence IGN peut arriver après (le proxy tuiles démarre sur Plan IGN v2).

### [Firebase : renseigner le Nom public du projet = ALTImates](https://trello.com/c/JiKOzqH8)

Console Firebase → Paramètres du projet → Nom public → saisir `ALTImates`.

Améliore les e-mails de repli (quand Brevo n'est pas configuré) et l'écran de consentement OAuth Google, qui affichent sinon l'identifiant technique du projet.

Action manuelle, seul Wacil a les accès. Remonté depuis BACKLOG.md le 30/07/2026.

### [Fournir les documents légaux définitifs](https://trello.com/c/0fyStJnp)

## Contexte
Les mentions légales, la politique de confidentialité et les CGU sont en ligne depuis la PR #14, mais dans une **version provisoire** rédigée d'après ce que fait réellement l'app. Un bandeau le signale à l'écran. Wacil a annoncé le 02/08 qu'il générerait les documents définitifs.

## À faire (seul Wacil peut le faire)
- [ ] **Nom et prénom de l'éditeur** — actuellement « [à compléter] » dans les mentions légales.
- [ ] **Adresse e-mail de contact** pour l'exercice des droits RGPD — actuellement « [à compléter] ». `Contact.altimates@gmail.com` conviendrait si tu veux réutiliser l'adresse déjà créée.
- [ ] Fournir les textes définitifs des 3 documents (ou valider les textes actuels).

## Où ça se remplace
Tout le contenu vit dans un seul fichier : `src/features/legal/legalContent.ts`. Le remplacement est une réécriture de données, sans toucher aux composants. Retirer aussi `LEGAL_PROVISIONAL_NOTICE` (le bandeau jaune) une fois les textes validés.

## Critères d'acceptation
- [ ] Plus aucun « [à compléter] » dans les documents
- [ ] Le bandeau « Version provisoire » a disparu
- [ ] La date de dernière mise à jour est celle de la validation

### [Boîte à idée : configurer TRELLO_KEY + TRELLO_TOKEN dans Vercel](https://trello.com/c/15fbu1hs)

## Contexte
La boîte à idée (ampoule, commit e06864d) relaie chaque retour vers Trello via api/send-feedback.ts. Sans secrets, le feedback reste bien enregistré en Firestore mais aucune carte Trello n'est créée (erreur loguée dans Vercel).

## À faire (Wacil, console Vercel)
1. Vercel > projet altimates-app > Settings > Environment Variables, environnements Preview ET Production :
   - TRELLO_KEY = clé API (https://trello.com/app-key)
   - TRELLO_TOKEN = token (même valeur que .claude/trello.local.json local)
2. Optionnel : TRELLO_LIST_BUG / TRELLO_LIST_IDEE / TRELLO_LIST_CONTACT pour surcharger les listes cibles (défauts corrects pour le board actuel).
3. Redéployer pour prise en compte.

## Critère
Un envoi via l'ampoule en staging crée une carte dans la bonne liste du board.


## 🐞 Bugs à corriger (0)


## ⚡ Optimisations techniques (1)

### [Kit : relever les poids encore estimés](https://trello.com/c/2qIVsx7Q)

Les articles sans référence produit unique gardent un ordre de grandeur, marqué `weightEstimated: true` dans gear.ts plutôt que présenté comme un poids constaté.

**Relevés le 30/07** via blogs et comparatifs (toporando, i-trekkings, tourdumondiste, randonner-malin, CleverHiker) — Decathlon renvoie un 403 au scraping, le contournement fonctionne :
- Chaussures MH500 : 650–900 g la paire (860 g en 43)
- Bâtons MT500 : 470–490 g la paire (240 g le bâton)
- Chaussettes mérinos : 60–80 g la paire
- Poncho MT500 60L : 340–380 g
- Power bank 10 000 mAh : 180–280 g
- Microcrampons Simond Bobcat : 420–465 g (avec housse)

**Restent estimés** (aucune source fiable trouvée) : serviette microfibre, protection solaire, savon, adaptateurs gaz, rondelles, sac étanche, poche filtrante, chaise de camping, bonnet/buff, frontale, et les consommables (barres, lyophilisés — variables par nature).

Relevé à faire à la main, en magasin ou sur la fiche produit. Retirer `weightEstimated` au fur et à mesure.


## ✨ Améliorations / plus tard (8)

### [Nom de domaine (ex. altimates.fr, ~10€/an)](https://trello.com/c/1t7DrnlY)

Délivrabilité e-mail pro (SPF/DKIM), arrivée en boîte principale garantie, adresse d'envoi propre. Débloque aussi la version riche du mail de connexion.

### [Staging isolé : projet Firebase dédié + auto-login test](https://trello.com/c/6W9BQWgd)

**Objectif** : environnement de staging avec données factices, où un auto-login est acceptable (zéro connexion pour tester), sans aucun risque sur les données prod.

**Contexte** : aujourd'hui staging et prod partagent le même projet Firebase (altimates-4c37f) — mêmes données réelles. Un auto-login déployé y est donc interdit (session admin publique sur les vraies données). L'isolation était déjà notée comme amélioration future dans le skill environnements.

**À faire** :
1. Créer un second projet Firebase (ex. altimates-staging) : Auth (Google + lien e-mail) + Firestore
2. Déployer les mêmes firestore.rules sur ce projet
3. Script de seed : données de test (randos, membres, kit, idées) + compte de test whitelisté
4. Vercel : env vars Preview pointant vers altimates-staging (config Firebase côté client via variables VITE_*, à extraire du code si en dur)
5. Auto-login staging : compte de test e-mail+mot de passe dédié, identifiants injectés au build preview uniquement — jamais dans le build production (garde-fou build + test)
6. CI : le job deploy-staging build avec cette config ; smoke tests enrichis (peuvent alors être authentifiés)
7. Mettre à jour le skill environnements + BACKLOG.md

**Effort estimé** : ~une session de travail complète.
**Prérequis** : aucun — indépendant des secrets CI (autre carte), mais plus confortable une fois la CI réparée.

### [Version riche du mail de connexion](https://trello.com/c/otF5YfKQ)

Une fois le domaine pris : remplacer le bandeau texte par le design topographique complet (image hébergée). Aperçu de référence déjà conçu (bandeau topo + ligne de crête, univers rando).

### [V2 — Trajets train/bus pour les non-véhiculés](https://trello.com/c/pQCNtpYa)

## Contexte
Suite de la carte « Organisation des voitures » : pour les non-véhiculés, prévoir le trajet en transports (train/bus/covoiturage) jusqu'au point de rendez-vous. Jugé trop complexe pour la V1 (pas d'API horaires gratuite fiable type SNCF) — reporté en V2, décision actée.

## Objectif (V2)
Un non-véhiculé indique sa grande ville de départ ; l'app aide à organiser : regroupement par ville, point de jonction avec les voitures, et si faisable des suggestions d'itinéraires transports.

## Pistes techniques (exploration)
- S'appuyer sur `transport` (mode 'non-vehicule') créé par la carte voitures : ajouter `departureCity`.
- Étudier les API gratuites : Navitia/transport.data.gouv.fr (couverture TER/TGV à vérifier) ; à défaut, simple lien profond vers SNCF Connect/Trainline pré-rempli ville→ville, zéro API.
- Regroupement par ville = calcul client pur, faisable sans API.

## Critères de déclenchement
- [ ] Carte voitures livrée et utilisée sur au moins une vraie sortie.
- [ ] Choix d'approche API vs liens profonds tranché avec Wacil.

### [V2 — Mode payant : Stripe + entitlements premium](https://trello.com/c/U6pLUfYb)

## Contexte
Projet V2 : offre payante donnant accès aux traces GPX et aux fonds de carte IGN de toutes les randos France. Prérequis de tout le reste : savoir qui a payé, et verrouiller l'accès côté serveur.

## Objectif
Un membre peut souscrire l'offre premium ; son statut (`free`/`premium`) est fiable côté serveur et conditionne l'accès aux téléchargements GPX et aux tuiles IGN.

## Périmètre
- Paiement par Stripe Checkout (abonnement ou one-shot : à trancher avec Wacil avant implémentation).
- Gating serveur uniquement — l'UI cache les boutons, mais la vérité est dans les règles Firestore + les fonctions api/.
- Pas de gestion de factures/TVA avancée en V2.0 (Stripe Tax plus tard si besoin).

## Pistes techniques
- `api/stripe-webhook.ts` (même modèle que api/send-signin-link.ts + api/_ratelimit.ts) : vérifie la signature Stripe, écrit `plan: 'premium'` + `planUntil` dans `users/{uid}` via firebase-admin (déjà en dépendance).
- `api/create-checkout.ts` : crée la session Checkout pour l'uid authentifié (vérifier le token Firebase côté serveur, jamais faire confiance au client).
- firestore.rules : le champ `plan` de users/{userId} n'est PAS modifiable par le membre lui-même (seulement admin/serveur) — règle dédiée, sinon n'importe qui s'auto-promeut premium.
- UI : écran d'offre + état d'abonnement dans src/features/basecamp/BasecampPage.tsx.

## Contraintes
- Secrets Stripe dans les env Vercel (voir skill environnements), jamais en dur.
- Webhook idempotent (Stripe rejoue les événements).
- E2E : parcours gating (non-premium refusé par l'API) sans vrais paiements — mode test Stripe.

## Critères d'acceptation
- [ ] Paiement test Stripe → `plan: 'premium'` visible en base sans action manuelle.
- [ ] Un membre free appelant l'API de téléchargement reçoit 403.
- [ ] Un membre ne peut pas écrire son propre champ `plan` (refusé par les règles).

### [V2 — Base GPX France + cartes IGN (sources légales)](https://trello.com/c/XymNO9Z5)

## Contexte
Projet V2 : donner aux abonnés premium les traces GPX des randos de France + fonds de carte IGN. Contrainte légale actée : PAS de scraping de plateformes tierces (Visorando, AllTrails, Komoot — CGU + droit des bases de données). Sources légales uniquement.

## Objectif
Un abonné premium télécharge le GPX d'une rando et affiche le fond IGN ; un membre free n'y a pas accès.

## Périmètre
- Traces : extraction OpenStreetMap France (ODbL) des relations `route=hiking`, GPX générés et stockés chez nous. Sigles GR®/PR® = marques FFRandonnée, à ne pas utiliser sans accord ; les tracés OSM restent utilisables.
- Cartes : AUCUNE copie massive de tuiles — proxy à la demande vers l'API Géoplateforme IGN, clé côté serveur. Plan IGN v2 (licence ouverte) d'abord ; SCAN 25 seulement après contrat pro IGN (carte Config manuelle).
- Attributions OSM (« © OpenStreetMap contributors ») et IGN affichées — non négociable.

## Pistes techniques
- Pipeline hors app (scripts/) : Overpass/osmium sur la France → nettoyage (dédoublonnage, longueur mini) → GPX + métadonnées → Firebase Storage (Blaze requis) + index Firestore `gpxCatalog`.
- `api/gpx-download.ts` : token Firebase + `plan: 'premium'` vérifiés → URL signée courte durée. Rate limit via api/_ratelimit.ts.
- `api/tiles.ts` : proxy {z}/{x}/{y} vers Géoplateforme, cache CDN (headers Vercel), gating premium sur les couches non libres.
- Affichage : MapLibre GL dans src/features/sommets/RandoDetailModal.tsx — lat/lon déjà dans `Rando` (src/core/types/index.ts).

## Contraintes
- ODbL : vendre l'ACCÈS est permis, privatiser la donnée non (share-alike si redistribution).
- Volume : GPX France ≈ quelques Go — chiffrer Storage/egress avant ouverture.

## Critères d'acceptation
- [ ] Pipeline rejouable validé sur 1 région pilote (ex. Écrins) avant la France entière.
- [ ] Premium télécharge un GPX ; free reçoit 403 (API, pas seulement UI).
- [ ] Fond Plan IGN v2 affiché avec attributions ; clé IGN jamais exposée au client.

### [Badges transversaux (chocard, salamandre, hermine…) : ravitos, dépenses, conditions](https://trello.com/c/NipWiZqm)

## Contexte
Suite de l'échelle animalière (carte « Badges : échelle animalière »). Idées WhatsApp : récompenser aussi les ravitos remplis, l'usage de l'onglet dépenses — « plus ça utilise l'app plus ça reward ». Proposition Claude : badges transversaux par exploit plutôt que paliers — chocard (sorties hivernales), salamandre (sorties sous la pluie), hermine (course en blanc), + à définir : ravito rempli N fois, dépenses équilibrées N sorties.

## À trancher avant de commencer
- Liste exacte des badges transversaux et leurs seuils
- Garder l'animalier pour la seule échelle verticale ou en faire le langage visuel de tout le système

## Dépendance
Après livraison de l'échelle animalière (infra badges + Base Camp).

### [V10 — Signalement de dangers sur carte (type Komoot) + badge Sentinelle](https://trello.com/c/NgFXU7KK)

## Contexte
Idée WhatsApp explicitement datée « pas avant une v10 » : signaler des dangers sur une carte interactive (interface type Komoot où on pointe sur la map), points/gamification pour les dangers confirmés par d'autres membres, badge Sentinelle (comme Garmin pour une bonne nuit — ici pour un danger confirmé par des mates).

## Prérequis
Carte interactive (fond de carte, pointage), modèle de signalements + confirmations, anti-abus. Dépend aussi de la base cartes IGN/GPX (cartes V2 existantes).

## Périmètre indicatif
- Poser un signalement géolocalisé sur la carte
- Confirmation par d'autres membres passés au même endroit
- Points + badge Sentinelle pour un danger confirmé


## 🧪 À tester (8)

### [PWA iOS : login Google KO en standalone (redirect revient non connecté)](https://trello.com/c/zNHc05Q6)

## Repro (vidéo Wacil 16/08 08:42)
PWA installée sur iPhone > Continuer avec Google > feuille Safari altimates-4c37f.firebaseapp.com > retour écran login, non connecté.

## Cause
authDomain (firebaseapp.com) ≠ origine de l'app : Safari iOS partitionne/bloque le storage tiers, l'état du signInWithRedirect se perd (ITP). Cas documenté Firebase « signInWithRedirect best practices ».

## Fix (option proxy same-origin)
1. vercel.json : rewrite /__/auth/:path* vers https://altimates-4c37f.firebaseapp.com/__/auth/:path*
2. src/core/firebase/app.ts : authDomain = hostname de l'app sur les domaines Vercel, fallback firebaseapp.com en local
3. **Config manuelle Wacil** : Google Cloud Console > APIs & Services > Credentials > OAuth 2.0 Client IDs (client web du projet altimates-4c37f) > Authorized redirect URIs, ajouter :
   - https://altimates-app.vercel.app/__/auth/handler
   - https://altimates-app-staging.vercel.app/__/auth/handler

## Critère
Login Google aboutit dans la PWA standalone iOS (et rien ne casse en desktop/Safari classique).

### [Invitations : parrainage + cordées multiples](https://trello.com/c/uhcFvF1I)

## Contexte
Aujourd'hui l'accès repose sur une whitelist d'e-mails unique (config/allowedEmails), éditée par un admin depuis le portail Admin : tout le monde partage une seule cordée et personne ne peut faire entrer un ami sans passer par l'admin. Wacil veut ouvrir l'app à plusieurs cercles (potes proches, famille, collègues) et rendre l'invitation autonome.

**Prérequis de tout le reste** : les cartes « Radio : canal par cordée » et « Niveaux de visibilité d'une sortie » définissent leurs règles à partir du modèle de cordée introduit ici. À développer en premier.

## Objectif
Un membre invite lui-même quelqu'un via un lien de parrainage, sans intervention de l'admin. Un utilisateur appartient à plusieurs cordées, chacune avec ses propres membres, ses sorties et ses échanges cloisonnés.

## Périmètre
- Lien de partage / parrainage généré par un membre
- Liste d'invités en attente + approbation manuelle avant l'entrée effective
- Modèle multi-cordées : un profil, N cordées, données partitionnées par cordée

## Décisions actées (02/08/2026)
- Un lien de parrainage vaut pour **6 personnes maximum** de la cordée. Quota atteint : le lien ne fait plus entrer personne.
- Un lien est valable **24 heures** après sa création, puis expire.

## Questions ouvertes à trancher avec Wacil
- Qui approuve une demande : l'admin de la cordée, ou le membre qui a créé le lien ?
- Un utilisateur peut-il appartenir à un nombre illimité de cordées ?

## Pistes techniques
- src/core/firebase/auth.ts — ADMIN_EMAILS et isMemberEmail() ; le contrôle d'accès passe d'une whitelist globale à une appartenance par cordée
- firestore.rules — isMember() devient dépendant de la cordée visée ; les admins codés en dur restent l'ancre anti-lockout
- src/features/admin/AdminPage.tsx — gestion des accès à revoir
- src/core/firebase/collections.ts — nouvelles collections (cordées, invitations)

## Contraintes
La vérité du contrôle d'accès est dans firestore.rules, jamais dans le client : quota et expiration du lien se vérifient côté serveur. Un lien de parrainage ne doit pas permettre d'écrire dans une cordée avant approbation. Règles à redéployer à la main : firebase deploy --only firestore:rules.

## Critères d'acceptation
- [ ] Un membre non-admin génère un lien et fait entrer quelqu'un après approbation
- [ ] Le 7e usage d'un lien est refusé, et un lien de plus de 24 h aussi — par les règles, pas par l'UI
- [ ] Un invité non approuvé ne lit et n'écrit rien dans la cordée
- [ ] Un utilisateur membre de deux cordées ne voit pas les données de l'une depuis l'autre
- [ ] Aucun lockout possible : les admins gardent l'accès

### [Radio : canal par cordée (fin de la radio globale)](https://trello.com/c/IcqKwQmP)

## Contexte
Décision de Wacil (02/08/2026) : l'onglet Radio global disparaît. La radio devient un canal de communication propre à chaque cordée — les échanges se font entre potes d'une même cordée, pas dans un salon unique pour tout le monde.

## Objectif
Chaque cordée dispose de son propre canal de messages, isolé des autres cordées. Aucun message n'est visible en dehors de la cordée à laquelle il appartient.

## Périmètre
- Suppression de l'onglet Radio global de la navigation
- Canal de messages rattaché à une cordée
- Migration ou archivage des messages existants (à trancher)

## Question ouverte à trancher avec Wacil
Comment communiquer AVANT qu'une cordée soit formée ? Proposition de Wacil : un message radio « broadcast » visible par tous, sur le modèle des applis de padel — « t'envoies un message radio pour tout le monde, pour voir qui est chaud ». Exemple d'usage : « Cherche 3 randonneurs pour le Mont Toubkal ». À décider : broadcast conservé en parallèle des canaux de cordée, ou remplacé par un autre mécanisme (annonce sur une sortie).

## Pistes techniques
- src/features/radio/RadioPage.tsx — page actuelle
- src/core/firebase/messages.ts — collection des messages, à indexer par cordée
- src/App.tsx (TABS, ligne ~50) — retrait de l'onglet
- firestore.rules — la lecture d'un message doit être restreinte aux membres de la cordée concernée, côté serveur (l'UI ne protège rien)

## Dépendance
Nécessite le modèle multi-cordées de la carte « Invitations : parrainage + cordées multiples ». À livrer après, ou en même temps.

## Critères d'acceptation
- [ ] Un membre ne voit que les messages des cordées dont il fait partie
- [ ] Une lecture hors cordée est refusée par les règles Firestore, pas seulement masquée dans l'UI
- [ ] L'onglet Radio global n'existe plus
- [ ] Le sort des messages existants est tranché et appliqué

### [Boîte à idée (ampoule) en remplacement de l'onglet Idées](https://trello.com/c/e0fLmMCv)

## Contexte
Décision de Wacil (02/08/2026) : l'onglet Idées disparaît — toutes les idées qui y vivaient sont soit développées, soit déjà suivies sur Trello. Le besoin réel est de recueillir à tout moment les retours des beta-testeurs, sans les obliger à naviguer vers un onglet dédié.

## Objectif
Depuis n'importe quel onglet, un membre ouvre une icône ampoule et envoie une proposition d'amélioration, une idée de fonctionnalité, un bug ou un message de contact. Le retour arrive dans le backlog sans ressaisie manuelle.

## Périmètre
- Retrait de l'onglet Idées
- Icône ampoule persistante, accessible depuis tous les onglets
- Formulaire court avec choix du type : amélioration / nouvelle fonctionnalité / bug
- Formulaire de contact
- Acheminement automatique vers Trello, puis traitement : bug avéré corrigé, fonctionnalité transformée en carte de backlog si validée

## Pistes techniques
- src/features/idees/IdeesPage.tsx — page à retirer, ainsi que l'entrée TABS de src/App.tsx (ligne ~52)
- src/core/firebase/feedbacks.ts — collection de retours déjà existante, à réutiliser plutôt qu'à recréer
- Création Trello côté serveur uniquement : fonction dans api/ sur le modèle de api/send-signin-link.ts, avec rate limit via api/_ratelimit.ts. La clé et le token Trello sont des variables d'environnement Vercel — jamais dans le bundle client
- Modale via src/components/Modal.tsx (portal sur body)

## Contraintes
Le sort des idées déjà enregistrées en base doit être tranché avant la suppression de l'onglet. Cibles tactiles 44px, modale accessible (dialog, Escape, focus), lisible en 360px.

## Critères d'acceptation
- [ ] L'ampoule est atteignable depuis chaque onglet
- [ ] Un envoi crée une carte Trello sans intervention manuelle
- [ ] Les identifiants Trello ne sont pas exposés côté client
- [ ] Un envoi refusé affiche une erreur à l'écran et conserve la saisie
- [ ] L'onglet Idées n'existe plus et ses données ont été traitées

### [Enquête post-rando (déclenchée après la date de sortie)](https://trello.com/c/EicxJ6aQ)

## Contexte
Une sortie se termine sans qu'aucun retour ne soit collecté. Wacil veut qu'une petite enquête se déclenche une fois la date de la sortie passée, pour noter la rando à chaud.

## Objectif
Passé la date d'une sortie, les participants sont invités à la noter ; les réponses sont consultables et donnent une valeur au groupe (qualité de l'itinéraire, de l'organisation).

## Périmètre
- Déclenchement automatique après la date de la sortie
- Questionnaire court, répondable en moins d'une minute
- Restitution des réponses

## Questions ouvertes à trancher avec Wacil
- Quelles questions ? Pistes évoquées : note globale, difficulté ressentie, conditions météo, organisation.
- Timing : le lendemain de la date ? Pendant combien de temps l'enquête reste-t-elle ouverte ?
- Qui voit les réponses : toute la cordée, ou seulement l'organisateur ? Anonyme ou nominatif ?

## Pistes techniques
- src/core/types/index.ts — le type Rando porte déjà la date de la sortie, base du déclenchement
- src/features/sommets/RandoDetailModal.tsx — l'enquête peut vivre en onglet du détail, comme Dépenses / Transport / Photos
- src/core/firebase/collections.ts — nouvelle collection de réponses
- Pas de tâche planifiée côté serveur : le déclenchement peut être un simple calcul client sur la date, sans plan Blaze

## Contraintes
Une sortie porte ses pièces jointes via son id métier rando.id, pas l'id du document — indexer les réponses de la même façon. Une réponse par membre et par sortie, modifiable tant que l'enquête est ouverte. Refus d'écriture Firestore : afficher l'erreur à l'écran, jamais un console.warn silencieux.

## Critères d'acceptation
- [ ] L'enquête n'apparaît qu'après la date de la sortie
- [ ] Un membre ne peut pas répondre deux fois pour la même sortie
- [ ] Les réponses sont visibles selon la règle de visibilité tranchée
- [ ] Une sortie sans réponse n'affiche pas de restitution vide

### [Niveaux de visibilité d'une sortie (potes / public)](https://trello.com/c/hAAgIaxW)

## Contexte
Piste à cadrer, pas encore tranchée. Une fois l'app ouverte à plusieurs cordées et au parrainage, une sortie n'a plus un seul public possible : il faut choisir qui la voit.

## Objectif
L'auteur d'une sortie choisit son niveau de visibilité au moment de la créer, et ce choix est appliqué côté serveur.

## Périmètre — options évoquées
- **Potes seulement** : visible uniquement par les personnes dont on a accepté l'invitation ou qu'on a invitées soi-même.
- **Potes + public** : visible par les potes et publiquement.
- **Invisible** : jugé probablement hors sujet par Wacil — tout l'intérêt de l'app est de s'organiser avec ses potes. À valider ou écarter explicitement.

## Questions ouvertes à trancher avec Wacil
- Retient-on deux niveaux ou trois ?
- « Public » signifie-t-il visible sans être connecté, ou visible par tout membre de l'app ?
- La visibilité est-elle modifiable après création ?

## Pistes techniques
- src/core/types/index.ts — champ de visibilité sur Rando
- src/features/sommets/AddRandoModal.tsx et EditRandoModal.tsx — choix à la création et à l'édition
- src/features/sommets/SommetsPage.tsx — filtrage de la liste
- firestore.rules — la visibilité est une règle de lecture serveur ; masquer dans l'UI ne protège rien

## Dépendance
Repose sur le modèle multi-cordées et la notion de « potes » introduits par la carte « Invitations : parrainage + cordées multiples ». Ne pas démarrer avant.

## Contraintes
Une sortie publique expose des données personnelles (prénoms, photos, dépenses). Trancher précisément ce qui reste privé même en mode public avant d'implémenter.

## Critères d'acceptation
- [ ] Le niveau de visibilité est choisi à la création
- [ ] Une sortie « potes seulement » est refusée en lecture à un non-pote par les règles Firestore
- [ ] Les données personnelles exclues du mode public sont listées et effectivement non exposées

### [PWA iOS : installer ALTImates comme web app sur l'écran d'accueil](https://trello.com/c/8U0yANBF)

## Contexte
Demande de Wacil (nuit du 15-16/08) : faire d'ALTImates une web app installable sur iOS en premier lieu (Ajouter à l'écran d'accueil, plein écran, icône, splash), sans passer par l'App Store.

## Périmètre
- manifest.json (nom, icônes, display standalone, theme color)
- Meta tags iOS (apple-mobile-web-app-capable, apple-touch-icon, status bar, splash)
- Service worker de cache raisonnable (app shell, pas de cache agressif des données Firestore)
- Respect safe-area iOS déjà en place (dvh, env(safe-area-inset-*))
- Vérifier login Google/lien e-mail en mode standalone iOS (piège connu : popup OAuth dans PWA iOS)

## Critères d'acceptation
- [ ] Depuis Safari iOS, Partager > Sur l'écran d'accueil installe l'app avec icône et nom ALTImates
- [ ] Lancement plein écran sans barre Safari
- [ ] La connexion fonctionne en mode standalone
- [ ] Lighthouse PWA installable

### [Badges : échelle animalière de progression (10 paliers, 3 zones d'altitude)](https://trello.com/c/MlHN49MY)

## Contexte
Idée de la conversation WhatsApp (badges gamification, noms d'animaux de montagne du bas vers le sommet), affinée avec Claude le 15/08. L'utilisation de l'app est récompensée : plus tu fais et partages de sorties, plus tu montes dans l'échelle.

## Échelle actée (design Claude validé dans la conversation)
1 Écureuil roux (1 sortie, 800 m) · 2 Renard (3, 1200 m) · 3 Tétras-lyre (8, 1800 m) · 4 Marmotte (15, 2000 m) · 5 Hermine (25, 2300 m) · 6 Chamois (40, 2500 m) · 7 Lagopède alpin (60, 2700 m) · 8 Bouquetin (90, 3000 m) · 9 Gypaète barbu (130, 3500 m) · 10 Aigle royal (180, au-dessus de tout).
Paliers qui doublent grossièrement : début très accessible (écureuil dès la 1re sortie), sommets rares (aigle = plusieurs saisons).

## Trois zones de couleur
Vert montagnard (800-1800 m, paliers 1-3), bleu-vert subalpin/alpin (2000-2700 m, paliers 4-7), ambre nival (3000 m+, paliers 8-10). Feedback visuel sans lire le nom ; permet « tu es en zone alpine, plus que 20 sorties avant l'ambre ».

## Décision produit (compromis validé dans la conversation Claude)
Le palier compte les **sorties faites** (participation, date passée) — pas seulement partagées — pour ne pas pénaliser ceux qui font les 4000 sans poster. **Liseré doré** sur le badge quand la sortie a été partagée/organisée. Ravitos remplis et dépenses = badges transversaux (carte séparée).

## Graphisme
Médaillon rond, silhouette pleine de l'animal en négatif sur fond couleur de zone, anneau extérieur matérialisant l'altitude. Silhouettes distinctes à 40 px (queue touffue écureuil, queue lyre tétras, marmotte dressée, cornes crochues chamois vs annelées bouquetin, queue losange gypaète vs aigle).

## Où
Collection visible dans Base Camp (profil), type Garmin : tous les badges acquis + le prochain à débloquer avec progression.

## Critères d'acceptation
- [ ] Palier calculé depuis les sorties faites (date passée, participation)
- [ ] Badge courant + progression vers le suivant visibles dans Base Camp
- [ ] Collection complète consultable (acquis / à venir)
- [ ] 10 silhouettes distinctes à 40 px, 3 zones de couleur


## ✅ Done (70)

- [Valider le staging puis approuver la mise en prod (run #14)](https://trello.com/c/7L6za2tI)
- [Dépense/transport refusés en silence pour un compte Google](https://trello.com/c/ggXNrnpn)
- [Dépenses : écart de 2 centimes entre membres](https://trello.com/c/XViB86aS)
- [Photo de profil des membres](https://trello.com/c/6OJ9Cq7h)
- [Photos : mise en avant sur la carte de sortie](https://trello.com/c/81Xozrb7)
- [Mentions légales, confidentialité et CGU](https://trello.com/c/sWjOeJvt)
- [isMemberEmail : revoir le retry](https://trello.com/c/BD8VnNrk)
- [Idée : ajouter ses anciennes sorties (XP + reco)](https://trello.com/c/UMZwrszs)
- [Idée : gestion des électrolytes/minéraux/vitamines](https://trello.com/c/sh4dnCPg)
- [Audit accessibilité / responsive](https://trello.com/c/smJCQ1cc)
- [Fenêtre : refonte UX du bloc Mon statut (cartes avec explication)](https://trello.com/c/FThXjAqY)
- [Onglet Fenêtre : calendrier de disponibilités de la cordée](https://trello.com/c/ZYp4GMYV)
- [Barre de navigation : position instable entre onglets](https://trello.com/c/5jk180LR)
- [Rando : « Pas partant » avec 🇨🇳 seul](https://trello.com/c/Wh8HdFYy)
- [Idée : cost simulator type Tricount](https://trello.com/c/3pVl7i79)
- [Audit accessibilité complet (WCAG 2.1 AA) — corrections](https://trello.com/c/eo5TKmf3)
- [Suite Playwright E2E + CI](https://trello.com/c/VXWRSRGM)
- [Code-splitting jspdf + html2canvas (~600 kB)](https://trello.com/c/FYSQKIyz)
- [Kit : taux de complétion faux — skip/réfléchir comptés dans le dénominateur](https://trello.com/c/2x5vn0jD)
- [Modifier profil : renommer champ Nom en Prénom](https://trello.com/c/nczxBFvI)
- [Rando : flèches disparues sur Distance/Dénivelé (retour Adebola)](https://trello.com/c/Z1BNIaOT)
- [🐞 Bloquant : picker de date inopérant dans Proposer une rando](https://trello.com/c/kVwK6JU5)
- [Membres affichés "Anonyme" (connexion lien e-mail sans displayName)](https://trello.com/c/FMl7ZRjm)
- [Bouton GPX/Komoot cassé : 404 sur komoot.com/search](https://trello.com/c/WRyjPj21)
- [Whitelist dynamique (config/allowedEmails)](https://trello.com/c/7ZkqW06G)
- [useMemberName réactif (onSnapshot)](https://trello.com/c/E8kNnM7k)
- [Kit : triage non relancé après « Réinitialiser mon kit » (repro trek)](https://trello.com/c/GMkpUySj)
- [Modifier profil : bloquer caractères spéciaux dans champs numériques](https://trello.com/c/ms5VCCt2)
- [🐞 Moyen : distance/dénivelé négatifs acceptés dans Proposer une rando](https://trello.com/c/C81LrmPc)
- [Kit : popup info article tronquée](https://trello.com/c/ULsaLXjC)
- [wacil78 ajouté comme admin](https://trello.com/c/F74OPhEm)
- [Gate CI → déploiement Vercel](https://trello.com/c/ysayNGLC)
- [Header : avatar "AN" incompréhensible — afficher le prénom complet](https://trello.com/c/jGR5Kq1F)
- [Écran compte / Base Camp via l'avatar](https://trello.com/c/NVVpMqng)
- [Rate-limiting sur api/send-signin-link](https://trello.com/c/kh7mcscm)
- [Rando : ajouter option « Pas partant » (lettre chinoise + 🇨🇳)](https://trello.com/c/ESBRpPcH)
- [Sommets : popup détail trek tronquée](https://trello.com/c/fOfVRpDJ)
- [Connexion par e-mail (lien magique)](https://trello.com/c/FL410tii)
- [Base Camp : bugs signalés mais non détaillés](https://trello.com/c/sCP4WUxO)
- [Revue de sécurité — flux auth + fonction serverless](https://trello.com/c/qeToAb2E)
- [Rando : emoji pour option « Peut-être »](https://trello.com/c/aeuzIxcH)
- [Sommets : popup hydratation tronquée](https://trello.com/c/fNbUqaLA)
- [Auto-déploiement GitHub → Vercel](https://trello.com/c/2Sigoh9D)
- [Kit : logos des sites marchands absents dans la popup conseils](https://trello.com/c/Ues2px7c)
- [Rando : emoji ✅ pour option « Partant »](https://trello.com/c/ixFn31Kk)
- [Fonction d'envoi d'e-mail personnalisé codée](https://trello.com/c/cL2IAFkB)
- [Idées : supprimer la vue Kanban (remplacée par Trello)](https://trello.com/c/cKGNrwoU)
- [Trello : créer une carte par idée de l'onglet Idées](https://trello.com/c/r78G4Qmo)
- [E2E : fuite d'état entre fichiers de specs malgré resetEmulators()](https://trello.com/c/JTQppdg4)
- [npm audit : 0 vulnérabilité en production (résolu 30/07)](https://trello.com/c/53o7yAvU)
- [CI : empêcher l'accumulation de runs prod en attente](https://trello.com/c/OoSJG7rp)
- [Dates au format français (JJ/MM/AAAA) partout](https://trello.com/c/07bIXK8A)
- [Idée : filtrer les randos par dénivelé max](https://trello.com/c/Puc0asuv)
- [Desktop : barre « Proposer une rando » par-dessus la popup rando](https://trello.com/c/jQSBtKyD)
- [Popup rando délavée / cachée par la nav (sorties passées)](https://trello.com/c/v8DglJFQ)
- [Idée : ravito — répartition précise de qui ramène quoi](https://trello.com/c/NGbktc3o)
- [Idée : éditer/modifier une idée déjà soumise](https://trello.com/c/yIWyMYvk)
- [Idée : section photos après rando](https://trello.com/c/erFQSUCR)
- [Admin : modifier / supprimer n'importe quelle rando soumise](https://trello.com/c/4frTweH9)
- [Checklist départ : clarifier checkbox vs prise en charge (retour Adebola)](https://trello.com/c/y9SPIHSg)
- [Audit responsive mobile complet (iPhone/Android) — corrections](https://trello.com/c/tx51Nt5R)
- [Base Camp : mettre en avant Modifier profil (bouton primaire pleine largeur)](https://trello.com/c/Mun13jbb)
- [Photos post-rando (organisateur)](https://trello.com/c/Y60EbMBD)
- [Kit : poids du sac estimé, dynamique comme le budget](https://trello.com/c/EBJHNtpY)
- [Tricount des dépenses par sortie](https://trello.com/c/4afNgJ95)
- [Kit : poids porté dans le sac, hors équipement porté sur soi](https://trello.com/c/bYmZfK8j)
- [Organisation des voitures vers le départ](https://trello.com/c/h0Qveixj)
- [Kit : références produit Decathlon réelles avec liens](https://trello.com/c/X37qYjLL)
- [Kit : refonte UX écran starter pack (trop lourd, trop de saisie)](https://trello.com/c/YPCdBcY0)
- [Kit : « Tout retrier » + « Réinitialiser mon kit » (test triage de bout en bout)](https://trello.com/c/3Uw6B33t)
