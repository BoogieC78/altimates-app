# Backlog ALTImates

Tâches reportées et pistes d'optimisation. Cochez au fur et à mesure.
Dernière mise à jour : 2026-07-31 (release prod v0.3.10).

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

### Prérequis V2 premium (GPX + cartes IGN) — carte Trello 3Umpcb2X
- [ ] **Plan Firebase Blaze** (CB + alerte budget ~5 €) — stockage des GPX.
- [ ] **Compte Stripe** (mode test, clés dans les env Vercel, jamais dans le repo).
- [ ] **Licence IGN SCAN 25** (offre pro Géoplateforme) — facultatif au lancement, Plan IGN v2 (libre) suffit.

---

## 🐞 Bugs à corriger

- [x] **Membres affichés « Anonyme »** — connexion lien e-mail sans displayName : fallback 'Anonyme'
  persisté par l'onboarding Kit. Fix : modal prénom obligatoire au premier login, 'Anonyme' traité
  comme absent, email/displayName persistés dans users/{uid}. Livré prod v0.3.3 (2026-07-17,
  carte Trello FMl7ZRjm).
- [x] **Header : avatar « AN » incompréhensible** — prénom complet affiché en pastille dans le
  header (retour Adebola). Livré prod 2026-07-17 (carte Trello jGR5Kq1F).
- [ ] **Bugs Base Camp** — signalés (« il y a des bugs ») mais pas encore détaillés.
  → À faire : lister précisément les symptômes (captures) puis corriger.
- [x] **Kit : popup info article tronquée** — livré prod v0.3.1 (2026-07-15).
- [x] **Barre de navigation : position instable** — livré prod v0.3.1.
- [x] **Sommets : popups détail trek / hydratation tronquées** — livré prod v0.3.1 (z-index, dvh, portal).
- [x] **Popup rando délavée (sorties passées) + barre Proposer par-dessus** — livré prod v0.3.1 (portal + barre 480px masquée sous modale).
- [x] **Kit : logos marchands absents (CSP)** — livré prod v0.3.1 (img-src *.gstatic.com).
- [x] **Dates au format JJ/MM/AAAA** — livré prod v0.3.1 (composant DateField).

---

## ⚡ Optimisations techniques

- [ ] **Reset des émulateurs E2E : fuite d'un document entre fichiers de specs.** Constaté le
  2026-08-02 : une rando seedée par `sommets.spec.ts` réapparaissait dans un test de
  `sortie-partagee.spec.ts` malgré le `resetEmulators()` du `beforeEach`, cassant un locator en
  strict mode (2 cartes homonymes). Contourné en donnant des noms de randos distincts par fichier,
  mais la cause (suppression asynchrone côté émulateur Firestore ?) reste ouverte — tant qu'elle
  l'est, toute réutilisation d'un même nom de fixture entre specs est un flake en puissance.

