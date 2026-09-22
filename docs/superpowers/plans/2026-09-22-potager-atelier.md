# Potager - Sous-projet 6a : l'Atelier

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter l'Atelier au Potager : un chaudron qui brasse en temps réel des préparations à partir des fleurs du panier, sept recettes débloquées par l'arbre, et un outil Préparer qui applique leurs effets dans le champ.

**Architecture:** La logique est pure dans `src/garden/core/` : catalogue des recettes, chaudron (`atelier.ts`), effets dans le champ (`potions.ts`, branché sur `planAction` comme les autres outils), sauts de pousse dans `growth.ts`, déblocage déduit des nœuds récupérés (`unlocks.ts`). L'interface ajoute un onglet Atelier (disposition A : chaudron à gauche, recettes à droite, stock en bas) et un huitième outil dans le Champ. Le rendu three.js ne change que pour une surbrillance multi-cases et un type de particule.

**Tech Stack:** TypeScript, React 19, `motion/react`, three.js, Vitest, Tailwind.

**Spec:** [docs/superpowers/specs/2026-09-22-potager-atelier-design.md](../specs/2026-09-22-potager-atelier-design.md)

## Global Constraints

- Tout texte affiché est en français **correctement accentué** ("préparation", "révélée", "rosée", "éclosion"). Les identifiants restent ASCII (`preparer`, `rosee`, `revealed`). `src/lib/accents.test.ts` est le garde-fou : on complète sa liste `WRONG`, on ne la désactive jamais.
- Pas de tiret long, pas de guillemets typographiques dans le code : tirets simples et guillemets droits.
- `src/garden/core/` n'importe ni React ni three.js.
- Aucun import depuis `src/game/` (le jeu des canards).
- Le hasard est toujours injecté (`Rng = () => number`), jamais `Math.random` dans `core/`.
- La sauvegarde reste en `version: 1`. Une sauvegarde existante doit continuer à se charger.
- Un fichier par composant React ; helpers purs et constantes dans des modules voisins.
- Commandes de vérification : `bun run test`, `bunx tsc --noEmit`, `bun run lint`.
- Chaque commit se termine par la ligne `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` (second `-m` dans les commandes ci-dessous).
- Aperçu navigateur : `bun run dev` (port 1420, ou configuration `vite-alt` sur 4180 si pris), fenêtre Potager ouverte par `?window=garden`.

## Écarts assumés par rapport à la spec

- Toasts de la clairvoyance et de la teinture : "Révélée : Dahlia bleu" et "Nouvelle couleur : Dahlia rose", avec `flowerName` tel qu'il existe, au lieu de "C'est un dahlia bleu" qui demanderait un article et une minuscule par espèce.
- Le libellé d'une préparation dans l'infobulle est le nom de la recette ("Élixir de croissance"), pour le refus comme pour l'action.
- Ajouts de développement, sur le modèle des Sachets : dans la barre de dev du Champ, un bouton qui débloque l'atelier et donne 3 doses de chaque préparation ; dans la page, "Dev : finir le brassage". Les trois transformations vivent dans `ui/atelier/devAtelier.ts`.
- Un toast annonce les doses à la récupération ("Élixir de croissance : 3 doses récupérées").
- La spec place `RecipeId` dans `types.ts` ; il est défini dans `core/catalog/recipes.ts` et réexporté par `types.ts`, comme `SpeciesId` et `ColorId`.
- `ui/atelier/styles.ts` (classes du panneau et du titre) et `ui/atelier/CauldronBubbles.tsx` (bulles animées) s'ajoutent pour respecter "un composant par fichier".

## Fichiers

| Fichier                                                                                       | Rôle                                                         |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `src/garden/sprites/atelier.ts` (nouveau)                                                     | Sprites `fiole`, `poudre`, `chaudron`                        |
| `src/garden/sprites/sprite.ts`                                                                | Enregistre les sprites de l'atelier                          |
| `src/garden/core/catalog/recipes.ts` (nouveau)                                                | Table des 7 recettes, `RecipeId`, `recipeById`, `isRecipeId` |
| `src/garden/core/types.ts`                                                                    | `boosts`, `revealed`, types de `potions` et `atelier.brew`   |
| `src/garden/core/counters.ts`                                                                 | `brewed`, `potionsUsed`                                      |
| `src/garden/core/save.ts`                                                                     | Vide un chaudron à recette inconnue                          |
| `src/garden/core/growth.ts`                                                                   | Sauts de pousse de l'élixir, belle plante                    |
| `src/garden/core/catalog/tree.ts`                                                             | Récompense `recettes`, nœuds `a1` à `a5`                     |
| `src/garden/core/unlocks.ts`                                                                  | `knownRecipes`, `recipeNode`                                 |
| `src/garden/core/progression.ts`                                                              | `claim` accepte `recettes`                                   |
| `src/garden/core/atelier.ts` (nouveau)                                                        | Chaudron : ingrédients, brassage, récupération               |
| `src/garden/core/labels.ts`                                                                   | `ingredientLabel`, `missingLabel`                            |
| `src/garden/core/potions.ts` (nouveau)                                                        | `planPotion`, `roseeArea`                                    |
| `src/garden/core/actions.ts`                                                                  | Outil `preparer`, particule `sparkles`, option `potion`      |
| `src/garden/core/target.ts`                                                                   | Ligne "Révélée : ..."                                        |
| `src/garden/ui/gardenReducer.ts`                                                              | Actions `brew`, `collect-brew`                               |
| `src/garden/render/particles.ts`                                                              | Particule `sparkles`                                         |
| `src/garden/render/highlight.ts`, `render/interaction.ts`                                     | Surbrillance de plusieurs cases                              |
| `src/garden/ui/toolMeta.ts`, `FieldView.tsx`, `SidePanel.tsx`, `hover.ts`, `GardenDevBar.tsx` | Outil Préparer                                               |
| `src/garden/ui/PotionPicker.tsx` (nouveau)                                                    | Choix de la préparation dans le panneau                      |
| `src/garden/ui/atelier/*` (nouveaux)                                                          | Page Atelier et ses composants, `devAtelier.ts`, `styles.ts` |
| `src/garden/ui/GardenTabs.tsx`, `GardenApp.tsx`                                               | Onglet Atelier                                               |
| `src/lib/accents.test.ts`                                                                     | Nouveaux mots dans `WRONG`                                   |

---

### Task 1 : Sprites de l'atelier

**Files:**

- Create: `src/garden/sprites/atelier.ts`
- Modify: `src/garden/sprites/sprite.ts`
- Test: `src/garden/sprites/sprite.test.ts`

**Interfaces:**

- Produces: `ATELIER_DRAW` avec les clés `fiole`, `poudre`, `chaudron` ; ces trois noms deviennent des `SpriteName` valides (`{ name: "fiole", color: "lime" }`). `fiole` et `poudre` sont teintés par `color`, `chaudron` l'ignore.

- [ ] **Step 1 : Écrire le test qui échoue**

Dans `src/garden/sprites/sprite.test.ts`, dans le `describe("renderSpriteBuf")`, ajouter :

```ts
it("dessine la fiole, le pot de poudre et le chaudron", () => {
  for (const name of ["fiole", "poudre", "chaudron"] as const) {
    const b = renderSpriteBuf({ name, color: "blue" });
    expect([b.w, b.h]).toEqual([48, 72]);
    expect(opaque(b)).toBeGreaterThan(150);
  }
});

it("teinte la fiole selon la couleur demandée", () => {
  const blue = renderSpriteBuf({ name: "fiole", color: "blue" }).c.join();
  const lime = renderSpriteBuf({ name: "fiole", color: "lime" }).c.join();
  expect(blue).not.toBe(lime);
});
```

- [ ] **Step 2 : Vérifier qu'il échoue**

Run: `bun run test src/garden/sprites/sprite.test.ts`
Expected: FAIL (erreur de type ou `draw is not a function` pour `fiole`).

- [ ] **Step 3 : Dessiner les sprites**

Créer `src/garden/sprites/atelier.ts` :

```ts
import { PAL } from "./palette";
import { ell, put, rampAt, sphere, stem, type DrawFn } from "./raster";

// `C` teinte le contenu : liquide de la fiole, poudre du pot.
export const ATELIER_DRAW = {
  fiole(b, k, C) {
    // panse en verre : liquide en bas, reflet clair en haut
    ell(b, k, 16, 39, 7.5, 7.5, 0, (nx, ny, _d, edge) => {
      if (edge) return PAL.white[1];
      if (ny < -0.15) return nx < -0.3 && ny < -0.4 ? PAL.white[3] : PAL.white[2];
      return rampAt(C, 0.75 - ny * 0.45 - nx * 0.2);
    });
    stem(b, k, 16, 32, 16, 25, 3.2, PAL.white);
    ell(b, k, 16, 24, 2.6, 1.8, 0, sphere(PAL.wood, 0.2));
    put(b, Math.round(12.5 * k), Math.round(36 * k), PAL.white[3]);
  },
  poudre(b, k, C) {
    ell(b, k, 16, 37.5, 6.5, 3.5, 0, sphere(C, 0.35));
    ell(b, k, 16, 42, 8.5, 5, 0, sphere(PAL.wood));
    ell(b, k, 16, 38.5, 8.5, 1.4, 0, () => PAL.wood[3]);
    for (const [x, y] of [
      [11, 31],
      [20, 29],
      [16, 27],
    ])
      put(b, Math.round(x * k), Math.round(y * k), C[3]);
  },
  chaudron(b, k) {
    stem(b, k, 8, 47, 10, 40, 1.6, PAL.metal);
    stem(b, k, 24, 47, 22, 40, 1.6, PAL.metal);
    ell(b, k, 16, 38, 12, 8.5, 0, sphere(PAL.metal, -0.1));
    ell(b, k, 16, 30.5, 12.5, 2.6, 0, () => PAL.metal[3]);
    ell(b, k, 16, 30.8, 10.5, 1.8, 0, sphere(PAL.green, 0.4));
  },
} satisfies Record<string, DrawFn>;
```

Dans `src/garden/sprites/sprite.ts` :

```ts
import { ATELIER_DRAW } from "./atelier";
```

```ts
export type SpriteName =
  | keyof typeof SPECIES_DRAW
  | keyof typeof STAGE_DRAW
  | keyof typeof DECOR_DRAW
  | keyof typeof TOOL_DRAW
  | keyof typeof ATELIER_DRAW
  | "arbre";
```

et dans `renderSpriteBuf`, prolonger la chaîne :

```ts
const draw =
  SPECIES_DRAW[ref.name as keyof typeof SPECIES_DRAW] ??
  STAGE_DRAW[ref.name as keyof typeof STAGE_DRAW] ??
  DECOR_DRAW[ref.name as keyof typeof DECOR_DRAW] ??
  TOOL_DRAW[ref.name as keyof typeof TOOL_DRAW] ??
  ATELIER_DRAW[ref.name as keyof typeof ATELIER_DRAW];
```

- [ ] **Step 4 : Vérifier que le test passe**

Run: `bun run test src/garden/sprites/sprite.test.ts && bunx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5 : Commit**

```bash
git add src/garden/sprites/atelier.ts src/garden/sprites/sprite.ts src/garden/sprites/sprite.test.ts
git commit -m "feat(potager): sprites de la fiole, du pot de poudre et du chaudron" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2 : Catalogue des recettes, modèle et sauvegarde

**Files:**

- Create: `src/garden/core/catalog/recipes.ts`
- Create: `src/garden/core/catalog/recipes.test.ts`
- Modify: `src/garden/core/types.ts`
- Modify: `src/garden/core/counters.ts`
- Modify: `src/garden/core/save.ts`
- Test: `src/garden/core/save.test.ts`
- Modify: `src/lib/accents.test.ts`

