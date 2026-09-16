# Potager d'automne - Sous-projet 1 (Socle) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Poser le socle du Potager : sauvegarde `garden.json`, moteur de pousse en temps réel avec pluie déterministe, générateur de sprites, scène HD-2D three.js, fond passif dans la fenêtre principale, fenêtre "Potager" séparée avec son cycle de vie, et réglage "Fond animé" (potager / mare / aucun).

**Architecture:** Logique pure et testée dans `src/garden/core/` (aucun import React ou three.js). Sprites pixel art générés par code dans `src/garden/sprites/`. Scène three.js impérative dans `src/garden/render/`, pilotée par un modèle pur (`sceneModel`) et une synchronisation par différence. Composants React dans `src/garden/ui/`. Une seule fenêtre écrit la sauvegarde : la fenêtre Potager quand elle est ouverte ; la fenêtre principale ne fait que lire.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Tauri 2 (`@tauri-apps/api` WebviewWindow + events, `@tauri-apps/plugin-store`), three.js (nouvelle dépendance), Rust (`lib.rs`).

**Spec:** [docs/superpowers/specs/2026-09-16-potager-automne-vision-design.md](../specs/2026-09-16-potager-automne-vision-design.md). Maquettes de référence (code source à porter) : [docs/superpowers/mockups/potager-automne/](../mockups/potager-automne/README.md), en particulier `pixelgen.js` (sprites) et `hd2dfield.js` (scène).

## Global Constraints

- Code totalement séparé du jeu des canards : aucun import depuis `PixelPool`, `duck*`, `src/game/*`, `src/lib/duck*`.
- Tout texte affiché est en français correctement accentué ; identifiants, clés, ids et noms de fichiers restent ASCII. `src/lib/accents.test.ts` doit rester vert.
- Pas d'em dash, pas de guillemets typographiques, pas de symboles Unicode décoratifs dans le code.
- Un composant par fichier ; helpers, types, constantes et tables dans des modules séparés.
- Fond passif : bridé à **30 images/s**, **pas de parallaxe souris**, pause si focus perdu, onglet caché, page opaque, ou Potager ouvert (image figée floutée, zéro rendu).
- Pousse en **temps réel uniquement** ; arrosage = accélérateur **x1,5** pendant que la case est mouillée ; un arrosage mouille **6 h** ; durées totales : commune **8 h**, rare **12 h**, épique **18 h**, légendaire **30 h**, réparties sur 4 étapes égales.
- Sauvegarde : fichier `garden.json` (plugin-store), clé `save`, `version: 1`. Fichier illisible : copie dans `garden.corrupt-<date>.json` puis sauvegarde neuve.
- Réglage `animated_backdrop` dans `settings.json` : `"potager" | "mare" | "aucun"`, forcé une fois à `"potager"` via la clé `garden_default_v1`.
- Fermer la fenêtre principale ferme aussi la fenêtre Potager. Une seule instance de la fenêtre Potager (label `garden`).
- Sprites : tuile 48x48, plante 48x72, palette "Chaleureux", contour coloré automatique.
- Commandes : tests `bun run test`, types `bunx tsc --noEmit`, lint `bun run lint`, Rust `cargo check` dans `src-tauri/`.

## Hors périmètre de ce plan

Outils et gestes (sous-projet 2), picking et particules d'action, catalogue complet des 12 à 14 espèces et Herbier (3), sachets et pity (4), arbre de progression (5), atelier (6). Le socle n'affiche que les plantes présentes dans la sauvegarde ; en développement, un bouton "semer des plantes de démonstration" permet de vérifier le rendu.

---

## File Structure

```
src/garden/
  core/
    types.ts              types de la sauvegarde et du jeu
    time.ts               intervalles (union, durée couverte)
    hash.ts               hachage entier déterministe
    weather.ts            pluie déterministe par jour
    growth.ts             pousse, belle plante
    plots.ts              parcelles et cases de terre
    starter.ts            sauvegarde de départ
    save.ts               validation d'une sauvegarde brute
    demo.ts               plantes de démonstration (dev)
    *.test.ts
  storage/
    gardenStore.ts        lecture / écriture garden.json, récupération
    gardenStore.test.ts
  sprites/
    color.ts              hexRgb, mix
    palette.ts            gammes "Chaleureux"
    raster.ts             tampon, primitives, contour, toCanvas
    stages.ts             graine, pousse, jeune, bouton
    species.ts            8 espèces des maquettes
    decor.ts              clôture, lanterne, citrouille, paille, arbre, trou, tas
    ground.ts             tuiles herbe / terre / mouillée
    sprite.ts             SpriteRef, cache, spriteCanvas()
    sprite.test.ts
  render/
    sceneModel.ts         état -> objets à afficher (pur)
    sceneModel.test.ts
    world.ts              conversions case <-> monde, bornes
    texture.ts            canvas -> texture pixel
    ground.ts             sol three.js
    billboards.ts         sprites debout, lanternes, légendaires
    lighting.ts           ambiances selon l'heure
    ambience.ts           ciel, feuilles, lucioles, pluie, brume
    post.ts               bloom, tilt-shift, vignette
    tod.ts                heure -> matin / midi / soir / nuit (pur)
    tod.test.ts
    createGardenScene.ts  assemblage, boucle 30 fps, profils
  ui/
    backdropMode.ts       run / pause / frozen (pur)
    backdropMode.test.ts
    gardenWindow.ts       ouverture fenêtre, événements
    GardenBackdrop.tsx    fond passif (fenêtre principale)
    GardenFrozen.tsx      image figée + message
    GardenApp.tsx         fenêtre Potager
    GardenDevBar.tsx      bouton dev de démonstration
src/lib/backdropPref.ts   réglage "Fond animé"
src/lib/backdropPref.test.ts
src/components/settings/panels/BackdropPanel.tsx   (renommé depuis SummerPanel.tsx)
src-tauri/capabilities/garden.json
```

Fichiers modifiés : `package.json`, `src/main.tsx`, `src/App.tsx`, `src/pages/MainPage.tsx`, `src/pages/DiscoverPage.tsx`, `src/pages/PreferencesPage.tsx`, `src/components/AppMenu.tsx`, `src/components/settings/settingsNav.ts`, `src/lib/devTauriShim.ts`, `src-tauri/capabilities/default.json`, `src-tauri/src/lib.rs`, `vite.config.ts`.

---

### Task 1: Types, intervalles et hachage

**Files:**

- Create: `src/garden/core/types.ts`
- Create: `src/garden/core/time.ts`
- Create: `src/garden/core/hash.ts`
- Test: `src/garden/core/time.test.ts`

**Interfaces:**

- Produces: tous les types de `types.ts` ; `HOUR`, `DAY`, `mergeIntervals(list: Interval[]): Interval[]`, `coveredDuration(list: Interval[], from: number, to: number): number`, `contains(list: Interval[], t: number): boolean` ; `hash(a: number, b?: number, c?: number): number` (retour dans [0, 1)).

- [ ] **Step 1: Écrire les types**

`src/garden/core/types.ts` :

```ts
export type Rarity = "commune" | "rare" | "epique" | "legendaire";

export type SpeciesId =
  | "tournesol"
  | "rosetremiere"
  | "dahlia"
  | "cosmos"
  | "aster"
  | "chrysantheme"
  | "bruyere"
  | "colchique";

export type ColorId =
  "yellow" | "pink" | "white" | "violet" | "red" | "orange" | "bronze" | "heather" | "lilac";

export type VariantId = "givree" | "doree" | "lumineuse";
export type DecorId = "lanterne" | "citrouille" | "paille";
export type PlotId = "p1";
export type Stage = 0 | 1 | 2 | 3 | 4;

// "x,y" en coordonnées de case
export type TileKey = `${number},${number}`;

export interface Interval {
  start: number;
  end: number;
}

export interface Seed {
  species: SpeciesId;
  color: ColorId;
  rarity: Rarity;
  variant?: VariantId;
  hybrid?: boolean;
}

export interface Flower {
  species: SpeciesId;
  color: ColorId;
  rarity: Rarity;
  variant?: VariantId;
}

export interface PlantTile {
  kind: "plant";
  seed: Seed;
  sownAt: number;
  watered: Interval[];
}

export type TileContent =
  | { kind: "hole"; dugAt: number }
  | PlantTile
  | { kind: "decor"; id: DecorId }
  | { kind: "leaves"; since: number };

export interface HerbierEntry {
  discoveredAt: number;
  pressed: number;
  variants: VariantId[];
}

export interface GardenSave {
  version: 1;
  tiles: Partial<Record<TileKey, TileContent>>;
  plots: PlotId[];
  inventory: {
    seeds: Seed[];
    basket: Flower[];
    potions: Record<string, number>;
    decor: Record<string, number>;
  };
  herbier: Record<string, HerbierEntry>;
  pity: { dryDiscovery: number; dryRare: number };
  sachets: { lastDailyAt: number; pending: number };
  progress: { nodes: Record<string, number>; counters: Record<string, number> };
  atelier: { brew: { recipe: string; startedAt: number } | null };
}

export const tileKey = (x: number, y: number): TileKey => `${x},${y}`;

export function parseTileKey(key: TileKey): [number, number] {
  const [x, y] = key.split(",").map(Number);
  return [x, y];
}
```

`src/garden/core/hash.ts` :

```ts
// Hachage entier déterministe, résultat dans [0, 1).
export function hash(a: number, b = 0, c = 0): number {
  let h = (a * 374761393 + b * 668265263 + c * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
```

- [ ] **Step 2: Écrire le test des intervalles**

`src/garden/core/time.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { contains, coveredDuration, mergeIntervals } from "./time";

describe("mergeIntervals", () => {
  it("fusionne les intervalles qui se chevauchent ou se touchent", () => {
    expect(
      mergeIntervals([
        { start: 10, end: 20 },
        { start: 0, end: 5 },
        { start: 15, end: 30 },
        { start: 30, end: 35 },
      ]),
    ).toEqual([
      { start: 0, end: 5 },
      { start: 10, end: 35 },
    ]);
  });

  it("ignore les intervalles vides ou inversés", () => {
    expect(
      mergeIntervals([
        { start: 5, end: 5 },
        { start: 9, end: 3 },
      ]),
    ).toEqual([]);
  });
});

describe("coveredDuration", () => {
  it("ne compte que la partie dans la fenêtre, sans double comptage", () => {
    const list = [
      { start: 0, end: 10 },
      { start: 5, end: 15 },
      { start: 20, end: 30 },
    ];
    expect(coveredDuration(list, 8, 25)).toBe(12);
  });

  it("vaut 0 quand la fenêtre est vide ou inversée", () => {
    expect(coveredDuration([{ start: 0, end: 10 }], 10, 5)).toBe(0);
  });
});

describe("contains", () => {
  it("inclut le début et exclut la fin", () => {
    const list = [{ start: 10, end: 20 }];
    expect(contains(list, 10)).toBe(true);
    expect(contains(list, 19)).toBe(true);
    expect(contains(list, 20)).toBe(false);
  });
});
```

- [ ] **Step 3: Lancer le test, vérifier l'échec**

Run: `bun run test src/garden/core/time.test.ts`
Expected: FAIL, module `./time` introuvable.

- [ ] **Step 4: Implémenter `time.ts`**

`src/garden/core/time.ts` :

```ts
import type { Interval } from "./types";

export const HOUR = 3_600_000;
export const DAY = 24 * HOUR;

export function mergeIntervals(list: Interval[]): Interval[] {
  const sorted = list.filter((i) => i.end > i.start).sort((a, b) => a.start - b.start);
  const out: Interval[] = [];
  for (const i of sorted) {
    const last = out[out.length - 1];
    if (last && i.start <= last.end) last.end = Math.max(last.end, i.end);
    else out.push({ start: i.start, end: i.end });
  }
  return out;
}

export function coveredDuration(list: Interval[], from: number, to: number): number {
  if (to <= from) return 0;
  let total = 0;
  for (const i of mergeIntervals(list)) {
    total += Math.max(0, Math.min(i.end, to) - Math.max(i.start, from));
  }
  return total;
}

export function contains(list: Interval[], t: number): boolean {
  return list.some((i) => t >= i.start && t < i.end);
}
```

- [ ] **Step 5: Lancer le test, vérifier le succès**

Run: `bun run test src/garden/core/time.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add src/garden/core/types.ts src/garden/core/time.ts src/garden/core/hash.ts src/garden/core/time.test.ts
git commit -m "feat(potager): types de la sauvegarde et utilitaires d'intervalles"
```

---

### Task 2: Pluie déterministe

**Files:**

- Create: `src/garden/core/weather.ts`
- Test: `src/garden/core/weather.test.ts`

**Interfaces:**

- Consumes: `hash` (Task 1), `DAY`, `HOUR`, `Interval`.
- Produces: `rainIntervals(from: number, to: number): Interval[]`, `isRaining(now: number): boolean`, `type RainSource = (from: number, to: number) => Interval[]`.

Règle : pour chaque jour local, `hash(année, mois, jour) < 0.35` donne une averse ; début à `6 h + floor(hash2 * 14) h` et durée `30 + floor(hash3 * 61)` minutes, où `hash2 = hash(jour, mois, année)` et `hash3 = hash(année + jour, mois * 7, 3)`.

- [ ] **Step 1: Écrire le test**

