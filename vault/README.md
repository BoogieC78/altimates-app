# Vault ALTImates

Notes de connaissance du projet, au format **Obsidian** (frontmatter YAML, tags, wikilinks `[[...]]`).
Elles sont volontairement en dehors de `src/` : c'est de la documentation de projet, pas du code.

## Intégrer dans un vault Obsidian

Copier le dossier `ALTImates/` à la racine (ou dans un sous-dossier) de ton vault :

```bash
cp -R vault/ALTImates ~/chemin/vers/ton-vault/
```

Ouvrir `ALTImates/ALTImates.md` : c'est la **carte du projet** (MOC), tous les liens partent de là.
Les wikilinks résolvent tant que les 12 notes restent dans le même dossier.

## Contenu

| Note | Sujet |
|---|---|
| `ALTImates.md` | Hub / carte du projet |
| `Produit — fonctionnalités.md` | Les 8 onglets et ce qu'ils font |
| `Architecture technique.md` | Stack, arborescence, règles d'architecture |
| `Modèle de données Firestore.md` | Collections et types |
| `Sécurité.md` | Invariants à ne jamais casser |
| `Environnements et déploiement.md` | local / e2e / staging / prod, pipeline CI |
| `Tests et CI.md` | Vitest, Playwright, réparation de la CI |
| `Kit de rando (gear.ts).md` | Structure et édition de la liste du matériel |
| `Pièges connus.md` | Bugs déjà diagnostiqués — à lire avant de debugger |
| `Historique des releases.md` | v0.3.1 → v0.3.9 |
| `Backlog et priorités.md` | Ce qui reste à faire |
| `Process et outils.md` | Trello, skills, discipline de travail |
| `Personnes et rôles.md` | Qui est qui |

## Fraîcheur

État au **2026-07-31**, version `v0.3.9`. Les sources vivantes restent `README.md`, `BACKLOG.md`,
`.claude/skills/` et le code : en cas de divergence, ce sont elles qui font foi.

Aucun secret dans ces notes (ni clé Trello, ni token Vercel, ni identifiant Firebase privé).
