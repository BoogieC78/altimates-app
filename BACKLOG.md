# Backlog ALTImates

> **Miroir du board Trello.** La source de vérité est le board
> [ALTImates — Backlog](https://trello.com/b/3qpIIJxH) : ce fichier en est le reflet versionné,
> régénéré depuis l'API à chaque synchro. En cas de divergence, **c'est Trello qui fait foi** —
> corriger la carte, puis régénérer ce fichier. Ne jamais résoudre un écart en éditant ce
> markdown à la main : la prochaine régénération l'écraserait. Voir le skill `trello-kanban`.
>
> Chaque entrée porte le lien de sa carte, pour retrouver commentaires et historique.

Dernière synchro : 2026-08-02.

---

## 🔧 Config manuelle (6)

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


## 🐞 Bugs à corriger (1)

### [Base Camp : bugs signalés mais non détaillés](https://trello.com/c/sCP4WUxO)

Wacil a signalé « il y a des bugs » sur le Base Camp, sans plus de détail. Rien n'est reproductible en l'état.

**À faire** : lister précisément les symptômes (captures d'écran annotées), puis corriger. Écrire le test de régression avant ou en même temps que le fix (cf. skill e2e-playwright).

Remonté depuis BACKLOG.md le 30/07/2026 : l'item y vivait depuis des semaines sans carte correspondante. Maintenant que Trello fait foi, il lui fallait une carte pour ne pas disparaître à la régénération du fichier.


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


## ✨ Améliorations / plus tard (6)

### [Version riche du mail de connexion](https://trello.com/c/otF5YfKQ)

Une fois le domaine pris : remplacer le bandeau texte par le design topographique complet (image hébergée). Aperçu de référence déjà conçu (bandeau topo + ligne de crête, univers rando).

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

### [Nom de domaine (ex. altimates.fr, ~10€/an)](https://trello.com/c/1t7DrnlY)

Délivrabilité e-mail pro (SPF/DKIM), arrivée en boîte principale garantie, adresse d'envoi propre. Débloque aussi la version riche du mail de connexion.

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



## 🧪 À tester (7)

### [Dépenses : écart de 2 centimes entre membres](https://trello.com/c/XViB86aS)

## Contexte
Jeu d'essai de Wacil : 150,00 € en deux dépenses (90 € + 60 €) partagées entre 7 personnes. Les soldes affichent 21,42 € / 21,43 € / **21,44 €** — un écart de 2 centimes, alors qu'une répartition au centime près ne devrait jamais dépasser 1 centime d'écart.

## Cause
`splitAmount()` (src/core/services/expenses.ts) donne systématiquement le reste de la division aux **premiers** bénéficiaires. Sur plusieurs dépenses, les mêmes personnes cumulent donc les centimes en trop : 9000c/7 → 5 premiers +1c ; 6000c/7 → le 1er +1c. Le bénéficiaire n°1 prend +2c.

## Objectif
L'écart maximal entre deux membres ayant la même part reste de 1 centime, quel que soit le nombre de dépenses. La somme des soldes reste exactement nulle.

## Pistes techniques
src/core/services/expenses.ts — répartir le reste dans `computeBalances` en tenant compte du surplus déjà attribué à chaque personne (les centimes vont à ceux qui en ont le moins reçu jusque-là), plutôt qu'aux premiers indices.

## Critères d'acceptation
- [ ] Sur le jeu d'essai 90+60 € / 7 pers., les parts ne prennent que deux valeurs : 21,42 et 21,43
- [ ] Somme des soldes = 0 (test unitaire)
- [ ] Test de non-régression sur plusieurs dépenses successives

### [Mentions légales, confidentialité et CGU](https://trello.com/c/sWjOeJvt)

## Contexte
L'app est exposée publiquement et collecte des données personnelles (e-mail, prénom, photos). Aucun document légal n'est accessible aujourd'hui. Wacil générera les textes définitifs plus tard ; en attendant, une première rédaction sert de socle.

## Objectif
Trois documents — mentions légales, politique de confidentialité, conditions d'utilisation — consultables **avant la connexion** (écran de login) et depuis le **profil** (Base Camp).

## Périmètre
Textes provisoires, rédigés à partir de ce que fait réellement l'app (Firebase Auth, Firestore, Vercel, open-meteo). Remplacement par les documents définitifs prévu ensuite : le contenu doit vivre dans un seul module facile à réécrire.

## Pistes techniques
- src/features/legal/legalContent.ts — les 3 documents en données structurées
- src/features/legal/LegalModal.tsx — visionneuse réutilisable
- src/App.tsx — pied de page de l'écran de connexion
- src/features/basecamp/BasecampPage.tsx — section Informations légales

## Critères d'acceptation
- [ ] Les 3 documents sont atteignables sans être connecté
- [ ] Les 3 documents sont atteignables depuis le Base Camp
- [ ] Modale accessible (dialog, Escape, focus) et lisible en 360px
- [ ] Un bandeau signale que les textes sont provisoires

### [Photos : mise en avant sur la carte de sortie](https://trello.com/c/81Xozrb7)

## Contexte
Retour de Wacil : après un envoi, il faut ouvrir la sortie puis l'onglet Photos pour voir quoi que ce soit. Les photos ne sont pas mises en avant.

## Objectif
Voir les photos d'une sortie depuis la liste des Sommets, et les agrandir en un seul geste.

## Périmètre
- Bandeau de vignettes sur la carte de sortie quand la sortie a des photos
- Ouverture directe en plein écran depuis une vignette
- Navigation précédent/suivant dans la visionneuse plein écran
- Ouverture de la sortie directement sur l'onglet Photos depuis le bandeau

## Pistes techniques
- src/features/sommets/RandoCard.tsx — bandeau de vignettes
- src/features/sommets/PhotoLightbox.tsx — visionneuse extraite de PhotosTab, réutilisée aux deux endroits
- src/features/sommets/RandoDetailModal.tsx — onglet initial paramétrable

## Contraintes
Les photos sont des data URL en Firestore (pas de Storage) : ne pas multiplier les lectures. Accessibilité : la visionneuse reste une vraie modale (dialog, Escape, focus). Cibles tactiles 44px.

## Critères d'acceptation
- [ ] Une sortie avec photos affiche ses vignettes dans la liste
- [ ] Un clic sur une vignette ouvre le plein écran, sans passer par le détail
- [ ] Flèches précédent/suivant + clavier dans le plein écran
- [ ] Aucun débordement horizontal en 360px

### [Photo de profil des membres](https://trello.com/c/6OJ9Cq7h)

## Contexte
Les membres se distinguent aujourd'hui par un prénom et deux initiales colorées. Wacil veut que chacun se reconnaisse à sa photo.

## Objectif
Chaque membre peut ajouter, remplacer ou retirer sa photo de profil ; elle apparaît là où il est identifié.

## Périmètre
- Choix de la photo dans « Modifier mon profil » (Base Camp)
- Affichage : pastille du header, hero du Base Camp, liste des membres de la Cordée
- Repli sur les initiales colorées quand aucune photo

## Pistes techniques
- src/core/services/media.ts — compression dédiée (carré, petit côté, poids très inférieur aux photos de sortie)
- src/hooks/useUserProfile.ts — champ `photo` dans Profile (data URL, comme randoMedia : pas de Storage donc pas de plan Blaze)
- firestore.rules — plafonner la taille et exiger un préfixe data:image sur users/{uid}, sinon la collection devient un espace de stockage libre

## Contraintes
Un document Firestore est plafonné à 1 Mio et users/{uid} porte aussi le kit : la photo doit rester légère (quelques dizaines de Ko).

## Critères d'acceptation
- [ ] Ajout, remplacement et retrait fonctionnent depuis le profil
- [ ] La photo apparaît dans le header, le Base Camp et la Cordée
- [ ] Une écriture dépassant le plafond est refusée par les règles Firestore
- [ ] Sans photo, l'affichage actuel (initiales colorées) est inchangé

### [Dépense/transport refusés en silence pour un compte Google](https://trello.com/c/ggXNrnpn)

## Contexte
Trouvé le 02/08 en corrigeant l'écart de centimes (carte XViB86aS). Les règles Firestore identifient l'auteur d'une dépense ou d'une déclaration de transport par `profile.name`, or **un login Google n'écrit jamais ce champ** : la modale de prénom ne s'affiche que pour les connexions par lien e-mail (celles sans displayName). L'écriture était donc refusée par les règles, et l'échec partait en `console.warn` — bouton apparemment inerte, saisie perdue, aucun message.

Invisible pour quiconque a déjà configuré son profil dans le Base Camp, d'où la découverte tardive.

## Correctifs livrés (PR #14)
- `src/hooks/useMemberName.ts` : le prénom affiché (displayName Google) est adopté en base dès la connexion.
- `src/features/sommets/ExpensesTab.tsx` : un refus d'enregistrement s'affiche à l'écran et la saisie est conservée.

## Pourquoi c'est à retester en vrai
Le parcours ne se reproduit qu'avec un compte Google **qui n'a jamais ouvert le Base Camp**. Les tests E2E passent par l'émulateur : ils couvrent le mécanisme, pas la vraie chaîne OAuth Google en prod.

### [Valider le staging puis approuver la mise en prod (run #14)](https://trello.com/c/7L6za2tI)

## Décision en attente
Le run GitHub du merge de la PR #14 a son job `deploy-production` **bloqué en « Waiting »**, dans l'attente de ton approbation.

👉 https://github.com/BoogieC78/altimates-app/actions/runs/30747252270

## Avant d'approuver
Dérouler la QA des 4 cartes de cette liste sur https://altimates-app-staging.vercel.app

## Puis
- **Approve** → rebuild du même commit en env production et déploiement prod.
- **Reject** → le commit reste en staging, rien ne part en prod.

## Piège à ne pas répéter
Ne jamais approuver plusieurs runs en attente : ils se déploient dans l'ordre de fin des jobs, et un run ancien terminé en dernier réécrit les alias prod ET staging avec du code antérieur (rollback silencieux vécu le 17/07, v0.3.4 avait écrasé v0.3.5). N'approuver que le run le PLUS RÉCENT.

### [isMemberEmail : revoir le retry](https://trello.com/c/BD8VnNrk)

Le retry sur échec de lecture config/allowedEmails (src/core/firebase/auth.ts) est un contournement d'un problème de timing après connexion. Voir si une meilleure approche existe.


## ✅ Déjà fait (62)

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
