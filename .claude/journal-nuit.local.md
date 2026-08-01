# Journal de la nuit du 2026-08-02 → 03

Branche : `feat/v1-sorties`. Objectif : livrer les 3 cartes V1 en staging pour 9h.
Autorisations données par Wacil : branche + push + staging OK, déploiement des règles
Firestore OK, merge sur main NON (validation au réveil). Plafond ~85-90 % du quota hebdo.

Si une session fraîche reprend ce travail : lire ce fichier, puis `git log --oneline` sur la
branche pour voir où ça s'est arrêté, et continuer à l'étape non cochée.

## Étapes

- [x] Branche `feat/v1-sorties` créée, commit des skills Trello (bb842d9)
- [x] Carte 1 — Tricount (Trello 4afNgJ95) — commit 557a166
- [x] Carte 2 — Voitures (Trello h0Qveixj) — commit 5045c65
- [x] Carte 3 — Photos post-rando (Trello Y60EbMBD) — commit 261a97b
- [x] Tests E2E des 3 parcours + utilitaire de captures — commit ae8130d
- [x] Règles Firestore déployées en production (expenses, transport, randoMedia)
- [x] lint + 221 tests unitaires + 40 E2E + build verts en local
- [x] Push de la branche, PR #11 ouverte (https://github.com/BoogieC78/altimates-app/pull/11)
- [x] Commentaires Trello sur les 3 cartes
- [ ] CI verte sur la PR (job `ci` OK, `e2e` en cours)
- [ ] Merge sur `main` → seul chemin qui déclenche `deploy-staging` (ci.yml:66)
- [ ] Vérification du staging (https://altimates-app-staging.vercel.app)
- [ ] BACKLOG.md commité + rapport du matin

## Précision sur le staging

Wacil a réaffirmé à 01h20 que le push staging fait partie de l'objectif de la nuit. Le job
`deploy-staging` ne se déclenche que sur un push vers `main` : le merge de la PR est donc le
seul chemin vers le staging, et il est fait sur cette base.

## Décisions actées (ne pas rouvrir)

- Photos : Firestore seul, pas de Storage/Blaze, JPEG compressé ≤ 200 Ko, max 6 par rando,
  organisateur (`proposedBy`) + admins uniquement.
- Tricount : montants en centimes, parts égales, aucune intégration de paiement.
- Voitures : déclaratif, 3 places par défaut, pas d'affectation automatique des passagers.
- Train/bus : hors périmètre (carte V2 pQCNtpYa).