**Interfaces:**

- Consumes: sprites `fiole` et `poudre` (Task 1).
- Produces:
  - `type RecipeId = "croissance" | "rosee" | "clairvoyance" | "teinture" | "givre" | "or" | "lune"` (exporté par `catalog/recipes.ts` et réexporté par `types.ts`) ;
  - `interface Recipe { id; name; effect; ingredients: Partial<Record<Rarity, number>>; durationMs; doses; icon: SpriteRef }` ;
  - `RECIPES: Recipe[]`, `recipeById(id: RecipeId): Recipe`, `isRecipeId(v: unknown): v is RecipeId` ;
  - `PlantTile.boosts?: number[]`, `PlantTile.revealed?: boolean` ;
  - `GardenSave["inventory"]["potions"]: Partial<Record<RecipeId, number>>` ;
  - `GardenSave["atelier"]: { brew: { recipe: RecipeId; startedAt: number } | null }` ;
  - `CounterId` gagne `"brewed"` et `"potionsUsed"`.

- [ ] **Step 1 : Écrire les tests qui échouent**

Créer `src/garden/core/catalog/recipes.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { isRecipeId, recipeById, RECIPES } from "./recipes";

describe("catalogue des recettes", () => {
  it("compte 7 recettes aux identifiants uniques", () => {
    expect(RECIPES).toHaveLength(7);
    expect(new Set(RECIPES.map((r) => r.id)).size).toBe(7);
  });

  it("demande des ingrédients, une durée et des doses positifs", () => {
    for (const r of RECIPES) {
      const counts = Object.values(r.ingredients);
      expect(counts.length).toBeGreaterThan(0);
      for (const n of counts) expect(n).toBeGreaterThan(0);
      expect(r.durationMs).toBeGreaterThan(0);
      expect(r.doses).toBeGreaterThan(0);
      expect(r.name.length).toBeGreaterThan(0);
      expect(r.effect.length).toBeGreaterThan(0);
    }
  });

  it("retrouve une recette par son identifiant", () => {
    expect(recipeById("teinture").ingredients).toEqual({ commune: 2, rare: 1 });
    expect(isRecipeId("lune")).toBe(true);
    expect(isRecipeId("philtre")).toBe(false);
    expect(isRecipeId(3)).toBe(false);
  });
});
```

Dans `src/garden/core/save.test.ts`, dans le `describe("parseSave")`, ajouter :

```ts
it("garde un brassage valide et vide un chaudron à recette inconnue", () => {
  const s = createStarterSave();
  const brewing = { ...s, atelier: { brew: { recipe: "rosee", startedAt: 42 } } };
  expect(parseSave(brewing)?.atelier.brew).toEqual({ recipe: "rosee", startedAt: 42 });
  const odd = { ...s, atelier: { brew: { recipe: "philtre", startedAt: 42 } } };
  expect(parseSave(odd)?.atelier.brew).toBeNull();
});
```

- [ ] **Step 2 : Vérifier qu'ils échouent**

Run: `bun run test src/garden/core/catalog/recipes.test.ts src/garden/core/save.test.ts`
Expected: FAIL (module `./recipes` introuvable ; le chaudron à recette inconnue est gardé tel quel).

- [ ] **Step 3 : Écrire le catalogue**

Créer `src/garden/core/catalog/recipes.ts` :

```ts
import type { SpriteRef } from "../../sprites/sprite";
import { HOUR } from "../time";
import type { Rarity } from "../types";

export type RecipeId =
  "croissance" | "rosee" | "clairvoyance" | "teinture" | "givre" | "or" | "lune";

export interface Recipe {
  id: RecipeId;
  name: string;
  // phrase courte pour le panneau du champ et la page Atelier
  effect: string;
  ingredients: Partial<Record<Rarity, number>>;
  durationMs: number;
  doses: number;
  icon: SpriteRef;
}

// Ordre du catalogue : celui de la page Atelier.
export const RECIPES: Recipe[] = [
  {
    id: "croissance",
    name: "Élixir de croissance",
    effect: "La plante gagne une étape d'un coup.",
    ingredients: { commune: 3 },
    durationMs: 2 * HOUR,
    doses: 3,
    icon: { name: "fiole", color: "lime" },
  },
  {
    id: "rosee",
    name: "Rosée du matin",
    effect: "Arrose toutes les plantes d'un carré de 3 x 3 cases.",
    ingredients: { commune: 2 },
    durationMs: HOUR,
    doses: 2,
    icon: { name: "fiole", color: "blue" },
  },
  {
    id: "clairvoyance",
    name: "Élixir de clairvoyance",
    effect: "Révèle l'espèce et la couleur d'une plante avant l'éclosion.",
    ingredients: { commune: 2 },
    durationMs: HOUR,
    doses: 3,
    icon: { name: "fiole", color: "violet" },
  },
  {
    id: "teinture",
    name: "Teinture",
    effect: "Change la couleur d'une plante pour une autre de même rareté, et la révèle.",
    ingredients: { commune: 2, rare: 1 },
    durationMs: 3 * HOUR,
    doses: 2,
    icon: { name: "fiole", color: "pink" },
  },
  {
    id: "givre",
    name: "Poudre de givre",
    effect: "Une chance sur deux que la plante éclose givrée.",
    ingredients: { commune: 2, rare: 1 },
    durationMs: 4 * HOUR,
    doses: 2,
    icon: { name: "poudre", color: "white" },
  },
  {
    id: "or",
    name: "Poudre d'or",
    effect: "Une chance sur deux que la plante éclose dorée.",
    ingredients: { rare: 2 },
    durationMs: 5 * HOUR,
    doses: 2,
    icon: { name: "poudre", color: "yellow" },
  },
  {
    id: "lune",
    name: "Poudre de lune",
    effect: "Une chance sur deux que la plante éclose lumineuse.",
    ingredients: { epique: 1, rare: 1 },
    durationMs: 6 * HOUR,
    doses: 2,
    icon: { name: "poudre", color: "lilac" },
  },
];

const BY_ID = new Map(RECIPES.map((r) => [r.id, r]));

export const isRecipeId = (v: unknown): v is RecipeId =>
  typeof v === "string" && BY_ID.has(v as RecipeId);

export const recipeById = (id: RecipeId): Recipe => BY_ID.get(id)!;
```

- [ ] **Step 4 : Mettre à jour le modèle, les compteurs et la sauvegarde**

Dans `src/garden/core/types.ts`, en tête :

```ts
import type { ColorId } from "./catalog/colors";
import type { RecipeId } from "./catalog/recipes";
import type { SpeciesId } from "./catalog/species";

export type { ColorId, RecipeId, SpeciesId };
```

Dans `PlantTile`, après `bloomedAt` :

```ts
  // instants d'application de l'élixir de croissance : chacun fait gagner une étape
  boosts?: number[];
  // clairvoyance ou teinture : l'infobulle montre l'espèce et la couleur
  revealed?: boolean;
```

Dans `GardenSave`, remplacer `potions: Record<string, number>;` par `potions: Partial<Record<RecipeId, number>>;` et la ligne `atelier` par :

```ts
  atelier: { brew: { recipe: RecipeId; startedAt: number } | null };
```

Dans `src/garden/core/counters.ts`, compléter l'union :

```ts
  | "bloomed"
  | "nightBloom"
  | "brewed"
  | "potionsUsed";
```

Dans `src/garden/core/save.ts`, importer `import { isRecipeId } from "./catalog/recipes";`, puis juste avant le `return` final :

```ts
// une recette retirée du catalogue ne doit pas bloquer le chaudron pour toujours
const brew =
  isObject(atelier.brew) &&
  isRecipeId(atelier.brew.recipe) &&
  typeof atelier.brew.startedAt === "number"
    ? { recipe: atelier.brew.recipe, startedAt: atelier.brew.startedAt }
    : null;
```

et ajouter `atelier: { brew },` dans l'objet renvoyé (après `progress`).

- [ ] **Step 5 : Compléter la liste `WRONG`**

Dans `src/lib/accents.test.ts`, insérer dans le tableau `WRONG`, en respectant l'ordre alphabétique : `"debloquee"`, `"eclosion"`, `"elixir"`, `"occupe"`, `"preparation"`, `"preparations"`, `"preparer"`, `"revelee"`, `"rosee"`, `"verrouillee"`.

- [ ] **Step 6 : Vérifier**

Run: `bun run test && bunx tsc --noEmit`
Expected: PASS. Si `tsc` signale un lecteur de `inventory.potions` ou de `atelier.brew` qui attendait une chaîne libre, le typer avec `RecipeId`.

- [ ] **Step 7 : Commit**

```bash
git add src/garden/core/catalog/recipes.ts src/garden/core/catalog/recipes.test.ts src/garden/core/types.ts src/garden/core/counters.ts src/garden/core/save.ts src/garden/core/save.test.ts src/lib/accents.test.ts
git commit -m "feat(potager): catalogue des sept recettes de l'atelier" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3 : Pousse accélérée par l'élixir

**Files:**

- Modify: `src/garden/core/growth.ts`
- Test: `src/garden/core/growth.test.ts`

**Interfaces:**

- Consumes: `PlantTile.boosts?: number[]` (Task 2).
- Produces: `effectiveMs` et `growthOf` comptent chaque boost `b` avec `sownAt <= b <= now` comme `GROWTH_MS[rareté] / 4` gagnés d'un coup à l'instant `b`. Signatures inchangées.

- [ ] **Step 1 : Écrire les tests qui échouent**

Dans `src/garden/core/growth.test.ts`, ajouter un helper après `plant` :

```ts
const boosted = (boosts: number[], watered: Interval[] = []): PlantTile => ({
  ...plant(watered),
  boosts,
});
```

puis un nouveau bloc :

```ts
describe("élixir de croissance", () => {
  it("fait gagner une étape d'un coup, à l'instant où il est versé", () => {
    const p = boosted([T0 + HOUR]);
    expect(effectiveMs(p, T0 + HOUR - 1, noRain)).toBe(HOUR - 1);
    expect(effectiveMs(p, T0 + HOUR, noRain)).toBe(3 * HOUR);
    expect(growthOf(p, T0 + HOUR, noRain)).toMatchObject({ stage: 1, stageProgress: 0.5 });
  });

  it("ignore un élixir postérieur à l'instant demandé", () => {
    expect(effectiveMs(boosted([T0 + 5 * HOUR]), T0 + 2 * HOUR, noRain)).toBe(2 * HOUR);
  });

  it("cumule plusieurs élixirs", () => {
    expect(growthOf(boosted([T0, T0 + HOUR]), T0 + HOUR, noRain).stage).toBe(2);
  });

  it("fait éclore une plante au stade bouton", () => {
    const p = boosted([T0 + 7 * HOUR]);
    expect(growthOf(p, T0 + 7 * HOUR - 1, noRain).stage).toBe(3);
    expect(growthOf(p, T0 + 7 * HOUR, noRain).stage).toBe(4);
  });

  it("une étape entièrement sautée ne compte pas contre la belle plante", () => {
    // mouillée : l'étape 0 finit à 80 min, l'élixir saute toute l'étape 1
    const p = boosted([T0 + 80 * 60_000], [{ start: T0, end: T0 + 10 * HOUR }]);
    expect(growthOf(p, T0 + 10 * HOUR, noRain).beautiful).toBe(true);
  });

  it("une étape vécue en partie doit toujours avoir été mouillée", () => {
    const p = boosted([T0 + 80 * 60_000], [{ start: T0, end: T0 + 80 * 60_000 }]);
    expect(growthOf(p, T0 + 10 * HOUR, noRain).beautiful).toBe(false);
  });
});
```

- [ ] **Step 2 : Vérifier qu'ils échouent**

Run: `bun run test src/garden/core/growth.test.ts`
Expected: FAIL sur les tests de l'élixir (`effectiveMs` ignore `boosts`).

- [ ] **Step 3 : Implémenter**

Dans `src/garden/core/growth.ts`, ajouter sous les constantes :

```ts
const stepOf = (plant: PlantTile): number => GROWTH_MS[plant.seed.rarity] / STAGES;