`src/garden/core/weather.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { DAY } from "./time";
import { isRaining, rainIntervals } from "./weather";

const start = new Date(2026, 8, 1).getTime();
const end = start + 60 * DAY;

describe("rainIntervals", () => {
  it("donne les mêmes averses pour la même période", () => {
    expect(rainIntervals(start, end)).toEqual(rainIntervals(start, end));
  });

  it("a des averses de 30 à 90 minutes, entre 6 h et 21 h", () => {
    const list = rainIntervals(start, end);
    expect(list.length).toBeGreaterThan(5);
    for (const r of list) {
      const minutes = (r.end - r.start) / 60_000;
      expect(minutes).toBeGreaterThanOrEqual(30);
      expect(minutes).toBeLessThanOrEqual(90);
      expect(new Date(r.start).getHours()).toBeGreaterThanOrEqual(6);
      expect(new Date(r.start).getHours()).toBeLessThanOrEqual(19);
    }
  });

  it("ne renvoie que ce qui touche la fenêtre demandée", () => {
    const all = rainIntervals(start, end);
    const first = all[0];
    const inside = rainIntervals(first.start + 1, first.start + 2);
    expect(inside).toEqual([first]);
  });

  it("isRaining suit les intervalles", () => {
    const first = rainIntervals(start, end)[0];
    expect(isRaining(first.start + 1000)).toBe(true);
    expect(isRaining(first.end + 1000)).toBe(false);
  });
});
```

- [ ] **Step 2: Lancer le test, vérifier l'échec**

Run: `bun run test src/garden/core/weather.test.ts`
Expected: FAIL, module `./weather` introuvable.

- [ ] **Step 3: Implémenter**

`src/garden/core/weather.ts` :

```ts
import { hash } from "./hash";
import { contains, HOUR } from "./time";
import type { Interval } from "./types";

export type RainSource = (from: number, to: number) => Interval[];

const RAIN_CHANCE = 0.35;

function rainOfDay(dayStart: Date): Interval | null {
  const y = dayStart.getFullYear();
  const m = dayStart.getMonth() + 1;
  const d = dayStart.getDate();
  if (hash(y, m, d) >= RAIN_CHANCE) return null;
  const hour = 6 + Math.floor(hash(d, m, y) * 14);
  const minutes = 30 + Math.floor(hash(y + d, m * 7, 3) * 61);
  const start = new Date(y, m - 1, d, hour).getTime();
  return { start, end: start + minutes * 60_000 };
}

export const rainIntervals: RainSource = (from, to) => {
  const out: Interval[] = [];
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  // un jour de marge avant : une averse de la veille ne dépasse jamais minuit, mais
  // on reste robuste aux changements d'heure
  cursor.setDate(cursor.getDate() - 1);
  while (cursor.getTime() < to + 2 * HOUR) {
    const r = rainOfDay(cursor);
    if (r && r.end > from && r.start < to) out.push(r);
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
};

export function isRaining(now: number): boolean {
  return contains(rainIntervals(now - HOUR * 2, now + 1), now);
}
```

- [ ] **Step 4: Lancer le test, vérifier le succès**

Run: `bun run test src/garden/core/weather.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/garden/core/weather.ts src/garden/core/weather.test.ts
git commit -m "feat(potager): pluie déterministe par jour"
```

---

### Task 3: Moteur de pousse

**Files:**

- Create: `src/garden/core/growth.ts`
- Test: `src/garden/core/growth.test.ts`

**Interfaces:**

- Consumes: `PlantTile`, `Rarity`, `Stage`, `Interval` (Task 1) ; `coveredDuration`, `mergeIntervals`, `contains`, `HOUR` (Task 1) ; `RainSource`, `rainIntervals` (Task 2).
- Produces:
  - `GROWTH_MS: Record<Rarity, number>`, `WATER_MS`, `WET_BONUS`
  - `interface GrowthState { stage: Stage; stageProgress: number; wet: boolean; beautiful: boolean }`
  - `wetIntervals(plant: PlantTile, now: number, rain?: RainSource): Interval[]`
  - `effectiveMs(plant: PlantTile, now: number, rain?: RainSource): number`
  - `growthOf(plant: PlantTile, now: number, rain?: RainSource): GrowthState`

