---
name: audit-accessibilite
description: Audit d'accessibilité WCAG 2.1 AA d'ALTImates — à relancer après tout ajout de page, modale ou composant interactif, ou périodiquement pour détecter les régressions. Couvre sémantique HTML, focus clavier, ARIA, contrastes, cibles tactiles.
---

# Audit accessibilité ALTImates (WCAG 2.1 AA)

Basé sur l'audit complet du 2026-07-19 (34 constats, tous corrigés — cartes Trello
6a5cc983e49b9df519f8efca). Sert de checklist pour détecter les régressions ou auditer
un nouveau développement, pas juste de compte-rendu historique.

## Quand relancer

- Avant un merge qui ajoute une page, une modale, ou un composant avec interaction
  (bouton, toggle, formulaire).
- Périodiquement (ex. avant une mise en prod majeure).

## Méthode

Lire chaque fichier de `src/components/` et `src/features/**/*.tsx` (hors `.test.tsx`)
en entier — ne pas se fier à un grep partiel, un `onClick` sur une div peut être à
n'importe quelle ligne. Pour chaque fichier, vérifier :

1. **Sémantique** : hiérarchie de titres (h1→h2→h3, pas de div stylée en faux titre),
   landmarks (`header`/`main`/`nav`), listes (`role="list"`/`listitem"` a minima si pas
   de vraies `ul`/`li`).
2. **Labels** : tout `input`/`select`/`textarea` a un label associé (`htmlFor`+`id`) ou
   un `aria-label` explicite. Un `placeholder` seul n'est jamais un label valide.
3. **Boutons icône-seule** : `aria-label` obligatoire dès qu'il n'y a pas de texte
   visible. Un `title` seul ne suffit pas (non lu par tous les lecteurs d'écran, pas de
   nom accessible garanti) — dupliquer en `aria-label`.
4. **Divs cliquables** : tout `onClick` posé sur un `div`/`span` doit soit devenir un
   vrai `<button>`, soit recevoir `role="button" tabIndex={0}` + `onKeyDown` gérant
   Enter et Espace (`preventDefault` sur Espace pour éviter le scroll de page).
5. **États** : tout bouton à état on/off/actif (vote, toggle, filtre, onglet) a
   `aria-pressed`/`aria-checked`/`aria-current` — ne jamais transmettre l'état
   uniquement par une classe CSS.
6. **Modales/popovers** : `role="dialog"` + `aria-modal="true"` + `aria-labelledby`,
   focus déplacé à l'ouverture, focus trap au Tab, Escape ferme, focus restitué à
   l'élément déclencheur en fermant. Le composant [Modal.tsx](../../../src/components/Modal.tsx)
   implémente déjà tout ça — réutiliser plutôt que réinventer une bottom-sheet custom.
7. **Contraste** : calculer le ratio texte/fond pour toute nouvelle couleur (seuil
   4.5:1 texte normal, 3:1 grand texte/UI). Piège récurrent : `rgba(255,255,255,.3-.4)`
   sur fond sombre (`--ink`) tombe sous le seuil — utiliser `.6` ou plus. Autre piège :
   `--ink4` (#9C9588) est décoratif seulement, jamais pour du texte informatif ou une
   icône interactive — utiliser `--ink3`.
8. **Cibles tactiles** : boutons/liens interactifs ≥ 44×44px, ou padding compensé par
   `margin` négative pour ne pas gonfler l'encombrement visuel (pattern déjà utilisé
   sur les corbeilles/épingles icône-seule).
9. **Erreurs et contenu dynamique** : tout message d'erreur affiché conditionnellement
   a `role="alert"` ; tout flux qui s'actualise en direct (messages, notifications) a
   `aria-live="polite"`.
10. **SVG/emojis décoratifs** : `aria-hidden="true"` (+ `focusable="false"` sur les
    SVG) dès qu'une alternative textuelle existe déjà à côté.
11. **Mouvement** : toute nouvelle `@keyframes`/`transition` doit rester couverte par
    la règle globale `prefers-reduced-motion` dans [topo.css](../../../src/topo.css)
    (déjà en place — vérifier qu'aucune animation n'y échappe via `!important` ailleurs).

## Piège vécu : renommer sans casser les tests

Avant tout changement de texte visible, nom accessible, ou `aria-label`, grep le texte
ciblé dans `e2e/tests/*.spec.ts` et `src/**/*.test.tsx`. Playwright/Testing Library
matchent par nom accessible — changer un `aria-label` sur un bouton qui a déjà du texte
visible change son nom et peut casser un sélecteur `getByRole('button', {name: ...})`.
Cas rencontré : l'aria-label des jours du calendrier Fenêtre ne peut pas inclure l'année
ni un suffixe de statut car `e2e/tests/fenetre.spec.ts` fait un match exact et re-sélectionne
le même bouton après une action.

## Vérification après correction

```bash
npx tsc -p tsconfig.app.json --noEmit
npx vitest run
```

Puis vérif live en dev-bypass : Tab à travers la page, Escape sur toute modale ouverte,
lecture du DOM (`read_page` ou lecteur d'écran) pour confirmer les noms accessibles.