// Élixirs de croissance déjà versés à `now`, dans l'ordre.
function boostsUntil(plant: PlantTile, now: number): number[] {
  return (plant.boosts ?? []).filter((b) => b >= plant.sownAt && b <= now).sort((a, b) => a - b);
}
```

Remplacer `effectiveMs` :

```ts
export function effectiveMs(
  plant: PlantTile,
  now: number,
  rain: RainSource = rainIntervals,
): number {
  if (now <= plant.sownAt) return 0;
  const wet = coveredDuration(wetIntervals(plant, now, rain), plant.sownAt, now);
  return now - plant.sownAt + WET_BONUS * wet + boostsUntil(plant, now).length * stepOf(plant);
}
```

Remplacer `realTimeFor` :

```ts
// Instant réel où le temps efficace atteint `target` (target <= temps efficace à `now`).
// Un élixir fait sauter le temps efficace d'une étape sans temps réel écoulé.
function realTimeFor(plant: PlantTile, target: number, wet: Interval[], now: number): number {
  const step = stepOf(plant);
  const jumps = boostsUntil(plant, now);
  const jumpsAt = (t: number) => jumps.filter((j) => j === t).length * step;
  let t = plant.sownAt;
  let acc = jumpsAt(t);
  if (acc >= target) return t;
  const bounds = [
    ...new Set(
      wet
        .flatMap((i) => [i.start, i.end])
        .concat(jumps)
        .filter((b) => b > plant.sownAt && b < now)
        .concat(now),
    ),
  ].sort((a, b) => a - b);
  for (const b of bounds) {
    const rate = contains(wet, t) ? 1 + WET_BONUS : 1;
    const gain = (b - t) * rate;
    if (acc + gain >= target) return t + (target - acc) / rate;
    acc += gain + jumpsAt(b);
    t = b;
    if (acc >= target) return t;
  }
  return now;
}
```

Dans `growthOf`, dans la boucle de la belle plante, remplacer le corps par :

```ts
for (let k = 0; k < STAGES; k++) {
  const from = realTimeFor(plant, k * step, wet, now);
  const to = realTimeFor(plant, (k + 1) * step, wet, now);
  // étape entièrement sautée par un élixir : rien à exiger
  if (to <= from) continue;
  if (coveredDuration(wet, from, to) <= 0) {
    beautiful = false;
    break;
  }
}
```

- [ ] **Step 4 : Vérifier**

Run: `bun run test src/garden/core/growth.test.ts && bun run test`
Expected: PASS, y compris les anciens tests de pousse et de belle plante.

- [ ] **Step 5 : Commit**

```bash
git add src/garden/core/growth.ts src/garden/core/growth.test.ts
git commit -m "feat(potager): l'élixir de croissance fait sauter une étape" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4 : Nœuds de l'atelier et recettes connues

**Files:**

- Modify: `src/garden/core/catalog/tree.ts`
- Modify: `src/garden/core/unlocks.ts`
- Modify: `src/garden/core/progression.ts`
- Test: `src/garden/core/catalog/tree.test.ts`, `src/garden/core/unlocks.test.ts`, `src/garden/core/progression.test.ts`

**Interfaces:**

- Consumes: `RecipeId`, `RECIPES` (Task 2), sprites `chaudron`, `fiole`, `poudre` (Task 1), compteurs `brewed`, `potionsUsed`, `pressed`.
- Produces:
  - `Reward` gagne `{ kind: "recettes"; recipes: RecipeId[] }` ;
  - nœuds `a1` à `a5` dans `TREE` (22 nœuds) ;
  - `knownRecipes(save: GardenSave): RecipeId[]` ;
  - `recipeNode(id: RecipeId): TreeNode | undefined`.

- [ ] **Step 1 : Écrire les tests qui échouent**

Dans `src/garden/core/catalog/tree.test.ts` :

- importer `import { ATELIER_DRAW } from "../../sprites/atelier";` et `import { RECIPES } from "./recipes";` ;
- ajouter `...Object.keys(ATELIER_DRAW),` dans `SPRITES` ;
- remplacer le premier test par :

```ts
it("compte 22 nœuds aux identifiants uniques", () => {
  expect(TREE).toHaveLength(22);
  expect(new Set(TREE.map((n) => n.id)).size).toBe(22);
});
```

- ajouter :

```ts
it("débloque chaque recette par exactement un nœud", () => {
  for (const r of RECIPES) {
    const nodes = TREE.filter(
      (n) => n.reward.kind === "recettes" && n.reward.recipes.includes(r.id),
    );
    expect(nodes).toHaveLength(1);
  }
});
```

Dans `src/garden/core/unlocks.test.ts`, importer `knownRecipes, recipeNode` depuis `./unlocks` et ajouter :

```ts
describe("knownRecipes", () => {
  it("ne connaît aucune recette au départ", () => {
    expect(knownRecipes(createStarterSave())).toEqual([]);
  });

  it("le chaudron apporte la croissance et la rosée", () => {
    expect(knownRecipes(withNode("a1"))).toEqual(["croissance", "rosee"]);
  });

  it("les poussières d'étoiles apportent l'or et la lune", () => {
    expect(knownRecipes(withNode("a5"))).toEqual(["or", "lune"]);
  });
});

describe("recipeNode", () => {
  it("retrouve le nœud qui débloque une recette", () => {
    expect(recipeNode("teinture")?.id).toBe("a2");
    expect(recipeNode("croissance")?.id).toBe("a1");
  });
});
```

Dans `src/garden/core/progression.test.ts`, ajouter :

```ts
describe("nœuds de l'atelier", () => {
  it("le chaudron s'ouvre après Main verte et se récupère après 3 pressages", () => {
    const opened = withNodes(base(), "root", "j1");
    expect(stateOf(opened, node("a1"))).toBe("ouvert");
    const ready = withCounter(opened, "pressed", 3);
    expect(stateOf(ready, node("a1"))).toBe("pret");
    const next = claim(ready, "a1", NOW, () => 0)!;
    expect(next.progress.nodes.a1).toBe(NOW);
    expect(next.inventory).toEqual(ready.inventory);
  });
});
```

- [ ] **Step 2 : Vérifier qu'ils échouent**

Run: `bun run test src/garden/core/catalog/tree.test.ts src/garden/core/unlocks.test.ts src/garden/core/progression.test.ts`
Expected: FAIL (17 nœuds, `knownRecipes` absent, nœud `a1` inconnu).

- [ ] **Step 3 : Ajouter la récompense et les nœuds**

Dans `src/garden/core/catalog/tree.ts`, importer `import type { RecipeId } from "./recipes";` et compléter `Reward` :

```ts
  | { kind: "graines"; rarity: Rarity; count: number }
  | { kind: "recettes"; recipes: RecipeId[] };
```

À la fin du tableau `TREE`, après `c4` :

```ts
  // Atelier (sous-projet 6a) : greffé sur Jardinage et Collection
  {
    id: "a1",
    branch: "jardin",
    parent: "j1",
    x: 290,
    y: 340,
    title: "Le chaudron",
    taskLabel: "Presser 3 fleurs",
    rewardLabel: "L'atelier",
    rewardNote: "Le chaudron, l'élixir de croissance et la rosée du matin",
    icon: { name: "chaudron" },
    task: counter("pressed", 3),
    reward: { kind: "recettes", recipes: ["croissance", "rosee"] },
  },
  {
    id: "a2",
    branch: "jardin",
    parent: "j4",
    x: 215,
    y: 120,
    title: "Teinturier",
    taskLabel: "Récupérer 3 brassages",
    rewardLabel: "Teinture",
    rewardNote: "Change la couleur d'une plante avant l'éclosion",
    icon: { name: "fiole", color: "pink" },
    task: counter("brewed", 3),
    reward: { kind: "recettes", recipes: ["teinture"] },
  },
  {
    id: "a3",
    branch: "collection",
    parent: "h3",
    x: 300,
    y: 60,
    title: "Seconde vue",
    taskLabel: "Utiliser 5 préparations",
    rewardLabel: "Élixir de clairvoyance",
    rewardNote: "Révèle une plante avant l'éclosion",
    icon: { name: "fiole", color: "violet" },
    task: counter("potionsUsed", 5),
    reward: { kind: "recettes", recipes: ["clairvoyance"] },
  },
  {
    id: "a4",
    branch: "collection",
    parent: "h4",
    x: 430,
    y: 65,
    title: "Premier givre",
    taskLabel: "Récupérer 5 brassages",
    rewardLabel: "Poudre de givre",
    rewardNote: "Une chance de fleur givrée",
    icon: { name: "poudre", color: "white" },
    task: counter("brewed", 5),
    reward: { kind: "recettes", recipes: ["givre"] },
  },
  {
    id: "a5",
    branch: "collection",
    parent: "a4",
    x: 545,
    y: 95,
    title: "Poussières d'étoiles",
    taskLabel: "Utiliser 15 préparations",
    rewardLabel: "Poudres d'or et de lune",
    rewardNote: "Des chances de fleurs dorées et lumineuses",
    icon: { name: "poudre", color: "yellow" },
    task: counter("potionsUsed", 15),
    reward: { kind: "recettes", recipes: ["or", "lune"] },
  },
```

- [ ] **Step 4 : Déduire les recettes connues et accepter la récompense**

Remplacer `src/garden/core/unlocks.ts` par :

```ts
import type { RecipeId } from "./catalog/recipes";
import { TREE, type TreeNode } from "./catalog/tree";
import type { GardenSave } from "./types";

// Ce que les nœuds récupérés changent dans les autres systèmes.
export function sachetsPerDay(save: GardenSave): number {
  const extra = TREE.filter(
    (n) => n.reward.kind === "sachet-quotidien" && save.progress.nodes[n.id],
  ).length;
  return 1 + extra;
}

export function knownRecipes(save: GardenSave): RecipeId[] {
  return TREE.flatMap((n) =>
    n.reward.kind === "recettes" && save.progress.nodes[n.id] ? n.reward.recipes : [],
  );
}

export const recipeNode = (id: RecipeId): TreeNode | undefined =>
  TREE.find((n) => n.reward.kind === "recettes" && n.reward.recipes.includes(id));
```

Dans `src/garden/core/progression.ts`, dans `applyReward`, remplacer le premier cas par :

```ts
    // le deuxième sachet du jour et les recettes se déduisent du nœud récupéré
    case "sachet-quotidien":
    case "recettes":
      return save;
```

- [ ] **Step 5 : Vérifier**

Run: `bun run test && bunx tsc --noEmit`
Expected: PASS.

- [ ] **Step 6 : Commit**

