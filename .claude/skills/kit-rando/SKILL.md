---
name: kit-rando
description: Ajoute, modifie, supprime ou fusionne des articles dans la liste du kit de randonnée de l'app Altimates (fichier src/core/constants/gear.ts). Utilise ce skill dès que l'utilisateur veut modifier le "kit de rando", la "liste du matériel", le "kit trek" ou "kit journée", ajouter un article/produit au kit (souvent via un lien Decathlon ou Amazon), changer la catégorie d'un article (indispensable/recommandé/facultatif), corriger un prix ou une note, ou fusionner deux articles similaires — même si l'utilisateur ne mentionne pas explicitement "gear.ts" ou le nom exact du fichier, et même s'il donne juste une liste de liens produits à intégrer.
---

# Gérer le kit de rando (gear.ts)

Toute la liste du kit vit dans un seul fichier : `src/core/constants/gear.ts`. Avant toute
modification, lis ce fichier — il n'est pas énorme et te donnera l'état exact des ids et
catégories existants, ce qui évite les doublons.

## Les deux structures de données

1. **`GEAR`** — `Record<'trek' | 'journee', { indispensable, recommande, facultatif }>`.
   Chaque item : `{ id, name, note, price, links: [{ l, u }] }`.
   Ces `links` (format court `l`/`u`) ne servent qu'à l'e-mail du kit (`kitEmail.ts`) —
   ce n'est PAS ce que l'utilisateur voit dans l'app.

2. **`GEAR_INFO`** — `Record<id, { tip, links: [{ label, url, favicon }] }>`.
   C'est ce qui alimente le bouton ℹ️ et les liens marchands affichés dans l'UI
   (`src/features/kit/GearRow.tsx`) et dans le PDF (`kitPdf.ts`). C'est la partie que
   l'utilisateur voit réellement quand il coche "Je prends" ou "Réfléchir" — ne l'oublie
   jamais quand tu ajoutes un article, sinon il n'aura ni conseil ni lien cliquable.

**Point important** : un même `id` peut apparaître dans plusieurs listes `GEAR` (typiquement
`trek` ET `journee` pour un article générique comme les chaussures ou la frontale). Dans ce
cas, une seule fiche `GEAR_INFO[id]` est partagée par toutes ces entrées. Avant de créer un
nouvel id, grep sur `id:'...'` pour vérifier qu'il n'existe pas déjà — sinon tu risques de
dupliquer une fiche conseil ou de casser le partage existant.

## Ajouter un article

1. **Nom du produit** : si l'utilisateur donne un lien, récupère le nom exact via WebFetch
   avant d'intégrer quoi que ce soit — ne devine pas depuis l'URL sans vérifier. Amazon
   fonctionne généralement bien. Decathlon renvoie souvent une 403 : dans ce cas, déduis le
   nom depuis le slug de l'URL et présente-le explicitement à l'utilisateur pour confirmation
   avant de l'ajouter au fichier.
2. **Nettoyer le lien** : retire tous les paramètres de tracking/affiliation avant de le
   coller dans le code (`utm_*`, `gclid`, `gbraid`, `dib*`, `ref_`, `linkCode`, `tag`, `mcid`,
   `hv*`...). Ne garde que le chemin produit. Si l'utilisateur avait un tag d'affiliation
   perso dans le lien, signale-le avant de le retirer au cas où il voudrait le garder.
3. **Choisir l'id** : slug court, minuscules, sans accents ni espaces, qui décrit l'objet
   (ex. `pochefiltre`, `chaisecamp`, `adaptgazlindal`). Vérifie qu'il n'est pas déjà pris.
4. **Choisir mode + catégorie** : si le mode (trek/journée) ou la catégorie
   (indispensable/recommandé/facultatif) n'est pas donné explicitement, propose un choix
   raisonnable en expliquant pourquoi plutôt que de trancher en silence — c'est une décision
   éditoriale, pas juste technique.
