# Journal de la nuit du 2026-08-02 → 03

Branche : `feat/v1-sorties`. Objectif : livrer les 3 cartes V1 en staging pour 9h.
Autorisations données par Wacil : branche + push + staging OK, déploiement des règles
Firestore OK, merge sur main NON (validation au réveil). Plafond ~85-90 % du quota hebdo.

Si une session fraîche reprend ce travail : lire ce fichier, puis `git log --oneline` sur la
branche pour voir où ça s'est arrêté, et continuer à l'étape non cochée.

## Étapes

- [x] Branche `feat/v1-sorties` créée, commit des skills Trello (bb842d9)
- [ ] Carte 1 — Tricount (Trello 4afNgJ95)
- [ ] Carte 2 — Voitures (Trello h0Qveixj)
- [ ] Carte 3 — Photos post-rando (Trello Y60EbMBD)
- [ ] Règles Firestore déployées (`firebase deploy --only firestore:rules`)
- [ ] lint + tests unitaires + build + E2E verts
- [ ] Push de la branche, CI + staging vérifiés
- [ ] Commentaires Trello sur les 3 cartes + BACKLOG.md à jour
- [ ] Rapport du matin rédigé

## Décisions actées (ne pas rouvrir)

- Photos : Firestore seul, pas de Storage/Blaze, JPEG compressé ≤ 200 Ko, max 6 par rando,
  organisateur (`proposedBy`) + admins uniquement.
- Tricount : montants en centimes, parts égales, aucune intégration de paiement.
- Voitures : déclaratif, 3 places par défaut, pas d'affectation automatique des passagers.
- Train/bus : hors périmètre (carte V2 pQCNtpYa).
