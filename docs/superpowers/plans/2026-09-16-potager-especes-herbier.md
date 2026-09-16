# Potager d'automne - Sous-projet 3 (espèces et Herbier) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Catalogue complet (14 espèces, 65 entrées), 6 nouveaux dessins, variantes et effets de rareté marqués dans la scène, pressage instantané, onglets et page Herbier en carnet.

**Architecture:** Le catalogue devient une table de données pure dans `src/garden/core/catalog/` dont dérivent `SpeciesId`, `ColorId`, les libellés et l'outil de cueillette. Les dessins restent dans `src/garden/sprites/` (un fichier par espèce), les variantes sont des recolorations de tampon. Le rendu three.js gagne un module d'effets par plante (`render/rarityFx.ts`). L'interface React ajoute des onglets, le bouton "Presser" et la page Herbier (`ui/herbier/`).

**Tech Stack:** React 19, TypeScript, three.js 0.186, vitest (environnement `node`), sonner, Tauri 2.

**Spec:** `docs/superpowers/specs/2026-09-16-potager-especes-herbier-design.md` (vision : `docs/superpowers/specs/2026-09-16-potager-automne-vision-design.md` ; maquettes : `docs/superpowers/mockups/potager-automne/herbier.html` option B, `rarete-effets.html` option B).

## Global Constraints

- Code totalement séparé du jeu des canards : aucun import depuis `PixelPool`, `duck*`, `src/game/*`, `src/lib/duck*`.
- Tout texte affiché est en français correctement accentué ; identifiants, clés, ids et noms de fichiers restent ASCII. `src/lib/accents.test.ts` doit rester vert.
- Pas d'em dash, pas de guillemets typographiques, pas de symboles Unicode décoratifs dans le code.
- Un composant par fichier ; helpers, types, constantes et tables dans des modules séparés.
- `src/garden/core/` n'importe jamais React, three.js ni `src/garden/sprites/`.
- Catalogue : **65 entrées** (27 communes, 17 rares, 11 épiques, 10 légendaires), 14 espèces.
- Pressage : graine **35 %**, poids **commune 60, rare 25, épique 12, légendaire 3**, jamais la couleur pressée, pas de variante.
- Cueillette inchangée : **30 %**, **45 %** si belle plante.
- Effets : intensité "marquée" ; **12 particules par plante**, **150 par scène**.
- Sauvegarde `garden.json`, `version: 1`, pas de migration.
- Tests vitest en environnement `node` : pas de `document` ni de canvas dans les tests.
- Commandes : tests `bun run test`, types `bunx tsc --noEmit`, lint `bun run lint`.

## Écarts assumés par rapport à la spec

- Le bouton de dev "Graine à variante" est remplacé par un enrichissement de "semer des plantes de démonstration" : les plantes de démonstration couvrent les 14 espèces, les 4 raretés et les 3 variantes, ce qui vérifie le rendu directement dans le champ.
- `speciesOf` renvoie toujours une définition pour un `SpeciesId` ; la robustesse aux identifiants inconnus passe par `isSpeciesId` (scène, Herbier) et par un nom de repli dans `flowerName`.
- Les dessins des 6 nouvelles espèces sont écrits avant le catalogue (tâche 2) pour que le point de contrôle visuel ait lieu avant le branchement (tâche 3).

---

## File Structure

```
src/garden/core/
  catalog/colors.ts     (new) COLORS, ColorId, colorName
  catalog/species.ts    (new) SPECIES, SpeciesId, speciesOf, isSpeciesId, harvestTool, rarityOf, CATALOG_ENTRIES
  catalog/catalog.test.ts (new)
  types.ts              (mod) SpeciesId / ColorId importés du catalogue
  species.ts            (del) remplacé par catalog/species.ts
  labels.ts             (mod) lectures du catalogue, VARIANT_FR, pressedLabel, HARVEST_FR
  counters.ts           (mod) CounterId + "pressed"
  rolls.ts              (mod) pressSeedChance, RARITY_WEIGHT, rollPressSeed
  herbier.ts            (new) pressFlower, speciesProgress, herbierProgress, latestSpecies
  herbier.test.ts       (new)
  demo.ts               (mod) démonstration 14 espèces, raretés, variantes
  target.ts, actions.ts, field.test.ts, labels.test.ts, rolls.test.ts (mod)
src/garden/sprites/
  palette.ts            (mod) blue, burgundy, apricot, black, lime
  colorRamps.ts         (new) COLOR_RAMP: Record<ColorId, PaletteKey>
  raster.ts             (mod) curveAt
  species/index.ts      (new) SPECIES_DRAW
  species/<id>.ts       (new) 14 fichiers (8 déplacés, 6 nouveaux)
  species.ts            (del)
  variants.ts           (new) VARIANT_FX
  sprite.ts             (mod) SpriteRef.variant, drawBuf
  sprite.test.ts        (mod)
  variants.test.ts      (new)
src/garden/render/
  sceneModel.ts         (mod) rarity, variant
  fxTextures.ts         (new) textures canvas des effets
  rarityFx.ts           (new) createFxBudget, createPlantFx
  billboards.ts         (mod) effets par plante, updateFx
  createGardenScene.ts  (mod) appelle updateFx
src/garden/ui/
  gardenReducer.ts      (mod) action press, état pressed
  GardenApp.tsx         (mod) onglets, toast de pressage
  GardenTabs.tsx        (new)
  FieldView.tsx         (mod) prop active, onPress
  useCrows.ts           (mod) pause si inactif
  SidePanel.tsx         (mod) bouton Presser
  SpriteIcon.tsx        (inchangé, SpriteRef porte la variante)
  herbier/HerbierPage.tsx, SpeciesList.tsx, SpeciesPlate.tsx, SpecimenCard.tsx,
  VariantSlots.tsx, SpeciesNotes.tsx       (new)
  herbier/cardFx.ts     (new) dessin canvas 2D des effets de carte
  herbier/useCardFx.ts  (new) boucle d'animation d'une carte
  herbier/plate.ts      (new) tri des spécimens, inclinaisons
  herbier/plate.test.ts (new)
src/lib/accents.test.ts (mod) nouveaux mots
```

---

### Task 1: Sprites par espèce, nouvelles gammes, curveAt

Refactor sans changement de rendu : un fichier par espèce, table des gammes de couleur séparée, 5 gammes ajoutées, helper de courbe.

**Files:**

- Create: `src/garden/sprites/colorRamps.ts`, `src/garden/sprites/species/index.ts`, `src/garden/sprites/species/{tournesol,rosetremiere,dahlia,cosmos,aster,chrysantheme,bruyere,colchique}.ts`
- Delete: `src/garden/sprites/species.ts`
- Modify: `src/garden/sprites/palette.ts`, `src/garden/sprites/raster.ts`, `src/garden/sprites/sprite.ts`
- Test: `src/garden/sprites/sprite.test.ts`

**Interfaces:**

- Produces: `COLOR_RAMP: Record<ColorId, PaletteKey>` (`colorRamps.ts`) ; `SPECIES_DRAW: Record<SpeciesId, DrawFn>` (`species/index.ts`) ; `curveAt(x0, y0, x1, y1, bend, s): [number, number]` (`raster.ts`) ; `drawBuf(draw: DrawFn, ramp: Ramp): Buf` (`sprite.ts`, rend un tampon 48x72 avec contour) ; `PAL.blue | burgundy | apricot | black | lime`.

- [ ] **Step 1: Write the failing test**

Ajouter dans `src/garden/sprites/sprite.test.ts` (imports complétés : `curveAt` depuis `./raster`, `drawBuf` depuis `./sprite`, `PAL` depuis `./palette`) :

```ts
describe("curveAt", () => {
  it("part du premier point et arrive au second", () => {
    expect(curveAt(0, 0, 10, 20, 3, 0)).toEqual([0, 0]);
    expect(curveAt(0, 0, 10, 20, 3, 1)).toEqual([10, 20]);
  });

  it("le point de contrôle décale le milieu", () => {
    const [x] = curveAt(0, 0, 10, 0, 4, 0.5);
    expect(x).toBeCloseTo(7);
  });
});

describe("palette", () => {
  it("les nouvelles gammes ont 4 tons", () => {
    for (const key of ["blue", "burgundy", "apricot", "black", "lime"] as const)
      expect(PAL[key]).toHaveLength(4);
  });
});

describe("drawBuf", () => {
  it("dessine une fonction dans un tampon 48x72 avec contour", () => {
    const b = drawBuf((buf, k) => ell(buf, k, 16, 24, 4, 4, 0, () => "#ff0000"), PAL.red);
    expect([b.w, b.h]).toEqual([48, 72]);
    expect(b.c.some((c) => c && c !== "#ff0000")).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test src/garden/sprites/sprite.test.ts`
Expected: FAIL, `curveAt` et `drawBuf` non exportés, `PAL.blue` absent.

- [ ] **Step 3: Implement**

`src/garden/sprites/palette.ts`, ajouter après `heather` :

```ts
  blue: ["#1c2a6e", "#3456b8", "#5a8ae6", "#a8ccff"],
  burgundy: ["#3a0a1a", "#6e1430", "#9e2a48", "#cc5a74"],
  apricot: ["#7a3a1a", "#c8703c", "#f0a070", "#ffd4b0"],
  black: ["#140a1a", "#2a1630", "#44284e", "#6e4a7a"],
  lime: ["#3a5010", "#6e9420", "#a8cc3a", "#dcf07a"],
```

`src/garden/sprites/raster.ts`, ajouter avant `stem` et utiliser dans `stem` :

```ts
// Point d'une courbe de Bézier quadratique ; `bend` décale le point de contrôle.
export function curveAt(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  bend: number,
  s: number,
): [number, number] {
  const mx = (x0 + x1) / 2 + bend;
  const my = (y0 + y1) / 2;
  const a = (1 - s) * (1 - s);
  const c = 2 * s * (1 - s);
  const e = s * s;
  return [a * x0 + c * mx + e * x1, a * y0 + c * my + e * y1];
}
```

Corps de `stem` remplacé par :

```ts
const pw = Math.max(1, Math.round(w * k));
const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * k * 1.6) + 1;
for (let i = 0; i <= n; i++) {
  const [x, y] = curveAt(x0, y0, x1, y1, bend, i / n);
  const px = Math.round(x * k - pw / 2);
  const py = Math.round(y * k);
  for (let j = 0; j < pw; j++) put(b, px + j, py, j === 0 && pw > 1 ? ramp[2] : ramp[1]);
}
```

`src/garden/sprites/colorRamps.ts` :

```ts
import type { ColorId } from "../core/types";
import type { PaletteKey } from "./palette";

export const COLOR_RAMP: Record<ColorId, PaletteKey> = {
  yellow: "yellow",
  pink: "pink",
  white: "white",
  violet: "violet",
  red: "red",
  orange: "orange",
  bronze: "bronze",
  heather: "heather",
  lilac: "lilac",
};
```

Déplacer chaque entrée de `SPECIES_DRAW` de `src/garden/sprites/species.ts` dans son fichier, corps copié à l'identique. Modèle pour `species/tournesol.ts` :

```ts
import { PAL } from "../palette";
import { ell, leaf, petal, stem, type DrawFn } from "../raster";

const TAU = Math.PI * 2;

export const tournesol: DrawFn = (b, k, C) => {
  // corps identique à SPECIES_DRAW.tournesol dans l'ancien species.ts
};
```

Chaque fichier importe seulement ce qu'il utilise (`hash` depuis `../../core/hash` pour `bruyere`, `put`, `rampAt`, `sphere` selon le cas). `species/index.ts` :

```ts
import type { SpeciesId } from "../../core/types";
import type { DrawFn } from "../raster";
import { aster } from "./aster";
import { bruyere } from "./bruyere";
import { chrysantheme } from "./chrysantheme";
import { colchique } from "./colchique";
import { cosmos } from "./cosmos";
import { dahlia } from "./dahlia";
import { rosetremiere } from "./rosetremiere";
import { tournesol } from "./tournesol";

// Chaque espèce a sa silhouette ; `C` est la gamme de sa couleur.
export const SPECIES_DRAW: Record<SpeciesId, DrawFn> = {
  tournesol,
  rosetremiere,
  dahlia,
  cosmos,
  aster,
  chrysantheme,
  bruyere,
  colchique,
};
```

Supprimer `src/garden/sprites/species.ts`. Dans `src/garden/sprites/sprite.ts` : importer `COLOR_RAMP` depuis `./colorRamps` et `SPECIES_DRAW` depuis `./species/index` ; `rampOf` utilise `PAL[COLOR_RAMP[color]]` ; ajouter :

```ts
export function drawBuf(draw: DrawFn, ramp: Ramp): Buf {
  const b = buf(SPRITE_TILE, SPRITE_TILE * 1.5);
  draw(b, K, ramp);
  outline(b);
  return b;
}
```

et remplacer la fin de `renderSpriteBuf` (après le cas `arbre`) par `return drawBuf(draw, rampOf(ref.color));` (importer `type DrawFn` depuis `./raster`).

- [ ] **Step 4: Run tests**

Run: `bun run test src/garden && bunx tsc --noEmit`
Expected: PASS, aucune erreur de type.

- [ ] **Step 5: Commit**

```bash
git add -A src/garden/sprites
git commit -m "refactor(potager): un fichier par espèce, gammes de couleur séparées"
```

---

### Task 2: Six nouveaux dessins et planche de contrôle

**Files:**

- Create: `src/garden/sprites/species/{anemone,sedum,amarante,vergedor,heliopsis,lanternelune}.ts`
- Create (hors dépôt, scratchpad) : `planche-entry.ts`, `planche.html`
- Test: `src/garden/sprites/sprite.test.ts`

**Interfaces:**

- Consumes: `drawBuf`, `curveAt`, `PAL` (tâche 1).
- Produces: `anemone`, `sedum`, `amarante`, `vergedor`, `heliopsis`, `lanternelune` (`DrawFn`) ; `LANTERN_BELLS: readonly [x: number, y: number, r: number][]` (`species/lanternelune.ts`, unités 32x48).

- [ ] **Step 1: Write the failing test**

Dans `sprite.test.ts` :