```bash
git add src/garden/core/catalog/tree.ts src/garden/core/catalog/tree.test.ts src/garden/core/unlocks.ts src/garden/core/unlocks.test.ts src/garden/core/progression.ts src/garden/core/progression.test.ts
git commit -m "feat(potager): cinq nœuds de l'arbre débloquent les recettes" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5 : Le chaudron

**Files:**

- Create: `src/garden/core/atelier.ts`
- Create: `src/garden/core/atelier.test.ts`
- Modify: `src/garden/core/labels.ts`
- Test: `src/garden/core/labels.test.ts`

**Interfaces:**

- Consumes: `recipeById`, `RecipeId` (Task 2), `knownRecipes` (Task 4), `bump` (compteur `brewed`).
- Produces:
  - `type Ingredients = Partial<Record<Rarity, number>>` ;
  - `interface BrewStatus { recipe: RecipeId; remaining: number; ready: boolean }` ;
  - `pickIngredients(basket: Flower[], need: Ingredients): number[] | null` ;
  - `missingFor(save: GardenSave, id: RecipeId): Ingredients` ;
  - `startBrew(save: GardenSave, id: RecipeId, now: number): GardenSave | null` ;
  - `brewStatus(save: GardenSave, now: number): BrewStatus | null` ;
  - `collectBrew(save: GardenSave, now: number): GardenSave | null` ;
  - `ingredientLabel(rarity: Rarity, n: number): string` et `missingLabel(missing: Partial<Record<Rarity, number>>): string` dans `labels.ts`.

- [ ] **Step 1 : Écrire les tests qui échouent**

Créer `src/garden/core/atelier.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { brewStatus, collectBrew, missingFor, pickIngredients, startBrew } from "./atelier";
import { createStarterSave } from "./starter";
import { HOUR } from "./time";
import type { Flower, GardenSave, Rarity } from "./types";

const NOW = 1_700_000_000_000;

const f = (rarity: Rarity, variant?: Flower["variant"]): Flower => ({
  species: "cosmos",
  color: "pink",
  rarity,
  ...(variant && { variant }),
});

function atelier(basket: Flower[], nodes: string[] = ["a1"]): GardenSave {
  const s = createStarterSave();
  return {
    ...s,
    inventory: { ...s.inventory, basket },
    progress: { ...s.progress, nodes: Object.fromEntries(nodes.map((id) => [id, 1])) },
  };
}

describe("pickIngredients", () => {
  it("prend les plus anciennes fleurs, celles à variante en dernier", () => {
    const basket = [f("commune", "givree"), f("commune"), f("rare"), f("commune"), f("commune")];
    expect(pickIngredients(basket, { commune: 3 })).toEqual([1, 3, 4]);
    expect(pickIngredients(basket, { commune: 4 })).toEqual([1, 3, 4, 0]);
  });

  it("renvoie null s'il manque des fleurs", () => {
    expect(pickIngredients([f("commune")], { commune: 1, rare: 1 })).toBeNull();
  });
});

describe("missingFor", () => {
  it("compte ce qui manque par rareté", () => {
    expect(missingFor(atelier([f("commune")]), "teinture")).toEqual({ commune: 1, rare: 1 });
    expect(missingFor(atelier([f("commune"), f("commune"), f("rare")]), "teinture")).toEqual({});
  });
});

describe("startBrew", () => {
  const three = [f("commune"), f("rare"), f("commune"), f("commune")];

  it("retire les ingrédients du panier et lance le chaudron", () => {
    const next = startBrew(atelier(three), "croissance", NOW)!;
    expect(next.inventory.basket).toEqual([f("rare")]);
    expect(next.atelier.brew).toEqual({ recipe: "croissance", startedAt: NOW });
  });

  it("refuse une recette verrouillée, un panier trop maigre ou un chaudron occupé", () => {
    expect(startBrew(atelier(three, []), "croissance", NOW)).toBeNull();
    expect(startBrew(atelier([f("commune")]), "croissance", NOW)).toBeNull();
    const busy = startBrew(atelier([...three, ...three]), "croissance", NOW)!;
    expect(startBrew(busy, "rosee", NOW)).toBeNull();
  });
});

describe("brewStatus et collectBrew", () => {
  const brewing = () =>
    startBrew(atelier([f("commune"), f("commune"), f("commune")]), "croissance", NOW)!;

  it("indique le temps restant puis la fin du brassage", () => {
    expect(brewStatus(atelier([]), NOW)).toBeNull();
    expect(brewStatus(brewing(), NOW + HOUR)).toEqual({
      recipe: "croissance",
      remaining: HOUR,
      ready: false,
    });
    expect(brewStatus(brewing(), NOW + 3 * HOUR)).toMatchObject({ remaining: 0, ready: true });
  });

  it("ne récupère qu'un brassage prêt", () => {
    expect(collectBrew(atelier([]), NOW)).toBeNull();
    expect(collectBrew(brewing(), NOW + HOUR)).toBeNull();
  });

  it("ajoute les doses au stock, vide le chaudron et compte le brassage", () => {
    const s = brewing();
    const stocked = { ...s, inventory: { ...s.inventory, potions: { croissance: 1 } } };
    const next = collectBrew(stocked, NOW + 2 * HOUR)!;
    expect(next.inventory.potions.croissance).toBe(4);
    expect(next.atelier.brew).toBeNull();
    expect(next.progress.counters.brewed).toBe(1);
  });
});
```

Dans `src/garden/core/labels.test.ts`, importer `ingredientLabel, missingLabel` et ajouter :

```ts
describe("ingrédients", () => {
  it("accorde la rareté au nombre", () => {
    expect(ingredientLabel("commune", 3)).toBe("3 communes");
    expect(ingredientLabel("epique", 1)).toBe("1 épique");
  });

  it("dit ce qui manque, ou rien", () => {
    expect(missingLabel({})).toBe("");
    expect(missingLabel({ rare: 1 })).toBe("Il manque 1 fleur rare");
    expect(missingLabel({ commune: 2, rare: 1 })).toBe(
      "Il manque 2 fleurs communes et 1 fleur rare",
    );
  });
});
```

- [ ] **Step 2 : Vérifier qu'ils échouent**

Run: `bun run test src/garden/core/atelier.test.ts src/garden/core/labels.test.ts`
Expected: FAIL (module `./atelier` introuvable, `ingredientLabel` absent).

- [ ] **Step 3 : Implémenter le chaudron**

Créer `src/garden/core/atelier.ts` :

```ts
import { recipeById, type RecipeId } from "./catalog/recipes";
import { bump } from "./counters";
import type { Flower, GardenSave, Rarity } from "./types";
import { knownRecipes } from "./unlocks";

export type Ingredients = Partial<Record<Rarity, number>>;

export interface BrewStatus {
  recipe: RecipeId;
  remaining: number;
  ready: boolean;
}

const entriesOf = (need: Ingredients) => Object.entries(need) as [Rarity, number][];

// Les plus anciennes fleurs de chaque rareté, celles qui portent une variante en dernier.
export function pickIngredients(basket: Flower[], need: Ingredients): number[] | null {
  const picked: number[] = [];
  for (const [rarity, n] of entriesOf(need)) {
    const candidates = basket
      .map((flower, i) => ({ flower, i }))
      .filter(({ flower }) => flower.rarity === rarity)
      .sort((a, b) => Number(!!a.flower.variant) - Number(!!b.flower.variant) || a.i - b.i);
    if (candidates.length < n) return null;
    picked.push(...candidates.slice(0, n).map(({ i }) => i));
  }
  return picked;
}

export function missingFor(save: GardenSave, id: RecipeId): Ingredients {
  const missing: Ingredients = {};
  for (const [rarity, n] of entriesOf(recipeById(id).ingredients)) {
    const have = save.inventory.basket.filter((f) => f.rarity === rarity).length;
    if (have < n) missing[rarity] = n - have;
  }
  return missing;
}

export function startBrew(save: GardenSave, id: RecipeId, now: number): GardenSave | null {
  if (save.atelier.brew || !knownRecipes(save).includes(id)) return null;
  const picked = pickIngredients(save.inventory.basket, recipeById(id).ingredients);
  if (!picked) return null;
  const used = new Set(picked);
  return {
    ...save,
    inventory: {
      ...save.inventory,
      basket: save.inventory.basket.filter((_, i) => !used.has(i)),
    },
    atelier: { brew: { recipe: id, startedAt: now } },
  };
}

export function brewStatus(save: GardenSave, now: number): BrewStatus | null {
  const brew = save.atelier.brew;
  if (!brew) return null;
  const remaining = Math.max(0, brew.startedAt + recipeById(brew.recipe).durationMs - now);
  return { recipe: brew.recipe, remaining, ready: remaining === 0 };
}

export function collectBrew(save: GardenSave, now: number): GardenSave | null {
  const status = brewStatus(save, now);
  if (!status?.ready) return null;
  const potions = save.inventory.potions;
  const doses = (potions[status.recipe] ?? 0) + recipeById(status.recipe).doses;
  return bump(
    {
      ...save,
      inventory: { ...save.inventory, potions: { ...potions, [status.recipe]: doses } },
      atelier: { brew: null },
    },
    "brewed",
  );
}
```

- [ ] **Step 4 : Ajouter les libellés**

À la fin de `src/garden/core/labels.ts` :

```ts
const rarityWord = (rarity: Rarity, n: number): string =>
  `${RARITY_FR[rarity].toLowerCase()}${n > 1 ? "s" : ""}`;

// "3 communes", "1 épique"
export const ingredientLabel = (rarity: Rarity, n: number): string =>
  `${n} ${rarityWord(rarity, n)}`;

// "Il manque 2 fleurs communes et 1 fleur rare" ; vide quand rien ne manque.
export function missingLabel(missing: Partial<Record<Rarity, number>>): string {
  const parts = (Object.entries(missing) as [Rarity, number][]).map(
    ([rarity, n]) => `${n} ${n > 1 ? "fleurs" : "fleur"} ${rarityWord(rarity, n)}`,
  );
  return parts.length ? `Il manque ${parts.join(" et ")}` : "";
}
```

- [ ] **Step 5 : Vérifier**

Run: `bun run test && bunx tsc --noEmit && bun run lint`
Expected: PASS.

- [ ] **Step 6 : Commit**

```bash
git add src/garden/core/atelier.ts src/garden/core/atelier.test.ts src/garden/core/labels.ts src/garden/core/labels.test.ts
git commit -m "feat(potager): chaudron, ingrédients du panier et récupération des doses" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6 : Les préparations dans le champ

**Files:**

- Create: `src/garden/core/potions.ts`
- Create: `src/garden/core/potions.test.ts`
- Modify: `src/garden/core/actions.ts`
- Modify: `src/garden/render/particles.ts`
- Modify: `src/garden/ui/toolMeta.ts`
- Modify: `src/garden/ui/FieldView.tsx:61-62`

**Interfaces:**

- Consumes: `recipeById`, `RecipeId` (Task 2), `growthOf`, `WATER_MS` (Task 3), `bump`, `bumpBy`, `setTile`, `mergeIntervals`, `isInField`, `flowerName`, `speciesOf`, types `Plan`, `Outcome`, `Effect` de `actions.ts`.
- Produces:
  - `type Tool` et `TOOLS` gagnent `"preparer"` (en dernier) ;
  - `type Particle` gagne `"sparkles"` ;
  - `PlanOptions.potion?: RecipeId | null` ;
  - `POWDER_CHANCE = 0.5` ;
  - `roseeArea(plots: PlotId[], key: TileKey): TileKey[]` ;
  - `planPotion(save: GardenSave, key: TileKey, potion: RecipeId | null, now: number, rng: Rng, rain: RainSource): Plan`.

- [ ] **Step 1 : Écrire les tests qui échouent**