5. **Prix** : mets une fourchette réaliste en euros au format `'X–Y€'` (tiret demi-cadratin,
   pas un trait d'union). Si le prix n'était pas visible sur la page produit, dis-le
   explicitement à l'utilisateur plutôt que d'inventer un chiffre précis sans le signaler.
6. **Ajoute l'entrée dans `GEAR[mode][categorie]`** avec `name`, `note` (ou `null`), `price`,
   et `links: [{ l:'Decathlon', u:'...' }]` (ou Amazon).
7. **Ajoute la fiche dans `GEAR_INFO[id]`** avec :
   - un `tip` de 2-3 phrases utiles : pourquoi c'est utile en rando/trek, un conseil d'usage
     concret, et une précaution si l'objet le justifie (sécurité, entretien, compatibilité) ;
   - 1 à 3 liens marchands. Si tu en mets plusieurs, garde cet ordre de préférence pour
     rester cohérent avec le tri déjà fait dans `GearRow.tsx` :
     `Decathlon, Vinted, Amazon, LeBonCoin, IGN Boutique`. Format de chaque lien :
     `{ label, url, favicon: 'https://www.google.com/s2/favicons?domain=<domaine>&sz=16' }`.
8. **Vérifie** avec `npx tsc --noEmit` — le fichier est entièrement typé, une faute de frappe
   dans un champ casse la compilation.

## Modifier un article

Localise l'id via grep sur `name:'...'` ou `id:'...'`. Selon ce qui change :
- `name`, `note`, `price` → dans `GEAR[mode][categorie]`.
- conseil, liens marchands → dans `GEAR_INFO[id]`.
Si l'id est partagé entre plusieurs modes, un changement de `tip`/liens s'applique à tous
les modes qui le référencent (c'est voulu, une seule fiche par id).

## Supprimer un article

1. Grep l'id pour voir dans combien d'endroits il apparaît dans `GEAR`.
2. Ne retire que l'entrée `GEAR[mode][categorie]` visée si l'utilisateur ne demande la
   suppression que dans un mode précis (ex. "retire les crampons du kit journée" ne doit pas
   toucher `trek`).
3. Si c'était la dernière occurrence de l'id dans tout `GEAR`, supprime aussi
   `GEAR_INFO[id]` — sinon la fiche devient orpheline (elle reste dans le code mais n'est
   plus jamais affichée).
4. Vérifie `SHARE_ITEMS` dans `src/features/kit/GearRow.tsx` (`['tente', 'rechaud',
   'filtreeau', 'camelbak']`) — c'est la liste des ids d'objets partageables en groupe. Si tu
   supprimes définitivement un de ces ids, retire-le aussi de `SHARE_ITEMS`.

## Fusionner deux articles similaires

Garde un seul `id` (en général le plus générique/ancien), retire l'autre entrée de `GEAR`,
et fusionne le meilleur des deux `tip` + `links` dans une seule fiche `GEAR_INFO`. Comme pour
une suppression, ne supprime la fiche `GEAR_INFO` de l'id abandonné que si plus aucune entrée
`GEAR` ne le référence.

## Après chaque changement

- `npx tsc --noEmit` doit passer sans erreur avant de considérer la tâche terminée.
- Le rendu visuel du kit n'est pas facilement vérifiable dans le navigateur : l'app est
  derrière l'écran de connexion Firebase (Google / lien e-mail), donc pas de compte de test
  automatique disponible. Dis-le explicitement plutôt que de prétendre avoir vérifié
  visuellement — la vérification réelle qu'on peut faire ici, c'est le typecheck.
- Ne commit/push jamais sans confirmation explicite de l'utilisateur. Si une demande de
  commit arrive, travaille sur une branche dédiée (jamais directement sur `main`), avec un
  message de commit qui explique le *pourquoi* de l'ajout/retrait plutôt que de décrire
  mécaniquement le diff.

## Exemple complet (ajout d'un article Amazon)

Entrée `GEAR` (mode trek, facultatif) :
```ts
{id:'chaisecamp',name:'Chaise de camping pliante ultra-compacte MH500',note:'Confort au bivouac · compacte',price:'30–50€',links:[{l:'Decathlon',u:'https://www.decathlon.fr/p/chaise-basse-de-camping-pliante-et-ultra-compacte-500-m-vert/375910/c311c1m8975150'}]}
```

Fiche `GEAR_INFO` correspondante :
```ts
chaisecamp: {
  tip: "Chaise pliante ultra-compacte pour le confort au bivouac : se replie à la taille d'une gourde et pèse ~500g. Un vrai luxe léger après une longue journée de marche. Vérifier le poids et le volume replié — à réserver aux treks où le confort prime sur l'ultralight.",
  links: [{'label':'Decathlon','url':'https://www.decathlon.fr/p/chaise-basse-de-camping-pliante-et-ultra-compacte-500-m-vert/375910/c311c1m8975150','favicon':'https://www.google.com/s2/favicons?domain=decathlon.fr&sz=16'}]
}
```