```ts
import { amarante } from "./species/amarante";
import { anemone } from "./species/anemone";
import { heliopsis } from "./species/heliopsis";
import { lanternelune } from "./species/lanternelune";
import { sedum } from "./species/sedum";
import { vergedor } from "./species/vergedor";

describe("nouvelles espèces", () => {
  it.each([
    ["anemone", anemone],
    ["sedum", sedum],
    ["amarante", amarante],
    ["vergedor", vergedor],
    ["heliopsis", heliopsis],
    ["lanternelune", lanternelune],
  ] as const)("%s produit un sprite non vide qui dépend de la couleur", (_name, draw) => {
    const a = drawBuf(draw, PAL.pink);
    expect(opaque(a)).toBeGreaterThan(200);
    expect(a.c.join()).not.toBe(drawBuf(draw, PAL.blue).c.join());
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test src/garden/sprites/sprite.test.ts`
Expected: FAIL, modules introuvables.

- [ ] **Step 3: Implement the drawings**

`species/anemone.ts` (tiges fines ramifiées, fleurs à 6 larges pétales, cœur vert cerclé de jaune) :

```ts
import { PAL } from "../palette";
import { ell, leaf, petal, sphere, stem, type DrawFn } from "../raster";

const TAU = Math.PI * 2;
const HEADS: [number, number][] = [
  [8, 19],
  [24, 15],
  [15, 9],
];

export const anemone: DrawFn = (b, k, C) => {
  [
    [16, 46, 3.4],
    [16, 46, -0.3],
    [15, 45, 4.2],
    [17, 45, 5.3],
  ].forEach(([x, y, a]) => leaf(b, k, x, y, a, 8, 5, PAL.darkLeaf));
  for (const [x, y] of HEADS) stem(b, k, 16, 43, x, y, 0.8, PAL.green, (x - 16) * 0.35);
  for (const [x, y] of HEADS) {
    for (let j = 0; j < 6; j++) petal(b, k, x, y, (j / 6) * TAU + 0.3, 6.6, 4.8, C, { bias: 0.05 });
    ell(b, k, x, y, 2.1, 2.1, 0, sphere(PAL.yellow, 0.1));
    ell(b, k, x, y, 1.2, 1.2, 0, sphere(PAL.green, 0.15));
  }
};
```

`species/sedum.ts` (tiges charnues, feuilles grasses, dôme plat de petites étoiles) :

```ts
import { hash } from "../../core/hash";
import { PAL } from "../palette";
import { curveAt, ell, sphere, stem, type DrawFn } from "../raster";

const STEMS = [10, 16, 22];

export const sedum: DrawFn = (b, k, C) => {
  for (const x of STEMS) {
    const bend = (x - 16) * 0.2;
    stem(b, k, 16, 47, x, 21, 1.7, PAL.green, bend);
    for (let s = 0.15; s < 0.9; s += 0.17) {
      const [lx, ly] = curveAt(16, 47, x, 21, bend, s);
      const side = Math.round(s * 10) % 2 ? 1 : -1;
      ell(b, k, lx + side * 2.2, ly, 2.5, 1.6, side * 0.5, sphere(PAL.green, 0.25));
    }
  }
  for (let row = 0; row < 3; row++)
    for (let dx = -10; dx <= 10; dx += 1.7) {
      const top = 17 - Math.sqrt(Math.max(0, 1 - (dx / 11) ** 2)) * 5;
      const jitter = (hash(Math.round(dx * 10), row) - 0.5) * 0.8;
      ell(b, k, 16 + dx, top + row * 1.7 + jitter, 1.2, 1.1, 0, sphere(C, -0.12 * row));
    }
};
```

`species/amarante.ts` (grandes feuilles, épis retombants en chapelets) :

```ts
import { hash } from "../../core/hash";
import { PAL } from "../palette";
import { ell, leaf, sphere, stem, type DrawFn } from "../raster";

// [départ x, départ y, écart latéral, longueur]
const TASSELS: [number, number, number, number][] = [
  [14, 13, -5, 27],
  [18, 13, 5, 25],
  [16, 12, -1.5, 31],
  [20, 15, 8, 18],
  [12, 15, -8, 20],
];

export const amarante: DrawFn = (b, k, C) => {
  stem(b, k, 16, 47, 16, 11, 1.8, PAL.green, 1);
  leaf(b, k, 16, 41, Math.PI * 0.9, 10, 6, PAL.green);
  leaf(b, k, 16, 35, -0.2, 10, 6, PAL.green);
  leaf(b, k, 16, 27, Math.PI * 1.05, 8, 5, PAL.green);
  leaf(b, k, 16, 21, -0.3, 7, 4, PAL.green);
  for (let j = 0; j < 6; j++)
    ell(b, k, 16 + (j % 2 ? 1 : -1), 9 - j * 1.2, 1.7, 1.5, 0, sphere(C, 0.1));
  TASSELS.forEach(([sx, sy, side, len], t) => {
    for (let s = 0; s <= 1; s += 0.055) {
      const x = sx + side * Math.sin(s * Math.PI * 0.55);
      const y = sy + s * len;
      const r = 1.7 * (1 - s * 0.45);
      ell(b, k, x, y, r, r * 1.15, 0, sphere(C, -0.1 + (hash(t, Math.round(s * 20)) - 0.5) * 0.3));
    }
  });
};
```

`species/vergedor.ts` (tige droite, feuilles lancéolées, panicules arquées fleuries sur le dessus) :

```ts
import { hash } from "../../core/hash";
import { PAL } from "../palette";
import { curveAt, ell, leaf, sphere, stem, type DrawFn } from "../raster";

// [bout x, bout y, courbure]
const BRANCHES: [number, number, number][] = [
  [4, 15, -3],
  [28, 14, 3],
  [9, 7, -2],
  [23, 6, 2],
  [16, 2, 0.5],
];

export const vergedor: DrawFn = (b, k, C) => {
  stem(b, k, 16, 47, 16, 20, 1.2, PAL.green, 0.5);
  for (let y = 43; y > 21; y -= 4.5)
    leaf(b, k, 16, y, Math.round(y) % 2 ? -0.35 : Math.PI + 0.35, 7, 2, PAL.green);
  BRANCHES.forEach(([ex, ey, bend], i) => {
    stem(b, k, 16, 21, ex, ey, 0.7, PAL.green, bend);
    for (let s = 0.3; s <= 1; s += 0.07) {
      const [x, y] = curveAt(16, 21, ex, ey, bend, s);
      const jx = (hash(i, Math.round(s * 100)) - 0.5) * 1.4;
      ell(b, k, x + jx, y - 1.1, 1.1, 1.1, 0, sphere(C, 0.1));
      ell(b, k, x - jx, y - 0.2, 0.9, 0.9, 0, sphere(C, -0.1));
    }
  });
};
```

`species/heliopsis.ts` (trois capitules à 14 pétales, cœur bombé cuivré, feuilles opposées) :

```ts
import { PAL } from "../palette";
import { ell, leaf, petal, sphere, stem, type DrawFn } from "../raster";

const TAU = Math.PI * 2;
const HEADS: [number, number, number][] = [
  [9, 21, 5],
  [23, 18, 5],
  [16, 11, 5.8],
];

export const heliopsis: DrawFn = (b, k, C) => {
  stem(b, k, 16, 47, 16, 11, 1.4, PAL.green, 0.6);
  stem(b, k, 16, 33, 9, 21, 1, PAL.green, -1);
  stem(b, k, 16, 30, 23, 18, 1, PAL.green, 1);
  for (const y of [41, 35]) {
    leaf(b, k, 16, y, Math.PI * 0.95, 8, 4.5, PAL.green);
    leaf(b, k, 16, y, -0.1, 8, 4.5, PAL.green);
  }
  for (const [x, y, r] of HEADS) {
    for (let j = 0; j < 14; j++) petal(b, k, x, y, (j / 14) * TAU, r, 2.4, C, { bias: 0.05 });
    ell(b, k, x, y, r * 0.38, r * 0.38, 0, sphere(PAL.bronze, -0.25));
  }
};
```

`species/lanternelune.ts` (tige arquée portant trois clochettes lunaires ; `C` colore les clochettes) :

```ts
import { PAL } from "../palette";
import { ell, leaf, put, sphere, stem, type DrawFn } from "../raster";

// Clochettes [x, y, rayon] en unités 32x48 ; le rendu y pose ses lumières.
export const LANTERN_BELLS: readonly [number, number, number][] = [
  [24, 17, 3.4],
  [19.5, 24, 2.8],
  [26, 27.5, 2.4],
];

export const lanternelune: DrawFn = (b, k, C) => {
  stem(b, k, 14, 47, 14, 12, 1.4, PAL.darkLeaf, 2.5);
  stem(b, k, 14, 13, 24, 10, 1.1, PAL.darkLeaf, -2);
  leaf(b, k, 14, 40, Math.PI * 0.92, 8, 3.5, PAL.darkLeaf);
  leaf(b, k, 15, 32, -0.25, 7, 3, PAL.darkLeaf);
  for (const [x, y, r] of LANTERN_BELLS) {
    stem(b, k, x, y - r - 3, x, y - r, 0.5, PAL.darkLeaf);
    ell(b, k, x, y, r, r * 1.2, 0, sphere(C, 0.25));
    ell(b, k, x, y + r * 0.9, r * 0.9, r * 0.35, 0, () => C[1]);
    put(b, Math.round(x * k), Math.round((y + r * 1.1) * k), PAL.glow[3]);
  }
};
```

- [ ] **Step 4: Run tests**

Run: `bun run test src/garden/sprites && bunx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Point de contrôle visuel (bloquant)**

Construire une planche des 6 dessins dans toutes leurs couleurs du catalogue (tâche 3, tableau 2.1 de la spec) avec les gammes de la tâche 1 (`vert` = `PAL.lime`, `bordeaux` = `PAL.burgundy`, `abricot` = `PAL.apricot`, `noir` = `PAL.black`, `bleu` = `PAL.blue`). Script dans le scratchpad :

```ts
// planche-entry.ts
import { PAL } from "<repo>/src/garden/sprites/palette";
import { toCanvas } from "<repo>/src/garden/sprites/raster";
import { drawBuf } from "<repo>/src/garden/sprites/sprite";
import { amarante } from "<repo>/src/garden/sprites/species/amarante";
import { anemone } from "<repo>/src/garden/sprites/species/anemone";
import { heliopsis } from "<repo>/src/garden/sprites/species/heliopsis";
import { lanternelune } from "<repo>/src/garden/sprites/species/lanternelune";
import { sedum } from "<repo>/src/garden/sprites/species/sedum";
import { vergedor } from "<repo>/src/garden/sprites/species/vergedor";

const ROWS = [
  ["Anémone du Japon", anemone, ["pink", "white", "lilac", "burgundy"]],
  ["Sedum", sedum, ["pink", "burgundy", "white", "lime"]],
  ["Amarante", amarante, ["red", "burgundy", "lime", "orange", "yellow"]],
  ["Verge d'or", vergedor, ["yellow", "orange", "apricot", "white"]],
  ["Héliopsis", heliopsis, ["yellow", "orange", "bronze", "red"]],
  ["Lanterne-de-lune", lanternelune, ["blue", "white", "violet"]],
] as const;

for (const [name, draw, colors] of ROWS) {
  const row = document.createElement("div");
  row.innerHTML = `<h3>${name}</h3>`;
  for (const c of colors) {
    const cv = toCanvas(drawBuf(draw, PAL[c]));
    cv.style.cssText = "width:144px;image-rendering:pixelated;background:#2a1e26;margin:4px";
    row.appendChild(cv);
  }
  document.body.appendChild(row);
}
```

`bun build planche-entry.ts --target=browser --outfile planche.js`, puis une page `planche.html` (fond `#1a1216`, texte clair) qui charge `planche.js`, affichée dans le compagnon de brainstorming ou le panneau navigateur. Montrer la planche à l'utilisateur et **attendre sa validation**. Ajuster les dessins selon ses retours (les tests de l'étape 1 doivent rester verts).

- [ ] **Step 6: Commit**

```bash
git add src/garden/sprites
git commit -m "feat(potager): dessins de six nouvelles espèces"
```

---

### Task 3: Catalogue et branchement

**Files:**

- Create: `src/garden/core/catalog/colors.ts`, `src/garden/core/catalog/species.ts`, `src/garden/core/catalog/catalog.test.ts`
- Delete: `src/garden/core/species.ts`
- Modify: `src/garden/core/types.ts`, `src/garden/core/labels.ts`, `src/garden/core/target.ts`, `src/garden/core/actions.ts`, `src/garden/core/field.test.ts`, `src/garden/core/labels.test.ts`, `src/garden/sprites/colorRamps.ts`, `src/garden/sprites/species/index.ts`, `src/garden/sprites/sprite.test.ts`, `src/lib/accents.test.ts`

**Interfaces:**

- Consumes: 6 dessins (tâche 2), `COLOR_RAMP`, `SPECIES_DRAW` (tâche 1).
- Produces:
  - `COLORS`, `type ColorId`, `colorName(color: ColorId, feminine: boolean): string`
  - `type HarvestTool = "main" | "secateur"`, `interface SpeciesDef { id: SpeciesId; name: string; feminine: boolean; tool: HarvestTool; note: string; colors: readonly { color: ColorId; rarity: Rarity }[] }`
  - `SPECIES` (ordre du catalogue), `type SpeciesId`, `speciesOf(id: SpeciesId): SpeciesDef`, `isSpeciesId(v: string): v is SpeciesId`, `harvestTool(id: SpeciesId): HarvestTool`, `rarityOf(species: SpeciesId, color: ColorId): Rarity | null`, `CATALOG_ENTRIES: readonly { species: SpeciesId; color: ColorId; rarity: Rarity }[]`
  - `labels.ts` : `SPECIES_FR` supprimé, `flowerName`, `pickedWord` inchangés ; ajout `VARIANT_FR: Record<VariantId, string>`, `HARVEST_FR: Record<HarvestTool, string>`, `pressedLabel(n: number): string`.

- [ ] **Step 1: Write the failing tests**