Créer `src/garden/core/potions.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { planAction, type Plan } from "./actions";
import type { RecipeId } from "./catalog/recipes";
import { growthOf } from "./growth";
import { planPotion, roseeArea } from "./potions";
import { createStarterSave } from "./starter";
import { HOUR } from "./time";
import type { GardenSave, Interval, PlantTile, Seed, TileKey } from "./types";

const noRain = (): Interval[] => [];
const NOW = new Date(2026, 9, 1, 12).getTime();

const plant = (seed: Seed, sownAt = NOW - HOUR): PlantTile => ({
  kind: "plant",
  seed,
  sownAt,
  watered: [],
});
const cosmos = plant({ species: "cosmos", color: "pink", rarity: "commune" });
const bloomed = plant({ species: "cosmos", color: "pink", rarity: "commune" }, NOW - 9 * HOUR);

function field(tiles: GardenSave["tiles"], potions: GardenSave["inventory"]["potions"]) {
  const s = createStarterSave();
  return { ...s, tiles, inventory: { ...s.inventory, potions } };
}

const plan = (s: GardenSave, key: TileKey, potion: RecipeId | null, rng = () => 0.99): Plan =>
  planPotion(s, key, potion, NOW, rng, noRain);

function run(p: Plan) {
  if (!p.ok) throw new Error(`refus : ${p.reason}`);
  return p.apply();
}

const reason = (p: Plan) => (p.ok ? "" : p.reason);

describe("refus communs", () => {
  it("demande de choisir une préparation, puis d'en avoir en stock", () => {
    const s = field({ "1,1": cosmos }, { croissance: 0 });
    expect(reason(plan(s, "1,1", null))).toBe("choisis une préparation dans le panneau");
    expect(reason(plan(s, "1,1", "croissance"))).toBe("il ne t'en reste plus");
  });

  it("refuse une case sans plante et une plante éclose", () => {
    const s = field({ "1,1": bloomed }, { croissance: 1 });
    expect(reason(plan(s, "2,2", "croissance"))).toBe("rien à faire pousser ici");
    expect(reason(plan(s, "1,1", "croissance"))).toBe("déjà éclose");
  });
});

describe("élixir de croissance", () => {
  it("fait gagner une étape, retire une dose et compte la préparation", () => {
    const out = run(plan(field({ "1,1": cosmos }, { croissance: 3 }), "1,1", "croissance"));
    const tile = out.save.tiles["1,1"] as PlantTile;
    expect(tile.boosts).toEqual([NOW]);
    expect(growthOf(tile, NOW, noRain).stage).toBe(1);
    expect(out.save.inventory.potions.croissance).toBe(2);
    expect(out.save.progress.counters.potionsUsed).toBe(1);
    expect(out.effects).toEqual([
      { kind: "burst", key: "1,1", particle: "sparkles" },
      { kind: "toast", text: "La plante a grandi d'une étape" },
    ]);
  });
});

describe("rosée du matin", () => {
  it("couvre le carré 3 x 3 sans sortir du champ", () => {
    expect(roseeArea(["p1"], "0,0")).toEqual(["0,0", "1,0", "0,1", "1,1"]);
    expect(roseeArea(["p1"], "4,2")).toHaveLength(9);
  });

  it("arrose chaque plante du carré", () => {
    const s = field({ "1,1": cosmos, "2,2": cosmos, "5,4": cosmos }, { rosee: 1 });
    const out = run(plan(s, "1,1", "rosee"));
    for (const key of ["1,1", "2,2"] as const)
      expect((out.save.tiles[key] as PlantTile).watered).toEqual([
        { start: NOW, end: NOW + 6 * HOUR },
      ]);
    expect((out.save.tiles["5,4"] as PlantTile).watered).toEqual([]);
    expect(out.save.progress.counters.watered).toBe(2);
    expect(out.save.inventory.potions.rosee).toBe(0);
    expect(out.effects).toEqual([
      { kind: "burst", key: "1,1", particle: "water" },
      { kind: "burst", key: "2,2", particle: "water" },
    ]);
  });

  it("refuse un carré sans plante", () => {
    const s = field({ "1,1": cosmos }, { rosee: 1 });
    expect(reason(plan(s, "6,4", "rosee"))).toBe("aucune plante autour");
  });
});

describe("élixir de clairvoyance", () => {
  it("révèle la plante une seule fois", () => {
    const out = run(plan(field({ "1,1": cosmos }, { clairvoyance: 2 }), "1,1", "clairvoyance"));
    expect((out.save.tiles["1,1"] as PlantTile).revealed).toBe(true);
    expect(out.effects[1]).toEqual({ kind: "toast", text: "Révélée : Cosmos rose" });
    expect(reason(plan(out.save, "1,1", "clairvoyance"))).toBe("déjà révélée");
  });
});

describe("teinture", () => {
  it("tire une autre couleur de même rareté et la révèle", () => {
    const sun = plant({ species: "tournesol", color: "yellow", rarity: "commune" });
    const out = run(plan(field({ "1,1": sun }, { teinture: 1 }), "1,1", "teinture", () => 0));
    const tile = out.save.tiles["1,1"] as PlantTile;
    expect(tile.seed).toEqual({ species: "tournesol", color: "orange", rarity: "commune" });
    expect(tile.revealed).toBe(true);
  });

  it("refuse une couleur seule de sa rareté", () => {
    const aster = plant({ species: "aster", color: "white", rarity: "epique" });
    expect(reason(plan(field({ "1,1": aster }, { teinture: 1 }), "1,1", "teinture"))).toBe(
      "aucune autre couleur de cette rareté",
    );
  });
});

describe("poudres", () => {
  it("donne la variante une fois sur deux, et la dose part dans tous les cas", () => {
    const s = field({ "1,1": cosmos }, { givre: 2 });
    const hit = run(plan(s, "1,1", "givre", () => 0.1));
    expect((hit.save.tiles["1,1"] as PlantTile).seed.variant).toBe("givree");
    const miss = run(plan(s, "1,1", "givre", () => 0.9));
    expect((miss.save.tiles["1,1"] as PlantTile).seed.variant).toBeUndefined();
    expect(miss.save.inventory.potions.givre).toBe(1);
  });

  it("remplace une variante déjà présente", () => {
    const gold = plant({ species: "cosmos", color: "pink", rarity: "commune", variant: "doree" });
    const out = run(plan(field({ "1,1": gold }, { lune: 1 }), "1,1", "lune", () => 0));
    expect((out.save.tiles["1,1"] as PlantTile).seed.variant).toBe("lumineuse");
  });
});

describe("outil Préparer", () => {
  it("planAction délègue aux préparations", () => {
    const s = field({ "1,1": cosmos }, { croissance: 1 });
    const p = planAction(s, { kind: "tile", key: "1,1" }, "preparer", NOW, {
      rain: noRain,
      potion: "croissance",
    });
    expect(p).toMatchObject({ ok: true, label: "Élixir de croissance" });
  });
});
```

- [ ] **Step 2 : Vérifier qu'ils échouent**

Run: `bun run test src/garden/core/potions.test.ts`
Expected: FAIL (module `./potions` introuvable).

- [ ] **Step 3 : Implémenter les effets**

Créer `src/garden/core/potions.ts` :

```ts
import type { Effect, Outcome, Particle, Plan } from "./actions";
import { recipeById, type RecipeId } from "./catalog/recipes";
import { speciesOf } from "./catalog/species";
import { bump, bumpBy } from "./counters";
import { growthOf, WATER_MS } from "./growth";
import { flowerName } from "./labels";
import { isInField } from "./plots";
import type { Rng } from "./rolls";
import { setTile } from "./tiles";
import { mergeIntervals } from "./time";
import {
  parseTileKey,
  tileKey,
  type GardenSave,
  type PlantTile,
  type PlotId,
  type TileKey,
  type VariantId,
} from "./types";
import type { RainSource } from "./weather";

export const POWDER_CHANCE = 0.5;

const POWDER: Record<"givre" | "or" | "lune", VariantId> = {
  givre: "givree",
  or: "doree",
  lune: "lumineuse",
};

const no = (label: string, reason: string): Plan => ({ ok: false, label, reason });
const burst = (key: TileKey, particle: Particle): Effect => ({ kind: "burst", key, particle });

// Le carré 3 x 3 centré sur la case, limité au champ.
export function roseeArea(plots: PlotId[], key: TileKey): TileKey[] {
  const [x, y] = parseTileKey(key);
  const out: TileKey[] = [];
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const k = tileKey(x + dx, y + dy);
      if (isInField(plots, k)) out.push(k);
    }
  return out;
}

function useDose(save: GardenSave, potion: RecipeId): GardenSave {
  const potions = save.inventory.potions;
  const left = { ...potions, [potion]: (potions[potion] ?? 0) - 1 };
  return bump({ ...save, inventory: { ...save.inventory, potions: left } }, "potionsUsed");
}

// L'effet est écrit tout de suite sur la case ; il reste caché jusqu'à l'éclosion,
// sauf pour la clairvoyance et la teinture qui révèlent.
export function planPotion(
  save: GardenSave,
  key: TileKey,
  potion: RecipeId | null,
  now: number,
  rng: Rng,
  rain: RainSource,
): Plan {
  if (!potion) return no("Préparer", "choisis une préparation dans le panneau");
  const { name } = recipeById(potion);
  if ((save.inventory.potions[potion] ?? 0) <= 0) return no(name, "il ne t'en reste plus");
  const yes = (apply: () => Outcome): Plan => ({ ok: true, label: name, apply });

  if (potion === "rosee") {
    const plants = roseeArea(save.plots, key).filter((k) => save.tiles[k]?.kind === "plant");
    if (!plants.length) return no(name, "aucune plante autour");
    return yes(() => {
      let next = save;
      for (const k of plants) {
        const p = next.tiles[k] as PlantTile;
        const watered = mergeIntervals([...p.watered, { start: now, end: now + WATER_MS }]);
        next = setTile(next, k, { ...p, watered });
      }
      return {
        save: useDose(bumpBy(next, "watered", plants.length), potion),
        effects: plants.map((k) => burst(k, "water")),
      };
    });
  }

  const tile = save.tiles[key];
  if (tile?.kind !== "plant") return no(name, "rien à faire pousser ici");
  if (growthOf(tile, now, rain).stage >= 4) return no(name, "déjà éclose");
  const done = (plant: PlantTile, text: string): Outcome => ({
    save: useDose(setTile(save, key, plant), potion),
    effects: [burst(key, "sparkles"), { kind: "toast", text }],
  });

  switch (potion) {
    case "croissance":
      return yes(() =>
        done({ ...tile, boosts: [...(tile.boosts ?? []), now] }, "La plante a grandi d'une étape"),
      );
    case "clairvoyance":
      if (tile.revealed) return no(name, "déjà révélée");
      return yes(() => done({ ...tile, revealed: true }, `Révélée : ${flowerName(tile.seed)}`));
    case "teinture": {
      const others = speciesOf(tile.seed.species).colors.filter(
        (c) => c.rarity === tile.seed.rarity && c.color !== tile.seed.color,
      );
      if (!others.length) return no(name, "aucune autre couleur de cette rareté");
      return yes(() => {
        const { color } = others[Math.min(others.length - 1, Math.floor(rng() * others.length))];
        const seed = { ...tile.seed, color };
        return done({ ...tile, seed, revealed: true }, `Nouvelle couleur : ${flowerName(seed)}`);
      });
    }
    default: {
      const variant = POWDER[potion];
      return yes(() => {
        const seed = rng() < POWDER_CHANCE ? { ...tile.seed, variant } : tile.seed;
        return done({ ...tile, seed }, "Poudre répandue, surprise à l'éclosion");
      });
    }
  }
}
```

- [ ] **Step 4 : Brancher l'outil**

Dans `src/garden/core/actions.ts` :

```ts
import type { RecipeId } from "./catalog/recipes";
import { planPotion } from "./potions";
```

```ts
export type Tool =
  "main" | "creuser" | "semer" | "arroser" | "secateur" | "rateau" | "decor" | "preparer";
export const TOOLS: Tool[] = [
  "main",
  "creuser",
  "semer",
  "arroser",
  "secateur",
  "rateau",
  "decor",
  "preparer",
];
```

```ts
export type Particle = "dirt" | "water" | "leaves" | "petals" | "feathers" | "sparkles";
```

Dans `PlanOptions`, ajouter `potion?: RecipeId | null;`. Dans `planAction`, compléter la déstructuration :