Règles : `effectif = (now - sownAt) + WET_BONUS * durée mouillée dans [sownAt, now]`, borné à 0 si l'horloge recule. Étape = `min(4, floor(effectif / (total / 4)))`. `stageProgress` = fraction dans l'étape courante (1 à l'étape 4). `beautiful` = étape 4 atteinte ET chacune des étapes 0 à 3 a eu au moins une milliseconde mouillée dans sa fenêtre de temps réel.

- [ ] **Step 1: Écrire le test**

`src/garden/core/growth.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { effectiveMs, growthOf, WATER_MS } from "./growth";
import { DAY, HOUR } from "./time";
import type { Interval, PlantTile } from "./types";

const noRain = (): Interval[] => [];
const T0 = new Date(2026, 9, 1, 8).getTime();

function plant(
  watered: Interval[] = [],
  rarity: PlantTile["seed"]["rarity"] = "commune",
): PlantTile {
  return {
    kind: "plant",
    seed: { species: "aster", color: "violet", rarity },
    sownAt: T0,
    watered,
  };
}

describe("growthOf", () => {
  it("une commune sèche passe une étape toutes les 2 h", () => {
    expect(growthOf(plant(), T0 + 1 * HOUR, noRain)).toMatchObject({
      stage: 0,
      stageProgress: 0.5,
    });
    expect(growthOf(plant(), T0 + 2 * HOUR, noRain)).toMatchObject({ stage: 1, stageProgress: 0 });
    expect(growthOf(plant(), T0 + 8 * HOUR, noRain)).toMatchObject({ stage: 4, stageProgress: 1 });
  });

  it("une terre mouillée fait pousser 1,5 fois plus vite", () => {
    const p = plant([{ start: T0, end: T0 + WATER_MS }]);
    expect(effectiveMs(p, T0 + 2 * HOUR, noRain)).toBe(3 * HOUR);
    expect(growthOf(p, T0 + 2 * HOUR, noRain)).toMatchObject({ stage: 1, stageProgress: 0.5 });
  });

  it("ne compte pas deux fois des arrosages qui se chevauchent", () => {
    const p = plant([
      { start: T0, end: T0 + 2 * HOUR },
      { start: T0 + 1 * HOUR, end: T0 + 3 * HOUR },
    ]);
    expect(effectiveMs(p, T0 + 4 * HOUR, noRain)).toBe(4 * HOUR + 1.5 * HOUR);
  });

  it("la pluie compte comme un arrosage, sans double comptage", () => {
    const rain = (): Interval[] => [{ start: T0 + 1 * HOUR, end: T0 + 3 * HOUR }];
    const p = plant([{ start: T0, end: T0 + 2 * HOUR }]);
    expect(effectiveMs(p, T0 + 4 * HOUR, rain)).toBe(4 * HOUR + 1.5 * HOUR);
  });

  it("indique si la case est mouillée maintenant", () => {
    const p = plant([{ start: T0, end: T0 + HOUR }]);
    expect(growthOf(p, T0 + 30 * 60_000, noRain).wet).toBe(true);
    expect(growthOf(p, T0 + 2 * HOUR, noRain).wet).toBe(false);
  });

  it("une légendaire met 30 h sans arrosage", () => {
    expect(growthOf(plant([], "legendaire"), T0 + 29 * HOUR, noRain).stage).toBe(3);
    expect(growthOf(plant([], "legendaire"), T0 + 30 * HOUR, noRain).stage).toBe(4);
  });

  it("une absence d'une semaine donne une fleur", () => {
    expect(growthOf(plant([], "epique"), T0 + 7 * DAY, noRain).stage).toBe(4);
  });

  it("si l'horloge recule, rien ne régresse sous zéro", () => {
    expect(growthOf(plant(), T0 - HOUR, noRain)).toMatchObject({ stage: 0, stageProgress: 0 });
  });

  it("belle plante : mouillée à chaque étape", () => {
    const always = plant([{ start: T0, end: T0 + 10 * HOUR }]);
    expect(growthOf(always, T0 + 10 * HOUR, noRain).beautiful).toBe(true);
  });

  it("pas belle plante si une étape est restée sèche", () => {
    // mouillée seulement pendant la première heure : les étapes suivantes sont sèches
    const once = plant([{ start: T0, end: T0 + HOUR }]);
    expect(growthOf(once, T0 + 10 * HOUR, noRain).beautiful).toBe(false);
  });

  it("pas belle plante tant qu'elle n'a pas fleuri", () => {
    const always = plant([{ start: T0, end: T0 + 10 * HOUR }]);
    expect(growthOf(always, T0 + HOUR, noRain).beautiful).toBe(false);
  });
});
```

- [ ] **Step 2: Lancer le test, vérifier l'échec**

Run: `bun run test src/garden/core/growth.test.ts`
Expected: FAIL, module `./growth` introuvable.

- [ ] **Step 3: Implémenter**

`src/garden/core/growth.ts` :

```ts
import { contains, coveredDuration, HOUR, mergeIntervals } from "./time";
import type { Interval, PlantTile, Rarity, Stage } from "./types";
import { rainIntervals, type RainSource } from "./weather";

export const GROWTH_MS: Record<Rarity, number> = {
  commune: 8 * HOUR,
  rare: 12 * HOUR,
  epique: 18 * HOUR,
  legendaire: 30 * HOUR,
};

export const WATER_MS = 6 * HOUR;
export const WET_BONUS = 0.5;
const STAGES = 4;

export interface GrowthState {
  stage: Stage;
  stageProgress: number;
  wet: boolean;
  beautiful: boolean;
}

export function wetIntervals(
  plant: PlantTile,
  now: number,
  rain: RainSource = rainIntervals,
): Interval[] {
  if (now <= plant.sownAt) return mergeIntervals(plant.watered);
  return mergeIntervals([...plant.watered, ...rain(plant.sownAt, now)]);
}

export function effectiveMs(
  plant: PlantTile,
  now: number,
  rain: RainSource = rainIntervals,
): number {
  if (now <= plant.sownAt) return 0;
  const wet = coveredDuration(wetIntervals(plant, now, rain), plant.sownAt, now);
  return now - plant.sownAt + WET_BONUS * wet;
}

// Instant réel où le temps efficace atteint `target` (target <= temps efficace à `now`).
function realTimeFor(plant: PlantTile, target: number, wet: Interval[], now: number): number {
  let t = plant.sownAt;
  let acc = 0;
  const bounds = wet
    .flatMap((i) => [i.start, i.end])
    .filter((b) => b > plant.sownAt && b < now)
    .concat(now)
    .sort((a, b) => a - b);
  for (const b of bounds) {
    const rate = contains(wet, t) ? 1 + WET_BONUS : 1;
    const gain = (b - t) * rate;
    if (acc + gain >= target) return t + (target - acc) / rate;
    acc += gain;
    t = b;
  }
  return now;
}

export function growthOf(
  plant: PlantTile,
  now: number,
  rain: RainSource = rainIntervals,
): GrowthState {
  const total = GROWTH_MS[plant.seed.rarity];
  const step = total / STAGES;
  const eff = effectiveMs(plant, now, rain);
  const wet = wetIntervals(plant, now, rain);
  const stage = Math.min(STAGES, Math.floor(eff / step)) as Stage;
  const stageProgress = stage === STAGES ? 1 : (eff - stage * step) / step;

  let beautiful = false;
  if (stage === STAGES) {
    beautiful = true;
    for (let k = 0; k < STAGES; k++) {
      const from = realTimeFor(plant, k * step, wet, now);
      const to = realTimeFor(plant, (k + 1) * step, wet, now);
      if (coveredDuration(wet, from, to) <= 0) {
        beautiful = false;
        break;
      }
    }
  }

  return { stage, stageProgress, wet: contains(wet, now), beautiful };
}
```

- [ ] **Step 4: Lancer le test, vérifier le succès**

Run: `bun run test src/garden/core/growth.test.ts`
Expected: PASS (11 tests).

- [ ] **Step 5: Commit**

```bash
git add src/garden/core/growth.ts src/garden/core/growth.test.ts
git commit -m "feat(potager): moteur de pousse en temps réel et belle plante"
```

---

### Task 4: Parcelles, sauvegarde de départ, validation et démonstration

**Files:**

- Create: `src/garden/core/plots.ts`
- Create: `src/garden/core/starter.ts`
- Create: `src/garden/core/save.ts`
- Create: `src/garden/core/demo.ts`
- Test: `src/garden/core/save.test.ts`

**Interfaces:**

- Consumes: types (Task 1), `HOUR` (Task 1), `GROWTH_MS` (Task 3).
- Produces:
  - `PLOTS: Record<PlotId, { x: number; y: number; w: number; h: number }>`, `soilTiles(plots: PlotId[]): TileKey[]`, `isSoil(plots: PlotId[], key: TileKey): boolean`
  - `createStarterSave(): GardenSave`
  - `SAVE_VERSION = 1`, `parseSave(raw: unknown): GardenSave | null`
  - `withDemoPlants(save: GardenSave, now: number): GardenSave`

Parcelle `p1` : `x: 1, y: 1, w: 6, h: 4`. Sauvegarde de départ : parcelle `p1`, 3 graines communes (tournesol jaune, cosmos rose, aster violet), 1 sachet en attente, décor posé : lanterne en `0,1`, lanterne en `7,1`, citrouille en `8,2`, paille en `8,3`, citrouille en `0,4`.

- [ ] **Step 1: Écrire le test**

`src/garden/core/save.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { withDemoPlants } from "./demo";
import { growthOf } from "./growth";
import { isSoil, soilTiles } from "./plots";
import { parseSave } from "./save";
import { createStarterSave } from "./starter";

describe("plots", () => {
  it("la parcelle p1 couvre 24 cases", () => {
    expect(soilTiles(["p1"])).toHaveLength(24);
    expect(isSoil(["p1"], "1,1")).toBe(true);
    expect(isSoil(["p1"], "6,4")).toBe(true);
    expect(isSoil(["p1"], "0,1")).toBe(false);
    expect(isSoil(["p1"], "7,4")).toBe(false);
  });
});

describe("createStarterSave", () => {
  it("contient une parcelle, 3 graines, 1 sachet et du décor", () => {
    const s = createStarterSave();
    expect(s.version).toBe(1);
    expect(s.plots).toEqual(["p1"]);
    expect(s.inventory.seeds).toHaveLength(3);
    expect(s.sachets.pending).toBe(1);
    expect(s.tiles["0,1"]).toEqual({ kind: "decor", id: "lanterne" });
  });

  it("le décor n'est jamais posé sur la terre", () => {
    const s = createStarterSave();
    for (const key of Object.keys(s.tiles) as (keyof typeof s.tiles)[]) {
      expect(isSoil(s.plots, key)).toBe(false);
    }
  });
});

describe("parseSave", () => {
  it("accepte une sauvegarde valide", () => {
    const s = createStarterSave();
    expect(parseSave(JSON.parse(JSON.stringify(s)))).toEqual(s);
  });

  it("refuse une version inconnue ou une forme cassée", () => {
    expect(parseSave(null)).toBeNull();
    expect(parseSave("texte")).toBeNull();
    expect(parseSave({ ...createStarterSave(), version: 2 })).toBeNull();
    expect(parseSave({ ...createStarterSave(), tiles: [] })).toBeNull();
    expect(parseSave({ ...createStarterSave(), inventory: undefined })).toBeNull();
  });
});

describe("withDemoPlants", () => {
  it("sème des plantes à toutes les étapes dans la parcelle", () => {
    const now = Date.now();
    const s = withDemoPlants(createStarterSave(), now);
    const stages = new Set<number>();
    for (const [key, t] of Object.entries(s.tiles)) {
      if (t?.kind !== "plant") continue;
      expect(isSoil(s.plots, key as `${number},${number}`)).toBe(true);
      stages.add(growthOf(t, now, () => []).stage);
    }
    expect(stages).toEqual(new Set([0, 1, 2, 3, 4]));
  });
});
```

- [ ] **Step 2: Lancer le test, vérifier l'échec**

Run: `bun run test src/garden/core/save.test.ts`
Expected: FAIL, modules introuvables.

- [ ] **Step 3: Implémenter les quatre modules**

`src/garden/core/plots.ts` :

```ts
import { tileKey, type PlotId, type TileKey } from "./types";

export const PLOTS: Record<PlotId, { x: number; y: number; w: number; h: number }> = {
  p1: { x: 1, y: 1, w: 6, h: 4 },
};

export function soilTiles(plots: PlotId[]): TileKey[] {
  const out: TileKey[] = [];
  for (const id of plots) {
    const p = PLOTS[id];
    for (let y = p.y; y < p.y + p.h; y++)
      for (let x = p.x; x < p.x + p.w; x++) out.push(tileKey(x, y));
  }
  return out;
}

export function isSoil(plots: PlotId[], key: TileKey): boolean {
  return soilTiles(plots).includes(key);
}
```

`src/garden/core/starter.ts` :

```ts
import type { GardenSave } from "./types";

export function createStarterSave(): GardenSave {
  return {
    version: 1,
    tiles: {
      "0,1": { kind: "decor", id: "lanterne" },
      "7,1": { kind: "decor", id: "lanterne" },
      "8,2": { kind: "decor", id: "citrouille" },
      "8,3": { kind: "decor", id: "paille" },
      "0,4": { kind: "decor", id: "citrouille" },
    },
    plots: ["p1"],
    inventory: {
      seeds: [
        { species: "tournesol", color: "yellow", rarity: "commune" },
        { species: "cosmos", color: "pink", rarity: "commune" },
        { species: "aster", color: "violet", rarity: "commune" },
      ],
      basket: [],
      potions: {},
      decor: {},
    },
    herbier: {},
    pity: { dryDiscovery: 0, dryRare: 0 },
    sachets: { lastDailyAt: 0, pending: 1 },
    progress: { nodes: {}, counters: {} },
    atelier: { brew: null },
  };
}
```

`src/garden/core/save.ts` :

```ts
import type { GardenSave } from "./types";

export const SAVE_VERSION = 1;

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

export function parseSave(raw: unknown): GardenSave | null {
  if (!isObject(raw) || raw.version !== SAVE_VERSION) return null;
  const { tiles, plots, inventory, herbier, pity, sachets, progress, atelier } = raw;
  if (!isObject(tiles) || !Array.isArray(plots)) return null;
  if (!isObject(inventory) || !Array.isArray(inventory.seeds) || !Array.isArray(inventory.basket))
    return null;
  if (!isObject(inventory.potions) || !isObject(inventory.decor)) return null;
  if (!isObject(herbier) || !isObject(pity) || !isObject(sachets)) return null;
  if (!isObject(progress) || !isObject(progress.nodes) || !isObject(progress.counters)) return null;
  if (!isObject(atelier)) return null;
  return raw as unknown as GardenSave;
}
```

`src/garden/core/demo.ts` :

```ts
import { GROWTH_MS } from "./growth";
import { soilTiles } from "./plots";
import type { ColorId, GardenSave, Rarity, SpeciesId } from "./types";

const DEMO: [SpeciesId, ColorId, Rarity][] = [
  ["tournesol", "yellow", "commune"],
  ["rosetremiere", "pink", "epique"],
  ["dahlia", "red", "rare"],
  ["cosmos", "white", "rare"],
  ["aster", "violet", "commune"],
  ["chrysantheme", "bronze", "commune"],
  ["bruyere", "heather", "commune"],
  ["colchique", "lilac", "epique"],
  ["dahlia", "violet", "legendaire"],
];

// Plantes de démonstration pour vérifier le rendu en développement : une case
// sur deux, avec des âges qui couvrent les 5 étapes.
export function withDemoPlants(save: GardenSave, now: number): GardenSave {
  const tiles = { ...save.tiles };
  soilTiles(save.plots)
    .filter((_, i) => i % 2 === 0)
    .forEach((key, i) => {
      const [species, color, rarity] = DEMO[i % DEMO.length];
      const fraction = (i % 5) / 4 + 0.05;
      tiles[key] = {
        kind: "plant",
        seed: { species, color, rarity },
        sownAt: now - Math.min(fraction, 1.2) * GROWTH_MS[rarity],
        watered: [],
      };
    });
  return { ...save, tiles };
}
```

- [ ] **Step 4: Lancer le test, vérifier le succès**

Run: `bun run test src/garden/core/save.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/garden/core/plots.ts src/garden/core/starter.ts src/garden/core/save.ts src/garden/core/demo.ts src/garden/core/save.test.ts
git commit -m "feat(potager): parcelle, sauvegarde de départ et validation"
```

---

### Task 5: Stockage `garden.json` et shim navigateur

**Files:**

- Create: `src/garden/storage/gardenStore.ts`
- Test: `src/garden/storage/gardenStore.test.ts`
- Modify: `src/lib/devTauriShim.ts` (action `reload` du store)

**Interfaces:**

- Consumes: `parseSave`, `createStarterSave` (Task 4), `GardenSave`.
- Produces:
  - `loadGarden(): Promise<{ save: GardenSave; recovered: boolean }>`
  - `saveGarden(save: GardenSave): Promise<void>`
  - `createSaveScheduler(delayMs?: number): { schedule(save: GardenSave): void; flush(): Promise<void> }`

- [ ] **Step 1: Écrire le test**

`src/garden/storage/gardenStore.test.ts` :

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const registry = vi.hoisted(() => new Map<string, Map<string, unknown>>());

vi.mock("@tauri-apps/plugin-store", () => {
  class LazyStore {
    private filename: string;
    constructor(filename: string) {
      this.filename = filename;
    }
    // recrée la table après un registry.clear() entre deux tests
    private get data() {
      if (!registry.has(this.filename)) registry.set(this.filename, new Map());
      return registry.get(this.filename)!;
    }
    async get<T>(key: string): Promise<T | undefined> {
      return this.data.get(key) as T | undefined;
    }
    async set(key: string, val: unknown) {
      this.data.set(key, val);
    }
    async save() {}
    async reload() {}
  }
  return { LazyStore };
});

const { loadGarden, saveGarden, createSaveScheduler } = await import("./gardenStore");
const { createStarterSave } = await import("../core/starter");

beforeEach(() => registry.clear());

describe("loadGarden", () => {
  it("crée et écrit une sauvegarde de départ si le fichier est vide", async () => {
    const { save, recovered } = await loadGarden();
    expect(recovered).toBe(false);
    expect(save).toEqual(createStarterSave());
    expect(registry.get("garden.json")!.get("save")).toEqual(save);
  });

  it("relit une sauvegarde existante", async () => {
    const s = { ...createStarterSave(), plots: ["p1" as const] };
    s.sachets.pending = 4;
    await saveGarden(s);
    expect((await loadGarden()).save.sachets.pending).toBe(4);
  });

  it("met de côté une sauvegarde illisible et repart de zéro", async () => {
    registry.set("garden.json", new Map([["save", { version: 99 }]]));
    const { save, recovered } = await loadGarden();
    expect(recovered).toBe(true);
    expect(save).toEqual(createStarterSave());
    const backup = [...registry.keys()].find((k) => k.startsWith("garden.corrupt-"));
    expect(backup).toMatch(/^garden\.corrupt-\d{8}-\d{6}\.json$/);
    expect(registry.get(backup!)!.get("save")).toEqual({ version: 99 });
  });
});

describe("createSaveScheduler", () => {
  it("regroupe les écritures et flush écrit la dernière version", async () => {
    vi.useFakeTimers();
    const saver = createSaveScheduler(1000);
    const a = createStarterSave();
    const b = { ...createStarterSave(), sachets: { lastDailyAt: 0, pending: 9 } };
    saver.schedule(a);
    saver.schedule(b);
    expect(registry.get("garden.json")?.get("save")).toBeUndefined();
    await saver.flush();
    expect(registry.get("garden.json")!.get("save")).toEqual(b);
    vi.useRealTimers();
  });
});
```

- [ ] **Step 2: Lancer le test, vérifier l'échec**

Run: `bun run test src/garden/storage/gardenStore.test.ts`
Expected: FAIL, module `./gardenStore` introuvable.

- [ ] **Step 3: Implémenter**

`src/garden/storage/gardenStore.ts` :

```ts
import { LazyStore } from "@tauri-apps/plugin-store";
import { parseSave } from "../core/save";
import { createStarterSave } from "../core/starter";
import type { GardenSave } from "../core/types";

const KEY = "save";
const store = new LazyStore("garden.json", { defaults: {}, autoSave: false });

const pad = (n: number) => String(n).padStart(2, "0");
function stamp(d = new Date()): string {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

export async function saveGarden(save: GardenSave): Promise<void> {
  await store.set(KEY, save);
  await store.save();
}

export async function loadGarden(): Promise<{ save: GardenSave; recovered: boolean }> {
  // relit le disque : la fenêtre Potager a pu écrire depuis le dernier chargement
  await store.reload();
  const raw = await store.get<unknown>(KEY);
  if (raw == null) {
    const save = createStarterSave();
    await saveGarden(save);
    return { save, recovered: false };
  }
  const parsed = parseSave(raw);
  if (parsed) return { save: parsed, recovered: false };

  const backup = new LazyStore(`garden.corrupt-${stamp()}.json`, { defaults: {}, autoSave: false });
  await backup.set(KEY, raw);
  await backup.save();
  const save = createStarterSave();
  await saveGarden(save);
  return { save, recovered: true };
}

export function createSaveScheduler(delayMs = 1500) {
  let pending: GardenSave | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  async function flush(): Promise<void> {
    if (timer) clearTimeout(timer);
    timer = null;
    if (!pending) return;
    const save = pending;
    pending = null;
    await saveGarden(save);
  }

  function schedule(save: GardenSave): void {
    pending = save;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void flush(), delayMs);
  }

  return { schedule, flush };
}
```

- [ ] **Step 4: Lancer le test, vérifier le succès**

Run: `bun run test src/garden/storage/gardenStore.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Faire relire le disque au shim navigateur**

Dans `src/lib/devTauriShim.ts`, le `switch (action)` du store traite aujourd'hui `"reload"` avec `"save"` et `"close"` (retour `null`). Sortir `"reload"` de ce groupe pour relire `localStorage`, afin qu'un onglet voie ce qu'un autre onglet (la fenêtre Potager en preview) a écrit :

```ts
        case "reload": {
          const raw = localStorage.getItem(`devstore:${store.path}`);
          store.data = raw ? JSON.parse(raw) : {};
          return null;
        }
        case "save":
        case "close":
          return null;
```

Et remplacer `const { data } = store;` par un accès direct `store.data` dans les autres branches n'est pas nécessaire : `data` est relu à chaque appel d'`invoke` car la déstructuration est faite après `stores.get(...)`. Vérifier que la déstructuration se trouve bien à l'intérieur d'`invoke` (c'est le cas, ligne `const { data } = store;`).

- [ ] **Step 6: Vérifier les types**

Run: `bunx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 7: Commit**

```bash
git add src/garden/storage src/lib/devTauriShim.ts
git commit -m "feat(potager): stockage garden.json avec récupération des sauvegardes illisibles"
```

---

### Task 6: Réglage "Fond animé"

**Files:**

- Create: `src/lib/backdropPref.ts`
- Test: `src/lib/backdropPref.test.ts`

**Interfaces:**

- Produces: `type Backdrop = "potager" | "mare" | "aucun"`, `BACKDROPS: Backdrop[]`, `loadBackdrop(): Promise<Backdrop>` (applique la migration une fois), `getBackdrop(): Promise<Backdrop>` (lecture seule, défaut `"potager"`), `saveBackdrop(v: Backdrop): Promise<void>`.

- [ ] **Step 1: Écrire le test**

`src/lib/backdropPref.test.ts` :

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const data = vi.hoisted(() => new Map<string, unknown>());

vi.mock("@tauri-apps/plugin-store", () => ({
  LazyStore: class {
    async get<T>(k: string): Promise<T | undefined> {
      return data.get(k) as T | undefined;
    }
    async set(k: string, v: unknown) {
      data.set(k, v);
    }
    async save() {}
  },
}));

const { getBackdrop, loadBackdrop, saveBackdrop } = await import("./backdropPref");

beforeEach(() => data.clear());

describe("loadBackdrop", () => {
  it("force le Potager une seule fois, même si l'été était désactivé", async () => {
    data.set("summer_pool_enabled", false);
    expect(await loadBackdrop()).toBe("potager");
    expect(data.get("garden_default_v1")).toBe(true);
  });

  it("respecte ensuite le choix de l'utilisateur", async () => {
    await loadBackdrop();
    await saveBackdrop("mare");
    expect(await loadBackdrop()).toBe("mare");
  });

  it("retombe sur le Potager si la valeur stockée est inconnue", async () => {
    data.set("garden_default_v1", true);
    data.set("animated_backdrop", "piscine");
    expect(await loadBackdrop()).toBe("potager");
  });
});

describe("getBackdrop", () => {
  it("lit sans migrer", async () => {
    expect(await getBackdrop()).toBe("potager");
    expect(data.has("garden_default_v1")).toBe(false);
    data.set("animated_backdrop", "aucun");
    expect(await getBackdrop()).toBe("aucun");
  });
});
```

- [ ] **Step 2: Lancer le test, vérifier l'échec**

Run: `bun run test src/lib/backdropPref.test.ts`
Expected: FAIL, module introuvable.

- [ ] **Step 3: Implémenter**

`src/lib/backdropPref.ts` :

```ts
import { LazyStore } from "@tauri-apps/plugin-store";

export type Backdrop = "potager" | "mare" | "aucun";
export const BACKDROPS: Backdrop[] = ["potager", "mare", "aucun"];

const KEY = "animated_backdrop";
const MIGRATION_KEY = "garden_default_v1";
const store = new LazyStore("settings.json", { defaults: {}, autoSave: false });

const isBackdrop = (v: unknown): v is Backdrop => BACKDROPS.includes(v as Backdrop);

export async function getBackdrop(): Promise<Backdrop> {
  const v = await store.get<string>(KEY);
  return isBackdrop(v) ? v : "potager";
}

export async function saveBackdrop(v: Backdrop): Promise<void> {
  await store.set(KEY, v);
  await store.save();
}

// Le Potager devient le fond par défaut une fois, à la mise à jour ; ensuite le
// choix de l'utilisateur est respecté.
export async function loadBackdrop(): Promise<Backdrop> {
  if (!(await store.get<boolean>(MIGRATION_KEY))) {
    await store.set(KEY, "potager");
    await store.set(MIGRATION_KEY, true);
    await store.save();
    return "potager";
  }
  return getBackdrop();
}
```

- [ ] **Step 4: Lancer le test, vérifier le succès**

Run: `bun run test src/lib/backdropPref.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/backdropPref.ts src/lib/backdropPref.test.ts
git commit -m "feat(potager): réglage du fond animé avec bascule unique vers le Potager"
```

---

### Task 7: Générateur de sprites

**Files:**

- Create: `src/garden/sprites/color.ts`, `palette.ts`, `raster.ts`, `stages.ts`, `species.ts`, `decor.ts`, `ground.ts`, `sprite.ts`
- Test: `src/garden/sprites/sprite.test.ts`
- Modify: `package.json` (dépendance de test `canvas` non requise : le test n'utilise que le tampon, voir Step 1)

**Interfaces:**

- Consumes: `hash` (Task 1), `SpeciesId`, `ColorId`, `DecorId` (Task 1).
- Produces:
  - `raster.ts` : `type Ramp = [string, string, string, string]`, `interface Buf { w: number; h: number; c: (string | null)[] }`, `buf(w, h): Buf`, `put`, `ell`, `sphere`, `petal`, `leaf`, `stem`, `outline(b: Buf): void`, `toCanvas(b: Buf): HTMLCanvasElement`, `rampAt(ramp: Ramp, t: number): string`
  - `palette.ts` : `PAL: Record<PaletteKey, Ramp>` avec les clés de `BASE` de la maquette (`green, darkLeaf, yellow, brown, pink, white, violet, red, orange, bronze, lilac, heather, cream, wood, metal, hay, glow, grass, soil, wet, fall, crow`)
  - `type DrawFn = (b: Buf, k: number, C: Ramp) => void`
  - `stages.ts` : `STAGE_DRAW: Record<"graine" | "pousse" | "jeune" | "bouton", DrawFn>`
  - `species.ts` : `SPECIES_DRAW: Record<SpeciesId, DrawFn>`, `SPECIES_COLOR: Record<ColorId, PaletteKey>`
  - `decor.ts` : `DECOR_DRAW: Record<"cloture" | "lanterne" | "citrouille" | "paille" | "trou" | "tas", DrawFn>`, `drawTree(b: Buf, k: number): void` (espace 96x144)
  - `ground.ts` : `groundTile(kind: "grass" | "soil" | "wet", tx: number, ty: number): HTMLCanvasElement`
  - `sprite.ts` : `type SpriteName = SpeciesId | keyof typeof STAGE_DRAW | keyof typeof DECOR_DRAW | "arbre"`, `interface SpriteRef { name: SpriteName; color?: ColorId | "cream" }`, `spriteKey(ref: SpriteRef): string`, `renderSpriteBuf(ref: SpriteRef): Buf`, `spriteCanvas(ref: SpriteRef): HTMLCanvasElement` (mise en cache), `SPRITE_TILE = 48`

**Portage.** Le code source est `docs/superpowers/mockups/potager-automne/pixelgen.js`, style "Chaleureux" uniquement (supprimer `STYLES`, `hsl`, `fromHsl`, `sat`, `styledPal`, le tramage conditionnel de `R` et toute la partie `buildView` / `drawRow` / `drawScene` / `mount2D` / `tick2D` / `LINEUP` / `STAGE_ROW` / `scene`). Correspondances :

| Maquette (`pixelgen.js`)                                                                         | Cible                                                                                                                                           |
| ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `BASE` (l. 3-27)                                                                                 | `palette.ts` : `export const PAL = { ... } satisfies Record<string, Ramp>` et `export type PaletteKey = keyof typeof PAL`                       |
| `hexRgb`, `mix` (l. 72-76)                                                                       | `color.ts`                                                                                                                                      |
| `hash` (l. 77-81)                                                                                | supprimé, importer `hash` de `../core/hash` (même formule à un diviseur près, résultat dans [0, 1))                                             |
| `clamp`, `R` (l. 82-90)                                                                          | `raster.ts` : `rampAt(ramp, t)` = `ramp[clamp(Math.floor(t * 4), 0, 3)]` (sans tramage)                                                         |
| `buf`, `put`, `get`, `ell`, `sphere`, `petal`, `leaf`, `stem`, `outline`, `toCanvas` (l. 91-171) | `raster.ts`, typés ; `outline` utilise `mix(n, "#140a14", 0.65)`                                                                                |
| `SPECIES` (l. 172-269)                                                                           | `species.ts` (`SPECIES_DRAW`), les 8 espèces à l'identique                                                                                      |
| `STAGES` (l. 270-302)                                                                            | `stages.ts`                                                                                                                                     |
| `DECOR` : `trou`, `tas`, `citrouille`, `paille`, `lanterne`, `cloture`                           | `decor.ts` ; `arbre` devient `drawTree` ; `corbeau`, `secateur`, `arrosoir`, `transplantoir`, `main` ne sont PAS portés (sous-projet 2)         |
| `makeSprite` (l. 409-415)                                                                        | `sprite.ts` : `renderSpriteBuf` (buffer 48x72, `k = 1.5`, arbre en 144x216 avec `drawTree`) puis `outline`, puis `toCanvas` dans `spriteCanvas` |
| `groundTile` (l. 416-453)                                                                        | `ground.ts`, `S = 48` fixe, canvas mis en cache par `kind:tx:ty`                                                                                |

Les fonctions de dessin lisent la palette via l'import `PAL` au lieu de la variable globale mutable.

Correspondance des couleurs (`SPECIES_COLOR`) : `yellow: "yellow"`, `pink: "pink"`, `white: "white"`, `violet: "violet"`, `red: "red"`, `orange: "orange"`, `bronze: "bronze"`, `heather: "heather"`, `lilac: "lilac"`. `spriteCanvas({ name: "graine", color: "cream" })` utilise `PAL.cream` ; une étape sans couleur utilise `PAL.green`.

- [ ] **Step 1: Écrire le test (tampon uniquement, sans DOM)**

`src/garden/sprites/sprite.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import type { SpeciesId } from "../core/types";
import { buf, ell, outline, rampAt, type Ramp } from "./raster";
import { renderSpriteBuf, spriteKey } from "./sprite";

const RAMP: Ramp = ["#000000", "#444444", "#888888", "#cccccc"];
const opaque = (b: { c: (string | null)[] }) => b.c.filter(Boolean).length;

describe("raster", () => {
  it("rampAt choisit le ton selon la lumière", () => {
    expect(rampAt(RAMP, -1)).toBe("#000000");
    expect(rampAt(RAMP, 0.3)).toBe("#444444");
    expect(rampAt(RAMP, 2)).toBe("#cccccc");
  });

  it("outline entoure la forme d'un pixel de contour", () => {
    const b = buf(10, 10);
    ell(b, 1, 5, 5, 2, 2, 0, () => "#ff0000");
    const before = opaque(b);
    outline(b);
    expect(opaque(b)).toBeGreaterThan(before);
    expect(b.c[0]).toBeNull();
  });
});

describe("renderSpriteBuf", () => {
  const species: SpeciesId[] = [
    "tournesol",
    "rosetremiere",
    "dahlia",
    "cosmos",
    "aster",
    "chrysantheme",
    "bruyere",
    "colchique",
  ];

  it.each(species)("%s produit un sprite 48x72 non vide", (name) => {
    const b = renderSpriteBuf({ name, color: "violet" });
    expect([b.w, b.h]).toEqual([48, 72]);
    expect(opaque(b)).toBeGreaterThan(200);
  });

  it("les étapes et le décor produisent des sprites non vides", () => {
    for (const name of [
      "graine",
      "pousse",
      "jeune",
      "bouton",
      "cloture",
      "lanterne",
      "citrouille",
      "paille",
      "trou",
      "tas",
    ] as const) {
      expect(opaque(renderSpriteBuf({ name }))).toBeGreaterThan(20);
    }
  });

  it("l'arbre est trois fois plus grand", () => {
    const b = renderSpriteBuf({ name: "arbre" });
    expect([b.w, b.h]).toEqual([144, 216]);
  });

  it("deux couleurs donnent deux clés et deux rendus différents", () => {
    expect(spriteKey({ name: "dahlia", color: "red" })).not.toBe(
      spriteKey({ name: "dahlia", color: "violet" }),
    );
    const a = renderSpriteBuf({ name: "dahlia", color: "red" }).c.join();
    const b = renderSpriteBuf({ name: "dahlia", color: "violet" }).c.join();
    expect(a).not.toBe(b);
  });
});
```

- [ ] **Step 2: Lancer le test, vérifier l'échec**

Run: `bun run test src/garden/sprites/sprite.test.ts`
Expected: FAIL, modules introuvables.

- [ ] **Step 3: Porter le code selon le tableau**

Créer les 8 fichiers. Squelette obligatoire de `sprite.ts` (le reste est du portage) :

```ts
import type { ColorId } from "../core/types";
import { DECOR_DRAW, drawTree } from "./decor";
import { PAL } from "./palette";
import { buf, outline, toCanvas, type Buf, type Ramp } from "./raster";
import { SPECIES_COLOR, SPECIES_DRAW } from "./species";
import { STAGE_DRAW } from "./stages";

export const SPRITE_TILE = 48;
const K = SPRITE_TILE / 32;

export type SpriteName =
  keyof typeof SPECIES_DRAW | keyof typeof STAGE_DRAW | keyof typeof DECOR_DRAW | "arbre";

export interface SpriteRef {
  name: SpriteName;
  color?: ColorId | "cream";
}

export const spriteKey = (ref: SpriteRef): string => `${ref.name}:${ref.color ?? ""}`;

function rampOf(color: SpriteRef["color"]): Ramp {
  if (!color) return PAL.green;
  if (color === "cream") return PAL.cream;
  return PAL[SPECIES_COLOR[color]];
}

export function renderSpriteBuf(ref: SpriteRef): Buf {
  if (ref.name === "arbre") {
    const b = buf(SPRITE_TILE * 3, SPRITE_TILE * 4.5);
    drawTree(b, K);
    outline(b);
    return b;
  }
  const b = buf(SPRITE_TILE, SPRITE_TILE * 1.5);
  const draw =
    SPECIES_DRAW[ref.name as keyof typeof SPECIES_DRAW] ??
    STAGE_DRAW[ref.name as keyof typeof STAGE_DRAW] ??
    DECOR_DRAW[ref.name as keyof typeof DECOR_DRAW];
  draw(b, K, rampOf(ref.color));
  outline(b);
  return b;
}

const cache = new Map<string, HTMLCanvasElement>();

export function spriteCanvas(ref: SpriteRef): HTMLCanvasElement {
  const key = spriteKey(ref);
  let cv = cache.get(key);
  if (!cv) {
    cv = toCanvas(renderSpriteBuf(ref));
    cache.set(key, cv);
  }
  return cv;
}
```

Signature attendue dans `raster.ts` pour le callback d'ombrage (reprise de la maquette) :

```ts
export type Shade = (
  nx: number,
  ny: number,
  d: number,
  edge: boolean,
  px: number,
  py: number,
  ux: number,
  uy: number,
) => string | null;
```

`toCanvas` est la seule fonction qui touche au DOM (`document.createElement("canvas")`) ; elle n'est pas appelée par le test.

- [ ] **Step 4: Lancer le test, vérifier le succès**

Run: `bun run test src/garden/sprites/sprite.test.ts`
Expected: PASS (13 tests).

- [ ] **Step 5: Vérifier types et lint**

Run: `bunx tsc --noEmit && bun run lint`
Expected: aucune erreur.

- [ ] **Step 6: Commit**

```bash
git add src/garden/sprites
git commit -m "feat(potager): générateur de sprites pixel art (palette Chaleureux)"
```

---

### Task 8: Modèle de scène et heure du jour

**Files:**

- Create: `src/garden/render/sceneModel.ts`
- Create: `src/garden/render/tod.ts`
- Test: `src/garden/render/sceneModel.test.ts`
- Test: `src/garden/render/tod.test.ts`

**Interfaces:**

- Consumes: `GardenSave`, `TileKey`, `parseTileKey` (Task 1), `growthOf`, `GrowthState` (Task 3), `soilTiles` (Task 4), `isRaining`, `RainSource` (Task 2), `SpriteRef`, `spriteKey` (Task 7).
- Produces:
  - `interface SceneItem { ref: SpriteRef; legendary: boolean; sway: boolean }`
  - `interface SceneModel { items: Map<TileKey, SceneItem>; soil: TileKey[]; wet: Set<TileKey>; raining: boolean }`
  - `buildSceneModel(save: GardenSave, now: number, rain?: RainSource): SceneModel`
  - `itemKey(item: SceneItem): string`
  - `diffItems(prev: Map<TileKey, SceneItem>, next: Map<TileKey, SceneItem>): { remove: TileKey[]; add: TileKey[] }` (un remplacement = retrait + ajout)
  - `type Tod = "matin" | "midi" | "soir" | "nuit"`, `todOf(date: Date): Tod`

Règles du modèle : plante à l'étape 0 à 3 -> `graine` (couleur `cream`), `pousse`, `jeune`, `bouton` (sans couleur) ; étape 4 -> espèce avec sa couleur, `legendary` si rareté `legendaire`. `hole` -> `trou`, `leaves` -> `tas`, `decor` -> son id. `sway` vrai pour les plantes (étapes 1 à 4). `wet` contient les cases de plante mouillées ; `raining` vient de la pluie à `now`. Heure : 6 h-10 h matin, 10 h-17 h midi, 17 h-21 h soir, sinon nuit.

- [ ] **Step 1: Écrire les tests**

`src/garden/render/tod.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { todOf } from "./tod";

const at = (h: number) => new Date(2026, 9, 1, h, 30);

describe("todOf", () => {
  it("découpe la journée en quatre ambiances", () => {
    expect(todOf(at(5))).toBe("nuit");
    expect(todOf(at(6))).toBe("matin");
    expect(todOf(at(10))).toBe("midi");
    expect(todOf(at(17))).toBe("soir");
    expect(todOf(at(21))).toBe("nuit");
  });
});
```

`src/garden/render/sceneModel.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { HOUR } from "../core/time";
import { createStarterSave } from "../core/starter";
import type { GardenSave, Interval, TileKey } from "../core/types";
import { buildSceneModel, diffItems, type SceneItem } from "./sceneModel";

const noRain = (): Interval[] => [];
const NOW = new Date(2026, 9, 1, 12).getTime();

function withTiles(tiles: GardenSave["tiles"]): GardenSave {
  return { ...createStarterSave(), tiles };
}

describe("buildSceneModel", () => {
  it("traduit chaque étape de pousse en sprite", () => {
    const seed = { species: "dahlia" as const, color: "red" as const, rarity: "commune" as const };
    const save = withTiles({
      "1,1": { kind: "plant", seed, sownAt: NOW, watered: [] },
      "2,1": { kind: "plant", seed, sownAt: NOW - 2 * HOUR, watered: [] },
      "3,1": { kind: "plant", seed, sownAt: NOW - 8 * HOUR, watered: [] },
    });
    const m = buildSceneModel(save, NOW, noRain);
    expect(m.items.get("1,1")!.ref).toEqual({ name: "graine", color: "cream" });
    expect(m.items.get("2,1")!.ref).toEqual({ name: "pousse" });
    expect(m.items.get("3,1")!.ref).toEqual({ name: "dahlia", color: "red" });
    expect(m.items.get("1,1")!.sway).toBe(false);
    expect(m.items.get("3,1")!.sway).toBe(true);
  });

  it("marque les légendaires et les cases mouillées", () => {
    const save = withTiles({
      "1,1": {
        kind: "plant",
        seed: { species: "dahlia", color: "violet", rarity: "legendaire" },
        sownAt: NOW - 40 * HOUR,
        watered: [{ start: NOW - HOUR, end: NOW + HOUR }],
      },
    });
    const m = buildSceneModel(save, NOW, noRain);
    expect(m.items.get("1,1")!.legendary).toBe(true);
    expect(m.wet.has("1,1")).toBe(true);
  });

  it("affiche décor, trous et tas de feuilles, et la terre des parcelles", () => {
    const save = withTiles({
      "0,1": { kind: "decor", id: "lanterne" },
      "2,2": { kind: "hole", dugAt: NOW },
      "0,5": { kind: "leaves", since: NOW },
    });
    const m = buildSceneModel(save, NOW, noRain);
    expect(m.items.get("0,1")!.ref.name).toBe("lanterne");
    expect(m.items.get("2,2")!.ref.name).toBe("trou");
    expect(m.items.get("0,5")!.ref.name).toBe("tas");
    expect(m.soil).toHaveLength(24);
  });

  it("indique s'il pleut", () => {
    const rain = (): Interval[] => [{ start: NOW - HOUR, end: NOW + HOUR }];
    expect(buildSceneModel(createStarterSave(), NOW, rain).raining).toBe(true);
    expect(buildSceneModel(createStarterSave(), NOW, noRain).raining).toBe(false);
  });
});

describe("diffItems", () => {
  it("retire, ajoute et remplace seulement ce qui change", () => {
    const item = (name: "pousse" | "jeune"): SceneItem => ({
      ref: { name },
      legendary: false,
      sway: true,
    });
    const prev = new Map<TileKey, SceneItem>([
      ["1,1", item("pousse")],
      ["2,1", item("pousse")],
    ]);
    const next = new Map<TileKey, SceneItem>([
      ["1,1", item("pousse")],
      ["2,1", item("jeune")],
      ["3,1", item("pousse")],
    ]);
    expect(diffItems(prev, next)).toEqual({ remove: ["2,1"], add: ["2,1", "3,1"] });
    expect(diffItems(next, new Map())).toEqual({ remove: ["1,1", "2,1", "3,1"], add: [] });
  });
});
```

- [ ] **Step 2: Lancer les tests, vérifier l'échec**

Run: `bun run test src/garden/render`
Expected: FAIL, modules introuvables.

- [ ] **Step 3: Implémenter**

`src/garden/render/tod.ts` :

```ts
export type Tod = "matin" | "midi" | "soir" | "nuit";

export function todOf(date: Date): Tod {
  const h = date.getHours();
  if (h >= 6 && h < 10) return "matin";
  if (h >= 10 && h < 17) return "midi";
  if (h >= 17 && h < 21) return "soir";
  return "nuit";
}
```

`src/garden/render/sceneModel.ts` :

```ts
import { growthOf } from "../core/growth";
import { soilTiles } from "../core/plots";
import type { GardenSave, TileContent, TileKey } from "../core/types";
import { isRaining, rainIntervals, type RainSource } from "../core/weather";
import { spriteKey, type SpriteRef } from "../sprites/sprite";

export interface SceneItem {
  ref: SpriteRef;
  legendary: boolean;
  sway: boolean;
}

export interface SceneModel {
  items: Map<TileKey, SceneItem>;
  soil: TileKey[];
  wet: Set<TileKey>;
  raining: boolean;
}

const STAGE_REFS: SpriteRef[] = [
  { name: "graine", color: "cream" },
  { name: "pousse" },
  { name: "jeune" },
  { name: "bouton" },
];

export const itemKey = (item: SceneItem): string =>
  `${spriteKey(item.ref)}:${item.legendary ? 1 : 0}`;

function itemOf(
  tile: TileContent,
  now: number,
  rain: RainSource,
  wet: Set<TileKey>,
  key: TileKey,
): SceneItem {
  switch (tile.kind) {
    case "plant": {
      const g = growthOf(tile, now, rain);
      if (g.wet) wet.add(key);
      if (g.stage < 4) return { ref: STAGE_REFS[g.stage], legendary: false, sway: g.stage > 0 };
      const { species, color, rarity } = tile.seed;
      return { ref: { name: species, color }, legendary: rarity === "legendaire", sway: true };
    }
    case "hole":
      return { ref: { name: "trou" }, legendary: false, sway: false };
    case "leaves":
      return { ref: { name: "tas" }, legendary: false, sway: false };
    case "decor":
      return { ref: { name: tile.id }, legendary: false, sway: false };
  }
}

export function buildSceneModel(
  save: GardenSave,
  now: number,
  rain: RainSource = rainIntervals,
): SceneModel {
  const items = new Map<TileKey, SceneItem>();
  const wet = new Set<TileKey>();
  for (const [key, tile] of Object.entries(save.tiles) as [TileKey, TileContent | undefined][]) {
    if (tile) items.set(key, itemOf(tile, now, rain, wet, key));
  }
  const raining =
    rain === rainIntervals
      ? isRaining(now)
      : rain(now - 1, now + 1).some((r) => now >= r.start && now < r.end);
  return { items, soil: soilTiles(save.plots), wet, raining };
}

export function diffItems(prev: Map<TileKey, SceneItem>, next: Map<TileKey, SceneItem>) {
  const remove: TileKey[] = [];
  const add: TileKey[] = [];
  for (const [key, item] of prev) {
    const n = next.get(key);
    if (!n || itemKey(n) !== itemKey(item)) remove.push(key);
  }
  for (const [key, item] of next) {
    const p = prev.get(key);
    if (!p || itemKey(p) !== itemKey(item)) add.push(key);
  }
  return { remove, add };
}
```

- [ ] **Step 4: Lancer les tests, vérifier le succès**

Run: `bun run test src/garden/render`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/garden/render/sceneModel.ts src/garden/render/sceneModel.test.ts src/garden/render/tod.ts src/garden/render/tod.test.ts
git commit -m "feat(potager): modèle de scène pur et ambiances horaires"
```

---

### Task 9: Scène HD-2D three.js

**Files:**

- Modify: `package.json` (via `bun add three` et `bun add -d @types/three`)
- Create: `src/garden/render/world.ts`, `texture.ts`, `ground.ts`, `billboards.ts`, `lighting.ts`, `ambience.ts`, `post.ts`, `webgl.ts`, `createGardenScene.ts`

**Interfaces:**

- Consumes: `SceneModel`, `SceneItem`, `buildSceneModel`, `diffItems` (Task 8), `todOf`, `Tod` (Task 8), `spriteCanvas`, `SpriteRef` (Task 7), `groundTile` (Task 7), `hash` (Task 1), `GardenSave`, `TileKey`, `parseTileKey` (Task 1).
- Produces:
  - `type SceneProfile = "backdrop" | "garden"`
  - `interface GardenScene { start(): void; stop(): void; readonly running: boolean; readonly fps: number; sync(save: GardenSave, now: number): void; renderOnce(): void; dispose(): void }`
  - `createGardenScene(canvas: HTMLCanvasElement, profile: SceneProfile): GardenScene` (lève une erreur si WebGL est indisponible)
  - `hasWebgl(): boolean` dans `src/garden/render/webgl.ts`

`renderOnce()` dessine une image sans lancer la boucle : une fois la boucle arrêtée, le canvas WebGL continue d'afficher la dernière image présentée, ce qui sert d'image figée (pas de capture ni d'état React).

**Portage.** Source : `docs/superpowers/mockups/potager-automne/hd2dfield.js`. Découper ainsi (tout le code d'interaction de la maquette - `hl*`, `setHighlight`, `ray`, `pick`, `lift`, `moveLifted`, `drop`, `spawnCrow`, `chaseCrow`, particules `PMAX` à `updateFx` - n'est PAS porté, sauf la lumière des légendaires dans `billboards.ts`) :

| Maquette                                                                            | Cible                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `X0`, `MIN_X..MAX_Y`, `wx`, `wz` (l. 37-39)                                         | `world.ts` : `export const WORLD = { X0: -4, MIN_X: -5, MAX_X: 13, MIN_Y: -4, MAX_Y: 7 }`, `wx(tx)`, `wz(ty)`                                                                                                                                                                                                                                                                                                                                                              |
| `texOf` (l. 29-34)                                                                  | `texture.ts` : `pixelTexture(canvas)`                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `gDry`, `gWet`, `kindAt`, `paintTile`, `setWet`, `groundMat`, `ground` (l. 40-66)   | `ground.ts` : `createGround(scene)` qui renvoie `{ setSoil(keys: TileKey[]): void; setWet(keys: Set<TileKey>): void; setRaining(on: boolean): void }` ; ne repeint que les cases dont l'état change                                                                                                                                                                                                                                                                        |
| `billboard`, `swayers`, `placeItem`, `removeItem`, `dispose`, lanternes (l. 67-134) | `billboards.ts` : `createBillboards(scene)` qui renvoie `{ add(key: TileKey, item: SceneItem): void; remove(key: TileKey): void; addStatic(canvas, x, z, w, h, sway, phase): void; sway(t: number, raining: boolean): void; lanterns(): { glows: THREE.Mesh[]; lights: THREE.PointLight[] } }` ; `add` utilise `spriteCanvas(item.ref)`, ajoute la lanterne si `ref.name === "lanterne"`, une `PointLight(0xffe7a0, 1.4, 2.4, 2)` en `(0, 1.05, 0.35)` si `item.legendary` |
| `fence`, `tree`, `bushes` (l. 274-284)                                              | `createGardenScene.ts` : clôture de `tx = -2` à `9` en `wz(-1) + 0.2`, 7 arbres aux positions de la maquette via `addStatic(spriteCanvas({ name: "arbre" }), x, z, 3, 4.5, true, i)` ; les buissons de la maquette ne sont PAS portés                                                                                                                                                                                                                                      |
| ciel, `paintSky`, feuilles, lucioles, pluie, brume (l. 285-360)                     | `ambience.ts` : `createAmbience(scene)` qui renvoie `{ paintSky(colors: [string, string, string, string]): void; update(t: number, tod: Tod, raining: boolean, look: Look, camera: THREE.Camera): void; setNight(on: boolean): void; setRainVisible(on: boolean): void }`                                                                                                                                                                                                  |
| `hemi`, `sun`, `scene.fog`, `LOOKS`, `applyLook` (l. 308-319, 383-411)              | `lighting.ts` : `LOOKS: Record<Tod, Look>` et `createLighting(scene)` qui renvoie `{ apply(tod: Tod, raining: boolean, ctx: { renderer, bloom, ambience, lanterns, groundSetRaining }): void }` (même logique que `applyLook`, avec mémorisation `tod + raining`)                                                                                                                                                                                                          |
| composer, bloom, tilt-shift, vignette, `resize` (l. 362-382)                        | `post.ts` : `createPost(renderer, scene, camera)` qui renvoie `{ composer, bloom, resize(w: number, h: number): void }`                                                                                                                                                                                                                                                                                                                                                    |
| renderer, camera, boucle (`frame`, `draw`, `start`, `stop`, `snapshot`)             | `createGardenScene.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

Profils de caméra dans `createGardenScene.ts` :

```ts
const VIEWS: Record<
  SceneProfile,
  { y: number; z: number; look: [number, number, number]; parallax: number }
> = {
  backdrop: { y: 6.2, z: 11.5, look: [0, 0.9, -0.6], parallax: 0 },
  garden: { y: 7.4, z: 11.8, look: [0.9, 0.2, 0.6], parallax: 0.6 },
};
```

`parallax: 0` : aucun écouteur `pointermove` n'est posé. La dérive automatique `Math.sin(t * 0.1) * 0.3` est conservée dans les deux profils.

Squelette obligatoire de `createGardenScene.ts` :

```ts
import * as THREE from "three";
import type { GardenSave, TileKey } from "../core/types";
import { spriteCanvas } from "../sprites/sprite";
import { createAmbience } from "./ambience";
import { createBillboards } from "./billboards";
import { createGround } from "./ground";
import { createLighting } from "./lighting";
import { createPost } from "./post";
import { buildSceneModel, diffItems, type SceneItem } from "./sceneModel";
import { todOf } from "./tod";
import { wx, wz } from "./world";

export type SceneProfile = "backdrop" | "garden";

export interface GardenScene {
  start(): void;
  stop(): void;
  readonly running: boolean;
  readonly fps: number;
  sync(save: GardenSave, now: number): void;
  renderOnce(): void;
  dispose(): void;
}

const FRAME_MS = 1000 / 30;

export function createGardenScene(canvas: HTMLCanvasElement, profile: SceneProfile): GardenScene {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
  // ... réglages renderer, scène, caméra, sol, billboards, ambiance, lumière, post (portage)

  let shown = new Map<TileKey, SceneItem>();
  let raining = false;

  function sync(save: GardenSave, now: number) {
    const model = buildSceneModel(save, now);
    const { remove, add } = diffItems(shown, model.items);
    remove.forEach((k) => billboards.remove(k));
    add.forEach((k) => billboards.add(k, model.items.get(k)!));
    shown = model.items;
    ground.setSoil(model.soil);
    ground.setWet(model.wet);
    raining = model.raining;
  }

  let running = false;
  let raf = 0;
  let lastDraw = 0;
  let frames = 0;
  let fpsT = 0;
  let fps = 0;

  function draw(ms: number) {
    const t = ms / 1000;
    const tod = todOf(new Date());
    lighting.apply(tod, raining, {
      renderer,
      bloom: post.bloom,
      ambience,
      lanterns: billboards.lanterns(),
      groundSetRaining: ground.setRaining,
    });
    // caméra (dérive + parallaxe selon le profil), billboards.sway(t, raining), ambience.update(...)
    post.composer.render();
  }

  function frame(ms: number) {
    raf = requestAnimationFrame(frame);
    if (ms - lastDraw < FRAME_MS - 2) return;
    lastDraw = ms;
    frames++;
    if (ms - fpsT >= 1000) {
      fps = Math.round((frames * 1000) / (ms - fpsT));
      frames = 0;
      fpsT = ms;
    }
    draw(ms);
  }

  return {
    start() {
      if (running) return;
      running = true;
      frames = 0;
      fpsT = performance.now();
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
    get running() {
      return running;
    },
    get fps() {
      return running ? fps : 0;
    },
    sync,
    renderOnce() {
      draw(performance.now());
    },
    dispose() {
      this.stop();
      // retirer le ResizeObserver et l'écouteur pointermove, libérer textures et géométries
      renderer.dispose();
    },
  };
}
```

Les commentaires `// ...` ci-dessus désignent le code porté depuis la maquette selon le tableau, pas du code à inventer. `canvas` remplace `cv`, `WebGLRenderer` lève une exception si WebGL est indisponible : ne pas l'attraper ici (c'est `GardenBackdrop` qui la gère).

- [ ] **Step 1: Ajouter three.js**

Run: `bun add three && bun add -d @types/three`
Expected: `three` dans `dependencies`, `@types/three` dans `devDependencies`, `bun.lock` mis à jour.

- [ ] **Step 2: Porter les modules selon le tableau et le squelette**

`src/garden/render/webgl.ts` :

```ts
export function hasWebgl(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") ?? c.getContext("webgl"));
  } catch {
    return false;
  }
}
```

Créer les 8 autres fichiers. Imports three.js addons sous la forme `import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";` (idem pour `RenderPass`, `UnrealBloomPass`, `ShaderPass`, `OutputPass`, `HorizontalTiltShiftShader`, `VerticalTiltShiftShader`, `VignetteShader`).

- [ ] **Step 3: Vérifier types, lint et tests existants**

Run: `bunx tsc --noEmit && bun run lint && bun run test`
Expected: aucune erreur, tous les tests PASS.

- [ ] **Step 4: Vérifier que three.js n'entre pas dans le bundle principal**

Run: `bunx vite build 2>&1 | grep -i three || echo "three absent des noms de chunks"`
Expected: aucun chunk d'entrée ne contient three (il ne sera importé qu'en différé à partir de la Task 11). À ce stade aucun fichier applicatif n'importe `createGardenScene`, le build doit simplement réussir.

- [ ] **Step 5: Commit**

```bash
git add package.json bun.lock src/garden/render
git commit -m "feat(potager): scène HD-2D three.js portée depuis la maquette"
```

---

### Task 10: Mode du fond et fenêtre Potager (côté frontend)

**Files:**

- Create: `src/garden/ui/backdropMode.ts`
- Test: `src/garden/ui/backdropMode.test.ts`
- Create: `src/garden/ui/gardenWindow.ts`

**Interfaces:**

- Consumes: `isBrowserPreview` (`src/lib/devTauriShim.ts`).
- Produces:
  - `type BackdropMode = "run" | "pause" | "frozen"`
  - `backdropMode(s: { active: boolean; focused: boolean; hidden: boolean; gardenOpen: boolean }): BackdropMode`
  - `GARDEN_LABEL = "garden"`, `GARDEN_QUERY = "window=garden"`, `isGardenWindow(): boolean`
  - `openGardenWindow(): Promise<void>` (crée ou remet au premier plan)
  - `onGardenOpenChange(cb: (open: boolean) => void): () => void` (appelle `cb` avec l'état initial puis à chaque changement)
  - `announceGardenOpened(): Promise<void>`, `announceGardenClosed(): Promise<void>` (appelés par la fenêtre Potager)

Règle : `gardenOpen` -> `"frozen"` ; sinon `!active || !focused || hidden` -> `"pause"` ; sinon `"run"`.

- [ ] **Step 1: Écrire le test**

`src/garden/ui/backdropMode.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { backdropMode } from "./backdropMode";

const base = { active: true, focused: true, hidden: false, gardenOpen: false };

describe("backdropMode", () => {
  it("tourne quand tout est visible", () => {
    expect(backdropMode(base)).toBe("run");
  });

  it("se met en pause si la page masque le fond, le focus est perdu ou l'onglet caché", () => {
    expect(backdropMode({ ...base, active: false })).toBe("pause");
    expect(backdropMode({ ...base, focused: false })).toBe("pause");
    expect(backdropMode({ ...base, hidden: true })).toBe("pause");
  });

  it("se fige quand le Potager est ouvert, quoi qu'il arrive", () => {
    expect(backdropMode({ ...base, gardenOpen: true })).toBe("frozen");
    expect(backdropMode({ active: false, focused: false, hidden: true, gardenOpen: true })).toBe(
      "frozen",
    );
  });
});
```

- [ ] **Step 2: Lancer le test, vérifier l'échec**

Run: `bun run test src/garden/ui/backdropMode.test.ts`
Expected: FAIL, module introuvable.

- [ ] **Step 3: Implémenter `backdropMode.ts`**

```ts
export type BackdropMode = "run" | "pause" | "frozen";

export function backdropMode(s: {
  active: boolean;
  focused: boolean;
  hidden: boolean;
  gardenOpen: boolean;
}): BackdropMode {
  if (s.gardenOpen) return "frozen";
  if (!s.active || !s.focused || s.hidden) return "pause";
  return "run";
}
```

- [ ] **Step 4: Lancer le test, vérifier le succès**

Run: `bun run test src/garden/ui/backdropMode.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Implémenter `gardenWindow.ts`**

```ts
import { emit, listen } from "@tauri-apps/api/event";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { isBrowserPreview } from "@/lib/devTauriShim";

export const GARDEN_LABEL = "garden";
export const GARDEN_QUERY = "window=garden";
const OPENED = "garden:opened";
const CLOSED = "garden:closed";

export const isGardenWindow = () => new URLSearchParams(location.search).get("window") === "garden";

// Aperçu navigateur : la fenêtre Potager est un onglet, suivi par sa référence.
let previewTab: Window | null = null;

export async function openGardenWindow(): Promise<void> {
  if (isBrowserPreview) {
    if (previewTab && !previewTab.closed) previewTab.focus();
    else previewTab = window.open(`/?${GARDEN_QUERY}`, GARDEN_LABEL);
    return;
  }
  const existing = await WebviewWindow.getByLabel(GARDEN_LABEL);
  if (existing) {
    await existing.unminimize();
    await existing.setFocus();
    return;
  }
  new WebviewWindow(GARDEN_LABEL, {
    url: `index.html?${GARDEN_QUERY}`,
    title: "Potager",
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    dragDropEnabled: false,
  });
}

export function onGardenOpenChange(cb: (open: boolean) => void): () => void {
  if (isBrowserPreview) {
    // jamais d'appel synchrone : les composants passent un setState depuis un effet
    queueMicrotask(() => cb(false));
    let last = false;
    const id = setInterval(() => {
      const open = !!previewTab && !previewTab.closed;
      if (open !== last) cb((last = open));
    }, 500);
    return () => clearInterval(id);
  }
  let disposed = false;
  const unlisteners: (() => void)[] = [];
  WebviewWindow.getByLabel(GARDEN_LABEL).then((w) => !disposed && cb(!!w));
  listen(OPENED, () => cb(true)).then((u) => (disposed ? u() : unlisteners.push(u)));
  listen(CLOSED, () => cb(false)).then((u) => (disposed ? u() : unlisteners.push(u)));
  return () => {
    disposed = true;
    unlisteners.forEach((u) => u());
  };
}

export async function announceGardenOpened(): Promise<void> {
  if (!isBrowserPreview) await emit(OPENED);
}

export async function announceGardenClosed(): Promise<void> {
  if (!isBrowserPreview) await emit(CLOSED);
}
```

- [ ] **Step 6: Vérifier les types**

Run: `bunx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 7: Commit**

```bash
git add src/garden/ui/backdropMode.ts src/garden/ui/backdropMode.test.ts src/garden/ui/gardenWindow.ts
git commit -m "feat(potager): mode du fond et ouverture de la fenêtre Potager"
```

---

### Task 11: Fond passif dans la fenêtre principale

**Files:**

- Create: `src/garden/ui/GardenFrozen.tsx`
- Create: `src/garden/ui/GardenBackdrop.tsx`

**Interfaces:**

- Consumes: `createGardenScene`, `GardenScene` (Task 9), `loadGarden` (Task 5), `backdropMode` (Task 10), `onGardenOpenChange` (Task 10).
- Produces:
  - `GardenFrozen()`
  - `GardenBackdrop({ active, onWebglError }: { active: boolean; onWebglError: () => void })` (export nommé, chargé en différé par `App`)

Comportement :

- Montage : `createGardenScene(canvas, "backdrop")` dans un `try` ; en cas d'exception, appeler `onWebglError()` et ne rien afficher.
- Charge la sauvegarde (`loadGarden`) puis `scene.sync(save, Date.now())` ; toutes les 60 s, `scene.sync` avec la dernière sauvegarde connue.
- Suit `document.hasFocus()` (événements `focus` / `blur` de `window`), `document.hidden` (`visibilitychange`) et `onGardenOpenChange`.
- `mode = backdropMode(...)` : `run` -> `scene.start()` ; `pause` -> `scene.stop()` ; `frozen` -> `scene.renderOnce()` puis `scene.stop()` ; le canvas garde sa dernière image, floutée et assombrie en CSS, et `GardenFrozen` affiche le message par-dessus.
- Aucun `setState` synchrone dans un effet (règle `react-hooks/set-state-in-effect` de eslint-plugin-react-hooks 7) : les mises à jour d'état passent par des callbacks (événements, promesses).
- Passage de `frozen` à autre chose : `loadGarden()` puis `scene.sync(...)` avant de relancer (la fenêtre Potager a pu tout changer).
- Démontage : `scene.dispose()`.
- `pointer-events-none` : le conteneur est déjà non interactif dans `App`.

- [ ] **Step 1: Écrire `GardenFrozen.tsx`**

```tsx
export function GardenFrozen() {
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-x-0 bottom-10 flex justify-center">
        <div className="rounded-2xl border border-amber-300/25 bg-[#18141c]/75 px-5 py-3 text-center text-sm text-[#f4e6d0] backdrop-blur-md">
          <p className="font-semibold">Ton champ est ouvert dans la fenêtre Potager</p>
          <p className="mt-1 text-xs text-[#cbbba6]">Il reprendra vie à sa fermeture.</p>
        </div>
      </div>
    </div>
  );
}
```

Le message est placé en bas pour ne pas recouvrir l'interface centrale de l'accueil (le fond reste sous l'interface).

- [ ] **Step 2: Écrire `GardenBackdrop.tsx`**

```tsx
import { useEffect, useRef, useState } from "react";
import type { GardenSave } from "../core/types";
import { createGardenScene, type GardenScene } from "../render/createGardenScene";
import { hasWebgl } from "../render/webgl";
import { loadGarden } from "../storage/gardenStore";
import { backdropMode } from "./backdropMode";
import { GardenFrozen } from "./GardenFrozen";
import { onGardenOpenChange } from "./gardenWindow";

const RESYNC_MS = 60_000;

export function GardenBackdrop({
  active,
  onWebglError,
}: {
  active: boolean;
  onWebglError: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<GardenScene | null>(null);
  const saveRef = useRef<GardenSave | null>(null);
  const [focused, setFocused] = useState(() => document.hasFocus());
  const [hidden, setHidden] = useState(() => document.hidden);
  const [gardenOpen, setGardenOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hasWebgl()) {
      onWebglError();
      return;
    }
    let scene: GardenScene;
    try {
      scene = createGardenScene(canvasRef.current!, "backdrop");
    } catch {
      onWebglError();
      return;
    }
    sceneRef.current = scene;
    let alive = true;
    loadGarden().then(({ save }) => {
      if (!alive) return;
      saveRef.current = save;
      scene.sync(save, Date.now());
      setReady(true);
    });
    const id = setInterval(
      () => saveRef.current && scene.sync(saveRef.current, Date.now()),
      RESYNC_MS,
    );
    return () => {
      alive = false;
      clearInterval(id);
      scene.dispose();
      sceneRef.current = null;
    };
  }, [onWebglError]);

  useEffect(() => {
    const onFocus = () => setFocused(true);
    const onBlur = () => setFocused(false);
    const onVisibility = () => setHidden(document.hidden);
    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibility);
    const stop = onGardenOpenChange(setGardenOpen);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibility);
      stop();
    };
  }, []);

  const mode = backdropMode({ active, focused, hidden, gardenOpen });

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !ready) return;
    if (mode === "frozen") {
      scene.renderOnce();
      scene.stop();
      return;
    }
    let alive = true;
    // retour d'un gel : la fenêtre Potager a pu modifier la sauvegarde
    loadGarden().then(({ save }) => {
      if (!alive) return;
      saveRef.current = save;
      scene.sync(save, Date.now());
      if (mode === "run") scene.start();
      else {
        scene.stop();
        scene.renderOnce();
      }
    });
    return () => {
      alive = false;
    };
  }, [mode, ready]);

  const frozen = mode === "frozen";
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#120c10]">
      <canvas
        ref={canvasRef}
        className={`h-full w-full transition-[filter] duration-500 ${
          frozen ? "scale-105 blur-[10px] brightness-[.55] saturate-[.7]" : ""
        }`}
      />
      {frozen && <GardenFrozen />}
    </div>
  );
}
```

- [ ] **Step 3: Vérifier types et lint**

Run: `bunx tsc --noEmit && bun run lint`
Expected: aucune erreur.

- [ ] **Step 4: Commit**

```bash
git add src/garden/ui/GardenFrozen.tsx src/garden/ui/GardenBackdrop.tsx
git commit -m "feat(potager): fond passif bridé, en pause ou figé selon le contexte"
```

---

### Task 12: Fenêtre Potager (application, capability, Rust)

**Files:**

- Create: `src/garden/ui/GardenDevBar.tsx`
- Create: `src/garden/ui/GardenApp.tsx`
- Modify: `src/main.tsx`
- Create: `src-tauri/capabilities/garden.json`
- Modify: `src-tauri/capabilities/default.json`
- Modify: `src-tauri/src/lib.rs` (fermeture du Potager avec la fenêtre principale)

**Interfaces:**

- Consumes: `createGardenScene` (Task 9), `loadGarden`, `createSaveScheduler` (Task 5), `withDemoPlants` (Task 4), `announceGardenOpened`, `announceGardenClosed`, `isGardenWindow` (Task 10), `applyTheme`/`getTheme` (existants, non utilisés : la fenêtre Potager a son propre thème sombre).
- Produces: `GardenApp()` (export par défaut), `GardenDevBar({ onSeed }: { onSeed: () => void })`.

- [ ] **Step 1: Écrire `GardenDevBar.tsx`**

```tsx
export function GardenDevBar({ onSeed }: { onSeed: () => void }) {
  return (
    <div className="absolute bottom-3 left-3 z-10">
      <button
        onClick={onSeed}
        className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-300 ring-1 ring-amber-500/30 hover:bg-amber-500/25"
      >
        Dev : semer des plantes de démonstration
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Écrire `GardenApp.tsx`**

```tsx
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useRef, useState } from "react";
import { toast, Toaster } from "sonner";
import { isBrowserPreview } from "@/lib/devTauriShim";
import { withDemoPlants } from "../core/demo";
import type { GardenSave } from "../core/types";
import { createGardenScene, type GardenScene } from "../render/createGardenScene";
import { hasWebgl } from "../render/webgl";
import { createSaveScheduler, loadGarden } from "../storage/gardenStore";
import { GardenDevBar } from "./GardenDevBar";
import { announceGardenClosed, announceGardenOpened } from "./gardenWindow";

const RESYNC_MS = 60_000;

export default function GardenApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<GardenScene | null>(null);
  const [saver] = useState(() => createSaveScheduler());
  const [webglOk] = useState(hasWebgl);
  const [save, setSave] = useState<GardenSave | null>(null);

  useEffect(() => {
    let alive = true;
    loadGarden().then(({ save, recovered }) => {
      if (!alive) return;
      if (recovered)
        toast.error(
          "Sauvegarde du Potager illisible : une copie a été mise de côté et un nouveau champ a été créé.",
        );
      setSave(save);
    });
    void announceGardenOpened();
    if (!webglOk) return;
    const scene = createGardenScene(canvasRef.current!, "garden");
    sceneRef.current = scene;
    scene.start();
    return () => {
      alive = false;
      scene.dispose();
      sceneRef.current = null;
    };
  }, [webglOk]);

  useEffect(() => {
    if (!save) return;
    saver.schedule(save);
    sceneRef.current?.sync(save, Date.now());
    const id = setInterval(() => sceneRef.current?.sync(save, Date.now()), RESYNC_MS);
    return () => clearInterval(id);
  }, [save, saver]);

  useEffect(() => {
    if (isBrowserPreview) {
      const onHide = () => void saver.flush();
      window.addEventListener("pagehide", onHide);
      return () => window.removeEventListener("pagehide", onHide);
    }
    const pending = getCurrentWindow().onCloseRequested(async () => {
      await saver.flush();
      await announceGardenClosed();
    });
    return () => {
      pending.then((unlisten) => unlisten());
    };
  }, [saver]);

  return (
    <div className="flex h-screen flex-col bg-[#1a1216] text-[#f1e6d2]">
      <Toaster theme="dark" />
      <nav className="flex gap-1 border-b border-amber-300/25 px-4 pt-2">
        <span className="rounded-t-lg bg-amber-300/10 px-4 py-2 font-serif text-lg font-semibold text-[#f3dca0] shadow-[inset_0_-2px_0_#d9b46a]">
          Champ
        </span>
      </nav>
      <div className="relative flex-1">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
        {!webglOk && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm">
            Le Potager a besoin de WebGL, qui n'est pas disponible sur cet appareil.
          </div>
        )}
        {import.meta.env.DEV && save && (
          <GardenDevBar onSeed={() => setSave((s) => (s ? withDemoPlants(s, Date.now()) : s))} />
        )}
      </div>
    </div>
  );
}
```

La première sauvegarde planifiée réécrit la sauvegarde qu'on vient de lire : c'est sans effet et évite un cas particulier.

- [ ] **Step 3: Router `main.tsx` selon la fenêtre**

Remplacer le rendu de `src/main.tsx` par :

```tsx
import "./lib/devTauriShim";
import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { isGardenWindow } from "./garden/ui/gardenWindow";
import { queryClient } from "./lib/queryClient";
import { applyTheme, getTheme } from "./lib/theme";
import { initTextScale } from "./lib/textScale";
import "./lib/launchTime";
import "./index.css";