`src/garden/core/catalog/catalog.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { PAL } from "../../sprites/palette";
import { COLOR_RAMP } from "../../sprites/colorRamps";
import { SPECIES_DRAW } from "../../sprites/species/index";
import { COLORS } from "./colors";
import { CATALOG_ENTRIES, harvestTool, isSpeciesId, rarityOf, SPECIES, speciesOf } from "./species";

describe("catalogue", () => {
  it("65 entrées, 27 / 17 / 11 / 10", () => {
    expect(CATALOG_ENTRIES).toHaveLength(65);
    const count = (r: string) => CATALOG_ENTRIES.filter((e) => e.rarity === r).length;
    expect([count("commune"), count("rare"), count("epique"), count("legendaire")]).toEqual([
      27, 17, 11, 10,
    ]);
  });

  it("14 espèces, chacune avec des couleurs sans doublon, un dessin et une note", () => {
    expect(SPECIES).toHaveLength(14);
    for (const s of SPECIES) {
      const colors = s.colors.map((c) => c.color);
      expect(colors.length).toBeGreaterThan(0);
      expect(new Set(colors).size).toBe(colors.length);
      expect(SPECIES_DRAW[s.id]).toBeTypeOf("function");
      expect(s.note.length).toBeGreaterThan(20);
    }
  });

  it("chaque couleur a ses noms et sa gamme", () => {
    for (const id of Object.keys(COLORS) as (keyof typeof COLORS)[]) {
      expect(COLORS[id]).toHaveLength(2);
      expect(PAL[COLOR_RAMP[id]]).toHaveLength(4);
    }
  });

  it("la Lanterne-de-lune est entièrement légendaire", () => {
    expect(speciesOf("lanternelune").colors.every((c) => c.rarity === "legendaire")).toBe(true);
  });

  it("outils, raretés et garde d'identifiant", () => {
    expect(harvestTool("dahlia")).toBe("secateur");
    expect(harvestTool("anemone")).toBe("main");
    expect(rarityOf("dahlia", "blue")).toBe("legendaire");
    expect(rarityOf("dahlia", "lilac")).toBeNull();
    expect(isSpeciesId("sedum")).toBe(true);
    expect(isSpeciesId("pissenlit")).toBe(false);
  });
});
```

`src/garden/core/labels.test.ts`, ajouter dans `describe("flowerName")` puis un nouveau bloc (import `pressedLabel`, `VARIANT_FR`) :

```ts
it("accorde les nouvelles espèces et couleurs", () => {
  expect(flowerName({ species: "anemone", color: "white" })).toBe("Anémone du Japon blanche");
  expect(flowerName({ species: "vergedor", color: "orange" })).toBe("Verge d'or orange");
  expect(flowerName({ species: "lanternelune", color: "blue" })).toBe("Lanterne-de-lune bleue");
  expect(flowerName({ species: "sedum", color: "lime" })).toBe("Sedum vert");
  expect(flowerName({ species: "rosetremiere", color: "black" })).toBe("Rose trémière noire");
});
```

```ts
describe("herbier", () => {
  it("pressedLabel accorde le nombre", () => {
    expect(pressedLabel(1)).toBe("1 pressée");
    expect(pressedLabel(3)).toBe("3 pressées");
  });

  it("noms des variantes", () => {
    expect(VARIANT_FR).toEqual({ givree: "Givrée", doree: "Dorée", lumineuse: "Lumineuse" });
  });
});
```

`src/garden/core/field.test.ts` : remplacer le bloc `describe("harvestTool")` par

```ts
describe("harvestTool", () => {
  it("sécateur pour les tiges épaisses, main sinon", () => {
    const cut = SPECIES.filter((s) => harvestTool(s.id) === "secateur").map((s) => s.id);
    expect(cut.sort()).toEqual([
      "amarante",
      "chrysantheme",
      "dahlia",
      "heliopsis",
      "rosetremiere",
      "sedum",
      "tournesol",
    ]);
  });
});
```

avec `import { harvestTool, SPECIES } from "./catalog/species";` à la place de l'import de `./species`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun run test src/garden/core`
Expected: FAIL, `./catalog/species` introuvable.

- [ ] **Step 3: Implement the catalog**

`src/garden/core/catalog/colors.ts` :

```ts
// [masculin, féminin]
export const COLORS = {
  yellow: ["jaune", "jaune"],
  pink: ["rose", "rose"],
  white: ["blanc", "blanche"],
  violet: ["violet", "violette"],
  red: ["rouge", "rouge"],
  orange: ["orange", "orange"],
  bronze: ["bronze", "bronze"],
  heather: ["pourpre", "pourpre"],
  lilac: ["lilas", "lilas"],
  blue: ["bleu", "bleue"],
  burgundy: ["bordeaux", "bordeaux"],
  apricot: ["abricot", "abricot"],
  black: ["noir", "noire"],
  lime: ["vert", "verte"],
} as const satisfies Record<string, readonly [string, string]>;

export type ColorId = keyof typeof COLORS;

export const colorName = (color: ColorId, feminine: boolean): string =>
  COLORS[color][feminine ? 1 : 0];
```

`src/garden/core/catalog/species.ts` :

```ts
import type { Rarity } from "../types";
import type { ColorId } from "./colors";

export type HarvestTool = "main" | "secateur";

interface SpeciesData {
  id: string;
  name: string;
  feminine: boolean;
  tool: HarvestTool;
  note: string;
  colors: readonly { color: ColorId; rarity: Rarity }[];
}

const c = (color: ColorId, rarity: Rarity) => ({ color, rarity });

// Ordre du catalogue : celui de l'Herbier.
export const SPECIES = [
  {
    id: "tournesol",
    name: "Tournesol",
    feminine: false,
    tool: "secateur",
    note: "Il a suivi le soleil tout l'été ; en automne, sa tête lourde regarde enfin le sol et nourrit les mésanges.",
    colors: [
      c("yellow", "commune"),
      c("orange", "commune"),
      c("bronze", "rare"),
      c("burgundy", "epique"),
      c("white", "legendaire"),
    ],
  },
  {
    id: "rosetremiere",
    name: "Rose trémière",
    feminine: true,
    tool: "secateur",
    note: "Elle pousse contre les murs chauds et fleurit de bas en haut, comme une échelle qu'on grimpe jusqu'aux premiers froids.",
    colors: [
      c("pink", "commune"),
      c("white", "commune"),
      c("yellow", "rare"),
      c("red", "rare"),
      c("black", "legendaire"),
    ],
  },
  {
    id: "dahlia",
    name: "Dahlia",
    feminine: false,
    tool: "secateur",
    note: "Plus on le coupe, plus il fleurit. Ses pompons tiennent jusqu'à la première gelée, qui les noircit en une nuit.",
    colors: [
      c("red", "commune"),
      c("orange", "commune"),
      c("pink", "rare"),
      c("apricot", "rare"),
      c("burgundy", "epique"),
      c("blue", "legendaire"),
    ],
  },
  {
    id: "cosmos",
    name: "Cosmos",
    feminine: false,
    tool: "main",
    note: "Léger comme une plume, il danse au moindre souffle. Les abeilles tardives lui rendent visite jusqu'en octobre.",
    colors: [
      c("pink", "commune"),
      c("white", "commune"),
      c("red", "rare"),
      c("orange", "rare"),
      c("yellow", "epique"),
      c("black", "legendaire"),
    ],
  },
  {
    id: "aster",
    name: "Aster",
    feminine: false,
    tool: "main",
    note: "On l'appelle aussi l'étoile d'automne : ses petites marguerites s'ouvrent quand le reste du jardin s'endort.",
    colors: [
      c("violet", "commune"),
      c("lilac", "commune"),
      c("blue", "rare"),
      c("pink", "rare"),
      c("white", "epique"),
    ],
  },
  {
    id: "chrysantheme",
    name: "Chrysanthème",
    feminine: false,
    tool: "secateur",
    note: "Il attend que les jours raccourcissent pour fleurir. Ses capitules serrés résistent au vent et à la pluie.",
    colors: [
      c("bronze", "commune"),
      c("yellow", "commune"),
      c("white", "commune"),
      c("red", "rare"),
      c("pink", "rare"),
      c("lime", "legendaire"),
    ],
  },
  {
    id: "bruyere",
    name: "Bruyère",
    feminine: true,
    tool: "main",
    note: "Un tapis de clochettes minuscules qui colore les landes. Elle aime la terre pauvre et les matins brumeux.",
    colors: [
      c("heather", "commune"),
      c("pink", "commune"),
      c("white", "rare"),
      c("lilac", "epique"),
    ],
  },
  {
    id: "colchique",
    name: "Colchique",
    feminine: false,
    tool: "main",
    note: "Il sort de terre sans feuilles quand les prés jaunissent. Joli à regarder, à ne jamais goûter.",
    colors: [
      c("lilac", "commune"),
      c("pink", "commune"),
      c("violet", "rare"),
      c("white", "epique"),
    ],
  },
  {
    id: "anemone",
    name: "Anémone du Japon",
    feminine: true,
    tool: "main",
    note: "Ses fleurs se balancent en haut de longues tiges fines. Elle éclaire les coins d'ombre jusqu'aux premières gelées.",
    colors: [
      c("pink", "commune"),
      c("white", "commune"),
      c("lilac", "rare"),
      c("burgundy", "epique"),
    ],
  },
  {
    id: "sedum",
    name: "Sedum",
    feminine: false,
    tool: "secateur",
    note: "Ses feuilles charnues gardent l'eau de l'été. Ses dômes de petites étoiles rougissent à mesure que l'automne avance.",
    colors: [
      c("pink", "commune"),
      c("burgundy", "commune"),
      c("white", "rare"),
      c("lime", "epique"),
    ],
  },
  {
    id: "amarante",
    name: "Amarante",
    feminine: true,
    tool: "secateur",
    note: "Ses épis retombent comme des cordelettes de velours. Une fois séchée, elle garde sa couleur tout l'hiver.",
    colors: [
      c("red", "commune"),
      c("burgundy", "commune"),
      c("lime", "rare"),
      c("orange", "epique"),
      c("yellow", "legendaire"),
    ],
  },
  {
    id: "vergedor",
    name: "Verge d'or",
    feminine: true,
    tool: "main",
    note: "Ses plumets dorés s'inclinent au bord des chemins. Les papillons de fin de saison s'y arrêtent volontiers.",
    colors: [
      c("yellow", "commune"),
      c("orange", "rare"),
      c("apricot", "epique"),
      c("white", "legendaire"),
    ],
  },
  {
    id: "heliopsis",
    name: "Héliopsis",
    feminine: false,
    tool: "secateur",
    note: "Un cousin du tournesol, plus modeste et plus têtu : il fleurit sans relâche de juillet aux premiers froids.",
    colors: [
      c("yellow", "commune"),
      c("orange", "commune"),
      c("bronze", "rare"),
      c("red", "epique"),
    ],
  },
  {
    id: "lanternelune",
    name: "Lanterne-de-lune",
    feminine: true,
    tool: "main",
    note: "On raconte qu'elle ne pousse que dans les jardins bien soignés. La nuit, ses clochettes éclairent le champ d'une lueur froide.",
    colors: [c("blue", "legendaire"), c("white", "legendaire"), c("violet", "legendaire")],
  },
] as const satisfies readonly SpeciesData[];

export type SpeciesId = (typeof SPECIES)[number]["id"];

export interface SpeciesDef extends SpeciesData {
  id: SpeciesId;
}

const BY_ID = new Map<string, SpeciesDef>(SPECIES.map((s) => [s.id, s]));

export const isSpeciesId = (v: string): v is SpeciesId => BY_ID.has(v);

export const speciesOf = (id: SpeciesId): SpeciesDef => BY_ID.get(id)!;

export const harvestTool = (id: SpeciesId): HarvestTool => speciesOf(id).tool;

export const rarityOf = (species: SpeciesId, color: ColorId): Rarity | null =>
  speciesOf(species).colors.find((x) => x.color === color)?.rarity ?? null;

export const CATALOG_ENTRIES = SPECIES.flatMap((s) =>
  s.colors.map(({ color, rarity }) => ({ species: s.id as SpeciesId, color, rarity })),
);
```

(Prettier reformatera les tableaux de couleurs sur plusieurs lignes au commit.)

`src/garden/core/types.ts` : supprimer les unions `SpeciesId` et `ColorId`, ajouter en tête :

```ts
import type { ColorId } from "./catalog/colors";
import type { SpeciesId } from "./catalog/species";

export type { ColorId, SpeciesId };
```

`src/garden/core/labels.ts` : supprimer `SPECIES_FR`, `FEMININE`, `COLOR_FR` ; importer `colorName`, `isSpeciesId`, `speciesOf`, `type HarvestTool` et `VariantId` ; remplacer les fonctions :

```ts
export function flowerName(f: { species: SpeciesId; color: ColorId }): string {
  if (!isSpeciesId(f.species)) return "Fleur inconnue";
  const s = speciesOf(f.species);
  return `${s.name} ${colorName(f.color, s.feminine)}`;
}

export const pickedWord = (species: SpeciesId): string =>
  isSpeciesId(species) && speciesOf(species).feminine ? "cueillie" : "cueilli";

export const VARIANT_FR: Record<VariantId, string> = {
  givree: "Givrée",
  doree: "Dorée",
  lumineuse: "Lumineuse",
};

export const HARVEST_FR: Record<HarvestTool, string> = {
  main: "À la main",
  secateur: "Au sécateur",
};

export const pressedLabel = (n: number): string => `${n} ${n > 1 ? "pressées" : "pressée"}`;
```

`src/garden/core/target.ts` et `src/garden/core/actions.ts` : remplacer `import { harvestTool } from "./species";` par `import { harvestTool } from "./catalog/species";`. Supprimer `src/garden/core/species.ts`.

`src/garden/sprites/colorRamps.ts` : ajouter `blue: "blue", burgundy: "burgundy", apricot: "apricot", black: "black", lime: "lime",`.

`src/garden/sprites/species/index.ts` : importer et ajouter `anemone, sedum, amarante, vergedor, heliopsis, lanternelune` à `SPECIES_DRAW`.

`src/garden/sprites/sprite.test.ts` : remplacer le tableau `species` de `renderSpriteBuf` par un test sur tout le catalogue :