```ts
const {
  rng = Math.random,
  rain = rainIntervals,
  seedRarity = null,
  decor = null,
  potion = null,
} = opts;
```

et ajouter dans le `switch (tool)`, avant `case "main":` :

```ts
    case "preparer":
      return planPotion(save, key, potion, now, rng, rain);
```

`potions.ts` n'importe que des types depuis `actions.ts` : pas de cycle à l'exécution.

Dans `src/garden/render/particles.ts`, ajouter à `KINDS` :

```ts
  sparkles: {
    n: 28,
    cols: [
      [1.9, 1.7, 0.8],
      [1.5, 1.3, 1.9],
      [1.9, 1.9, 1.9],
    ],
    y: [0.6, 1.2],
    v: [0.9, 1.4, 0.9],
    g: -0.6,
    life: 1.2,
  },
```

Dans `src/garden/ui/toolMeta.ts`, ajouter à `TOOL_META` :

```ts
  preparer: { label: "Préparer", icon: { name: "fiole", color: "lime" } },
```

Dans `src/garden/ui/FieldView.tsx`, remplacer les deux lignes `hasDecor` / `tools` par :

```ts
const hasDecor = Object.values(save.inventory.decor).some((n) => n > 0);
const hasPotion = Object.values(save.inventory.potions).some((n) => (n ?? 0) > 0);
const tools = TOOLS.filter((t) => (t !== "decor" || hasDecor) && (t !== "preparer" || hasPotion));
```

- [ ] **Step 5 : Vérifier**

Run: `bun run test && bunx tsc --noEmit && bun run lint`
Expected: PASS.

- [ ] **Step 6 : Commit**

```bash
git add src/garden/core/potions.ts src/garden/core/potions.test.ts src/garden/core/actions.ts src/garden/render/particles.ts src/garden/ui/toolMeta.ts src/garden/ui/FieldView.tsx
git commit -m "feat(potager): effets des préparations dans le champ" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7 : Infobulle révélée et réducteur de l'atelier

**Files:**

- Modify: `src/garden/core/target.ts`
- Test: `src/garden/core/target.test.ts`
- Modify: `src/garden/ui/gardenReducer.ts`
- Test: `src/garden/ui/gardenReducer.test.ts`

**Interfaces:**

- Consumes: `PlantTile.revealed` (Task 2), `startBrew`, `collectBrew` (Task 5), `RecipeId`.
- Produces: actions `{ type: "brew"; recipe: RecipeId; now: number }` et `{ type: "collect-brew"; now: number }` dans `GardenAction`.

- [ ] **Step 1 : Écrire les tests qui échouent**

À la fin de `src/garden/core/target.test.ts` (noms locaux distincts pour ne pas heurter ceux du fichier) :

```ts
describe("plante révélée", () => {
  const revealNow = new Date(2026, 9, 1, 12).getTime();
  const dry = (): Interval[] => [];
  const withPlant = (revealed: boolean): GardenSave => ({
    ...createStarterSave(),
    tiles: {
      "1,1": {
        kind: "plant",
        seed: { species: "dahlia", color: "blue", rarity: "legendaire" },
        sownAt: revealNow - HOUR,
        watered: [],
        revealed,
      },
    },
  });

  it("montre l'espèce et la couleur avant l'éclosion", () => {
    const lines = describeTile(withPlant(true), "1,1", revealNow, { rain: dry }).lines;
    expect(lines).toContain("Révélée : Dahlia bleu");
    expect(lines).not.toContain("Espèce et couleur inconnues");
  });

  it("garde le mystère sans révélation", () => {
    const lines = describeTile(withPlant(false), "1,1", revealNow, { rain: dry }).lines;
    expect(lines).toContain("Espèce et couleur inconnues");
  });
});
```

Ajouter en tête du fichier les imports manquants parmi : `describeTile` (`./target`), `createStarterSave` (`./starter`), `HOUR` (`./time`), `GardenSave`, `Interval` (`./types`). Ne pas dupliquer ceux déjà présents.

À la fin de `src/garden/ui/gardenReducer.test.ts` :

```ts
describe("atelier", () => {
  const c = { species: "cosmos", color: "pink", rarity: "commune" } as const;
  const withAtelier = (): GardenState => {
    const s = createStarterSave();
    return gardenReducer(INITIAL_GARDEN, {
      type: "load",
      save: {
        ...s,
        inventory: { ...s.inventory, basket: [c, c, c] },
        progress: { ...s.progress, nodes: { a1: 1 } },
      },
    });
  };

  it("brasse puis récupère les doses une fois le temps écoulé", () => {
    const brewing = gardenReducer(withAtelier(), { type: "brew", recipe: "croissance", now: NOW });
    expect(brewing.save!.atelier.brew).toEqual({ recipe: "croissance", startedAt: NOW });
    expect(gardenReducer(brewing, { type: "collect-brew", now: NOW + HOUR })).toBe(brewing);
    const done = gardenReducer(brewing, { type: "collect-brew", now: NOW + 2 * HOUR });
    expect(done.save!.inventory.potions.croissance).toBe(3);
    expect(done.save!.atelier.brew).toBeNull();
  });

  it("ignore une recette verrouillée", () => {
    const state = withAtelier();
    expect(gardenReducer(state, { type: "brew", recipe: "lune", now: NOW })).toBe(state);
  });
});
```

- [ ] **Step 2 : Vérifier qu'ils échouent**

Run: `bun run test src/garden/core/target.test.ts src/garden/ui/gardenReducer.test.ts`
Expected: FAIL (ligne "Révélée" absente, action `brew` inconnue).

- [ ] **Step 3 : Implémenter**

Dans `src/garden/core/target.ts`, fonction `describePlant`, remplacer :

```ts
if (g.stage === 0) lines.push("Espèce et couleur inconnues");
```

par :

```ts
if (plant.revealed) lines.push(`Révélée : ${flowerName(plant.seed)}`);
else if (g.stage === 0) lines.push("Espèce et couleur inconnues");
```

Dans `src/garden/ui/gardenReducer.ts` :

```ts
import { collectBrew, startBrew } from "../core/atelier";
import type { RecipeId } from "../core/catalog/recipes";
```

compléter `GardenAction` :

```ts
  | { type: "deposit"; id: NodeId; species: SpeciesId }
  | { type: "brew"; recipe: RecipeId; now: number }
  | { type: "collect-brew"; now: number };
```

et ajouter dans le `switch` :

```ts
    case "brew": {
      const save = startBrew(state.save, action.recipe, action.now);
      return save ? { ...state, save } : state;
    }
    case "collect-brew": {
      const save = collectBrew(state.save, action.now);
      return save ? { ...state, save } : state;
    }
```

- [ ] **Step 4 : Vérifier**

Run: `bun run test && bunx tsc --noEmit && bun run lint`
Expected: PASS.

- [ ] **Step 5 : Commit**

```bash
git add src/garden/core/target.ts src/garden/core/target.test.ts src/garden/ui/gardenReducer.ts src/garden/ui/gardenReducer.test.ts
git commit -m "feat(potager): infobulle d'une plante révélée et actions du chaudron" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8 : L'outil Préparer dans le Champ

**Files:**

- Modify: `src/garden/render/highlight.ts`
- Modify: `src/garden/render/interaction.ts`
- Create: `src/garden/ui/PotionPicker.tsx`
- Create: `src/garden/ui/atelier/devAtelier.ts`
- Modify: `src/garden/ui/SidePanel.tsx`
- Modify: `src/garden/ui/hover.ts`
- Modify: `src/garden/ui/FieldView.tsx`
- Modify: `src/garden/ui/GardenDevBar.tsx`

**Interfaces:**

- Consumes: `planAction` avec `potion` et `roseeArea` (Task 6), `RECIPES`, `recipeById` (Task 2).
- Produces:
  - `Highlight.set(keys: TileKey[], tone?: HighlightTone)` ;
  - `GardenInteraction.setHighlight(target: Target | null, tone?: HighlightTone, area?: TileKey[])` ;
  - `withAtelierUnlocked(save: GardenSave, now: number): GardenSave`, `withAllPotions(save: GardenSave): GardenSave`, `withBrewDone(save: GardenSave): GardenSave` dans `ui/atelier/devAtelier.ts`.

- [ ] **Step 1 : Surbrillance de plusieurs cases**

Dans `src/garden/render/highlight.ts`, remplacer l'interface `Highlight` et `createHighlight` par :

```ts
export interface Highlight {
  set(keys: TileKey[], tone?: HighlightTone): void;
  update(t: number): void;
  dispose(): void;
}

export function createHighlight(scene: THREE.Scene): Highlight {
  const map = pixelTexture(frameCanvas());
  const material = new THREE.MeshBasicMaterial({
    map,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
  const geometry = new THREE.PlaneGeometry(1, 1);
  // un cadre par case surlignée, créés à la demande et réutilisés
  const meshes: THREE.Mesh[] = [];

  function meshAt(i: number): THREE.Mesh {
    if (!meshes[i]) {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI / 2;
      scene.add(mesh);
      meshes[i] = mesh;
    }
    return meshes[i];
  }

  return {
    set(keys, tone = "info") {
      keys.forEach((key, i) => {
        const [tx, ty] = parseTileKey(key);
        const mesh = meshAt(i);
        mesh.position.set(wx(tx), 0.015, wz(ty));
        mesh.visible = true;
      });
      for (let i = keys.length; i < meshes.length; i++) meshes[i].visible = false;
      material.color.set(TONES[tone]).multiplyScalar(HIGHLIGHT_BOOST);
    },
    update(t) {
      material.opacity = pulse(t);
    },
    dispose() {
      for (const mesh of meshes) scene.remove(mesh);
      geometry.dispose();
      material.dispose();
      map.dispose();
    },
  };
}
```

Dans `src/garden/render/interaction.ts`, changer la signature dans l'interface :

```ts
  setHighlight(target: Target | null, tone?: HighlightTone, area?: TileKey[]): void;
```

et l'implémentation :

```ts
    // cadre au sol pour une case ou une zone, contour pour un corbeau
    setHighlight(target, tone = "info", area) {
      highlight.set(area ?? (target?.kind === "tile" ? [target.key] : []), tone);
      crows.outline(target?.kind === "crow" ? target.id : null, TONES[tone]);
    },
```

Run: `bunx tsc --noEmit`
Expected: PASS (aucun autre appelant de `highlight.set`).

- [ ] **Step 2 : Outils de développement**

Créer `src/garden/ui/atelier/devAtelier.ts` :

```ts
import { RECIPES, recipeById } from "../../core/catalog/recipes";
import type { GardenSave } from "../../core/types";

const ATELIER_NODES = ["a1", "a2", "a3", "a4", "a5"];

// Outils de développement : tout l'atelier d'un coup, 3 doses de chaque préparation,
// un brassage terminé tout de suite.
export const withAtelierUnlocked = (save: GardenSave, now: number): GardenSave => ({
  ...save,
  progress: {
    ...save.progress,
    nodes: {
      ...save.progress.nodes,
      ...Object.fromEntries(ATELIER_NODES.map((id) => [id, now])),
    },
  },
});

export function withAllPotions(save: GardenSave): GardenSave {
  const potions = save.inventory.potions;
  return {
    ...save,
    inventory: {
      ...save.inventory,
      potions: Object.fromEntries(RECIPES.map((r) => [r.id, (potions[r.id] ?? 0) + 3])),
    },
  };
}

export function withBrewDone(save: GardenSave): GardenSave {
  const brew = save.atelier.brew;
  if (!brew) return save;
  const startedAt = brew.startedAt - recipeById(brew.recipe).durationMs;
  return { ...save, atelier: { brew: { ...brew, startedAt } } };
}
```

