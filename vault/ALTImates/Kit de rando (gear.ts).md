---
title: Kit de rando (gear.ts)
type: note
tags: [altimates, produit, kit, matériel]
updated: 2026-07-31
---

# Kit de rando (`gear.ts`)

Toute la liste du matériel vit dans **un seul fichier** : `src/core/constants/gear.ts`.
Le lire avant toute modification — il donne l'état exact des ids et catégories et évite les doublons.

## Deux structures de données

1. **`GEAR`** — `Record<'trek' | 'journee', { indispensable, recommande, facultatif }>`.
   Chaque item : `{ id, name, note, price, weight, worn?, weightEstimated?, links: [{l, u}] }`.
   Ces `links` (format court `l`/`u`) ne servent **qu'à l'e-mail du kit** (`kitEmail.ts`).
2. **`GEAR_INFO`** — `Record<id, { tip, links: [{label, url, favicon}] }>`.
   C'est ce qui alimente le bouton ℹ️ et les liens marchands **visibles dans l'app**
   (`src/features/kit/GearRow.tsx`) et dans le PDF (`kitPdf.ts`).

> Un même `id` peut apparaître dans plusieurs listes `GEAR` (typiquement `trek` **et** `journee`
> pour un article générique comme les chaussures ou la frontale) : une seule fiche `GEAR_INFO[id]`
> est alors partagée. Grep `id:'...'` avant de créer un nouvel id.

## Fonctionnalités liées

- **Budget estimé** : somme des prix, recalculée dynamiquement.
- **Poids du sac estimé** (v0.3.9) : chaque article porte une fourchette `weight` en grammes.
  Le drapeau **`worn`** exclut du total ce qui est porté sur soi (chaussures, bâtons, t-shirt,
  chaussettes, boxer mérinos, casquette), avec un astérisque nommant ce qui est retiré.
  Les articles marqués **`weightEstimated: true`** n'ont qu'un ordre de grandeur.
- **Triage express du starter pack** (v0.3.9, variante A validée le 30/07) : une réponse
  obligatoire par carte, boutons « Tout retrier » et « Réinitialiser mon kit ».
  Les articles « skip / à réfléchir » sont exclus du % complet, du « à acheter » et du poids.
- **Export PDF** (`kitPdf.ts`) et **e-mail du kit** (`kitEmail.ts`).
- **`SHARE_ITEMS`** dans `GearRow.tsx` = `['tente', 'rechaud', 'filtreeau', 'camelbak']` — les objets
  partageables en groupe.

## Ajouter un article

1. **Nom du produit** : si un lien est fourni, récupérer le nom exact via la page produit — ne pas
   deviner depuis l'URL. Amazon marche bien ; **Decathlon renvoie souvent un 403** → déduire le nom
   depuis le slug et le faire **confirmer** avant de l'intégrer.
2. **Nettoyer le lien** : retirer tout le tracking/affiliation (`utm_*`, `gclid`, `gbraid`, `dib*`,
   `ref_`, `linkCode`, `tag`, `mcid`, `hv*`). Si un tag d'affiliation perso était présent, le signaler
   avant de le retirer.
3. **Id** : slug court, minuscules, sans accents ni espaces (`pochefiltre`, `chaisecamp`,
   `adaptgazlindal`). Vérifier qu'il n'est pas pris.
4. **Mode + catégorie** : si ce n'est pas explicite, **proposer** un choix en l'expliquant plutôt que
   de trancher en silence — c'est une décision éditoriale.
5. **Prix** : fourchette réaliste au format `'X–Y€'` (tiret demi-cadratin, pas un trait d'union).
   Prix non visible sur la page ? Le dire, ne pas inventer.
6. Ajouter l'entrée dans `GEAR[mode][categorie]` **et** la fiche dans `GEAR_INFO[id]` :
   un `tip` de 2-3 phrases (utilité en rando, conseil d'usage concret, précaution si justifié) et
   1 à 3 liens marchands, dans l'ordre `Decathlon, Vinted, Amazon, LeBonCoin, IGN Boutique`
   (cohérent avec le tri de `GearRow.tsx`), chaque lien avec
   `favicon: 'https://www.google.com/s2/favicons?domain=<domaine>&sz=16'`.
7. **`npx tsc --noEmit`** — le fichier est entièrement typé, une faute de frappe casse la compilation.

## Modifier / supprimer / fusionner

- **Modifier** : `name`/`note`/`price` dans `GEAR[mode][categorie]` ; conseil et liens dans
  `GEAR_INFO[id]`. Un changement de `tip` s'applique à **tous** les modes qui partagent l'id.
- **Supprimer** : ne retirer que l'entrée du mode visé (« retire les crampons du kit journée » ne
  touche pas `trek`). Si c'était la dernière occurrence de l'id, supprimer aussi `GEAR_INFO[id]`
  (sinon fiche orpheline) et vérifier `SHARE_ITEMS`.
- **Fusionner** : garder un seul id (le plus générique/ancien), fusionner le meilleur des deux `tip`
  et `links` dans une fiche unique.

## Vérification

`npx tsc --noEmit` doit passer. **Le rendu visuel n'est pas vérifiable simplement** : l'app est
derrière l'écran de connexion Firebase, sans compte de test automatique. Le dire explicitement
plutôt que de prétendre avoir vérifié visuellement — le typecheck est la vraie vérification possible.

## État / dette

- Reclassements du 2026-07-30 : cuillère trek pliable et oreiller gonflable en **Indispensables**
  côté trek (l'oreiller reste hors du kit journée). La protection solaire était déjà en Recommandés
  dans les deux modes.
- **Poids à compléter** : les articles encore `weightEstimated` (chaussures, bâtons, chaussettes,
  serviette, poncho, power bank, solaire, crampons, savon, adaptateurs gaz, consommables) attendent
  un poids constaté. Decathlon renvoie un 403 au scraping → relevé à la main.
- **Code-splitting `jspdf` + `html2canvas`** (~600 kB) : utiles seulement pour l'export PDF,
  à charger en `import()` dynamique → voir [[Backlog et priorités]].