```ts
it("les 65 entrées du catalogue produisent un sprite 48x72 non vide", () => {
  for (const { species, color } of CATALOG_ENTRIES) {
    const b = renderSpriteBuf({ name: species, color });
    expect([b.w, b.h]).toEqual([48, 72]);
    expect(opaque(b)).toBeGreaterThan(200);
  }
});
```

(import `CATALOG_ENTRIES` depuis `../core/catalog/species`, retirer l'import devenu inutile de `SpeciesId`).

`src/lib/accents.test.ts` : ajouter à `WRONG`, dans l'ordre alphabétique, `"doree"`, `"epique"`, `"givree"`, `"legendaire"`, `"pressee"`, `"pressees"`, `"tombee"`.

- [ ] **Step 4: Run tests**

Run: `bun run test && bunx tsc --noEmit && bun run lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A src/garden src/lib/accents.test.ts
git commit -m "feat(potager): catalogue de 14 espèces et 65 entrées"
```

---

### Task 4: Pressage et avancement de l'Herbier (règles pures)

**Files:**

- Create: `src/garden/core/herbier.ts`, `src/garden/core/herbier.test.ts`
- Modify: `src/garden/core/rolls.ts`, `src/garden/core/rolls.test.ts`, `src/garden/core/counters.ts`

**Interfaces:**

- Consumes: `speciesOf`, `isSpeciesId`, `CATALOG_ENTRIES` (tâche 3), `entryId` (`core/discovery.ts`), `bump` (`core/counters.ts`).
- Produces:
  - `rolls.ts` : `pressSeedChance = 0.35`, `RARITY_WEIGHT: Record<Rarity, number>`, `rollPressSeed(flower: Flower, rng: Rng): Seed | null`
  - `herbier.ts` : `pressFlower(save: GardenSave, index: number, now: number, rng: Rng): { save: GardenSave; seed: Seed | null } | null` ; `interface Progress { found: number; total: number }` ; `speciesProgress(save: GardenSave, species: SpeciesId): Progress` ; `herbierProgress(save: GardenSave): Progress` ; `latestSpecies(save: GardenSave): SpeciesId`
  - `CounterId` gagne `"pressed"`.

- [ ] **Step 1: Write the failing tests**

`src/garden/core/rolls.test.ts`, ajouter (imports `pressSeedChance`, `RARITY_WEIGHT`, `rollPressSeed`) :

```ts
const seq = (...values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};

describe("rollPressSeed", () => {
  const cosmos: Flower = { species: "cosmos", color: "pink", rarity: "commune" };

  it("35 % de chance", () => {
    expect(pressSeedChance).toBe(0.35);
    expect(rollPressSeed(cosmos, seq(0.34, 0))).not.toBeNull();
    expect(rollPressSeed(cosmos, seq(0.35, 0))).toBeNull();
  });

  it("pondère les autres couleurs par rareté, jamais la couleur pressée", () => {
    // autres couleurs du cosmos : white C 60, red R 25, orange R 25, yellow E 12, black L 3 = 125
    expect(RARITY_WEIGHT).toEqual({ commune: 60, rare: 25, epique: 12, legendaire: 3 });
    expect(rollPressSeed(cosmos, seq(0, 0))).toEqual({
      species: "cosmos",
      color: "white",
      rarity: "commune",
    });
    expect(rollPressSeed(cosmos, seq(0, 60 / 125))).toEqual({
      species: "cosmos",
      color: "red",
      rarity: "rare",
    });
    expect(rollPressSeed(cosmos, seq(0, 0.999))).toEqual({
      species: "cosmos",
      color: "black",
      rarity: "legendaire",
    });
    for (let r = 0; r < 1; r += 0.01)
      expect(rollPressSeed(cosmos, seq(0, r))!.color).not.toBe("pink");
  });

  it("espèce à deux couleurs : toujours l'autre", () => {
    const v: Flower = { species: "lanternelune", color: "blue", rarity: "legendaire" };
    const colors = new Set([0, 0.3, 0.6, 0.99].map((r) => rollPressSeed(v, seq(0, r))!.color));
    expect([...colors].sort()).toEqual(["violet", "white"]);
  });
});
```

`src/garden/core/herbier.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { herbierProgress, latestSpecies, pressFlower, speciesProgress } from "./herbier";
import { createStarterSave } from "./starter";
import type { Flower, GardenSave } from "./types";

const NOW = 1_000_000;
const rose: Flower = { species: "cosmos", color: "pink", rarity: "commune" };
const aster: Flower = { species: "aster", color: "violet", rarity: "commune" };

function withBasket(basket: Flower[], herbier: GardenSave["herbier"] = {}): GardenSave {
  const s = createStarterSave();
  return { ...s, herbier, inventory: { ...s.inventory, basket } };
}

describe("pressFlower", () => {
  it("retire la fleur, compte le spécimen et le geste", () => {
    const save = withBasket([rose, aster], {
      "cosmos:pink": { discoveredAt: 5, pressed: 2, variants: [] },
    });
    const r = pressFlower(save, 0, NOW, () => 0.9)!;
    expect(r.seed).toBeNull();
    expect(r.save.inventory.basket).toEqual([aster]);
    expect(r.save.herbier["cosmos:pink"]).toEqual({ discoveredAt: 5, pressed: 3, variants: [] });
    expect(r.save.progress.counters.pressed).toBe(1);
    expect(r.save.inventory.seeds).toEqual(save.inventory.seeds);
  });

  it("crée l'entrée absente et ajoute la graine tombée", () => {
    const r = pressFlower(withBasket([aster]), 0, NOW, () => 0)!;
    expect(r.save.herbier["aster:violet"]).toEqual({ discoveredAt: NOW, pressed: 1, variants: [] });
    expect(r.seed).toEqual({ species: "aster", color: "lilac", rarity: "commune" });
    expect(r.save.inventory.seeds.at(-1)).toEqual(r.seed);
  });

  it("index invalide : rien", () => {
    expect(pressFlower(withBasket([rose]), 3, NOW, () => 0)).toBeNull();
  });
});

describe("avancement", () => {
  const herbier = {
    "cosmos:pink": { discoveredAt: 10, pressed: 0, variants: [] },
    "cosmos:black": { discoveredAt: 30, pressed: 0, variants: [] },
    "aster:violet": { discoveredAt: 20, pressed: 0, variants: [] },
    "pissenlit:yellow": { discoveredAt: 99, pressed: 0, variants: [] },
    "cosmos:lilac": { discoveredAt: 98, pressed: 0, variants: [] },
  };
  const save = withBasket([], herbier);

  it("par espèce et au total, entrées hors catalogue ignorées", () => {
    expect(speciesProgress(save, "cosmos")).toEqual({ found: 2, total: 6 });
    expect(speciesProgress(save, "sedum")).toEqual({ found: 0, total: 4 });
    expect(herbierProgress(save)).toEqual({ found: 3, total: 65 });
  });

  it("espèce de la dernière découverte, Tournesol par défaut", () => {
    expect(latestSpecies(save)).toBe("cosmos");
    expect(latestSpecies(withBasket([]))).toBe("tournesol");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun run test src/garden/core/rolls.test.ts src/garden/core/herbier.test.ts`
Expected: FAIL, exports manquants.

- [ ] **Step 3: Implement**

`src/garden/core/counters.ts` : `export type CounterId = "dug" | "sown" | "watered" | "picked" | "raked" | "crowsChased" | "pressed";`

`src/garden/core/rolls.ts`, ajouter (imports `speciesOf` depuis `./catalog/species`, `Rarity`) :

```ts
export const pressSeedChance = 0.35;

export const RARITY_WEIGHT: Record<Rarity, number> = {
  commune: 60,
  rare: 25,
  epique: 12,
  legendaire: 3,
};

// Graine d'une autre couleur de la même espèce, pondérée par rareté.
export function rollPressSeed(flower: Flower, rng: Rng): Seed | null {
  if (rng() >= pressSeedChance) return null;
  const others = speciesOf(flower.species).colors.filter((c) => c.color !== flower.color);
  if (!others.length) return null;
  const total = others.reduce((sum, c) => sum + RARITY_WEIGHT[c.rarity], 0);
  let r = rng() * total;
  const pick = others.find((c) => (r -= RARITY_WEIGHT[c.rarity]) < 0) ?? others[others.length - 1];
  return { species: flower.species, color: pick.color, rarity: pick.rarity };
}
```

`src/garden/core/herbier.ts` :

```ts
import { CATALOG_ENTRIES, isSpeciesId, speciesOf } from "./catalog/species";
import { bump } from "./counters";
import { entryId } from "./discovery";
import { rollPressSeed, type Rng } from "./rolls";
import type { GardenSave, Seed, SpeciesId } from "./types";

export interface Progress {
  found: number;
  total: number;
}

export function pressFlower(
  save: GardenSave,
  index: number,
  now: number,
  rng: Rng,
): { save: GardenSave; seed: Seed | null } | null {
  const { basket, seeds } = save.inventory;
  const flower = basket[index];
  if (!flower) return null;
  const id = entryId(flower.species, flower.color);
  const prev = save.herbier[id] ?? { discoveredAt: now, pressed: 0, variants: [] };
  const seed = rollPressSeed(flower, rng);
  const next: GardenSave = {
    ...save,
    inventory: {
      ...save.inventory,
      basket: basket.filter((_, i) => i !== index),
      seeds: seed ? [...seeds, seed] : seeds,
    },
    herbier: { ...save.herbier, [id]: { ...prev, pressed: prev.pressed + 1 } },
  };
  return { save: bump(next, "pressed"), seed };
}

export function speciesProgress(save: GardenSave, species: SpeciesId): Progress {
  const colors = speciesOf(species).colors;
  return {
    found: colors.filter((c) => save.herbier[entryId(species, c.color)]).length,
    total: colors.length,
  };
}

export function herbierProgress(save: GardenSave): Progress {
  return {
    found: CATALOG_ENTRIES.filter((e) => save.herbier[entryId(e.species, e.color)]).length,
    total: CATALOG_ENTRIES.length,
  };
}

export function latestSpecies(save: GardenSave): SpeciesId {
  let best: { species: SpeciesId; at: number } | null = null;
  for (const e of CATALOG_ENTRIES) {
    const found = save.herbier[entryId(e.species, e.color)];
    if (found && (!best || found.discoveredAt > best.at))
      best = { species: e.species, at: found.discoveredAt };
  }
  return best?.species ?? "tournesol";
}
```

(`isSpeciesId` n'est pas nécessaire ici : `CATALOG_ENTRIES` ne contient que des espèces valides ; ne pas l'importer.)

- [ ] **Step 4: Run tests**

Run: `bun run test src/garden/core && bunx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/garden/core
git commit -m "feat(potager): pressage des fleurs et avancement de l'Herbier"
```

---

### Task 5: Bouton Presser, reducer et toast

**Files:**

- Modify: `src/garden/ui/gardenReducer.ts`, `src/garden/ui/gardenReducer.test.ts`, `src/garden/ui/SidePanel.tsx`, `src/garden/ui/FieldView.tsx`, `src/garden/ui/GardenApp.tsx`

**Interfaces:**

- Consumes: `pressFlower` (tâche 4), `Rng` (`core/rolls.ts`).
- Produces: `GardenAction` gagne `{ type: "press"; index: number; now: number; rng: Rng }` ; `GardenState.pressed: { seq: number; seed: boolean }` ; `SidePanel` prop `onPress(index: number): void`.

- [ ] **Step 1: Write the failing test**

Dans `src/garden/ui/gardenReducer.test.ts` (qui importe déjà `createStarterSave`, `gardenReducer`, `INITIAL_GARDEN`), ajouter :

```ts
describe("press", () => {
  const flower = { species: "cosmos", color: "pink", rarity: "commune" } as const;
  const withFlower = () => {
    const s = createStarterSave();
    return gardenReducer(INITIAL_GARDEN, {
      type: "load",
      save: { ...s, inventory: { ...s.inventory, basket: [flower] } },
    });
  };

  it("presse la fleur et signale la graine", () => {
    const next = gardenReducer(withFlower(), { type: "press", index: 0, now: 5, rng: () => 0 });
    expect(next.save!.inventory.basket).toHaveLength(0);
    expect(next.pressed).toEqual({ seq: 1, seed: true });
  });

  it("index invalide : état inchangé", () => {
    const state = withFlower();
    expect(gardenReducer(state, { type: "press", index: 4, now: 5, rng: () => 0 })).toBe(state);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test src/garden/ui/gardenReducer.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

`gardenReducer.ts` :

```ts
export interface GardenState {
  save: GardenSave | null;
  // seq change à chaque lot de découvertes, pour déclencher le toast une seule fois
  discoveries: { seq: number; found: Flower[] };
  pressed: { seq: number; seed: boolean };
}

export const INITIAL_GARDEN: GardenState = {
  save: null,
  discoveries: { seq: 0, found: [] },
  pressed: { seq: 0, seed: false },
};
```

Ajouter `| { type: "press"; index: number; now: number; rng: Rng }` à `GardenAction` (import `type Rng` depuis `../core/rolls`, `pressFlower` depuis `../core/herbier`) et le cas :

```ts
    case "press": {
      const r = pressFlower(state.save, action.index, action.now, action.rng);
      if (!r) return state;
      return { ...state, save: r.save, pressed: { seq: state.pressed.seq + 1, seed: !!r.seed } };
    }
```

Le cas `tick` renvoie un objet complet : remplacer `return { save, discoveries: ... }` par `return { ...state, save, discoveries: ... }`.

`SidePanel.tsx` : signature `SidePanel({ save, raining, onPress }: { save: GardenSave; raining: boolean; onPress: (index: number) => void })` ; dans la ligne de chaque fleur du panier, après le `<span className="flex-1 ...">` :

```tsx
<button
  onClick={() => onPress(i)}
  className="rounded-md border border-amber-300/40 px-1.5 py-0.5 text-[10px] text-[#f3dca0] hover:bg-amber-300/15"
>
  Presser
</button>
```

`FieldView.tsx` :

```tsx
<SidePanel
  save={save}
  raining={isRaining(at)}
  onPress={(index) => dispatch({ type: "press", index, now: Date.now(), rng: Math.random })}
/>
```

`GardenApp.tsx`, après l'effet des découvertes :

```tsx
const toastedPress = useRef(0);
useEffect(() => {
  const { seq, seed } = state.pressed;
  if (seq === toastedPress.current) return;
  toastedPress.current = seq;
  toast(
    seed ? "Fleur pressée dans l'Herbier. Une graine est tombée !" : "Fleur pressée dans l'Herbier",
  );
}, [state.pressed]);
```

- [ ] **Step 4: Run tests and check in the browser**

Run: `bun run test && bunx tsc --noEmit && bun run lint`
Expected: PASS.

Aperçu (`preview_start` avec `name: "vite"`, ou `"vite-alt"` (port 4180) si 1420 est pris) : ouvrir le Potager sur `http://localhost:<port>/?window=garden`, semer les plantes de démonstration, cueillir une fleur, cliquer "Presser" : la fleur quitte le panier, le toast apparaît, `localStorage["devstore:garden.json"]` montre `pressed` incrémenté.

- [ ] **Step 5: Commit**

```bash
git add src/garden/ui
git commit -m "feat(potager): bouton Presser dans le panier"
```

---

### Task 6: Variantes de sprites

**Files:**

- Create: `src/garden/sprites/variants.ts`, `src/garden/sprites/variants.test.ts`
- Modify: `src/garden/sprites/sprite.ts`, `src/garden/sprites/sprite.test.ts`

**Interfaces:**

- Consumes: `Buf`, `rampAt`, `Ramp` (`raster.ts`), `hexRgb`, `mix` (`color.ts`), `PAL`.
- Produces: `VARIANT_FX: Record<VariantId, (b: Buf) => void>` ; `SpriteRef.variant?: VariantId` ; `spriteKey` inclut la variante ; `renderSpriteBuf` applique la variante avant le contour.

- [ ] **Step 1: Write the failing tests**

`src/garden/sprites/variants.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { PAL } from "./palette";
import { buf, put } from "./raster";
import { VARIANT_FX } from "./variants";

function sample() {
  const b = buf(3, 3);
  put(b, 1, 0, PAL.pink[2]);
  put(b, 1, 1, PAL.pink[1]);
  put(b, 1, 2, PAL.green[1]);
  return b;
}

describe("VARIANT_FX", () => {
  it("conserve la transparence", () => {
    for (const fx of Object.values(VARIANT_FX)) {
      const b = sample();
      fx(b);
      expect(b.c.map((c) => c !== null)).toEqual(sample().c.map((c) => c !== null));
    }
  });

  it("givrée blanchit le haut des formes et refroidit le reste", () => {
    const b = sample();
    VARIANT_FX.givree(b);
    expect(b.c[1]).toBe("#f0faff");
    expect(b.c[4]).not.toBe(PAL.pink[1]);
  });

  it("dorée garde les feuilles et dore les pétales", () => {
    const b = sample();
    VARIANT_FX.doree(b);
    expect(b.c[7]).toBe(PAL.green[1]);
    expect(b.c[4]).not.toBe(PAL.pink[1]);
  });

  it("lumineuse change toutes les couleurs", () => {
    const b = sample();
    VARIANT_FX.lumineuse(b);
    expect(b.c[4]).not.toBe(PAL.pink[1]);
    expect(b.c[7]).not.toBe(PAL.green[1]);
  });
});
```

`sprite.test.ts`, ajouter :

```ts
describe("variantes", () => {
  it("la variante change la clé et le rendu", () => {
    const plain = { name: "cosmos", color: "pink" } as const;
    const frost = { ...plain, variant: "givree" } as const;
    expect(spriteKey(frost)).not.toBe(spriteKey(plain));
    expect(renderSpriteBuf(frost).c.join()).not.toBe(renderSpriteBuf(plain).c.join());
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun run test src/garden/sprites`
Expected: FAIL.

- [ ] **Step 3: Implement**

`src/garden/sprites/variants.ts` :

```ts
import type { VariantId } from "../core/types";
import { hexRgb, mix } from "./color";
import { PAL } from "./palette";
import { rampAt, type Buf, type Ramp } from "./raster";

const FROST: Ramp = ["#2e4a6e", "#6a94c4", "#a8d0ee", "#e8f6ff"];
const GOLD: Ramp = ["#8a5a0c", "#d99a1c", "#f7cf4a", "#fff6c0"];
const LEAVES = new Set<string>([...PAL.green, ...PAL.darkLeaf]);

const lum = (hex: string) => {
  const [r, g, b] = hexRgb(hex);
  return (0.3 * r + 0.59 * g + 0.11 * b) / 255;
};

// `map` lit l'ancien tableau : les voisins sont ceux d'avant la recoloration.
function recolor(b: Buf, fn: (col: string, i: number) => string) {
  b.c = b.c.map((col, i) => (col ? fn(col, i) : null));
}

// Recolorations appliquées avant le contour.
export const VARIANT_FX: Record<VariantId, (b: Buf) => void> = {
  givree: (b) =>
    recolor(b, (col, i) => (i < b.w || !b.c[i - b.w] ? "#f0faff" : rampAt(FROST, lum(col) * 1.25))),
  doree: (b) => recolor(b, (col) => (LEAVES.has(col) ? col : rampAt(GOLD, lum(col) * 1.3 - 0.05))),
  lumineuse: (b) =>
    recolor(b, (col) => (LEAVES.has(col) ? mix(col, "#1e3a4a", 0.3) : mix(col, "#c8fff0", 0.45))),
};
```

`sprite.ts` :

```ts
export interface SpriteRef {
  name: SpriteName;
  color?: ColorId | "cream";
  variant?: VariantId;
}

export const spriteKey = (ref: SpriteRef): string =>
  `${ref.name}:${ref.color ?? ""}:${ref.variant ?? ""}`;
```

`drawBuf` prend un troisième paramètre optionnel `variant?: VariantId` et appelle `if (variant) VARIANT_FX[variant](b);` entre `draw(...)` et `outline(b)` ; `renderSpriteBuf` passe `ref.variant`. Imports : `type VariantId` depuis `../core/types`, `VARIANT_FX` depuis `./variants`.

- [ ] **Step 4: Run tests**

Run: `bun run test src/garden && bunx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/garden/sprites
git commit -m "feat(potager): sprites des variantes givrée, dorée et lumineuse"
```

---

### Task 7: Rareté et variante dans le modèle de scène

**Files:**

- Modify: `src/garden/render/sceneModel.ts`, `src/garden/render/sceneModel.test.ts`, `src/garden/render/billboards.ts`

**Interfaces:**

- Consumes: `SpriteRef.variant` (tâche 6), `isSpeciesId` (tâche 3).
- Produces: `SceneItem { ref: SpriteRef; rarity: Rarity | null; variant: VariantId | null; sway: boolean; thirsty: boolean }` (plus de `legendary`).

- [ ] **Step 1: Write the failing test**

Dans `sceneModel.test.ts`, remplacer `expect(m.items.get("1,1")!.legendary).toBe(true);` par `expect(m.items.get("1,1")!.rarity).toBe("legendaire");`, remplacer `legendary: false,` (objet `SceneItem` en bas du fichier) par `rarity: null, variant: null,`, et ajouter :

```ts
it("transmet la variante au sprite et à la clé", () => {
  const seed = {
    species: "cosmos" as const,
    color: "pink" as const,
    rarity: "rare" as const,
    variant: "doree" as const,
  };
  const save = withTiles({
    "1,1": { kind: "plant", seed, sownAt: NOW - 20 * HOUR, watered: [] },
    "2,1": {
      kind: "plant",
      seed: { ...seed, variant: undefined },
      sownAt: NOW - 20 * HOUR,
      watered: [],
    },
  });
  const m = buildSceneModel(save, NOW, noRain);
  const gold = m.items.get("1,1")!;
  expect(gold.ref).toEqual({ name: "cosmos", color: "pink", variant: "doree" });
  expect(gold.variant).toBe("doree");
  expect(itemKey(gold)).not.toBe(itemKey(m.items.get("2,1")!));
  expect(m.items.get("2,1")!.ref).toEqual({ name: "cosmos", color: "pink" });
});

it("une espèce inconnue s'affiche en graine", () => {
  const seed = { species: "pissenlit", color: "yellow", rarity: "commune" } as never;
  const save = withTiles({ "1,1": { kind: "plant", seed, sownAt: NOW - 20 * HOUR, watered: [] } });
  const item = buildSceneModel(save, NOW, noRain).items.get("1,1")!;
  expect(item.ref.name).toBe("graine");
  expect(item.rarity).toBeNull();
});
```

(ajouter `itemKey` à l'import depuis `./sceneModel`).

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test src/garden/render/sceneModel.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

`sceneModel.ts` :

```ts
export interface SceneItem {
  ref: SpriteRef;
  rarity: Rarity | null;
  variant: VariantId | null;
  sway: boolean;
  thirsty: boolean;
}

export const itemKey = (item: SceneItem): string =>
  `${spriteKey(item.ref)}:${item.rarity ?? ""}:${item.thirsty ? 1 : 0}`;
```

Dans `itemOf` : `const still = { rarity: null, variant: null, sway: false, thirsty: false };`, étapes 0 à 3 : `return { ...still, ref: STAGE_REFS[g.stage], sway: g.stage > 0, thirsty };`, puis pour la plante éclose :

```ts
const { species, color, rarity, variant } = tile.seed;
if (!isSpeciesId(species)) return { ...still, ref: STAGE_REFS[0] };
return {
  ref: { name: species, color, ...(variant && { variant }) },
  rarity,
  variant: variant ?? null,
  sway: true,
  thirsty: false,
};
```

Imports : `isSpeciesId` depuis `../core/catalog/species`, `type Rarity, type VariantId` depuis `../core/types`.

`billboards.ts` : remplacer `if (item.legendary) {` par `if (item.rarity === "legendaire") {` (remplacé à la tâche 8).

- [ ] **Step 4: Run tests**

Run: `bun run test && bunx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/garden/render
git commit -m "feat(potager): rareté et variante dans le modèle de scène"
```

---

### Task 8: Effets de rareté et de variante dans la scène

Pas de test automatisé (three.js et canvas) : vérification visuelle, panneau navigateur **visible** (sinon rAF gelé).

**Files:**

- Create: `src/garden/render/fxTextures.ts`, `src/garden/render/rarityFx.ts`
- Modify: `src/garden/render/billboards.ts`, `src/garden/render/createGardenScene.ts`, `src/garden/core/demo.ts`

**Interfaces:**

- Consumes: `SceneItem` (tâche 7), `LANTERN_BELLS` (tâche 2), `pixelTexture` (`render/texture.ts`).
- Produces: `createFxBudget(max: number): FxBudget` avec `take(n: number): number` et `give(n: number): void` ; `createPlantFx(mesh: THREE.Mesh, item: SceneItem, budget: FxBudget): PlantFx | null` avec `update(t: number, dt: number, night: boolean): void` et `dispose(): void` ; `Billboards.updateFx(t: number, dt: number, night: boolean): void`.

- [ ] **Step 1: Textures des effets**

`src/garden/render/fxTextures.ts` :

```ts
import * as THREE from "three";
import { pixelTexture } from "./texture";

const canvas = (w: number, h: number) =>
  Object.assign(document.createElement("canvas"), { width: w, height: h });

let cross: THREE.CanvasTexture | null = null;

// Étincelle en croix de 5 pixels, partagée.
export function crossTexture(): THREE.CanvasTexture {
  if (cross) return cross;
  const cv = canvas(5, 5);
  const g = cv.getContext("2d")!;
  g.fillStyle = "#ffffff";
  g.fillRect(2, 0, 1, 5);
  g.fillRect(0, 2, 5, 1);
  cross = pixelTexture(cv);
  return cross;
}

export function radialTexture(rgb: string): THREE.CanvasTexture {
  const cv = canvas(64, 64);
  const g = cv.getContext("2d")!;
  const grad = g.createRadialGradient(32, 32, 2, 32, 32, 32);
  grad.addColorStop(0, `rgba(${rgb},1)`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function raysTexture(): THREE.CanvasTexture {
  const cv = canvas(96, 96);
  const g = cv.getContext("2d")!;
  g.translate(48, 48);
  g.fillStyle = "rgba(255,230,150,0.5)";
  for (let k = 0; k < 8; k++) {
    g.rotate(Math.PI / 4);
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(-4, -48);
    g.lineTo(4, -48);
    g.fill();
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Halo pixelisé autour de la silhouette du sprite, marge `pad` pixels.
export function silhouetteGlow(
  source: HTMLCanvasElement,
  color: string,
  pad: number,
): THREE.CanvasTexture {
  const tint = canvas(source.width, source.height);
  const tg = tint.getContext("2d")!;
  tg.drawImage(source, 0, 0);
  tg.globalCompositeOperation = "source-in";
  tg.fillStyle = color;
  tg.fillRect(0, 0, tint.width, tint.height);
  const out = canvas(source.width + 2 * pad, source.height + 2 * pad);
  const g = out.getContext("2d")!;
  for (let dy = -pad; dy <= pad; dy++)
    for (let dx = -pad; dx <= pad; dx++) {
      const d = Math.hypot(dx, dy);
      if (d > pad || d === 0) continue;
      g.globalAlpha = 0.35 * (1 - d / (pad + 1));
      g.drawImage(tint, pad + dx, pad + dy);
    }
  return pixelTexture(out);
}

// Calque du reflet doré, redessiné par l'effet.
export function glintCanvas(w: number, h: number): HTMLCanvasElement {
  return canvas(w, h);
}
```

- [ ] **Step 2: Effets par plante**

`src/garden/render/rarityFx.ts` :

```ts
import * as THREE from "three";
import type { Rarity, VariantId } from "../core/types";
import { LANTERN_BELLS } from "../sprites/species/lanternelune";
import {
  crossTexture,
  glintCanvas,
  radialTexture,
  raysTexture,
  silhouetteGlow,
} from "./fxTextures";
import type { SceneItem } from "./sceneModel";
import { pixelTexture } from "./texture";

export const PLANT_PARTICLES = 12;
export const SCENE_PARTICLES = 150;

export interface FxBudget {
  take(n: number): number;
  give(n: number): void;
}

export function createFxBudget(max: number): FxBudget {
  let left = max;
  return {
    take(n) {
      const got = Math.min(n, left);
      left -= got;
      return got;
    },
    give(n) {
      left = Math.min(max, left + n);
    },
  };
}

export interface PlantFx {
  update(t: number, dt: number, night: boolean): void;
  dispose(): void;
}

type Rgb = [number, number, number];
type Motion = "twinkle" | "rise" | "drift" | "snow";

interface SparkSpec {
  motion: Motion;
  n: number;
  rate: number;
  rgb: Rgb;
  size: number;
}

// Couleurs au-delà de 1 : captées par le bloom.
const RARITY_SPARKS: Partial<Record<Rarity, SparkSpec>> = {
  rare: { motion: "twinkle", n: 6, rate: 5, rgb: [2.2, 2.4, 2.8], size: 0.09 },
  epique: { motion: "rise", n: 8, rate: 4, rgb: [1.8, 1.3, 2.6], size: 0.05 },
  legendaire: { motion: "drift", n: 10, rate: 5, rgb: [2.6, 2.2, 1.2], size: 0.07 },
};

const VARIANT_SPARKS: Partial<Record<VariantId, SparkSpec>> = {
  givree: { motion: "snow", n: 6, rate: 2.5, rgb: [2, 2.2, 2.5], size: 0.05 },
  doree: { motion: "twinkle", n: 4, rate: 3, rgb: [2.6, 2.1, 0.9], size: 0.08 },
};

const LIFE: Record<Motion, number> = { twinkle: 0.6, rise: 2, drift: 2.5, snow: 4 };

function additive(map: THREE.Texture, color?: THREE.ColorRepresentation) {
  return new THREE.MeshBasicMaterial({
    map,
    color,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
}

function sparks(parent: THREE.Object3D, spec: SparkSpec, n: number) {
  const pos = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const age = new Float32Array(n).fill(Infinity);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({
    map: crossTexture(),
    size: spec.size,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  parent.add(points);
  const life = LIFE[spec.motion];
  let debt = 0;

  function spawn(i: number) {
    const j = i * 3;
    age[i] = 0;
    pos[j + 2] = 0.03;
    if (spec.motion === "snow") {
      pos[j] = (Math.random() - 0.5) * 0.9;
      pos[j + 1] = 1.55;
    } else if (spec.motion === "rise") {
      pos[j] = (Math.random() - 0.5) * 0.7;
      pos[j + 1] = 0.3 + Math.random() * 0.6;
    } else {
      pos[j] = (Math.random() - 0.5) * 0.7;
      pos[j + 1] = 0.75 + Math.random() * 0.65;
    }
  }

  return {
    update(t: number, dt: number) {
      debt += dt * spec.rate;
      for (let i = 0; i < n && debt >= 1; i++)
        if (age[i] >= life) {
          spawn(i);
          debt--;
        }
      debt = Math.min(debt, 1);
      for (let i = 0; i < n; i++) {
        const j = i * 3;
        age[i] += dt;
        const a = age[i];
        if (a >= life) {
          col[j] = col[j + 1] = col[j + 2] = 0;
          continue;
        }
        if (spec.motion === "rise") pos[j + 1] += 0.35 * dt;
        if (spec.motion === "drift") {
          pos[j + 1] += 0.15 * dt;
          pos[j] += Math.sin(t * 2 + i) * 0.1 * dt;
        }
        if (spec.motion === "snow") pos[j + 1] -= 0.3 * dt;
        const k =
          spec.motion === "twinkle" ? Math.sin((a / life) * Math.PI) : Math.min(1, life - a, a * 3);
        col[j] = spec.rgb[0] * k;
        col[j + 1] = spec.rgb[1] * k;
        col[j + 2] = spec.rgb[2] * k;
      }
      geo.attributes.position.needsUpdate = true;
      geo.attributes.color.needsUpdate = true;
    },
    dispose() {
      parent.remove(points);
      geo.dispose();
      mat.dispose();
    },
  };
}

const GLOW_PAD = 3;

// Plan de halo de silhouette, mêmes proportions que le billboard (1 x 1,5).
function silhouettePlane(parent: THREE.Mesh, color: string) {
  const source = parent.userData.canvas as HTMLCanvasElement;
  const map = silhouetteGlow(source, color, GLOW_PAD);
  const px = 1 / source.width;
  const geo = new THREE.PlaneGeometry(1 + 2 * GLOW_PAD * px, 1.5 + 2 * GLOW_PAD * px);
  geo.translate(0, 0.75, -0.01);
  const mat = additive(map);
  const mesh = new THREE.Mesh(geo, mat);
  parent.add(mesh);
  return {
    mat,
    dispose() {
      parent.remove(mesh);
      geo.dispose();
      map.dispose();
      mat.dispose();
    },
  };
}

function flatPlane(parent: THREE.Object3D, map: THREE.Texture, size: number, y: number, z: number) {
  const geo = new THREE.PlaneGeometry(size, size);
  const mat = additive(map);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(0, y, z);
  parent.add(mesh);
  return {
    mesh,
    mat,
    dispose() {
      parent.remove(mesh);
      geo.dispose();
      map.dispose();
      mat.dispose();
    },
  };
}

function goldGlint(parent: THREE.Mesh) {
  const source = parent.userData.canvas as HTMLCanvasElement;
  const cv = glintCanvas(source.width, source.height);
  const g = cv.getContext("2d")!;
  const map = pixelTexture(cv);
  const geo = new THREE.PlaneGeometry(1, 1.5);
  geo.translate(0, 0.75, 0.005);
  const mat = additive(map);
  const mesh = new THREE.Mesh(geo, mat);
  parent.add(mesh);
  let last = -1;
  return {
    update(t: number) {
      if (t - last < 1 / 15) return;
      last = t;
      const ph = (t * 0.5) % 1.6;
      g.globalCompositeOperation = "source-over";
      g.clearRect(0, 0, cv.width, cv.height);
      if (ph <= 1) {
        const x = -20 + ph * (cv.width + 40);
        const grad = g.createLinearGradient(x - 10, 0, x + 10, 24);
        grad.addColorStop(0, "rgba(255,255,240,0)");
        grad.addColorStop(0.5, "rgba(255,255,240,0.9)");
        grad.addColorStop(1, "rgba(255,255,240,0)");
        g.fillStyle = grad;
        g.fillRect(0, 0, cv.width, cv.height);
        g.globalCompositeOperation = "destination-in";
        g.drawImage(source, 0, 0);
      }
      map.needsUpdate = true;
    },
    dispose() {
      parent.remove(mesh);
      geo.dispose();
      map.dispose();
      mat.dispose();
    },
  };
}

function bells(parent: THREE.Object3D) {
  const lights = LANTERN_BELLS.map(([x, y]) => {
    const light = new THREE.PointLight(0xaaccff, 0, 1.6, 2);
    light.position.set(x / 32 - 0.5, (48 - y) / 32, 0.2);
    parent.add(light);
    return light;
  });
  return {
    update(t: number, night: boolean) {
      lights.forEach(
        (l, i) => (l.intensity = (night ? 1.4 : 0.45) * (0.8 + 0.2 * Math.sin(t * 2 + i))),
      );
    },
    dispose() {
      lights.forEach((l) => parent.remove(l));
    },
  };
}

// Effets d'une plante éclose : enfants du billboard, ils suivent son balancement.
export function createPlantFx(mesh: THREE.Mesh, item: SceneItem, budget: FxBudget): PlantFx | null {
  const { rarity, variant } = item;
  if (!rarity || (rarity === "commune" && !variant)) return null;
  const parts: { update?(t: number, dt: number, night: boolean): void; dispose(): void }[] = [];
  let taken = 0;
  const addSparks = (spec: SparkSpec | undefined) => {
    if (!spec) return;
    const n = budget.take(Math.min(spec.n, PLANT_PARTICLES - taken));
    if (!n) return;
    taken += n;
    const s = sparks(mesh, spec, n);
    parts.push({ update: (t, dt) => s.update(t, dt), dispose: s.dispose });
  };

  addSparks(RARITY_SPARKS[rarity]);
  addSparks(variant ? VARIANT_SPARKS[variant] : undefined);

  if (rarity === "epique") {
    const aura = silhouettePlane(mesh, "#c9a0ff");
    parts.push({
      update: (t) => (aura.mat.opacity = 0.7 + 0.3 * Math.sin(t * 2.4)),
      dispose: aura.dispose,
    });
  }

  if (rarity === "legendaire") {
    const halo = flatPlane(mesh, radialTexture("255,220,120"), 1.6, 1.05, -0.03);
    const rays = flatPlane(mesh, raysTexture(), 2.2, 1.05, -0.04);
    const light = new THREE.PointLight(0xffe7a0, 1.4, 2.4, 2);
    light.position.set(0, 1.05, 0.35);
    mesh.add(light);
    parts.push({
      update(t, _dt, night) {
        const pulse = 0.5 + 0.5 * Math.sin(t * 1.6);
        halo.mat.opacity = (night ? 0.9 : 0.55) * (0.7 + 0.3 * pulse);
        rays.mat.opacity = night ? 0.45 : 0.3;
        rays.mesh.rotation.z = t * 0.2;
        light.intensity = (night ? 2.2 : 1.4) * (0.85 + 0.15 * pulse);
      },
      dispose() {
        halo.dispose();
        rays.dispose();
        mesh.remove(light);
      },
    });
  }

  if (variant === "doree") {
    const glint = goldGlint(mesh);
    parts.push({ update: (t) => glint.update(t), dispose: glint.dispose });
  }

  if (variant === "lumineuse") {
    const glow = silhouettePlane(mesh, "#9fe0d0");
    parts.push({
      update: (t, _dt, night) =>
        (glow.mat.opacity = (night ? 1 : 0.55) * (0.6 + 0.4 * Math.sin(t * 1.3))),
      dispose: glow.dispose,
    });
  }

  if (item.ref.name === "lanternelune") {
    const b = bells(mesh);
    parts.push({ update: (t, _dt, night) => b.update(t, night), dispose: b.dispose });
  }

  return {
    update(t, dt, night) {
      for (const p of parts) p.update?.(t, dt, night);
    },
    dispose() {
      for (const p of parts) p.dispose();
      budget.give(taken);
    },
  };
}
```

- [ ] **Step 3: Brancher dans les billboards et la scène**

`billboards.ts` :

- Ajouter `updateFx(t: number, dt: number, night: boolean): void;` à l'interface `Billboards`.
- Dans `createBillboards` : `const budget = createFxBudget(SCENE_PARTICLES);` et `const fx = new Map<TileKey, PlantFx>();`.
- Dans `add`, remplacer tout le bloc `if (item.rarity === "legendaire") { ... }` par :

```ts
const plantFx = createPlantFx(mesh, item, budget);
if (plantFx) fx.set(key, plantFx);
```

- Dans `remove`, avant `forget(mesh)` : `fx.get(key)?.dispose(); fx.delete(key);`.
- Nouvelle méthode :

```ts
    updateFx(t, dt, night) {
      for (const f of fx.values()) f.update(t, dt, night);
    },
```

- Dans `dispose`, en tête : `for (const f of fx.values()) f.dispose(); fx.clear();`.
- Imports : `createFxBudget, createPlantFx, SCENE_PARTICLES, type PlantFx` depuis `./rarityFx`.

`createGardenScene.ts`, dans `draw` :

```ts
  let lastT = 0;
  function draw(ms: number) {
    const t = ms / 1000;
    const dt = lastT ? Math.min(0.1, t - lastT) : 0;
    lastT = t;
    const tod = forcedTod ?? todOf(new Date());
    const L = lighting.apply(tod, raining, { ... inchangé ... });
    ...
    billboards.sway(t, raining);
    billboards.updateFx(t, dt, tod === "nuit");
    ...
```

(remplacer `forcedTod ?? todOf(new Date())` existant par `tod`).

- [ ] **Step 4: Démonstration enrichie**

`src/garden/core/demo.ts` : `DEMO` devient `[SpeciesId, ColorId, Rarity, VariantId?][]` et couvre les 14 espèces, les 4 raretés et les 3 variantes ; la graine reçoit la variante :

```ts
const DEMO: [SpeciesId, ColorId, Rarity, VariantId?][] = [
  ["tournesol", "yellow", "commune"],
  ["rosetremiere", "black", "legendaire"],
  ["dahlia", "apricot", "rare"],
  ["cosmos", "pink", "commune", "doree"],
  ["aster", "white", "epique"],
  ["chrysantheme", "lime", "legendaire"],
  ["bruyere", "heather", "commune", "givree"],
  ["colchique", "violet", "rare"],
  ["anemone", "burgundy", "epique"],
  ["sedum", "pink", "commune", "lumineuse"],
  ["amarante", "red", "commune"],
  ["vergedor", "white", "legendaire", "givree"],
  ["heliopsis", "bronze", "rare"],
  ["lanternelune", "blue", "legendaire"],
];
```

Dans `withDemoPlants`, `const [species, color, rarity, variant] = DEMO[i % DEMO.length];` et `seed: { species, color, rarity, ...(variant && { variant }) }`. Pour que toutes les plantes de démonstration soient visibles en fleur, garder le calcul d'âge actuel mais placer les entrées de `DEMO` sur **toutes** les cases de terre (retirer `.filter((_, i) => i % 2 === 0)`) et utiliser `const fraction = i < DEMO.length ? 1.05 : (i % 5) / 4 + 0.05;` (les 14 premières sont écloses, les suivantes couvrent les étapes).

- [ ] **Step 5: Vérifier**

Run: `bun run test && bunx tsc --noEmit && bun run lint`
Expected: PASS.

Aperçu, panneau navigateur **visible** : Potager, "semer des plantes de démonstration", puis vérifier pour chaque espèce et rareté : étincelles (rare), aura violette et particules montantes (épique), halo, rayons, lumière et paillettes (légendaire), flocons (givrée), reflet (dorée), lueur (lumineuse), clochettes éclairées (Lanterne-de-lune). Répéter avec l'heure forcée "Nuit" (barre de dev) : légendaires, lumineuses et Lanterne-de-lune plus fortes. Vérifier le fond passif de la fenêtre principale (mêmes effets, fps affiché <= 30). Lire `read_console_messages` (aucune erreur). Capture d'écran pour l'utilisateur.

- [ ] **Step 6: Commit**

```bash
git add src/garden
git commit -m "feat(potager): effets de rareté et de variante dans le champ"
```

---

### Task 9: Onglets de la fenêtre Potager

**Files:**

- Create: `src/garden/ui/GardenTabs.tsx`
- Modify: `src/garden/ui/GardenApp.tsx`, `src/garden/ui/FieldView.tsx`, `src/garden/ui/useCrows.ts`

**Interfaces:**

- Produces: `type GardenTab = "champ" | "herbier"` et `GardenTabs({ tab, onTab }: { tab: GardenTab; onTab(tab: GardenTab): void })` ; `FieldView` prop `active: boolean` ; `useCrows(sceneRef, saveRef, active: boolean)`.

- [ ] **Step 1: Implement**

`GardenTabs.tsx` :

```tsx
export type GardenTab = "champ" | "herbier";

const TABS: { id: GardenTab; label: string }[] = [
  { id: "champ", label: "Champ" },
  { id: "herbier", label: "Herbier" },
];

export function GardenTabs({ tab, onTab }: { tab: GardenTab; onTab: (tab: GardenTab) => void }) {
  return (
    <nav className="flex gap-1 border-b border-amber-300/25 px-4 pt-2">
      {TABS.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => onTab(id)}
          aria-pressed={tab === id}
          className={`rounded-t-lg px-4 py-2 font-serif text-lg font-semibold ${
            tab === id
              ? "bg-amber-300/10 text-[#f3dca0] shadow-[inset_0_-2px_0_#d9b46a]"
              : "text-[#a99a8a] hover:text-[#f3dca0]"
          }`}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
```

`GardenApp.tsx` : `const [tab, setTab] = useState<GardenTab>("champ");` ; remplacer le `<nav>` par `<GardenTabs tab={tab} onTab={setTab} />` ; le contenu devient :

```tsx
{
  !webglOk
    ? tab === "champ" && (
        <div className="flex flex-1 items-center justify-center p-6 text-center text-sm">
          Le Potager a besoin de WebGL, qui n'est pas disponible sur cet appareil.
        </div>
      )
    : state.save && (
        <div className={tab === "champ" ? "flex flex-1" : "hidden"}>
          <FieldView save={state.save} now={now} dispatch={dispatch} active={tab === "champ"} />
        </div>
      );
}
{
  tab === "herbier" && state.save && <HerbierPage save={state.save} />;
}
```

`HerbierPage` est créé à la tâche 11 : dans cette tâche, afficher à la place `<div className="flex-1" />` et remplacer par `HerbierPage` à la tâche 11.

`FieldView.tsx` : prop `active: boolean` ; remplacer l'effet de création de scène par une création sans `start()`, et ajouter :

```tsx
useEffect(() => {
  const scene = sceneRef.current;
  if (!scene) return;
  if (active) scene.start();
  else scene.stop();
}, [active]);
```

(l'effet de création reste déclaré avant celui-ci pour que `sceneRef` soit rempli) ; `useCrows(sceneRef, saveRef, active)`.

`useCrows.ts` : troisième paramètre `active: boolean`, conservé dans une ref :

```ts
const activeRef = useRef(active);
activeRef.current = active;
```

et la condition d'apparition devient `document.visibilityState === "visible" && activeRef.current && alive < MAX_CROWS`.

- [ ] **Step 2: Verify**

Run: `bunx tsc --noEmit && bun run lint && bun run test`
Expected: PASS.

Aperçu : les deux onglets s'affichent, passer à Herbier puis revenir sur Champ : la scène reprend là où elle était (pas de rechargement), `scene.fps` tombe à 0 pendant l'Herbier (vérifier par `javascript_tool` si exposé, sinon par l'absence d'erreur et le retour immédiat).

- [ ] **Step 3: Commit**

```bash
git add src/garden/ui
git commit -m "feat(potager): onglets Champ et Herbier"
```

---

### Task 10: Cartes de spécimen animées

**Files:**

- Create: `src/garden/ui/herbier/cardFx.ts`, `src/garden/ui/herbier/useCardFx.ts`, `src/garden/ui/herbier/VariantSlots.tsx`, `src/garden/ui/herbier/SpecimenCard.tsx`, `src/garden/ui/herbier/plate.ts`, `src/garden/ui/herbier/plate.test.ts`

**Interfaces:**

- Consumes: `spriteCanvas`, `iconDataUrl` (`sprites/sprite.ts`), `VARIANT_FR`, `RARITY_FR`, `pressedLabel`, `colorName` (tâche 3), `RARITY_COLOR` (`ui/toolMeta.ts`).
- Produces:
  - `plate.ts` : `interface Specimen { color: ColorId; rarity: Rarity; entry: HerbierEntry | null }` ; `specimensOf(save: GardenSave, species: SpeciesId): Specimen[]` (tri rareté croissante puis ordre du catalogue) ; `tiltOf(index: number): number` (degrés) ; `RARITY_ORDER: Rarity[]`.
  - `SpecimenCard({ species, specimen, tilt }: { species: SpeciesId; specimen: Specimen; tilt: number })`.

- [ ] **Step 1: Write the failing test**

`src/garden/ui/herbier/plate.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { createStarterSave } from "../../core/starter";
import { specimensOf, tiltOf } from "./plate";

describe("specimensOf", () => {
  it("trie par rareté puis ordre du catalogue et joint les entrées", () => {
    const save = {
      ...createStarterSave(),
      herbier: { "dahlia:pink": { discoveredAt: 1, pressed: 2, variants: [] } },
    };
    const list = specimensOf(save, "dahlia");
    expect(list.map((s) => s.color)).toEqual([
      "red",
      "orange",
      "pink",
      "apricot",
      "burgundy",
      "blue",
    ]);
    expect(list[2].entry?.pressed).toBe(2);
    expect(list[0].entry).toBeNull();
  });
});

describe("tiltOf", () => {
  it("alterne des inclinaisons légères", () => {
    const tilts = [0, 1, 2, 3, 4, 5].map(tiltOf);
    expect(tilts.every((t) => Math.abs(t) <= 3)).toBe(true);
    expect(new Set(tilts).size).toBeGreaterThan(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test src/garden/ui/herbier`
Expected: FAIL.

- [ ] **Step 3: Implement plate.ts**

```ts
import { speciesOf } from "../../core/catalog/species";
import { entryId } from "../../core/discovery";
import type { ColorId, GardenSave, HerbierEntry, Rarity, SpeciesId } from "../../core/types";

export const RARITY_ORDER: Rarity[] = ["commune", "rare", "epique", "legendaire"];
const TILTS = [-3, 2, -1, 3, -2, 1];

export interface Specimen {
  color: ColorId;
  rarity: Rarity;
  entry: HerbierEntry | null;
}

export function specimensOf(save: GardenSave, species: SpeciesId): Specimen[] {
  return speciesOf(species)
    .colors.map(({ color, rarity }) => ({
      color,
      rarity,
      entry: save.herbier[entryId(species, color)] ?? null,
    }))
    .sort((a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity));
}

export const tiltOf = (index: number): number => TILTS[index % TILTS.length];
```

(`Array.prototype.sort` est stable : l'ordre du catalogue est conservé à rareté égale.)

- [ ] **Step 4: Implement the card animation**

`cardFx.ts` (portage de `rarete-effets.html`, intensité marquée, fond transparent) :

```ts
import type { Rarity, VariantId } from "../../core/types";

export const CARD_SCALE = 2;
export const CARD_PAD = 8;
const W = 48 * CARD_SCALE;
const H = 72 * CARD_SCALE;
export const CARD_W = W + 2 * CARD_PAD;
export const CARD_H = H + CARD_PAD;
const CX = CARD_W / 2;
const HEAD_Y = CARD_PAD + H * 0.3;

interface Particle {
  x: number;
  y: number;
  vy: number;
  life: number;
  max: number;
}

export interface CardFxState {
  sprite: HTMLCanvasElement;
  glow: HTMLCanvasElement | null;
  layer: HTMLCanvasElement;
  rarity: Rarity;
  variant: VariantId | null;
  parts: Particle[];
}

function tinted(sprite: HTMLCanvasElement, color: string): HTMLCanvasElement {
  const cv = Object.assign(document.createElement("canvas"), { width: CARD_W, height: CARD_H });
  const g = cv.getContext("2d")!;
  g.imageSmoothingEnabled = false;
  g.drawImage(sprite, CARD_PAD, CARD_PAD, W, H);
  g.globalCompositeOperation = "source-in";
  g.fillStyle = color;
  g.fillRect(0, 0, CARD_W, CARD_H);
  return cv;
}

export function createCardFx(
  sprite: HTMLCanvasElement,
  rarity: Rarity,
  variant: VariantId | null,
): CardFxState {
  const glowColor = rarity === "epique" ? "#c9a0ff" : variant === "lumineuse" ? "#9fe0d0" : null;
  return {
    sprite,
    glow: glowColor ? tinted(sprite, glowColor) : null,
    layer: Object.assign(document.createElement("canvas"), { width: CARD_W, height: CARD_H }),
    rarity,
    variant,
    parts: [],
  };
}

function star(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  a: number,
) {
  const s = CARD_SCALE;
  g.globalAlpha = Math.max(0, a);
  g.fillStyle = color;
  g.fillRect(Math.round(x) - s / 2, Math.round(y) - r, s, r * 2);
  g.fillRect(Math.round(x) - r, Math.round(y) - s / 2, r * 2, s);
  g.globalAlpha = 1;
}

function emit(fx: CardFxState, dt: number, rate: number, make: () => Particle) {
  if (fx.parts.length < 12 && Math.random() < dt * rate) fx.parts.push(make());
}

export function drawCardFx(g: CanvasRenderingContext2D, fx: CardFxState, t: number, dt: number) {
  g.clearRect(0, 0, CARD_W, CARD_H);
  g.imageSmoothingEnabled = false;
  const pulse = 0.5 + 0.5 * Math.sin(t * 1.6);

  if (fx.rarity === "legendaire") {
    const halo = g.createRadialGradient(CX, HEAD_Y, 4, CX, HEAD_Y, CARD_W * 0.6);
    halo.addColorStop(0, `rgba(255,220,120,${0.45 * (0.7 + 0.3 * pulse)})`);
    halo.addColorStop(1, "rgba(255,200,80,0)");
    g.fillStyle = halo;
    g.fillRect(0, 0, CARD_W, CARD_H);
    g.save();
    g.translate(CX, HEAD_Y);
    g.rotate(t * 0.2);
    g.fillStyle = "rgba(255,230,150,0.14)";
    for (let k = 0; k < 8; k++) {
      g.rotate(Math.PI / 4);
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(-5, -CARD_W * 0.7);
      g.lineTo(5, -CARD_W * 0.7);
      g.fill();
    }
    g.restore();
  }

  if (fx.glow) {
    const base = fx.rarity === "epique" ? 0.9 : 0.6;
    g.globalAlpha = base * (0.6 + 0.4 * Math.sin(t * 2));
    for (const [dx, dy] of [
      [-2, 0],
      [2, 0],
      [0, -2],
      [0, 2],
      [-1, -1],
      [1, 1],
      [-1, 1],
      [1, -1],
    ])
      g.drawImage(fx.glow, dx * CARD_SCALE, dy * CARD_SCALE);
    g.globalAlpha = 1;
  }

  g.drawImage(fx.sprite, CARD_PAD, CARD_PAD, W, H);

  if (fx.variant === "doree") {
    const ph = (t * 0.5) % 1.6;
    if (ph <= 1) {
      const l = fx.layer.getContext("2d")!;
      l.globalCompositeOperation = "source-over";
      l.clearRect(0, 0, CARD_W, CARD_H);
      const x = -40 + ph * (CARD_W + 80);
      const band = l.createLinearGradient(x - 20, 0, x + 20, 40);
      band.addColorStop(0, "rgba(255,255,240,0)");
      band.addColorStop(0.5, "rgba(255,255,240,0.8)");
      band.addColorStop(1, "rgba(255,255,240,0)");
      l.fillStyle = band;
      l.fillRect(0, 0, CARD_W, CARD_H);
      l.globalCompositeOperation = "destination-in";
      l.imageSmoothingEnabled = false;
      l.drawImage(fx.sprite, CARD_PAD, CARD_PAD, W, H);
      g.drawImage(fx.layer, 0, 0);
    }
  }

  const rand = (a: number, b: number) => a + Math.random() * (b - a);
  if (fx.rarity === "rare" || fx.variant === "doree")
    emit(fx, dt, 5, () => ({
      x: rand(CARD_PAD + 10, CARD_W - CARD_PAD - 10),
      y: rand(CARD_PAD, HEAD_Y + 30),
      vy: 0,
      life: 0.6,
      max: 0.6,
    }));
  if (fx.rarity === "epique")
    emit(fx, dt, 4, () => ({
      x: rand(CARD_PAD + 10, CARD_W - CARD_PAD - 10),
      y: rand(HEAD_Y, CARD_H - 20),
      vy: -30,
      life: 2,
      max: 2,
    }));
  if (fx.rarity === "legendaire")
    emit(fx, dt, 5, () => ({
      x: rand(CARD_PAD, CARD_W - CARD_PAD),
      y: rand(HEAD_Y - 20, CARD_H - 30),
      vy: -12,
      life: 2.5,
      max: 2.5,
    }));
  if (fx.variant === "givree")
    emit(fx, dt, 2.5, () => ({ x: rand(0, CARD_W), y: 0, vy: 22, life: 4, max: 4 }));

  const s = CARD_SCALE;
  for (const p of fx.parts) {
    p.life -= dt;
    p.y += p.vy * dt;
    const a = p.max === 0.6 ? Math.sin((p.life / p.max) * Math.PI) : Math.min(1, p.life);
    if (p.max === 0.6) star(g, p.x, p.y, s * 3, fx.variant === "doree" ? "#fff4b0" : "#dff2ff", a);
    else if (p.max === 2.5) star(g, p.x, p.y, s * 1.5, "#fff1b0", a);
    else {
      g.globalAlpha = Math.max(0, a);
      g.fillStyle = p.max === 4 ? "#eaf6ff" : "#e0c8ff";
      g.fillRect(Math.round(p.x / s) * s, Math.round(p.y / s) * s, s, s);
      g.globalAlpha = 1;
    }
  }
  fx.parts = fx.parts.filter((p) => p.life > 0);
}
```

`useCardFx.ts` :

```ts
import { useEffect, type RefObject } from "react";
import type { Rarity, SpeciesId, VariantId } from "../../core/types";
import type { ColorId } from "../../core/types";
import { spriteCanvas } from "../../sprites/sprite";
import { createCardFx, drawCardFx } from "./cardFx";

// Anime une carte ; en pause quand la fenêtre est cachée.
export function useCardFx(
  ref: RefObject<HTMLCanvasElement | null>,
  species: SpeciesId,
  color: ColorId,
  rarity: Rarity,
  variant: VariantId | null,
) {
  useEffect(() => {
    const g = ref.current?.getContext("2d");
    if (!g) return;
    const fx = createCardFx(
      spriteCanvas({ name: species, color, ...(variant && { variant }) }),
      rarity,
      variant,
    );
    let raf = 0;
    let last = 0;
    const frame = (ms: number) => {
      raf = requestAnimationFrame(frame);
      if (document.visibilityState !== "visible") return;
      const t = ms / 1000;
      drawCardFx(g, fx, t, last ? Math.min(0.1, t - last) : 0);
      last = t;
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [ref, species, color, rarity, variant]);
}
```

(fusionner les deux imports de `../../core/types` en un seul.)

- [ ] **Step 5: Implement the components**

`VariantSlots.tsx` :

```tsx
import { VARIANT_FR } from "../../core/labels";
import type { VariantId } from "../../core/types";

const ORDER: VariantId[] = ["givree", "doree", "lumineuse"];
const DOT: Record<VariantId, string> = {
  givree: "#a8d0ee",
  doree: "#f3c34a",
  lumineuse: "#9fe0d0",
};

export function VariantSlots({
  seen,
  shown,
  onToggle,
}: {
  seen: VariantId[];
  shown: VariantId | null;
  onToggle: (variant: VariantId) => void;
}) {
  return (
    <div className="mt-1 flex justify-center gap-1">
      {ORDER.map((v) => {
        const has = seen.includes(v);
        return (
          <button
            key={v}
            disabled={!has}
            onClick={() => onToggle(v)}
            title={has ? VARIANT_FR[v] : "Variante pas encore vue"}
            aria-pressed={shown === v}
            className={`size-3.5 rounded-full border ${shown === v ? "border-[#3a2418]" : "border-[#b08a5a]"} disabled:cursor-default`}
            style={{ background: has ? DOT[v] : "transparent" }}
          />
        );
      })}
    </div>
  );
}
```

`SpecimenCard.tsx` :

```tsx
import { useRef, useState } from "react";
import { colorName } from "../../core/catalog/colors";
import { speciesOf } from "../../core/catalog/species";
import { pressedLabel, RARITY_FR } from "../../core/labels";
import type { SpeciesId, VariantId } from "../../core/types";
import { SpriteIcon } from "../SpriteIcon";
import { RARITY_COLOR } from "../toolMeta";
import { CARD_H, CARD_W } from "./cardFx";
import type { Specimen } from "./plate";
import { useCardFx } from "./useCardFx";
import { VariantSlots } from "./VariantSlots";

// Teintes de rareté lisibles sur le papier du carnet.
const INK: Record<Specimen["rarity"], string> = {
  commune: "#6a5a48",
  rare: "#2a6aa8",
  epique: "#7a44b0",
  legendaire: "#a8740c",
};

function LiveSprite({
  species,
  specimen,
  variant,
}: {
  species: SpeciesId;
  specimen: Specimen;
  variant: VariantId | null;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useCardFx(ref, species, specimen.color, specimen.rarity, variant);
  return (
    <canvas
      ref={ref}
      width={CARD_W}
      height={CARD_H}
      className="mx-auto block w-[112px] [image-rendering:pixelated]"
    />
  );
}

export function SpecimenCard({
  species,
  specimen,
  tilt,
}: {
  species: SpeciesId;
  specimen: Specimen;
  tilt: number;
}) {
  const [shown, setShown] = useState<VariantId | null>(null);
  const { entry, color, rarity } = specimen;
  return (
    <div className="w-[128px] text-center">
      <div
        className="rounded-sm border border-[#b08a5a] bg-[#f6eedb] p-1 shadow-[0_2px_3px_rgba(0,0,0,0.15)]"
        style={{ transform: `rotate(${tilt}deg)` }}
      >
        {entry ? (
          <LiveSprite species={species} specimen={specimen} variant={shown} />
        ) : (
          <div className="flex h-[150px] items-end justify-center">
            <SpriteIcon
              sprite={{ name: species, color }}
              className="w-[96px] [filter:brightness(0)_opacity(0.25)]"
            />
          </div>
        )}
      </div>
      <div className="mt-1 text-sm text-[#3a2418]">
        {entry ? colorName(color, speciesOf(species).feminine) : "?"}
      </div>
      <div className="text-[11px]" style={{ color: entry ? INK[rarity] : "#9a8a70" }}>
        {RARITY_FR[rarity]}
      </div>
      {entry && entry.pressed > 0 && (
        <div className="text-[11px] text-[#6a5a48]">{pressedLabel(entry.pressed)}</div>
      )}
      {entry && (
        <VariantSlots
          seen={entry.variants}
          shown={shown}
          onToggle={(v) => setShown((cur) => (cur === v ? null : v))}
        />
      )}
    </div>
  );
}
```

(`RARITY_COLOR` n'est pas utilisé : ne pas l'importer.)

- [ ] **Step 6: Run tests**

Run: `bun run test && bunx tsc --noEmit && bun run lint`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/garden/ui/herbier
git commit -m "feat(potager): cartes de spécimen animées"
```

---

### Task 11: Page Herbier en carnet

**Files:**

- Create: `src/garden/ui/herbier/HerbierPage.tsx`, `src/garden/ui/herbier/SpeciesList.tsx`, `src/garden/ui/herbier/SpeciesPlate.tsx`, `src/garden/ui/herbier/SpeciesNotes.tsx`
- Modify: `src/garden/ui/GardenApp.tsx`

**Interfaces:**

- Consumes: `herbierProgress`, `speciesProgress`, `latestSpecies` (tâche 4), `SPECIES`, `speciesOf` (tâche 3), `specimensOf`, `tiltOf`, `SpecimenCard` (tâche 10), `GROWTH_MS` (`core/growth.ts`), `formatDuration`, `RARITY_FR`, `HARVEST_FR` (`core/labels.ts`).
- Produces: `HerbierPage({ save }: { save: GardenSave })`.

- [ ] **Step 1: Implement**

`SpeciesList.tsx` :

```tsx
import { SPECIES } from "../../core/catalog/species";
import { herbierProgress, speciesProgress } from "../../core/herbier";
import type { GardenSave, SpeciesId } from "../../core/types";

export function SpeciesList({
  save,
  selected,
  onSelect,
}: {
  save: GardenSave;
  selected: SpeciesId;
  onSelect: (id: SpeciesId) => void;
}) {
  const total = herbierProgress(save);
  return (
    <div className="flex flex-col gap-0.5 border-r-2 border-dashed border-[#b08a5a] pr-3">
      <div className="mb-2">
        <div className="flex justify-between font-serif text-lg">
          <span>Herbier</span>
          <span>
            {total.found} / {total.total}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded bg-[#d6c29a]">
          <i
            className="block h-full bg-gradient-to-r from-[#b8801c] to-[#f3c34a]"
            style={{ width: `${(total.found / total.total) * 100}%` }}
          />
        </div>
      </div>
      {SPECIES.map((s) => {
        const p = speciesProgress(save, s.id);
        return (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            aria-pressed={selected === s.id}
            className={`flex justify-between rounded-md px-2 py-1 text-left ${
              selected === s.id ? "bg-[#d6c29a] font-bold" : "hover:bg-[#e0cfa8]"
            }`}
          >
            <span>{s.name}</span>
            <span>
              {p.found}/{p.total}
            </span>
          </button>
        );
      })}
    </div>
  );
}
```

`SpeciesNotes.tsx` :

```tsx
import { speciesOf } from "../../core/catalog/species";
import { GROWTH_MS } from "../../core/growth";
import { formatDuration, HARVEST_FR, RARITY_FR } from "../../core/labels";
import type { Rarity, SpeciesId } from "../../core/types";
import { RARITY_ORDER } from "./plate";

export function SpeciesNotes({ species }: { species: SpeciesId }) {
  const s = speciesOf(species);
  const rarities = RARITY_ORDER.filter((r: Rarity) => s.colors.some((c) => c.rarity === r));
  return (
    <div className="mt-5 grid gap-4 border-t border-dashed border-[#b08a5a] pt-3 sm:grid-cols-[1fr_220px]">
      <div>
        <h6 className="font-serif text-base">Note du jardinier</h6>
        <p className="font-serif italic leading-snug text-[#5a4028]">{s.note}</p>
      </div>
      <div className="text-sm">
        <div>
          <b>Cueillette :</b> {HARVEST_FR[s.tool]}
        </div>
        <div className="mt-1">
          <b>Pousse :</b>
        </div>
        {rarities.map((r) => (
          <div key={r} className="flex justify-between">
            <span>{RARITY_FR[r]}</span>
            <span>{formatDuration(GROWTH_MS[r])}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

`SpeciesPlate.tsx` :

```tsx
import { speciesOf } from "../../core/catalog/species";
import { speciesProgress } from "../../core/herbier";
import type { GardenSave, SpeciesId } from "../../core/types";
import { specimensOf, tiltOf } from "./plate";
import { SpeciesNotes } from "./SpeciesNotes";
import { SpecimenCard } from "./SpecimenCard";

export function SpeciesPlate({ save, species }: { save: GardenSave; species: SpeciesId }) {
  const p = speciesProgress(save, species);
  return (
    <div className="pl-5">
      <h5 className="font-serif text-2xl">{speciesOf(species).name}</h5>
      <div className="mb-3 italic">
        {p.found} {p.found > 1 ? "couleurs" : "couleur"} sur {p.total}
      </div>
      <div className="flex flex-wrap gap-4">
        {specimensOf(save, species).map((sp, i) => (
          <SpecimenCard key={sp.color} species={species} specimen={sp} tilt={tiltOf(i)} />
        ))}
      </div>
      <SpeciesNotes species={species} />
    </div>
  );
}
```

`HerbierPage.tsx` :

```tsx
import { useState } from "react";
import { latestSpecies } from "../../core/herbier";
import type { GardenSave, SpeciesId } from "../../core/types";
import { SpeciesList } from "./SpeciesList";
import { SpeciesPlate } from "./SpeciesPlate";

// Carnet d'herbier ouvert : espèces à gauche, planche de l'espèce à droite.
export function HerbierPage({ save }: { save: GardenSave }) {
  const [species, setSpecies] = useState<SpeciesId>(() => latestSpecies(save));
  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="mx-auto grid max-w-5xl grid-cols-[210px_1fr] rounded-xl bg-[#e9dcc0] p-4 text-[#3a2418] shadow-[inset_0_0_0_4px_#6a4428]">
        <SpeciesList save={save} selected={species} onSelect={setSpecies} />
        <SpeciesPlate key={species} save={save} species={species} />
      </div>
    </div>
  );
}
```

`GardenApp.tsx` : remplacer le `<div className="flex-1" />` provisoire de la tâche 9 par `<HerbierPage save={state.save} />` (import depuis `./herbier/HerbierPage`).

- [ ] **Step 2: Verify**

Run: `bun run test && bunx tsc --noEmit && bun run lint`
Expected: PASS.

Aperçu, panneau visible, Potager, onglet Herbier :

- avancement global et par espèce cohérents avec `localStorage["devstore:garden.json"]` ;
- espèce ouverte = dernière découverte ; sélection d'une autre espèce ;
- silhouettes pour les couleurs inconnues, rareté visible ;
- cartes animées selon la rareté (sembler les plantes de démonstration, attendre l'éclosion par un tick ou recharger) ;
- emplacement de variante rempli (plante de démonstration givrée, dorée ou lumineuse découverte) : clic, la carte passe en variante ; nouveau clic, retour ;
- "2 pressées" après deux pressages ;
- note du jardinier et fiche pratique ;
- `read_console_messages` sans erreur. Capture d'écran pour l'utilisateur.

- [ ] **Step 3: Commit**

```bash
git add src/garden/ui
git commit -m "feat(potager): page Herbier en carnet"
```

---

### Task 12: Vérification finale

**Files:**

- Modify: selon les écarts trouvés.

- [ ] **Step 1: Suite complète**

Run: `bun run test && bunx tsc --noEmit && bun run lint`
Expected: PASS, aucune erreur.

- [ ] **Step 2: Parcours complet dans l'aperçu (panneau visible)**

Nouvelle sauvegarde (`localStorage.removeItem("devstore:garden.json")`), puis : creuser, semer, arroser, plantes de démonstration, cueillette à la main et au sécateur sur une nouvelle espèce (infobulle "tige épaisse : sécateur" pour sedum, amarante, héliopsis), toast de découverte avec un nom accordé ("Anémone du Japon bordeaux"), pressage avec et sans graine, onglet Herbier, retour au Champ, heure forcée Nuit, fond passif de la fenêtre principale.

- [ ] **Step 3: Contrôle de la spec**

Relire `docs/superpowers/specs/2026-09-16-potager-especes-herbier-design.md` section par section et noter tout écart non listé dans "Écarts assumés" ; le corriger ou le signaler à l'utilisateur.

- [ ] **Step 4: Commit des corrections éventuelles**

```bash
git add -A src/garden
git commit -m "fix(potager): finitions espèces et Herbier"
```
