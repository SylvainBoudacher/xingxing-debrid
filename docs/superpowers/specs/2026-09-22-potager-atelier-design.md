# Potager - Sous-projet 6a : l'Atelier

**Vision :** [docs/superpowers/specs/2026-09-16-potager-automne-vision-design.md](2026-09-16-potager-automne-vision-design.md), section 2.8.
**Sous-projet précédent :** [docs/superpowers/specs/2026-09-21-potager-progression-design.md](2026-09-21-potager-progression-design.md).
**Maquette :** disposition A validée pendant le brainstorming (chaudron à gauche, recettes et détail à droite, stock en bandeau en bas).

## 1. Intention

Donner un usage aux fleurs cueillies et une prise sur la pousse : on brasse des préparations au chaudron, en temps réel, puis on les applique dans le champ pour accélérer une plante, arroser large, révéler une graine, changer sa couleur ou viser une variante.

Le sous-projet 6 est coupé en deux :

- **6a, Atelier** (ce document) : chaudron, 7 recettes, leurs effets, déblocage par l'arbre.
- **6b, Hybrides** : pollen d'affinité, 15 hybrides, sprites, Herbier. Hors de ce document.

Écartés de la liste de la vision : le philtre de rareté (changer la rareté change la durée de pousse, la plante reculerait d'étape) et l'épouvante-corbeaux (les corbeaux ne font aucun mal, l'effet serait nul ; l'épouvantail reste au sous-projet des outils).

## 2. Les recettes

Une recette consomme des **fleurs du panier désignées par rareté**, n'importe quelle espèce. Elle donne plusieurs doses.

| id             | Nom                    | Ingrédients         | Durée | Doses | Effet                                          |
| -------------- | ---------------------- | ------------------- | ----- | ----- | ---------------------------------------------- |
| `croissance`   | Élixir de croissance   | 3 communes          | 2 h   | 3     | La plante gagne une étape d'un coup            |
| `rosee`        | Rosée du matin         | 2 communes          | 1 h   | 2     | Arrose chaque plante du carré 3x3 visé         |
| `clairvoyance` | Élixir de clairvoyance | 2 communes          | 1 h   | 3     | Révèle l'espèce et la couleur avant l'éclosion |
| `teinture`     | Teinture               | 2 communes + 1 rare | 3 h   | 2     | Nouvelle couleur de même rareté, révélée       |
| `givre`        | Poudre de givre        | 2 communes + 1 rare | 4 h   | 2     | 50 % de chances que la plante éclose givrée    |
| `or`           | Poudre d'or            | 2 rares             | 5 h   | 2     | 50 % de chances que la plante éclose dorée     |
| `lune`         | Poudre de lune         | 1 épique + 1 rare   | 6 h   | 2     | 50 % de chances que la plante éclose lumineuse |

### 2.1 Ingrédients

- La rareté demandée est exacte : une fleur rare ne remplace pas une commune.
- `pickIngredients` choisit les fleurs les plus anciennes du panier pour chaque rareté, **en prenant celles qui portent une variante en dernier**.
- Les fleurs sont retirées du panier au lancement du brassage.

### 2.2 Chaudron

- Un seul brassage à la fois, pas d'annulation.
- Prêt quand `maintenant >= startedAt + durée`, même application fermée.
- Récupération à la main sur la page Atelier : les doses s'ajoutent à `inventory.potions`, le chaudron se vide, le compteur `brewed` augmente.

### 2.3 Effets dans le champ

Toutes les préparations s'appliquent avec l'outil Préparer, sur une case. Chaque application retire une dose et compte `potionsUsed`. L'effet est écrit **tout de suite** sur la case ; ce qu'il change reste caché jusqu'à l'éclosion, sauf pour la clairvoyance et la teinture qui révèlent.

- **Croissance** : cible une plante pas encore éclose. Ajoute `now` à `boosts`. Une plante à l'étape 3 éclot aussitôt.
- **Rosée** : cible n'importe quelle case du champ. Chaque plante du carré 3x3 centré sur la case reçoit un arrosage `[now, now + WATER_MS]`, comme à l'arrosoir, et compte un `watered`. Les cases hors du champ sont ignorées.
- **Clairvoyance** : cible une plante pas encore éclose et pas encore révélée. Pose `revealed: true`. L'infobulle affiche alors « Révélée : Dahlia bleu ». La variante reste cachée.
- **Teinture** : cible une plante pas encore éclose. Tire uniformément une autre couleur **de même rareté** parmi celles de l'espèce, l'écrit dans `seed.color` et pose `revealed: true`. La rareté ne change pas, la durée de pousse non plus.
- **Poudres** : ciblent une plante pas encore éclose. Tirage à 50 % ; en cas de réussite, `seed.variant` prend la variante de la poudre (givrée, dorée, lumineuse) et **remplace** celle qui s'y trouvait, pour ne pas révéler qu'il y en avait une. Plusieurs poudres sur une plante sont autant de tirages indépendants. Pas de pity.

### 2.4 Refus

Affichés tels quels dans l'infobulle, comme pour les autres outils :

- « choisis une préparation dans le panneau » ;
- « il ne t'en reste plus » ;
- « rien à faire pousser ici » (croissance, clairvoyance, teinture, poudres hors d'une plante) ;
- « déjà éclose » ;
- « déjà révélée » (clairvoyance) ;
- « aucune autre couleur de cette rareté » (teinture) ;
- « aucune plante autour » (rosée).

## 3. Déblocage par l'arbre

Un nouveau type de récompense :

```ts
| { kind: "recettes"; recipes: RecipeId[] }
```

`claim` n'écrit rien pour elle, comme pour `sachet-quotidien` : `unlocks.ts` gagne `knownRecipes(save): RecipeId[]`, déduit des nœuds récupérés. L'onglet Atelier et l'outil Préparer n'ont besoin d'aucun drapeau stocké.

Cinq nœuds greffés sur les branches existantes, l'arbre passe à 22 nœuds :

| id   | branche    | parent | x, y (indicatif) | titre                | tâche                        | récompense                     |
| ---- | ---------- | ------ | ---------------- | -------------------- | ---------------------------- | ------------------------------ |
| `a1` | jardin     | `j1`   | 290, 340         | Le chaudron          | compteur `pressed` >= 3      | recettes `croissance`, `rosee` |
| `a2` | jardin     | `j4`   | 215, 120         | Teinturier           | compteur `brewed` >= 3       | recette `teinture`             |
| `a3` | collection | `h3`   | 300, 60          | Seconde vue          | compteur `potionsUsed` >= 5  | recette `clairvoyance`         |
| `a4` | collection | `h4`   | 430, 65          | Premier givre        | compteur `brewed` >= 5       | recette `givre`                |
| `a5` | collection | `a4`   | 545, 95          | Poussières d'étoiles | compteur `potionsUsed` >= 15 | recettes `or`, `lune`          |

Les tâches de `a2` à `a5` supposent le chaudron. Si leur parent est récupéré avant `a1`, elles restent `ouvert` à 0 jusqu'à ce que l'atelier arrive : visible, sans blocage. Les positions sont ajustées dans l'aperçu à l'implémentation, le haut de l'arbre étant serré.

## 4. Modèle de données

La sauvegarde reste en **`version: 1`**, aucun champ racine n'est ajouté.

```ts
export type RecipeId = "croissance" | "rosee" | "clairvoyance" | "teinture" | "givre" | "or" | "lune";

inventory.potions: Partial<Record<RecipeId, number>>;           // existait en Record<string, number>
atelier: { brew: { recipe: RecipeId; startedAt: number } | null }; // existait, jamais utilisé

export interface PlantTile {
  // ...
  boosts?: number[];   // instants d'application de l'élixir de croissance
  revealed?: boolean;  // clairvoyance ou teinture
}
```

`parseSave` ne change pas : il n'inspecte ni `potions`, ni l'intérieur des cases. Une recette inconnue dans `atelier.brew` vide le chaudron au chargement ; une clé inconnue dans `potions` est ignorée à l'affichage.

## 5. Moteur

### 5.1 `core/catalog/recipes.ts`

Table de données seule.

```ts
export interface Recipe {
  id: RecipeId;
  name: string; // "Élixir de croissance"
  effect: string; // phrase courte pour le panneau et la page
  ingredients: Partial<Record<Rarity, number>>;
  durationMs: number;
  doses: number;
  icon: SpriteRef;
}
export const RECIPES: Recipe[];
export const recipeById: (id: RecipeId) => Recipe;
```

### 5.2 `core/atelier.ts`

```ts
pickIngredients(basket: Flower[], need: Partial<Record<Rarity, number>>): number[] | null
missingFor(save: GardenSave, id: RecipeId): Partial<Record<Rarity, number>>
startBrew(save: GardenSave, id: RecipeId, now: number): GardenSave | null
brewStatus(save: GardenSave, now: number): { recipe: RecipeId; remaining: number; ready: boolean } | null
collectBrew(save: GardenSave, now: number): GardenSave | null
```

- `pickIngredients` renvoie les index retenus, ou `null` s'il manque des fleurs.
- `startBrew` renvoie `null` si le chaudron est occupé, si la recette n'est pas dans `knownRecipes`, ou s'il manque des fleurs.
- `collectBrew` renvoie `null` si le chaudron est vide ou pas prêt.

### 5.3 `core/potions.ts`

```ts
planPotion(save: GardenSave, key: TileKey, recipe: RecipeId | null, now: number, rng: Rng, rain: RainSource): Plan
```

Même `Plan` que les autres outils (libellé, raison, `apply`). `planAction` gagne le cas `"preparer"` et lui délègue, avec une nouvelle option `potion` dans `PlanOptions`. `actions.ts` ne grossit pas. `Tool` et `TOOLS` gagnent `"preparer"`.

Effets renvoyés par `apply` : `burst` en `water` sur chaque plante arrosée par la rosée, `burst` en `sparkles` (nouveau type de particule) pour les autres, et un toast :

- croissance : « La plante a grandi d'une étape » ;
- clairvoyance : « C'est un dahlia bleu » ;
- teinture : « Nouvelle couleur : dahlia rose » ;
- poudres : « Poudre répandue, surprise à l'éclosion ».

### 5.4 `growth.ts`

- Chaque instant de `boosts` antérieur à `now` ajoute `GROWTH_MS[rareté] / 4` au temps efficace, d'un coup, à cet instant.
- `realTimeFor` tient compte de ces sauts : un saut peut faire franchir un seuil sans temps réel écoulé.
- **Belle plante** : une étape dont l'intervalle réel est vide (entièrement sautée par l'élixir) est ignorée. Une étape en partie vécue doit avoir été mouillée, comme aujourd'hui.

### 5.5 Autres modules

- `counters.ts` : `brewed`, `potionsUsed`.
- `catalog/tree.ts` : récompense `recettes`, les cinq nœuds.
- `progression.ts` : `claim` accepte `recettes` sans rien écrire.
- `unlocks.ts` : `knownRecipes`.
- `target.ts` : plante révélée, ligne « Révélée : <nom de la fleur> » à la place de « Espèce et couleur inconnues ».
- `labels.ts` : libellés des préparations si le catalogue n'y suffit pas.

### 5.6 Réducteur

Deux actions :

```ts
| { type: "brew"; recipe: RecipeId; now: number }
| { type: "collect-brew"; now: number }
```

Toutes deux ignorées si le moteur renvoie `null`. L'application d'une préparation passe par le chemin des outils du champ, déjà en place.

## 6. Interface

### 6.1 Onglet et page Atelier

Cinquième onglet, après Progression, affiché seulement si `knownRecipes` n'est pas vide. Pastille « 1 » quand le brassage est prêt.

Fichiers dans `src/garden/ui/atelier/`, un composant par fichier :

- `AtelierPage.tsx` : grille, chaudron à gauche, recettes à droite, stock en bas. Garde la recette sélectionnée.
- `Cauldron.tsx` : sprite du chaudron, bulles animées par `motion/react` pendant le brassage, nom de la préparation, barre d'avancement, « Prêt dans ~1 h 10 ». Prêt : bouton « Récupérer ». Vide : « Le chaudron est vide ».
- `RecipeList.tsx` : les 7 recettes. Verrouillées grisées avec « Débloquée par : <titre du nœud> ».
- `RecipeDetail.tsx` : effet, ingrédients avec l'état du panier (« 3 communes (5 au panier) »), durée, doses, bouton « Brasser ». Désactivé avec sa raison : « Le chaudron est occupé », « Il manque 1 fleur rare ».
- `PotionStock.tsx` : bandeau des préparations en stock.
- Bouton de développement « Finir le brassage » (recule `startedAt`), sur le modèle de `devSachets.ts`.

Le temps restant suit le `now` de `GardenApp` (tick d'une minute), suffisant pour des durées en heures.

### 6.2 Champ

- Outil **Préparer** (`preparer`), icône `fiole`. Présent dans la barre seulement si `inventory.potions` contient au moins une dose, comme l'outil Décor avec l'inventaire de décor.
- `PotionPicker.tsx` dans le panneau latéral : préparations en stock, nombre, effet court. Affiché en tête du panneau quand l'outil Préparer est actif, comme `DecorPicker` pour l'outil Décor.
- Surbrillance : `Highlight.set` accepte une liste de cases ; la rosée souligne tout le carré 3x3 (cases du champ seulement).
- Particules : nouveau type `sparkles`.

### 6.3 Sprites

`src/garden/sprites/atelier.ts`, dessinés par code comme les outils :

- `fiole` : flacon teinté par la gamme de couleur de la recette (élixirs, teinture, rosée) ;
- `poudre` : petit pot de poudre teinté (givre, or, lune) ;
- `chaudron` : pour la page Atelier.

## 7. Erreurs

- `startBrew`, `collectBrew` renvoient `null` quand l'action est impossible ; le réducteur ignore, l'interface désactive déjà le bouton.
- `planPotion` renvoie un refus motivé, affiché dans l'infobulle.
- Recette inconnue dans `atelier.brew` : chaudron vidé au chargement. Clé inconnue dans `potions` : ignorée à l'affichage.

## 8. Tests

- `atelier.test.ts` : lancer un brassage ; refus (chaudron occupé, ingrédients manquants, recette verrouillée) ; `pickIngredients` qui prend les fleurs à variante en dernier ; brassage prêt ou pas ; récupération et compteur `brewed`.
- `potions.test.ts` : chaque effet et chaque refus ; rosée sur un bord du champ ; teinture limitée à la même rareté et refus sans autre couleur ; poudre à 50 % avec hasard injecté et remplacement de la variante ; clairvoyance déjà révélée ; dose retirée et `potionsUsed`.
- `growth.test.ts` : un boost fait gagner une étape ; plusieurs boosts ; boost à l'étape 3 qui fait éclore ; étape sautée ignorée pour la belle plante.
- `catalog/recipes.test.ts` : identifiants uniques, ingrédients, durées et doses positifs.
- `catalog/tree.test.ts` : chaque recette débloquée par exactement un nœud, récompenses `recettes` vers des recettes existantes.
- `unlocks.test.ts` : `knownRecipes` avant et après `a1`, `a5`.
- `gardenReducer.test.ts` : `brew` et `collect-brew`.
- `accents.test.ts` : ajout de `debloquee`, `eclosion`, `elixir`, `occupe`, `preparation`, `preparations`, `preparer`, `revelee`, `rosee`, `verrouillee` à la liste `WRONG`.

Page, chaudron, surbrillance 3x3 et particules se vérifient dans l'aperçu navigateur.

## 9. Hors périmètre

- Hybrides et pollen d'affinité (sous-projet 6b).
- Philtre de rareté, épouvante-corbeaux.
- Plusieurs chaudrons, file de brassages, annulation.
- Outils améliorés, bonus de pousse (sous-projet des outils).