- [ ] **Step 3 : Choix de la préparation**

Créer `src/garden/ui/PotionPicker.tsx` :

```tsx
import { RECIPES, type RecipeId } from "../core/catalog/recipes";
import type { GardenSave } from "../core/types";
import { SpriteIcon } from "./SpriteIcon";

export function PotionPicker({
  potions,
  selected,
  onSelect,
}: {
  potions: GardenSave["inventory"]["potions"];
  selected: RecipeId | null;
  onSelect: (id: RecipeId) => void;
}) {
  const owned = RECIPES.filter((r) => (potions[r.id] ?? 0) > 0);
  return (
    <section className="rounded-xl border border-amber-300/30 bg-[#1a1216]/85 px-2.5 py-2 backdrop-blur">
      <h4 className="mb-1.5 font-serif text-[17px] text-[#f3dca0]">Préparations</h4>
      {!owned.length && (
        <em className="text-[11px] text-[#a99a8a]">Plus rien en stock. Passe à l'atelier.</em>
      )}
      <div className="flex flex-col gap-0.5">
        {owned.map((r) => {
          const on = r.id === selected;
          return (
            <button
              key={r.id}
              onClick={() => onSelect(r.id)}
              aria-pressed={on}
              className={`flex items-center gap-1.5 rounded-md px-1.5 py-1 text-left ${
                on ? "bg-amber-300/15 ring-1 ring-amber-300/40" : "hover:bg-amber-300/10"
              }`}
            >
              <SpriteIcon sprite={r.icon} cropped className="h-5" />
              <span className="flex-1 leading-tight">
                {r.name}
                <small className="block text-[10px] text-[#a99a8a]">{r.effect}</small>
              </span>
              <b className="text-[#f3dca0]">x{potions[r.id]}</b>
            </button>
          );
        })}
      </div>
    </section>
  );
}
```

Dans `src/garden/ui/SidePanel.tsx` : importer `PotionPicker` et `type RecipeId` (`../core/catalog/recipes`), ajouter les props `potionId: RecipeId | null;` et `onPotion: (id: RecipeId) => void;` (déstructurées avec les autres), puis, juste après le bloc du `DecorPicker` :

```tsx
{
  tool === "preparer" && (
    <PotionPicker potions={save.inventory.potions} selected={potionId} onSelect={onPotion} />
  );
}
```

Dans `src/garden/ui/hover.ts` : importer `type RecipeId`, ajouter `potion?: RecipeId | null;` à `HoverOptions`, et transmettre :

```ts
const { seedRarity = null, decor = null, potion = null } = opts;
const plan = planAction(save, target, tool, now, { seedRarity, decor, potion });
```

- [ ] **Step 4 : Brancher le Champ**

Dans `src/garden/ui/FieldView.tsx` :

```ts
import type { RecipeId } from "../core/catalog/recipes";
import { roseeArea } from "../core/potions";
import { withAllPotions, withAtelierUnlocked } from "./atelier/devAtelier";
```

État, à côté de `decorId` :

```ts
const [potionId, setPotionId] = useState<RecipeId | null>(null);
```

Vue dérivée :

```ts
      ? describeTarget(save, hover.pick.target, tool, at, {
          seedRarity,
          decor: decorId,
          potion: potionId,
        })
```

Effet de surbrillance, remplacé par :

```ts
useEffect(() => {
  const interaction = sceneRef.current?.interaction;
  if (!interaction || dragging) return;
  const target = shown ? (hover?.pick?.target ?? null) : null;
  // la rosée arrose un carré : on le montre en entier
  const area =
    target?.kind === "tile" && tool === "preparer" && potionId === "rosee"
      ? roseeArea(save.plots, target.key)
      : undefined;
  interaction.setHighlight(target, shown ? toneOf(shown) : undefined, area);
}, [shown, hover, dragging, tool, potionId, save.plots]);
```

Clic (`onPointerUp`) :

```ts
const plan = planAction(save, start.pick.target, tool, t, {
  seedRarity,
  decor: decorId,
  potion: potionId,
});
```

`SidePanel` reçoit `potionId={potionId}` et `onPotion={setPotionId}`. `GardenDevBar` reçoit :

```tsx
          onAtelier={() => {
            const t = Date.now();
            dispatch({ type: "set", save: withAllPotions(withAtelierUnlocked(save, t)) });
          }}
```

Dans `src/garden/ui/GardenDevBar.tsx`, ajouter la prop `onAtelier: () => void;` et, après le bouton du corbeau :

```tsx
<button onClick={onAtelier} className={button}>
  Dev : débloquer l'atelier et 3 doses de chaque préparation
</button>
```

- [ ] **Step 5 : Vérifications automatiques**

Run: `bun run test && bunx tsc --noEmit && bun run lint`
Expected: PASS.

- [ ] **Step 6 : Vérifier dans l'aperçu**

Run: `bun run dev` (port 1420, ou 4180 s'il est pris), ouvrir `?window=garden`, onglet Champ, panneau du navigateur visible.

1. Cliquer "Dev : semer des plantes de démonstration", puis "Dev : débloquer l'atelier et 3 doses de chaque préparation".
2. L'outil Préparer apparaît en dernier dans la barre (touche 7, ou 8 si l'outil Décor est présent). Le choisir : le panneau liste les 7 préparations avec "x3".
3. Sans préparation choisie, l'infobulle affiche "choisis une préparation dans le panneau".
4. Rosée : le survol souligne un carré 3x3 (tronqué au bord du champ) ; le clic arrose les plantes du carré (terre foncée, gouttes).
5. Croissance sur une jeune plante : étincelles, toast "La plante a grandi d'une étape", le sprite change d'étape ; sur une fleur éclose, refus "déjà éclose".
6. Clairvoyance : l'infobulle affiche "Révélée : ..." ; un second essai affiche "déjà révélée".
7. Quand les doses tombent à zéro pour toutes les préparations, l'outil disparaît de la barre.

Expected: tout se comporte comme ci-dessus, aucune erreur dans la console. Joindre une capture de la rosée survolée.

- [ ] **Step 7 : Commit**

```bash
git add src/garden/render/highlight.ts src/garden/render/interaction.ts src/garden/ui/PotionPicker.tsx src/garden/ui/atelier/devAtelier.ts src/garden/ui/SidePanel.tsx src/garden/ui/hover.ts src/garden/ui/FieldView.tsx src/garden/ui/GardenDevBar.tsx
git commit -m "feat(potager): outil Préparer, choix de la préparation et zone de la rosée" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9 : La page Atelier

**Files:**

- Create: `src/garden/ui/atelier/styles.ts`
- Create: `src/garden/ui/atelier/CauldronBubbles.tsx`
- Create: `src/garden/ui/atelier/Cauldron.tsx`
- Create: `src/garden/ui/atelier/RecipeList.tsx`
- Create: `src/garden/ui/atelier/RecipeDetail.tsx`
- Create: `src/garden/ui/atelier/PotionStock.tsx`
- Create: `src/garden/ui/atelier/AtelierPage.tsx`
- Modify: `src/garden/ui/GardenTabs.tsx`
- Modify: `src/garden/ui/GardenApp.tsx`

**Interfaces:**

- Consumes: `brewStatus`, `missingFor`, `BrewStatus` (Task 5), `knownRecipes`, `recipeNode` (Task 4), `RECIPES`, `recipeById` (Task 2), `ingredientLabel`, `missingLabel`, `formatDuration`, actions `brew` / `collect-brew` (Task 7), `withBrewDone` (Task 8), `RARITY_COLOR`, `SpriteIcon`, `DEV_BUTTON`.
- Produces: `GardenTab` gagne `"atelier"` ; `GardenTabs` reçoit `atelier: boolean` et `brewReady: boolean`.

- [ ] **Step 1 : Styles partagés et chaudron**

Créer `src/garden/ui/atelier/styles.ts` :

```ts
export const PANEL = "rounded-xl border border-amber-300/30 bg-[#1a1216]/85 p-4";
export const HEADING = "font-serif text-xl text-[#f3dca0]";
```

Créer `src/garden/ui/atelier/CauldronBubbles.tsx` :

```tsx
import { motion } from "motion/react";

const BUBBLES = [
  { left: "38%", delay: 0 },
  { left: "52%", delay: 0.6 },
  { left: "62%", delay: 1.2 },
];