const GardenApp = lazy(() => import("./garden/ui/GardenApp"));
const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

if (isGardenWindow()) {
  root.render(
    <React.StrictMode>
      <Suspense fallback={null}>
        <GardenApp />
      </Suspense>
    </React.StrictMode>,
  );
} else {
  getTheme()
    .then(applyTheme)
    .catch(() => {});
  initTextScale();
  root.render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </React.StrictMode>,
  );
}
```

- [ ] **Step 4: Capabilities**

Créer `src-tauri/capabilities/garden.json` :

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "garden",
  "description": "Capability de la fenêtre Potager",
  "windows": ["garden"],
  "permissions": ["core:default", "store:default"]
}
```

Dans `src-tauri/capabilities/default.json`, ajouter à `permissions` :

```json
    "core:webview:allow-create-webview-window",
    "core:window:allow-set-focus",
    "core:window:allow-unminimize",
```

- [ ] **Step 5: Fermer le Potager avec la fenêtre principale**

Dans `src-tauri/src/lib.rs`, fonction `run()`, ajouter après `.setup(...)` et avant `.invoke_handler(...)` :

```rust
        .on_window_event(|window, event| {
            // Fermer la fenetre principale ferme aussi le Potager (qui sauvegarde
            // dans son propre gestionnaire de fermeture).
            if window.label() == "main" {
                if let tauri::WindowEvent::Destroyed = event {
                    if let Some(garden) = window.app_handle().get_webview_window("garden") {
                        let _ = garden.close();
                    }
                }
            }
        })
```

