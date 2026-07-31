---
name: audit-responsive
description: Audit responsive mobile d'ALTImates (iPhone SE/12-14/Pro Max, Android 360-412px) — à relancer après tout ajout de page, modale, grille ou formulaire. Couvre débordement horizontal, safe-area iPhone, zoom iOS, cibles tactiles.
---

# Audit responsive mobile ALTImates (360–430px)

Basé sur l'audit complet du 2026-07-19 (29 constats, tous corrigés — carte Trello
6a5cc983aed8b84ea7109036). Sert de checklist pour détecter les régressions, pas juste
de compte-rendu historique. Cible : iPhone SE (375px), 12/13/14 (390px), Pro Max (430px),
Android (360–412px).

## Quand relancer

- Avant un merge qui ajoute une page, une modale, une grille/carte, ou un formulaire.
- Dès qu'un retour utilisateur mentionne un débordement, un élément coupé, ou un zoom
  intempestif sur mobile.

## Méthode

Lire le fichier concerné en entier (TSX + styles inline) et [topo.css](../../../src/topo.css)
autour des classes touchées. Vérifier :

1. **Débordement horizontal** : aucune largeur fixe en px qui dépasse 360px de contenu ;
   toute colonne flex (`.rcard-main`, etc.) a `min-width:0` ; tout texte saisi par
   l'utilisateur (nom, message, commentaire) est sous une règle `overflow-wrap:anywhere`
   (déjà globale dans topo.css pour les classes de texte connues — ajouter la nouvelle
   classe à la liste si besoin plutôt que dupliquer la règle).
2. **Zoom auto iOS** : tout nouvel `input`/`select`/`textarea` doit avoir `font-size`
   effectif ≥ 16px (CSS de classe ou inline) — sinon Safari zoome au focus et décale
   la mise en page.
3. **Safe-area iPhone** : tout élément `position:fixed` ancré à un bord (bottom surtout)
   doit intégrer `env(safe-area-inset-*)` dans son padding/bottom — le meta viewport a
   déjà `viewport-fit=cover` (index.html), sinon `env()` vaut toujours 0.
4. **Popovers/dropdowns** : un calendrier/menu qui s'ouvre à droite d'une grille à 2+
   colonnes doit être testé en dev-bypass à 360px — l'ancrage `left:0` déborde souvent
   dans la 2e colonne (piège vécu sur `DateField`, corrigé par ancrage `right:0` +
   `min-width:0` sur les cellules de `.form-row2`/`.form-row3`).
5. **Nav/tabs** : toute nouvelle entrée de navigation doit être vérifiée à 360px — si
   ça déborde, préférer un libellé court affiché (`short`) en gardant le nom accessible
   complet en `aria-label`, plutôt que de casser le layout ou de changer le nom que les
   tests e2e attendent.
6. **Cibles tactiles** : ≥ 44×44px, ou padding + `margin` négative pour ne pas changer
   l'encombrement visuel. `touch-action:manipulation` sur les éléments à tap répété
   (grille de calendrier, etc.) pour éviter le double-tap zoom.
7. **Modales/bottom-sheets** : `max-height` en `dvh` (pas seulement `vh`, la barre
   d'adresse mobile fausse `vh`), `overflow-y:auto`, `overscroll-behavior:contain`,
   et scroll-lock du body pendant l'ouverture (`body:has(.modal-wrap.open)` déjà en
   place — étendre si une nouvelle modale ne passe pas par [Modal.tsx](../../../src/components/Modal.tsx)).
8. **Hover** : tout nouveau `:hover` doit être dans `@media (hover:hover)` pour éviter
   le "sticky hover" après un tap sur mobile.
9. **Formulaires + clavier virtuel** : un champ en bas d'une modale doit rester atteignable
   au focus (`scroll-margin-bottom` déjà posé sur `.form-input` dans `.modal`).

## Vérification après correction

```bash
npx tsc -p tsconfig.app.json --noEmit
npm run build
```

Puis vérif live en dev-bypass (Browser pane), aux 3 largeurs 360/375/430px :

```js
// dans javascript_tool, sur chaque onglet touché
(() => { const d = document.documentElement; return JSON.stringify({ overflow: d.scrollWidth - d.clientWidth }) })()
```

`overflow` doit être `0` partout. Zéro tolérance : un `overflow` non nul = régression
à corriger avant de livrer, pas un warning à ignorer.