export function CauldronBubbles() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[18%]">
      {BUBBLES.map((b) => (
        <motion.span
          key={b.left}
          className="absolute size-2.5 rounded-full bg-[#b9f09a]/80 shadow-[0_0_8px_#8fcf5a]"
          style={{ left: b.left }}
          animate={{ y: [0, -36], opacity: [0.9, 0] }}
          transition={{ duration: 1.8, delay: b.delay, repeat: Infinity, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}
```

Créer `src/garden/ui/atelier/Cauldron.tsx` :

```tsx
import type { BrewStatus } from "../../core/atelier";
import { recipeById } from "../../core/catalog/recipes";
import { formatDuration } from "../../core/labels";
import { SpriteIcon } from "../SpriteIcon";
import { CauldronBubbles } from "./CauldronBubbles";
import { HEADING, PANEL } from "./styles";

export function Cauldron({
  status,
  onCollect,
}: {
  status: BrewStatus | null;
  onCollect: () => void;
}) {
  const recipe = status && recipeById(status.recipe);
  const progress =
    status && recipe ? Math.min(1, Math.max(0, 1 - status.remaining / recipe.durationMs)) : 0;
  return (
    <section
      className={`${PANEL} flex flex-1 flex-col items-center justify-center gap-3 text-center`}
    >
      <h3 className={HEADING}>Chaudron</h3>
      <div className="relative">
        <SpriteIcon sprite={{ name: "chaudron" }} cropped className="h-40" />
        {status && !status.ready && <CauldronBubbles />}
      </div>
      {!status || !recipe ? (
        <p className="text-[#a99a8a]">Le chaudron est vide</p>
      ) : (
        <div className="flex w-full max-w-[260px] flex-col items-center gap-2">
          <div>{recipe.name}</div>
          <div className="h-2 w-full overflow-hidden rounded bg-[#2c2027] ring-1 ring-amber-300/25">
            <div
              className="h-full bg-gradient-to-r from-[#4d8a36] to-[#9be07a]"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          {status.ready ? (
            <button
              onClick={onCollect}
              className="rounded-md border border-amber-300/50 px-3 py-1 text-[#f3dca0] hover:bg-amber-300/15"
            >
              Récupérer {recipe.doses} doses
            </button>
          ) : (
            <div className="text-[#a99a8a]">
              Prêt dans ~{formatDuration(status.remaining)} - {recipe.doses} doses
            </div>
          )}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 2 : Recettes et stock**

Créer `src/garden/ui/atelier/RecipeList.tsx` :

```tsx
import { RECIPES, type RecipeId } from "../../core/catalog/recipes";
import { SpriteIcon } from "../SpriteIcon";

export function RecipeList({
  known,
  selected,
  onSelect,
}: {
  known: RecipeId[];
  selected: RecipeId;
  onSelect: (id: RecipeId) => void;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      {RECIPES.map((r) => {
        const open = known.includes(r.id);
        const on = r.id === selected;
        return (
          <button
            key={r.id}
            onClick={() => onSelect(r.id)}
            aria-pressed={on}
            className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-left ${
              on ? "bg-amber-300/15 ring-1 ring-amber-300/40" : "hover:bg-amber-300/10"
            } ${open ? "" : "opacity-45"}`}
          >
            <SpriteIcon sprite={r.icon} cropped className={`h-6 ${open ? "" : "grayscale"}`} />
            <span className="flex-1">{r.name}</span>
            {!open && <small className="text-[10px] text-[#a99a8a]">verrouillée</small>}
          </button>
        );
      })}
    </div>
  );
}
```

Créer `src/garden/ui/atelier/RecipeDetail.tsx` :

```tsx
import { missingFor } from "../../core/atelier";
import { recipeById, type RecipeId } from "../../core/catalog/recipes";
import { formatDuration, ingredientLabel, missingLabel } from "../../core/labels";
import type { GardenSave, Rarity } from "../../core/types";
import { recipeNode } from "../../core/unlocks";
import { RARITY_COLOR } from "../toolMeta";
import { HEADING } from "./styles";

export function RecipeDetail({
  save,
  recipe,
  known,
  busy,
  onBrew,
}: {
  save: GardenSave;
  recipe: RecipeId;
  known: boolean;
  busy: boolean;
  onBrew: () => void;
}) {
  const r = recipeById(recipe);
  const reason = !known
    ? `Débloquée par : ${recipeNode(recipe)?.title ?? "l'arbre de progression"}`
    : busy
      ? "Le chaudron est occupé"
      : missingLabel(missingFor(save, recipe));
  const have = (rarity: Rarity) => save.inventory.basket.filter((f) => f.rarity === rarity).length;
  return (
    <div className="mt-3 flex flex-col gap-1.5 border-t border-amber-300/20 pt-3">
      <h4 className={HEADING}>{r.name}</h4>
      <p className="italic text-[#d8cbb6]">{r.effect}</p>
      <div className="mt-1 text-[11px] uppercase tracking-wide text-[#a99a8a]">Ingrédients</div>
      {(Object.entries(r.ingredients) as [Rarity, number][]).map(([rarity, n]) => (
        <div key={rarity} className="flex items-center gap-1.5">
          <span
            className="inline-block size-2.5 rounded-[3px]"
            style={{ background: RARITY_COLOR[rarity] }}
          />
          {ingredientLabel(rarity, n)}
          <span className="text-[#a99a8a]">({have(rarity)} au panier)</span>
        </div>
      ))}
      <div className="text-[#a99a8a]">
        Durée {formatDuration(r.durationMs)} - donne {r.doses} doses
      </div>
      <div className="mt-1 flex items-center gap-3">
        <button
          onClick={onBrew}
          disabled={!!reason}
          className="rounded-md border border-amber-300/50 px-3 py-1 text-[#f3dca0] enabled:hover:bg-amber-300/15 disabled:opacity-40"
        >
          Brasser
        </button>
        {reason && <span className="text-[11px] text-[#d98a7a]">{reason}</span>}
      </div>
    </div>
  );
}
```

Créer `src/garden/ui/atelier/PotionStock.tsx` :

```tsx
import { RECIPES } from "../../core/catalog/recipes";
import type { GardenSave } from "../../core/types";
import { SpriteIcon } from "../SpriteIcon";
import { PANEL } from "./styles";

export function PotionStock({ potions }: { potions: GardenSave["inventory"]["potions"] }) {
  const owned = RECIPES.filter((r) => (potions[r.id] ?? 0) > 0);
  return (
    <section className={`${PANEL} col-span-2 flex flex-wrap items-center gap-x-5 gap-y-2`}>
      <h4 className="font-serif text-[17px] text-[#f3dca0]">Préparations</h4>
      {!owned.length && (
        <em className="text-[11px] text-[#a99a8a]">Aucune préparation en stock.</em>
      )}
      {owned.map((r) => (
        <span key={r.id} className="flex items-center gap-1.5">
          <SpriteIcon sprite={r.icon} cropped className="h-5" />
          {r.name}
          <b className="text-[#f3dca0]">x{potions[r.id]}</b>
        </span>
      ))}
      <span className="ml-auto text-[11px] text-[#a99a8a]">
        À utiliser dans le champ avec l'outil Préparer
      </span>
    </section>
  );
}
```

- [ ] **Step 3 : La page**

Créer `src/garden/ui/atelier/AtelierPage.tsx` :

```tsx
import { useState } from "react";
import { brewStatus } from "../../core/atelier";
import type { RecipeId } from "../../core/catalog/recipes";
import type { GardenSave } from "../../core/types";
import { knownRecipes } from "../../core/unlocks";
import { DEV_BUTTON } from "../devButton";
import { Cauldron } from "./Cauldron";
import { PotionStock } from "./PotionStock";
import { RecipeDetail } from "./RecipeDetail";
import { RecipeList } from "./RecipeList";
import { HEADING, PANEL } from "./styles";

export function AtelierPage({
  save,
  now,
  onBrew,
  onCollect,
  onDevFinish,
}: {
  save: GardenSave;
  now: number;
  onBrew: (recipe: RecipeId) => void;
  onCollect: () => void;
  onDevFinish: () => void;
}) {
  const known = knownRecipes(save);
  const [selected, setSelected] = useState<RecipeId>(known[0] ?? "croissance");
  const status = brewStatus(save, now);
  return (
    <div className="grid flex-1 grid-cols-[1fr_1.1fr] grid-rows-[1fr_auto] gap-4 overflow-auto p-5">
      <div className="flex flex-col gap-2">
        <Cauldron status={status} onCollect={onCollect} />
        {import.meta.env.DEV && status && !status.ready && (
          <button onClick={onDevFinish} className={`${DEV_BUTTON} self-center`}>
            Dev : finir le brassage
          </button>
        )}
      </div>
      <section className={`${PANEL} overflow-auto`}>
        <h3 className={`${HEADING} mb-2`}>Recettes</h3>
        <RecipeList known={known} selected={selected} onSelect={setSelected} />
        <RecipeDetail
          save={save}
          recipe={selected}
          known={known.includes(selected)}
          busy={!!status}
          onBrew={() => onBrew(selected)}
        />
      </section>
      <PotionStock potions={save.inventory.potions} />
    </div>
  );
}
```

- [ ] **Step 4 : Onglet et branchement**

Dans `src/garden/ui/GardenTabs.tsx` :

```ts
export type GardenTab = "champ" | "herbier" | "sachets" | "progression" | "atelier";

const TABS: { id: GardenTab; label: string }[] = [
  { id: "champ", label: "Champ" },
  { id: "herbier", label: "Herbier" },
  { id: "sachets", label: "Sachets" },
  { id: "progression", label: "Progression" },
  { id: "atelier", label: "Atelier" },
];
```

Ajouter les props `atelier: boolean;` et `brewReady: boolean;` (déstructurées), remplacer `badge` par :

```ts
const badge = (id: GardenTab) =>
  id === "sachets"
    ? sachets
    : id === "progression"
      ? ready
      : id === "atelier"
        ? Number(brewReady)
        : 0;
```

et itérer sur `TABS.filter((t) => t.id !== "atelier" || atelier)` au lieu de `TABS`.

Dans `src/garden/ui/GardenApp.tsx` :

```ts
import { brewStatus } from "../core/atelier";
import { recipeById } from "../core/catalog/recipes";
import { knownRecipes } from "../core/unlocks";
import { AtelierPage } from "./atelier/AtelierPage";
import { withBrewDone } from "./atelier/devAtelier";
```

Avant le `return` :

```ts
const hasAtelier = !!state.save && knownRecipes(state.save).length > 0;
const brew = state.save ? brewStatus(state.save, now) : null;
```

`GardenTabs` reçoit `atelier={hasAtelier}` et `brewReady={!!brew?.ready}`. Après le bloc des Sachets :

```tsx
{
  tab === "atelier" && state.save && (
    <AtelierPage
      save={state.save}
      now={now}
      onBrew={(recipe) => {
        const t = Date.now();
        setNow(t);
        dispatch({ type: "brew", recipe, now: t });
      }}
      onCollect={() => {
        const t = Date.now();
        const status = brewStatus(state.save!, t);
        if (!status?.ready) return;
        const { name, doses } = recipeById(status.recipe);
        dispatch({ type: "collect-brew", now: t });
        toast(`${name} : ${doses} doses récupérées`);
      }}
      onDevFinish={() => {
        setNow(Date.now());
        dispatch({ type: "set", save: withBrewDone(state.save!) });
      }}
    />
  );
}
```

`setNow` rafraîchit l'horloge de la page : sans lui, le chaudron attendrait le prochain tick d'une minute pour se voir prêt.

- [ ] **Step 5 : Vérifications automatiques**

Run: `bun run test && bunx tsc --noEmit && bun run lint`
Expected: PASS (dont `accents.test.ts` sur les nouveaux textes).

- [ ] **Step 6 : Vérifier dans l'aperçu**

Run: `bun run dev`, ouvrir `?window=garden`, panneau du navigateur visible.

1. Nouvelle partie : pas d'onglet Atelier.
2. Champ : "Dev : débloquer l'atelier et 3 doses de chaque préparation". L'onglet Atelier apparaît après Progression.
3. Atelier : chaudron vide à gauche ("Le chaudron est vide"), 7 recettes à droite, stock "x3" en bas.
4. Recette choisie avec un panier vide : "Brasser" désactivé, "Il manque 3 fleurs communes".
5. Cueillir 3 fleurs communes (plantes de démonstration), revenir : "Brasser" actif ; le lancer. Le panier perd 3 fleurs, les bulles montent, "Prêt dans ~2 h - 3 doses", "Brasser" affiche "Le chaudron est occupé".
6. "Dev : finir le brassage" : la pastille "1" apparaît sur l'onglet, bouton "Récupérer 3 doses" ; le cliquer : toast, stock "x6", chaudron vide.
7. Onglet Progression : les nœuds a1 à a5 sont visibles et ne chevauchent ni les autres nœuds ni leurs libellés.

Expected: tout se comporte comme ci-dessus, aucune erreur dans la console. Joindre une capture de la page Atelier en cours de brassage.

- [ ] **Step 7 : Commit**

```bash
git add src/garden/ui/atelier src/garden/ui/GardenTabs.tsx src/garden/ui/GardenApp.tsx
git commit -m "feat(potager): onglet Atelier, chaudron, recettes et stock" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10 : Placement dans l'arbre et parcours complet

**Files:**

- Modify (si besoin): `src/garden/core/catalog/tree.ts` (positions `x`, `y` de `a1` à `a5`)

**Interfaces:**

- Consumes: tout ce qui précède.
- Produces: rien de nouveau.

- [ ] **Step 1 : Ajuster les positions**

Dans l'aperçu, onglet Progression. L'arbre dessine tous ses nœuds quel que soit leur état ; le bouton de dev de l'atelier les fait passer en fleur éclose, ce qui montre leur plus grande taille. Si un nœud `a*` chevauche un autre nœud, sa liane ou un libellé, déplacer son `x` / `y` dans `tree.ts` par pas de 10 à 20, dans l'espace 1000 x 640, en gardant `y` inférieur à celui de la racine (575). Le test "place les nœuds dans l'espace 1000 x 640" garde ces bornes.

- [ ] **Step 2 : Parcours complet**

Sans les boutons de dev de l'atelier, sur une partie où `j1` est récupéré :

1. Presser 3 fleurs : `a1` passe à "prêt", le récupérer : toast "Le chaudron : L'atelier", onglet Atelier visible.
2. Brasser un élixir de croissance, le finir (bouton de dev), le récupérer, l'appliquer dans le champ sur une graine : elle passe à l'étape suivante.
3. Recharger la page : le stock, le chaudron et les plantes boostées ou révélées sont conservés.

Expected: conforme, aucune erreur dans la console.

- [ ] **Step 3 : Vérifications finales**

Run: `bun run test && bunx tsc --noEmit && bun run lint`
Expected: PASS.

- [ ] **Step 4 : Commit (si des positions ont changé)**

```bash
git add src/garden/core/catalog/tree.ts
git commit -m "fix(potager): nœuds de l'atelier placés sans chevauchement" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