- [ ] **Step 6: Vérifier Rust, types et lint**

Run: `cd src-tauri && cargo check && cd .. && bunx tsc --noEmit && bun run lint`
Expected: aucune erreur.

- [ ] **Step 7: Vérifier dans l'aperçu navigateur**

Démarrer l'aperçu avec l'outil `preview_start` (configuration `vite` ou `vite-alt` de `.claude/launch.json`), puis ouvrir `http://localhost:<port>/?window=garden`.
Expected : fenêtre sombre avec l'onglet "Champ", champ HD-2D (clôture, arbres, lanternes, citrouilles, paille, parcelle de terre), bouton "Dev : semer des plantes de démonstration" ; un clic fait apparaître des graines, pousses, jeunes plants, boutons et fleurs, dont un dahlia violet éclairé. Aucune erreur console. Recharger l'onglet : les plantes sont toujours là (sauvegarde relue).

- [ ] **Step 8: Commit**

```bash
git add src/garden/ui/GardenApp.tsx src/garden/ui/GardenDevBar.tsx src/main.tsx src-tauri/capabilities src-tauri/src/lib.rs
git commit -m "feat(potager): fenêtre Potager, capability dédiée et fermeture liée"
```

---

### Task 13: Intégration dans l'application (réglage, fond, menu)