- [ ] **Code-splitting `jspdf` + `html2canvas`** (~600 kB) : ne sont utiles que pour l'export PDF du kit.
  Les charger en `import()` dynamique à la demande → bundle initial nettement allégé.
  (Le build affiche déjà l'avertissement « chunks > 500 kB ».)
- [x] **`useMemberName` réactif** — passé en `onSnapshot` avec le fix « Anonyme » (commit 46233db).
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

- [x] **Refonte kit v0.3.10** (2026-07-31, prod) — retours groupe du 30/07 :
  - **Formule complétion corrigée** : % complet = possédés / (possédés + à acheter), skip et
    réfléchir hors dénominateur et hors budget (carte Trello 2x5vn0jD).
  - **Triage express** (variante A choisie sur maquettes) : kit vierge → onboarding puis une
    carte par article, réponse obligatoire (J'ai / À acheter / Pas besoin), sortie libre via
    « Voir la liste » ; boutons « Trier (N) » et « Tout retrier » (sans toggle destructif) ;
    « Réinitialiser mon kit » (resetKit ciblé via deleteField, stats de sorties conservées).
    Cartes YPCdBcY0, 3Uw6B33t.
  - **Fix reset→trek** : condition d'ouverture du triage réévaluée à chaque rendu (verrou pris
    sur un rendu périmé avant l'écho onSnapshot du reset). Carte GMkpUySj.
  - E2E kit : emails dédiés par test sensible à l'état (fuite d'uid partagé entre tests).
- [ ] **Nom de domaine** (ex. `altimates.fr`, ~10 €/an) → délivrabilité e-mail « pro » (SPF/DKIM),
  arrivée en boîte principale garantie, et adresse d'envoi propre.
- [ ] **Version riche du mail de connexion** : une fois le domaine pris, remplacer le bandeau texte par le
  design topographique complet (image hébergée). Aperçu de référence déjà conçu (bandeau topo + ligne de crête).
- [x] **Onglet Fenêtre** : calendrier de disponibilités de la cordée (chacun renseigne ses jours ;
  l'app calcule les meilleures fenêtres communes). Livré en **staging** le 2026-07-15 (commit 61ad023,
  règles Firestore déployées) — passé en **PRODUCTION** avec la release v0.3.9 le 2026-07-30.
  Carte Trello ZYp4GMYV.
- [x] **Audit accessibilité / responsive** de l'app — 2 audits complets menés le 2026-07-19
  (a11y WCAG 2.1 AA : 34 constats ; responsive mobile 360–430px : 29 constats) puis corrections :
  modales accessibles (dialog/focus trap/Escape), labels/aria-pressed partout, contrastes,
  focus visible, safe-area iPhone, inputs 16px anti-zoom iOS, nav 8 onglets en 360px,
  0 débordement horizontal vérifié à 360/375/430px. Passé en **PRODUCTION** avec la release
  v0.3.9 le 2026-07-30. Cartes Trello 6a5cc983e49b9df519f8efca (a11y) et
  6a5cc983aed8b84ea7109036 (responsive). Note : vote « Pas partant » passé de 🇨🇳 à ❌.
- [x] **Kit : poids du sac estimé** — chaque article de `gear.ts` porte désormais une fourchette
  `weight` en grammes ; le bloc en-tête du Kit affiche le poids total du sac, recalculé
  dynamiquement comme le budget (tous les articles sauf ceux marqués « Skip »). Poids repris
  aussi dans l'export PDF et l'e-mail du kit. Livré en **PRODUCTION** v0.3.9 le 2026-07-30
  (carte Trello EBJHNtpY).
- [x] **Kit : reclassement d'articles** (2026-07-30, prod v0.3.9) — cuillère trek pliable et oreiller
  gonflable passés en **Indispensables** côté trek (l'oreiller reste absent du kit journée).
  La protection solaire était déjà en Recommandés dans les deux modes : aucun changement.
- [x] **CI : un seul déploiement prod en attente à la fois** — 9 runs non approuvés s'étaient
  empilés sur l'environnement `production` (dont certains du 17/07). Une file qui grossit est un
  piège : approuver plusieurs runs les déploie dans l'ordre de fin des jobs, donc un vieux run
  terminé en dernier réécrit les alias prod ET staging (rollback silencieux du 17/07, v0.3.4 a
  écrasé v0.3.5). Correctif : `concurrency: {group: deploy-production, cancel-in-progress: true}`
  dans [ci.yml](.github/workflows/ci.yml) — un nouveau push annule le run encore en attente.
  Les 8 runs périmés ont été purgés. Gate humaine inchangée. Commit b6cf451, carte Trello OoSJG7rp.
- [x] **Poids : distinguer le porté-sur-soi du porté-dans-le-sac** — fait 2026-07-30 : drapeau
  `worn` sur `GearItem` (chaussures, bâtons, t-shirt, chaussettes, boxer mérinos, casquette),
  exclus du total, avec un astérisque sous le chiffre qui nomme ce qui est retiré.
- [x] **Kit : références produit réelles** — chaque article porte désormais une référence
  Decathlon nommée + son lien. Les poids sont repris de la fiche technique quand elle a pu
  être trouvée ; les articles sans référence unique (consommables, accessoires génériques)
  gardent un ordre de grandeur, marqué `weightEstimated: true` dans `gear.ts`.
- [ ] **Poids : compléter les fiches manquantes** — les articles encore en `weightEstimated`
  (chaussures, bâtons, chaussettes, serviette, poncho, power bank, solaire, crampons, savon,
  adaptateurs gaz, consommables) attendent un poids constaté. Decathlon renvoie un 403 au
  scraping : à relever à la main en magasin/sur fiche produit.
- [ ] **Staging isolé** : projet Firebase dédié (données de test seedées) + auto-login compte de test
  en preview uniquement — permet de tester sans connexion, sans risque prod. Carte Trello détaillée.
- [x] **Rando : votes ✅ Partant / 🤔 Peut-être / 🇨🇳 Pas partant** — livré prod v0.3.1.
- [x] **Idées : vue Kanban supprimée** (remplacée par le board Trello) — livré prod v0.3.1.
- [x] **Admin : modifier/supprimer n'importe quelle rando** — livré prod v0.3.1.
- [x] **Trello : une carte par idée de l'onglet Idées** — fait 2026-07-15 (7 idées importées depuis Firestore).
- Idées du groupe (importées sur Trello 2026-07-15) : filtrer randos par dénivelé max (Thomas ▲3),
  électrolytes/minéraux (Wacil), ravito qui-ramène-quoi (Wacil), anciennes sorties → XP (Wacil),
  éditer une idée soumise (Wacil), cost simulator Tricount (Nordine), section photos (Sofia ▲5).
- [x] **Photos post-rando (organisateur)** : l'organisateur (`proposedBy`) ou un admin partage
  jusqu'à 6 photos compressées côté client (JPEG 1280px, ≤ 200 Ko) stockées en data URL dans
  Firestore — décision actée : pas de plan Blaze/Storage, vidéos hors périmètre. Collection
  `randoMedia`, règles sur l'`authorUid` (jamais le prénom) + plafond de taille. Développé le
  2026-08-02 sur `feat/v1-sorties` (PR #11), **pas encore mergé ni déployé**. Carte Trello Y60EbMBD.
- [x] **Tricount des dépenses par sortie** : saisie des frais avancés (lyophilisés, essence,
  refuge…), soldes par personne au centime, remboursements en ≤ N-1 virements — sans intégration
  de paiement. Collection `expenses` + service pur `expenses.ts` (montants en centimes, reste
  réparti au centime près). Développé le 2026-08-02 sur `feat/v1-sorties` (PR #11), **pas encore
  mergé ni déployé**. Carte Trello 4afNgJ95.
- [x] **Organisation des voitures vers le départ** : chacun déclare voiture (2 places passagers
  par défaut, matos compris) / passager / non véhiculé ; l'app calcule le besoin (1 voiture pour 3)
  et les places manquantes. Collection `transport` (1 doc par rando+membre, modèle availability).
  Développé le 2026-08-02 sur `feat/v1-sorties` (PR #11), **pas encore mergé ni déployé**.
  Carte Trello h0Qveixj.
- [ ] **V2 — Trajets train/bus pour les non-véhiculés** : ville de départ, regroupement par ville,
  suggestions d'itinéraires (API Navitia à évaluer, sinon liens profonds SNCF Connect). Reporté
  en V2 (complexité API). Carte Trello pQCNtpYa.
- [ ] **V2 — Mode payant (Stripe + entitlements)** : Checkout + webhook serverless (modèle
  api/send-signin-link.ts), `plan: 'premium'` écrit dans users/{uid} par le serveur seul (règle
  Firestore anti-auto-promotion), gating 403 côté API. Carte Trello U6pLUfYb.
- [ ] **V2 — Base GPX France + cartes IGN (sources légales)** : extraction OSM `route=hiking`
  (ODbL, attribution obligatoire, pilote sur 1 région d'abord), GPX servis par URL signée aux
  premium ; tuiles IGN en proxy à la demande (Plan IGN v2 libre, SCAN 25 après contrat pro) —
  jamais de copie massive ni de scraping Visorando/AllTrails/Komoot (CGU + droit des bases de
  données). Carte Trello XymNO9Z5.

---

## ✅ Déjà fait (contexte)

- **Modifier profil : Prénom + champs numériques durcis** (v0.3.8) : le champ "Nom" du modal
  Base Camp renommé en "Prénom" ; les 5 champs stats (Km saison, D+ saison, Sorties, Best km,
  Best D+) laissaient passer des caractères non numériques (`--71`) → saisie filtrée aux chiffres
  uniquement. Cartes Trello 6a5b61ae7a18b1382e1aaf36, 6a5b61ae0ad86bc1af761526.
- **Fenêtre : refonte UX du bloc Mon statut** (v0.3.8) : les 4 boutons pilules (DISPO/RETOUR
  DIM./+1 JOUR/INDISPO) n'expliquaient pas leur sens ni la visibilité côté cordée → cartes
  empilées (icône + titre + explication courte) + rappel "Visible par la cordée sur le
  calendrier, à ton nom." Maquette validée par Wacil (option B sur 3 propositions). Carte Trello
  6a5b7f426c415181c69f8454.
- **Flèches Distance/Dénivelé restaurées** (v0.3.7) : le durcissement v0.3.4 (type=text) avait fait
  disparaître les spinners natifs (retour Adebola) → retour à type=number (min=1, step=1) avec tous
  les garde-fous conservés (blocage clavier e/./-/+/,, nettoyage collage, entier positif au submit).
  Carte Trello 6a5a8a45.
- **Modifier mon profil mis en avant** (v0.3.6) : le bouton était noyé en bas du Base Camp → bouton
  primaire pleine largeur (ink/gold, icône crayon) sous les Personal Bests, Déconnexion/Réinitialiser
  côte à côte en dessous. Option validée sur maquette visuelle. Carte Trello 6a5a84ab.
- **Checklist départ clarifiée** (v0.3.5) : la checkbox nue se confondait avec la prise en charge
  (retour Adebola) → chip explicite "À préparer / ✓ Prêt", ligne d'état combinée ("Wacil s'en occupe ·
  pas encore prêt"), et "Me retirer" remet aussi l'article à préparer. Première spec E2E Cordée (3 cas).
  Carte Trello 6a5a58d0.
- **Proposer une rando : date + saisies durcies** (v0.3.4) : calendrier custom en français (le picker
  natif suit la langue du navigateur, `lang` ignoré), saisie date au clavier avec masque JJ/MM/AAAA
  (`frToIso` au submit, 31/02 rejeté), distance/dénivelé limités aux entiers positifs y compris au
  collage (sanitize à l'input). Cartes Trello kVwK6JU5, C81LrmPc.
- **Bouton GPX Komoot réparé** (v0.3.2) : Komoot a supprimé la recherche texte par URL → URL discover
  géographique construite depuis lat/lon (toFixed(7), Komoot 404 sans décimale), repli Google sans coords.
- Suite de tests **Playwright E2E** + intégration CI (login Google/e-mail, propositions, votes, admin, Base Camp…).
- **Whitelist dynamique** gérable depuis le portail Admin (`config/allowedEmails`) — règles Firestore déployées.
- **wacil78** ajouté comme **admin**.
- Écran **compte / Base Camp** via l'avatar (parité app d'origine).
- **Connexion par e-mail** (lien magique) : activée, en français, **sans pop-up** (adresse embarquée dans le lien).
- **Auto-déploiement GitHub → Vercel** connecté.
- Fonction d'envoi d'e-mail personnalisé **codée** (en attente des secrets ci-dessus).