**Files:**

- Modify: `src/App.tsx`
- Modify: `src/pages/MainPage.tsx`, `src/pages/DiscoverPage.tsx` (renommer la prop `summerEnabled` en `animatedBackdrop`)
- Modify: `src/pages/PreferencesPage.tsx`
- Rename + modify: `src/components/settings/panels/SummerPanel.tsx` -> `BackdropPanel.tsx`
- Modify: `src/components/settings/settingsNav.ts`
- Modify: `src/components/AppMenu.tsx`
- Modify: `vite.config.ts` (couverture de `src/garden/core/**`)

**Interfaces:**

- Consumes: `Backdrop`, `loadBackdrop`, `saveBackdrop`, `getBackdrop` (Task 6), `GardenBackdrop` (Task 11), `openGardenWindow`, `onGardenOpenChange` (Task 10), `loadGarden`, `saveGarden` (Task 5), `parseSave` (Task 4).
- Produces: `BackdropPanel` (props ci-dessous).

- [ ] **Step 1: `App.tsx`, état du fond**

Remplacer `const [summerEnabled, setSummerEnabled] = useState(true);` par :

```tsx
const [backdrop, setBackdrop] = useState<Backdrop>("potager");
const summerEnabled = backdrop === "mare";
const animatedBackdrop = backdrop !== "aucun";
```

Dans l'effet de démarrage, remplacer le bloc `summer_default_v1` (du `const applied = ...` jusqu'au `}` du `else`) par :

```tsx
setBackdrop(await loadBackdrop());
```

Remplacer `handleToggleSummer` par :

```tsx
async function handleSetBackdrop(v: Backdrop) {
  setBackdrop(v);
  await saveBackdrop(v);
}

// stable : GardenBackdrop l'utilise comme dépendance d'effet
const handleWebglError = useCallback(() => {
  toast.error("Le Potager a besoin de WebGL : le fond animé a été désactivé.");
  setBackdrop("aucun");
  void saveBackdrop("aucun");
}, []);
```

Ajouter les imports : `import { useCallback } from "react"` (compléter l'import existant), `import { toast } from "sonner";` si absent, `import { loadBackdrop, saveBackdrop, type Backdrop } from "@/lib/backdropPref";`, et le chargement différé :

```tsx
const GardenBackdrop = lazy(() =>
  import("@/garden/ui/GardenBackdrop").then((m) => ({ default: m.GardenBackdrop })),
);
```

- [ ] **Step 2: `App.tsx`, rendu du fond**

Remplacer :

```tsx
const showPool =
  summerEnabled && (page === "main" || page === "discover" || effectivePhase === "transition");
```

par :

```tsx
// Le fond n'est visible que sur les pages transparentes ; ailleurs il est en pause.
const backdropVisible =
  animatedBackdrop && (page === "main" || page === "discover" || effectivePhase === "transition");
const showPool = summerEnabled && backdropVisible;
```

Remplacer le bloc `{summerEnabled && ( <div aria-hidden ...> ... <PixelPool .../> ... </div> )}` par :

```tsx
{
  animatedBackdrop && (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-0 -z-10 transition-opacity duration-500 ${
        backdropVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <Suspense fallback={null}>
        {backdrop === "mare" ? (
          <PixelPool
            active={showPool}
            fps={summerFps}
            maxDucks={summerMaxDucks}
            onBoatWarp={() => setPage("boatgame")}
          />
        ) : (
          <GardenBackdrop active={backdropVisible} onWebglError={handleWebglError} />
        )}
      </Suspense>
    </div>
  );
}
```

Le bloc `{summerEnabled && (<Suspense> <DuckShop /> <DuckDex /> <SlotMachine /> </Suspense>)}` et les boutons dev `+ legendaire` / `+ roi` restent conditionnés par `summerEnabled` (inchangés).

- [ ] **Step 3: `App.tsx`, props des pages**

- `MainPage` : `summerEnabled={summerEnabled}` devient `animatedBackdrop={animatedBackdrop}` ; `initialIdleAutoHide={idleAutoHide && summerEnabled && !isBrowserPreview}` devient `initialIdleAutoHide={idleAutoHide && animatedBackdrop && !isBrowserPreview}`.
- `DiscoverPage` : `summerEnabled={summerEnabled}` devient `animatedBackdrop={animatedBackdrop}`.
- `PreferencesPage` : remplacer `summerEnabled={summerEnabled}` et `onToggleSummer={handleToggleSummer}` par `backdrop={backdrop}` et `onSetBackdrop={handleSetBackdrop}`.

Dans `MainPage.tsx` et `DiscoverPage.tsx`, renommer la prop `summerEnabled` en `animatedBackdrop` (interface des props, destructuration et usage dans la classe du `<main>` / conteneur), sans autre changement.

- [ ] **Step 4: Panneau "Fonds animés"**

Run: `git mv src/components/settings/panels/SummerPanel.tsx src/components/settings/panels/BackdropPanel.tsx`

Dans `BackdropPanel.tsx` :

- renommer le composant et l'interface en `BackdropPanel` / `BackdropPanelProps` ;
- remplacer les props `summerEnabled: boolean; onToggleSummer: (v: boolean) => void;` par `backdrop: Backdrop; onSetBackdrop: (v: Backdrop) => void;` ;
- en-tête du panneau : `title="Fonds animés"`, `subtitle="Le décor vivant derrière l'application."` ;
- remplacer la ligne "Une piscine ?" par :

```tsx
<SettingRow title="Fond animé" description="Un seul fond tourne à la fois.">
  <Segmented
    value={backdrop}
    options={[
      { value: "potager", label: "Potager" },
      { value: "mare", label: "Mare" },
      { value: "aucun", label: "Aucun" },
    ]}
    onChange={(v) => onSetBackdrop(v as Backdrop)}
  />
</SettingRow>
```

- "Masquage automatique" : condition `backdrop !== "aucun"` au lieu de `summerEnabled` ;
- "Fluidité de l'animation", "Nombre de canards" et "Ma collection de canards" : condition `backdrop === "mare"` ;
- ajouter, sous la condition `backdrop === "potager"`, un bloc au même style que "Ma collection de canards" :

```tsx
{
  backdrop === "potager" && (
    <div className="mt-3 rounded-xl bg-white dark:bg-zinc-900/80 ring-1 ring-black/8 dark:ring-white/8 px-4 py-3">
      <p className="text-sm font-medium text-zinc-900 dark:text-white">Mon potager</p>
      <p className="text-xs text-zinc-500 mt-0.5 mb-3 leading-relaxed">
        Le champ se gère dans sa propre fenêtre. La sauvegarde peut être exportée ou restaurée ;
        l'import remplace le potager actuel.
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => void openGardenWindow()}
          className="flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-xs font-medium text-white hover:bg-amber-400 transition-colors"
        >
          <Sprout className="h-3.5 w-3.5" />
          Ouvrir le Potager
        </button>
        <button
          onClick={handleExportGarden}
          className="flex items-center gap-2 rounded-full bg-white/90 dark:bg-zinc-800/80 ring-1 ring-black/10 dark:ring-white/10 px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          Exporter mon potager
        </button>
        <button
          onClick={() => importGardenInputRef.current?.click()}
          className="flex items-center gap-2 rounded-full bg-white/90 dark:bg-zinc-800/80 ring-1 ring-black/10 dark:ring-white/10 px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          <Upload className="h-3.5 w-3.5" />
          Importer un potager
        </button>
        <input
          ref={importGardenInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={handleImportGarden}
        />
      </div>
    </div>
  );
}
```

avec, dans le composant :

```tsx
const importGardenInputRef = useRef<HTMLInputElement>(null);
const [gardenOpen, setGardenOpen] = useState(false);
useEffect(() => onGardenOpenChange(setGardenOpen), []);

async function handleExportGarden() {
  try {
    const { save } = await loadGarden();
    const path = await invoke<string>("export_json", {
      filename: "c411-potager.json",
      content: JSON.stringify(save, null, 2),
    });
    toast.success(`Potager exporté : ${path}`);
  } catch (e) {
    toast.error(`Export impossible : ${e}`);
  }
}

async function handleImportGarden(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];
  e.target.value = "";
  if (!file) return;
  if (gardenOpen) {
    toast.error("Ferme la fenêtre Potager avant d'importer.");
    return;
  }
  const save = parseSave(JSON.parse(await file.text().catch(() => "null")));
  if (!save) {
    toast.error("Fichier invalide");
    return;
  }
  await saveGarden(save);
  toast.success("Potager importé (visible au prochain affichage du fond)");
}
```

Imports à ajouter : `useEffect` depuis `react`, `Sprout` depuis `lucide-react`, `type Backdrop` depuis `@/lib/backdropPref`, `loadGarden`, `saveGarden` depuis `@/garden/storage/gardenStore`, `parseSave` depuis `@/garden/core/save`, `openGardenWindow`, `onGardenOpenChange` depuis `@/garden/ui/gardenWindow`.

`JSON.parse` sur un texte invalide lève une exception : entourer le `parseSave(JSON.parse(...))` d'un `try { ... } catch { toast.error("Fichier invalide"); return; }` à la place du `.catch` sur `file.text()` :

```tsx
let save = null;
try {
  save = parseSave(JSON.parse(await file.text()));
} catch {
  save = null;
}
```

- [ ] **Step 5: `PreferencesPage.tsx` et `settingsNav.ts`**

- `PreferencesPage.tsx` : importer `BackdropPanel` au lieu de `SummerPanel` ; props `summerEnabled` / `onToggleSummer` remplacées par `backdrop: Backdrop` / `onSetBackdrop: (v: Backdrop) => void` ; le `case "summer"` rend `<BackdropPanel backdrop={backdrop} onSetBackdrop={onSetBackdrop} ... />` avec les autres props inchangées.
- `settingsNav.ts` : l'entrée `id: "summer"` garde son id ; `label: "Fonds animés"`, `subtitle: "Le décor vivant derrière l'application."`, `icon: Sprout` (importer `Sprout` depuis `lucide-react`, retirer `Sun` s'il n'est plus utilisé).

- [ ] **Step 6: Entrée "Potager" du menu**

Dans `src/components/AppMenu.tsx` :

- importer `Sprout` depuis `lucide-react`, `getBackdrop` depuis `@/lib/backdropPref`, `openGardenWindow` depuis `@/garden/ui/gardenWindow` ;
- ajouter un état et sa lecture au montage :

```tsx
const [gardenEnabled, setGardenEnabled] = useState(false);

useEffect(() => {
  getBackdrop()
    .then((b) => setGardenEnabled(b === "potager"))
    .catch(() => {});
}, []);
```

- ajouter l'entrée juste après l'entrée "Bibliothèque" (`onNavigate("library")`) :

```tsx
{
  gardenEnabled && (
    <DropdownMenuItem onClick={() => void openGardenWindow()}>
      <Sprout className="mr-2 h-4 w-4" />
      Potager
    </DropdownMenuItem>
  );
}
```

- [ ] **Step 7: Couverture des tests**

Dans `vite.config.ts`, `test.coverage.include` devient `["src/lib/**", "src/garden/core/**"]`.

- [ ] **Step 8: Vérifications automatiques**

Run: `bunx tsc --noEmit && bun run lint && bun run test`
Expected: aucune erreur ; tous les tests PASS, y compris `src/lib/accents.test.ts`.

- [ ] **Step 9: Vérifier dans l'aperçu navigateur**

Avec `preview_start` (configuration `vite` ou `vite-alt`), ouvrir l'accueil.
Expected :

- premier chargement : le Potager est le fond (migration `garden_default_v1`), sans parallaxe quand la souris bouge ;
- menu : entrée "Potager" ; un clic ouvre un onglet `?window=garden` ; l'accueil affiche alors l'image figée floutée et le message "Ton champ est ouvert dans la fenêtre Potager" ; semer des plantes de démonstration dans l'onglet Potager, fermer l'onglet : dans la seconde qui suit, l'accueil reprend vie et affiche les plantes ;
- Paramètres > Fonds animés : "Mare" réaffiche la piscine, la boutique et le Canardex ; "Aucun" rend le fond neutre ; "Potager" affiche le bloc "Mon potager" ; export et import fonctionnent (import refusé tant que l'onglet Potager est ouvert) ;
- page Paramètres (opaque) : le fond est en pause (vérifier avec `javascript_tool` que le compteur de rendus n'augmente pas, par exemple en lisant `performance.now()` avant et après et en observant `requestAnimationFrame` via un espion temporaire, ou simplement que le canvas ne change pas entre deux `toDataURL`) ;
- aucune erreur console.

Faire une capture d'écran de l'accueil avec le fond Potager et de l'état figé.

- [ ] **Step 10: Vérifier dans Tauri**

Run: `bun run tauri dev`
Expected : même comportement avec une vraie seconde fenêtre "Potager" ; la redemander la remet au premier plan (une seule instance) ; fermer la fenêtre Potager relance le fond ; fermer la fenêtre principale ferme aussi le Potager et quitte l'application ; relancer : les plantes de démonstration sont toujours là.

- [ ] **Step 11: Commit**

```bash
git add src/App.tsx src/pages/MainPage.tsx src/pages/DiscoverPage.tsx src/pages/PreferencesPage.tsx src/components/settings src/components/AppMenu.tsx vite.config.ts
git commit -m "feat(potager): fond animé au choix, Potager par défaut et entrée de menu"
```

---

## Self-review

- **Couverture du sous-projet 1 de la spec** : sauvegarde versionnée et récupération (Tasks 4, 5), pousse temps réel x1,5 et 6 h et durées par rareté (Task 3), pluie déterministe (Task 2), belle plante (Task 3), sprites Chaleureux 48x48 (Task 7), scène HD-2D et profils (Tasks 8, 9), fond bridé 30 images/s, sans parallaxe, pauses et gel par la dernière image floutée (Tasks 9, 10, 11), fenêtre Potager unique, capability dédiée, un seul écrivain, fermeture liée (Tasks 10, 12), réglage "Fond animé" avec bascule unique et panneau renommé (Tasks 6, 13), export / import (Task 13), WebGL indisponible (Tasks 11, 12, 13), tas de feuilles et trous affichables (Task 8). Les tas de feuilles qui apparaissent avec le temps relèvent du sous-projet 2 (gestes), tout comme la terre craquelée et la plante qui penche.
- **Types** : `SceneItem`, `SpriteRef`, `GardenScene`, `Backdrop`, `BackdropMode` sont définis une fois et réutilisés avec les mêmes noms.
