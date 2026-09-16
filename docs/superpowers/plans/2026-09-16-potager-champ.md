# Potager d'automne - Sous-projet 2 (onglet Champ) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre le champ jouable dans la fenêtre Potager : six outils, gestes creuser / semer / arroser, cueillette, déplacement, corbeaux, tas de feuilles, incitation visuelle à l'arrosage et inscription des découvertes.

**Architecture:** Les règles vivent dans `src/garden/core/` en fonctions pures testées (`planAction`, `planMove`, `describeTile`, `spawnLeaves`, `collectDiscoveries`). Le rendu three.js (`src/garden/render/`) gagne la sélection de case, la surbrillance, les particules, les corbeaux et le soulèvement, sans aucune règle. L'interface React (`src/garden/ui/`) relie les deux via un reducer pur.

**Tech Stack:** React 19, TypeScript, three.js 0.186, vitest, sonner, Tauri 2 (plugin-store).

**Spec:** `docs/superpowers/specs/2026-09-16-potager-champ-design.md` (vision : `docs/superpowers/specs/2026-09-16-potager-automne-vision-design.md`, maquette : `docs/superpowers/mockups/potager-automne/champ.html`).

## Global Constraints

- Code totalement séparé du jeu des canards : aucun import depuis `PixelPool`, `duck*`, `src/game/*`, `src/lib/duck*`.
- Tout texte affiché est en français correctement accentué ; identifiants, clés, ids et noms de fichiers restent ASCII. `src/lib/accents.test.ts` doit rester vert.
- Pas d'em dash, pas de guillemets typographiques, pas de symboles Unicode décoratifs dans le code.
- Un composant par fichier ; helpers, types, constantes et tables dans des modules séparés.
- `src/garden/core/` n'importe jamais React ni three.js.
- Arrosage : mouille **6 h** (`WATER_MS`), accélère **x1,5** ; jamais obligatoire.
- Cueillette : chance de graine **30 %**, **45 %** si la plante est belle.
- Tas de feuilles : un créneau toutes les **3 h**, **4** tas au maximum.
- Corbeaux : toutes les **2 à 5 min**, **2** au maximum, départ après **90 s**, Potager visible seulement, non enregistrés.
- Grille jouable `FIELD` : **9 x 5** cases (`x` 0 à 8, `y` 0 à 4).
- Sauvegarde `garden.json`, `version: 1`, un seul écrivain (fenêtre Potager).
- Pas de parallaxe ni de picking sur le fond passif (profil `backdrop`).
- Commandes : tests `bun run test`, types `bunx tsc --noEmit`, lint `bun run lint`.

## Écarts assumés par rapport à la spec

- Les libellés français (`labels.ts`) vont dans `core/` et non `ui/`, car `describeTile` (core) en a besoin et core ne dépend pas de ui.
- `setTile` et `isMovable` vivent dans `core/tiles.ts`, partagés par `actions.ts` et `move.ts` ; `planMove` est dans `core/move.ts` pour garder `actions.ts` court.
- `planAction` prend en plus un paramètre optionnel `rain` (source de pluie injectable pour les tests).
- La sauvegarde de départ initialise `leaves.checkedAt` au début du créneau de 3 h en cours (valeur stable, pas de tas immédiat).
- L'état de la fenêtre porte `discoveries: { seq, found }` pour déclencher le toast hors du reducer.

---

## File Structure

```
src/garden/core/
  types.ts          (mod) GardenSave.leaves
  save.ts           (mod) complète leaves
  starter.ts        (mod) initialise leaves
  plots.ts          (mod) FIELD, fieldTiles, isInField
  species.ts        (new) outil de cueillette par espèce
  counters.ts       (new) compteurs de gestes
  tiles.ts          (new) setTile, isMovable
  labels.ts         (new) libellés français, noms de fleurs, durées
  leaves.ts         (new) tas de feuilles déterministes
  discovery.ts      (new) inscription des éclosions
  rolls.ts          (new) graine de cueillette
  target.ts         (new) describeTile, describeCrow
  actions.ts        (new) Tool, Target, Effect, planAction
  move.ts           (new) planMove
  field.test.ts, labels.test.ts, leaves.test.ts, discovery.test.ts,
  rolls.test.ts, target.test.ts, actions.test.ts, move.test.ts   (new)
src/garden/sprites/
  palette.ts        (mod) gamme dry
  ground.ts         (mod) tuile de terre sèche craquelée
  decor.ts          (mod) corbeau
  tools.ts          (new) icônes d'outils
  sprite.ts         (mod) TOOL_DRAW, spriteDataUrl
  sprite.test.ts    (mod)
src/garden/render/
  sceneModel.ts     (mod) thirsty, dry
  sceneModel.test.ts(mod)
  ground.ts         (mod) setDry
  billboards.ts     (mod) inclinaison, get, entries, export makeBillboard/disposeMesh
  highlight.ts      (new) cadre de surbrillance
  particles.ts      (new) éclats
  crows.ts          (new) corbeaux éphémères
  picking.ts        (new) case ou corbeau sous le pointeur
  interaction.ts    (new) regroupe les quatre précédents
  createGardenScene.ts (mod) spawnLeaves, setDry, interaction
src/garden/ui/
  gardenReducer.ts  (new) + gardenReducer.test.ts
  toolMeta.ts       (new) libellés et icônes des outils, couleurs de rareté
  hover.ts          (new) describeTarget, tonalité
  SpriteIcon.tsx    (new)
  ToolBar.tsx       (new)
  TileTooltip.tsx   (new)
  SidePanel.tsx     (new)
  DiscoveryToast.tsx(new)
  useCrows.ts       (new)
  FieldView.tsx     (new)
  GardenDevBar.tsx  (mod)
  GardenApp.tsx     (mod)
```

---

### Task 1: Sauvegarde, grille jouable, espèces et compteurs

**Files:**

- Modify: `src/garden/core/types.ts`, `src/garden/core/save.ts`, `src/garden/core/starter.ts`, `src/garden/core/plots.ts`
- Create: `src/garden/core/species.ts`, `src/garden/core/counters.ts`, `src/garden/core/tiles.ts`, `src/garden/core/leaves.ts` (constantes seulement pour l'instant)
- Test: `src/garden/core/field.test.ts`

**Interfaces:**

- Produces:
  - `GardenSave.leaves: { checkedAt: number }`
  - `FIELD: { x: 0; y: 0; w: 9; h: 5 }`, `fieldTiles(): TileKey[]` (ordre ligne par ligne), `isInField(key: TileKey): boolean`
  - `CUT_SPECIES: ReadonlySet<SpeciesId>`, `type HarvestTool = "main" | "secateur"`, `harvestTool(species: SpeciesId): HarvestTool`
  - `type CounterId = "dug" | "sown" | "watered" | "picked" | "raked" | "crowsChased"`, `bump(save: GardenSave, id: CounterId): GardenSave`
  - `setTile(save: GardenSave, key: TileKey, tile: TileContent | undefined): GardenSave`, `isMovable(tile: TileContent | undefined): boolean`
  - `LEAF_SLOT_MS = 3 * HOUR`, `MAX_LEAVES = 4`

- [ ] **Step 1: Écrire le test**

`src/garden/core/field.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { bump } from "./counters";
import { LEAF_SLOT_MS } from "./leaves";
import { FIELD, fieldTiles, isInField } from "./plots";
import { parseSave } from "./save";
import { CUT_SPECIES, harvestTool } from "./species";
import { createStarterSave } from "./starter";
import { isMovable, setTile } from "./tiles";

describe("FIELD", () => {
  it("couvre 9 x 5 cases, ligne par ligne", () => {
    expect(FIELD).toEqual({ x: 0, y: 0, w: 9, h: 5 });
    const tiles = fieldTiles();
    expect(tiles).toHaveLength(45);
    expect(tiles.slice(0, 2)).toEqual(["0,0", "1,0"]);
    expect(tiles[44]).toBe("8,4");
  });

  it("isInField borne la grille", () => {
    expect(isInField("0,0")).toBe(true);
    expect(isInField("8,4")).toBe(true);
    expect(isInField("9,0")).toBe(false);
    expect(isInField("0,5")).toBe(false);
    expect(isInField("-1,2")).toBe(false);
  });

  it("le décor de départ est dans la grille", () => {
    for (const key of Object.keys(createStarterSave().tiles))
      expect(isInField(key as `${number},${number}`)).toBe(true);
  });
});

describe("harvestTool", () => {
  it("sécateur pour les tiges épaisses, main pour les autres", () => {
    expect([...CUT_SPECIES].sort()).toEqual([
      "chrysantheme",
      "dahlia",
      "rosetremiere",
      "tournesol",
    ]);
    expect(harvestTool("dahlia")).toBe("secateur");
    expect(harvestTool("cosmos")).toBe("main");
  });
});

describe("bump", () => {
  it("incrémente sans modifier l'original", () => {
    const s = createStarterSave();
    const a = bump(s, "dug");
    const b = bump(a, "dug");
    expect(b.progress.counters.dug).toBe(2);
    expect(s.progress.counters.dug).toBeUndefined();
  });
});

describe("tiles", () => {
  it("setTile pose et retire sans modifier l'original", () => {
    const s = createStarterSave();
    const a = setTile(s, "2,2", { kind: "hole", dugAt: 1 });
    expect(a.tiles["2,2"]).toEqual({ kind: "hole", dugAt: 1 });
    expect(s.tiles["2,2"]).toBeUndefined();
    const b = setTile(a, "2,2", undefined);
    expect("2,2" in b.tiles).toBe(false);
  });

  it("seuls plantes et décor se déplacent", () => {
    expect(isMovable({ kind: "decor", id: "paille" })).toBe(true);
    expect(
      isMovable({
        kind: "plant",
        seed: { species: "aster", color: "violet", rarity: "commune" },
        sownAt: 0,
        watered: [],
      }),
    ).toBe(true);
    expect(isMovable({ kind: "hole", dugAt: 0 })).toBe(false);
    expect(isMovable({ kind: "leaves", since: 0 })).toBe(false);
    expect(isMovable(undefined)).toBe(false);
  });
});

describe("leaves dans la sauvegarde", () => {
  it("la sauvegarde de départ démarre au créneau en cours", () => {
    const { checkedAt } = createStarterSave().leaves;
    expect(checkedAt % LEAF_SLOT_MS).toBe(0);
    expect(Date.now() - checkedAt).toBeLessThan(LEAF_SLOT_MS);
  });

  it("parseSave complète leaves s'il manque", () => {
    const raw = JSON.parse(JSON.stringify(createStarterSave()));
    delete raw.leaves;
    expect(parseSave(raw)!.leaves).toEqual({ checkedAt: 0 });
  });

  it("parseSave garde leaves s'il est valide", () => {
    const s = createStarterSave();
    expect(parseSave(JSON.parse(JSON.stringify(s)))!.leaves).toEqual(s.leaves);
  });
});
```

- [ ] **Step 2: Lancer le test, vérifier l'échec**

Run: `bun run test src/garden/core/field.test.ts`
Expected: FAIL (modules `counters`, `leaves`, `species`, `tiles` introuvables).

- [ ] **Step 3: Implémenter**

`src/garden/core/types.ts`, dans `GardenSave`, après `atelier` :

```ts
  atelier: { brew: { recipe: string; startedAt: number } | null };
  leaves: { checkedAt: number };
}
```

`src/garden/core/leaves.ts` (le reste arrive en Task 3) :

```ts
import { HOUR } from "./time";

export const LEAF_SLOT_MS = 3 * HOUR;
export const MAX_LEAVES = 4;
```

`src/garden/core/starter.ts` : ajouter l'import et le champ.

```ts
import { LEAF_SLOT_MS } from "./leaves";
import type { GardenSave } from "./types";

export function createStarterSave(): GardenSave {
  return {
    // ... champs existants inchangés ...
    atelier: { brew: null },
    leaves: { checkedAt: Math.floor(Date.now() / LEAF_SLOT_MS) * LEAF_SLOT_MS },
  };
}
```

`src/garden/core/save.ts`, remplacer la dernière ligne de `parseSave` :

```ts
  if (!isObject(atelier)) return null;
  const leaves =
    isObject(raw.leaves) && typeof raw.leaves.checkedAt === "number"
      ? { checkedAt: raw.leaves.checkedAt }
      : { checkedAt: 0 };
  return { ...(raw as unknown as GardenSave), leaves };
}
```

`src/garden/core/plots.ts`, ajouter à la fin (et `parseTileKey` à l'import depuis `./types`) :

```ts
export const FIELD = { x: 0, y: 0, w: 9, h: 5 } as const;

export function fieldTiles(): TileKey[] {
  const out: TileKey[] = [];
  for (let y = FIELD.y; y < FIELD.y + FIELD.h; y++)
    for (let x = FIELD.x; x < FIELD.x + FIELD.w; x++) out.push(tileKey(x, y));
  return out;
}

export function isInField(key: TileKey): boolean {
  const [x, y] = parseTileKey(key);
  return x >= FIELD.x && x < FIELD.x + FIELD.w && y >= FIELD.y && y < FIELD.y + FIELD.h;
}
```

`src/garden/core/species.ts` :

```ts
import type { SpeciesId } from "./types";

// Remplacé par le catalogue des espèces au sous-projet 3.
export const CUT_SPECIES: ReadonlySet<SpeciesId> = new Set([
  "tournesol",
  "rosetremiere",
  "dahlia",
  "chrysantheme",
]);

export type HarvestTool = "main" | "secateur";

export const harvestTool = (species: SpeciesId): HarvestTool =>
  CUT_SPECIES.has(species) ? "secateur" : "main";
```

`src/garden/core/counters.ts` :

```ts
import type { GardenSave } from "./types";

export type CounterId = "dug" | "sown" | "watered" | "picked" | "raked" | "crowsChased";

export function bump(save: GardenSave, id: CounterId): GardenSave {
  const counters = save.progress.counters;
  return {
    ...save,
    progress: { ...save.progress, counters: { ...counters, [id]: (counters[id] ?? 0) + 1 } },
  };
}
```

`src/garden/core/tiles.ts` :

```ts
import type { GardenSave, TileContent, TileKey } from "./types";

export function setTile(save: GardenSave, key: TileKey, tile: TileContent | undefined): GardenSave {
  const tiles = { ...save.tiles };
  if (tile) tiles[key] = tile;
  else delete tiles[key];
  return { ...save, tiles };
}

export const isMovable = (tile: TileContent | undefined): boolean =>
  tile?.kind === "plant" || tile?.kind === "decor";
```

- [ ] **Step 4: Lancer les tests et les types**

Run: `bun run test src/garden && bunx tsc --noEmit`
Expected: PASS. Si `tsc` signale un littéral `GardenSave` incomplet ailleurs, ajouter `leaves: { checkedAt: 0 }`.

- [ ] **Step 5: Commit**

```bash
git add src/garden/core
git commit -m "feat(potager): grille jouable, compteurs et tas de feuilles dans la sauvegarde"
```

---

### Task 2: Libellés français

**Files:**

- Create: `src/garden/core/labels.ts`
- Test: `src/garden/core/labels.test.ts`

**Interfaces:**

- Produces:
  - `SPECIES_FR: Record<SpeciesId, string>`, `RARITY_FR: Record<Rarity, string>`, `STAGE_FR: Record<Stage, string>`, `DECOR_FR: Record<DecorId, string>`
  - `flowerName(f: { species: SpeciesId; color: ColorId }): string` (accord du genre)
  - `pickedWord(species: SpeciesId): string` ("cueilli" ou "cueillie")
  - `formatDuration(ms: number): string` ("45 min", "3 h", "1 h 05")

- [ ] **Step 1: Écrire le test**

`src/garden/core/labels.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { flowerName, formatDuration, pickedWord, RARITY_FR, STAGE_FR } from "./labels";
import { HOUR } from "./time";

describe("flowerName", () => {
  it("accorde la couleur au genre de l'espèce", () => {
    expect(flowerName({ species: "cosmos", color: "white" })).toBe("Cosmos blanc");
    expect(flowerName({ species: "rosetremiere", color: "white" })).toBe("Rose trémière blanche");
    expect(flowerName({ species: "bruyere", color: "violet" })).toBe("Bruyère violette");
    expect(flowerName({ species: "dahlia", color: "heather" })).toBe("Dahlia pourpre");
  });

  it("pickedWord suit le genre", () => {
    expect(pickedWord("cosmos")).toBe("cueilli");
    expect(pickedWord("bruyere")).toBe("cueillie");
  });
});

describe("formatDuration", () => {
  it("minutes, heures pleines, heures et minutes", () => {
    expect(formatDuration(0)).toBe("1 min");
    expect(formatDuration(20 * 60_000)).toBe("20 min");
    expect(formatDuration(3 * HOUR)).toBe("3 h");
    expect(formatDuration(HOUR + 5 * 60_000)).toBe("1 h 05");
    expect(formatDuration(HOUR + 20 * 60_000 + 1)).toBe("1 h 21");
  });
});

describe("tables", () => {
  it("raretés et étapes accentuées", () => {
    expect(RARITY_FR.epique).toBe("Épique");
    expect(RARITY_FR.legendaire).toBe("Légendaire");
    expect(STAGE_FR[2]).toBe("Jeune plant");
    expect(STAGE_FR[4]).toBe("En fleur");
  });
});
```

- [ ] **Step 2: Lancer le test, vérifier l'échec**

Run: `bun run test src/garden/core/labels.test.ts`
Expected: FAIL (module introuvable).

- [ ] **Step 3: Implémenter**

`src/garden/core/labels.ts` :

```ts
import type { ColorId, DecorId, Rarity, SpeciesId, Stage } from "./types";

export const SPECIES_FR: Record<SpeciesId, string> = {
  tournesol: "Tournesol",
  rosetremiere: "Rose trémière",
  dahlia: "Dahlia",
  cosmos: "Cosmos",
  aster: "Aster",
  chrysantheme: "Chrysanthème",
  bruyere: "Bruyère",
  colchique: "Colchique",
};

const FEMININE: ReadonlySet<SpeciesId> = new Set(["rosetremiere", "bruyere"]);

// [masculin, féminin]
const COLOR_FR: Record<ColorId, [string, string]> = {
  yellow: ["jaune", "jaune"],
  pink: ["rose", "rose"],
  white: ["blanc", "blanche"],
  violet: ["violet", "violette"],
  red: ["rouge", "rouge"],
  orange: ["orange", "orange"],
  bronze: ["bronze", "bronze"],
  heather: ["pourpre", "pourpre"],
  lilac: ["lilas", "lilas"],
};

export const RARITY_FR: Record<Rarity, string> = {
  commune: "Commune",
  rare: "Rare",
  epique: "Épique",
  legendaire: "Légendaire",
};

export const STAGE_FR: Record<Stage, string> = {
  0: "Graine",
  1: "Pousse",
  2: "Jeune plant",
  3: "Bouton",
  4: "En fleur",
};

export const DECOR_FR: Record<DecorId, string> = {
  lanterne: "Lanterne",
  citrouille: "Citrouille",
  paille: "Botte de paille",
};

export function flowerName(f: { species: SpeciesId; color: ColorId }): string {
  const [m, fem] = COLOR_FR[f.color];
  return `${SPECIES_FR[f.species]} ${FEMININE.has(f.species) ? fem : m}`;
}

export const pickedWord = (species: SpeciesId): string =>
  FEMININE.has(species) ? "cueillie" : "cueilli";

export function formatDuration(ms: number): string {
  const min = Math.max(1, Math.ceil(ms / 60_000));
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${String(m).padStart(2, "0")}` : `${h} h`;
}
```

- [ ] **Step 4: Lancer le test, vérifier le succès**

Run: `bun run test src/garden/core/labels.test.ts src/lib/accents.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/garden/core/labels.ts src/garden/core/labels.test.ts
git commit -m "feat(potager): libellés français des fleurs, étapes et durées"
```

---

### Task 3: Tas de feuilles déterministes

**Files:**

- Modify: `src/garden/core/leaves.ts`
- Test: `src/garden/core/leaves.test.ts`

**Interfaces:**

- Consumes: `LEAF_SLOT_MS`, `MAX_LEAVES` (Task 1), `fieldTiles` (Task 1), `hash` (`core/hash.ts`).
- Produces: `spawnLeaves(save: GardenSave, now: number): GardenSave`. Renvoie **la même référence** si aucun créneau n'est à traiter (idempotent).

- [ ] **Step 1: Écrire le test**

`src/garden/core/leaves.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { LEAF_SLOT_MS, MAX_LEAVES, spawnLeaves } from "./leaves";
import { fieldTiles } from "./plots";
import { createStarterSave } from "./starter";
import { DAY, HOUR } from "./time";
import type { GardenSave, TileContent } from "./types";

const SLOT0 = 10_000 * LEAF_SLOT_MS;

function save(
  checkedAt = SLOT0,
  tiles: GardenSave["tiles"] = createStarterSave().tiles,
): GardenSave {
  return { ...createStarterSave(), tiles, leaves: { checkedAt } };
}

const leavesOf = (s: GardenSave) => Object.entries(s.tiles).filter(([, t]) => t?.kind === "leaves");

describe("spawnLeaves", () => {
  it("ne change rien dans le créneau déjà traité", () => {
    const s = save();
    expect(spawnLeaves(s, SLOT0 + HOUR)).toBe(s);
  });

  it("pose un tas au créneau suivant, sur une case libre de la grille", () => {
    const s = save();
    const next = spawnLeaves(s, SLOT0 + LEAF_SLOT_MS + HOUR);
    const found = leavesOf(next);
    expect(found).toHaveLength(1);
    const [key, tile] = found[0];
    expect(fieldTiles()).toContain(key);
    expect(s.tiles[key as keyof GardenSave["tiles"]]).toBeUndefined();
    expect(tile).toEqual({ kind: "leaves", since: SLOT0 + LEAF_SLOT_MS });
    expect(next.leaves.checkedAt).toBe(SLOT0 + LEAF_SLOT_MS);
  });

  it("est idempotent", () => {
    const now = SLOT0 + 2 * LEAF_SLOT_MS;
    const once = spawnLeaves(save(), now);
    expect(spawnLeaves(once, now)).toBe(once);
  });

  it("donne le même résultat pour la même sauvegarde", () => {
    const now = SLOT0 + 2 * LEAF_SLOT_MS;
    expect(spawnLeaves(save(), now)).toEqual(spawnLeaves(save(), now));
  });

  it("plafonne à 4 tas après une semaine d'absence", () => {
    const next = spawnLeaves(save(), SLOT0 + 7 * DAY);
    expect(leavesOf(next)).toHaveLength(MAX_LEAVES);
    expect(next.leaves.checkedAt).toBe(SLOT0 + 56 * LEAF_SLOT_MS);
  });

  it("n'ajoute rien quand 4 tas sont déjà là, mais avance le créneau", () => {
    const tiles: GardenSave["tiles"] = {};
    for (const key of ["0,0", "1,0", "2,0", "3,0"] as const)
      tiles[key] = { kind: "leaves", since: 0 };
    const next = spawnLeaves(save(SLOT0, tiles), SLOT0 + LEAF_SLOT_MS);
    expect(leavesOf(next)).toHaveLength(4);
    expect(next.leaves.checkedAt).toBe(SLOT0 + LEAF_SLOT_MS);
  });

  it("choisit la seule case libre", () => {
    const tiles: GardenSave["tiles"] = {};
    const full: TileContent = { kind: "decor", id: "paille" };
    for (const key of fieldTiles()) tiles[key] = full;
    delete tiles["5,3"];
    const next = spawnLeaves(save(SLOT0, tiles), SLOT0 + LEAF_SLOT_MS);
    expect(next.tiles["5,3"]).toEqual({ kind: "leaves", since: SLOT0 + LEAF_SLOT_MS });
  });

  it("une sauvegarde sans date examine au plus 4 créneaux", () => {
    const next = spawnLeaves(save(0), SLOT0);
    expect(leavesOf(next)).toHaveLength(MAX_LEAVES);
    expect(next.leaves.checkedAt).toBe(SLOT0);
  });
});
```

- [ ] **Step 2: Lancer le test, vérifier l'échec**

Run: `bun run test src/garden/core/leaves.test.ts`
Expected: FAIL (`spawnLeaves` n'existe pas).

- [ ] **Step 3: Implémenter**

`src/garden/core/leaves.ts` complet :

```ts
import { hash } from "./hash";
import { fieldTiles } from "./plots";
import { HOUR } from "./time";
import type { GardenSave } from "./types";

export const LEAF_SLOT_MS = 3 * HOUR;
export const MAX_LEAVES = 4;

// Un créneau toutes les 3 h ; chaque créneau écoulé pose un tas sur une case libre
// choisie par hachage, donc identique dans les deux fenêtres.
export function spawnLeaves(save: GardenSave, now: number): GardenSave {
  const current = Math.floor(now / LEAF_SLOT_MS);
  const first = Math.max(
    Math.floor(save.leaves.checkedAt / LEAF_SLOT_MS) + 1,
    current - MAX_LEAVES + 1,
  );
  if (first > current) return save;

  const tiles = { ...save.tiles };
  let count = Object.values(tiles).filter((t) => t?.kind === "leaves").length;
  for (let slot = first; slot <= current && count < MAX_LEAVES; slot++) {
    const free = fieldTiles().filter((key) => !tiles[key]);
    if (!free.length) break;
    tiles[free[Math.floor(hash(slot, 17) * free.length)]] = {
      kind: "leaves",
      since: slot * LEAF_SLOT_MS,
    };
    count++;
  }
  return { ...save, tiles, leaves: { checkedAt: current * LEAF_SLOT_MS } };
}
```

- [ ] **Step 4: Lancer le test, vérifier le succès**

Run: `bun run test src/garden/core/leaves.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/garden/core/leaves.ts src/garden/core/leaves.test.ts
git commit -m "feat(potager): tas de feuilles déterministes toutes les 3 h"
```

---

### Task 4: Découvertes à l'éclosion

**Files:**

- Create: `src/garden/core/discovery.ts`
- Test: `src/garden/core/discovery.test.ts`

**Interfaces:**

- Consumes: `growthOf` (`core/growth.ts`), `RainSource`, `rainIntervals` (`core/weather.ts`).
- Produces:
  - `entryId(species: SpeciesId, color: ColorId): string` (`"cosmos:pink"`)
  - `collectDiscoveries(save: GardenSave, now: number, rain?: RainSource): { save: GardenSave; found: Flower[] }`. Même référence de sauvegarde si rien ne change.

- [ ] **Step 1: Écrire le test**

`src/garden/core/discovery.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { collectDiscoveries, entryId } from "./discovery";
import { createStarterSave } from "./starter";
import { HOUR } from "./time";
import type { GardenSave, Interval, PlantTile, Seed } from "./types";

const noRain = (): Interval[] => [];
const NOW = new Date(2026, 9, 1, 12).getTime();

const plant = (seed: Seed, age: number): PlantTile => ({
  kind: "plant",
  seed,
  sownAt: NOW - age,
  watered: [],
});

const cosmos: Seed = { species: "cosmos", color: "pink", rarity: "commune" };
const aster: Seed = { species: "aster", color: "violet", rarity: "rare" };

function withTiles(tiles: GardenSave["tiles"], herbier: GardenSave["herbier"] = {}): GardenSave {
  return { ...createStarterSave(), tiles, herbier };
}

describe("collectDiscoveries", () => {
  it("inscrit les plantes écloses absentes de l'Herbier", () => {
    const s = withTiles({
      "1,1": plant(cosmos, 9 * HOUR),
      "2,1": plant(aster, 13 * HOUR),
      "3,1": plant({ ...cosmos, color: "white" }, 1 * HOUR),
    });
    const { save, found } = collectDiscoveries(s, NOW, noRain);
    expect(found).toEqual([cosmos, aster]);
    expect(save.herbier[entryId("cosmos", "pink")]).toEqual({
      discoveredAt: NOW,
      pressed: 0,
      variants: [],
    });
    expect(save.herbier["cosmos:white"]).toBeUndefined();
    expect(s.herbier).toEqual({});
  });

  it("ne compte qu'une fois deux plantes identiques", () => {
    const s = withTiles({ "1,1": plant(cosmos, 9 * HOUR), "2,1": plant(cosmos, 9 * HOUR) });
    expect(collectDiscoveries(s, NOW, noRain).found).toHaveLength(1);
  });

  it("renvoie la même sauvegarde quand tout est déjà connu", () => {
    const s = withTiles(
      { "1,1": plant(cosmos, 9 * HOUR) },
      { "cosmos:pink": { discoveredAt: 1, pressed: 0, variants: [] } },
    );
    const out = collectDiscoveries(s, NOW, noRain);
    expect(out.save).toBe(s);
    expect(out.found).toEqual([]);
  });

  it("ajoute une variante à une entrée existante sans nouvelle découverte", () => {
    const s = withTiles(
      { "1,1": plant({ ...cosmos, variant: "doree" }, 9 * HOUR) },
      { "cosmos:pink": { discoveredAt: 1, pressed: 2, variants: [] } },
    );
    const out = collectDiscoveries(s, NOW, noRain);
    expect(out.found).toEqual([]);
    expect(out.save.herbier["cosmos:pink"]).toEqual({
      discoveredAt: 1,
      pressed: 2,
      variants: ["doree"],
    });
  });

  it("une nouvelle entrée avec variante la note directement", () => {
    const s = withTiles({ "1,1": plant({ ...cosmos, variant: "givree" }, 9 * HOUR) });
    const out = collectDiscoveries(s, NOW, noRain);
    expect(out.found).toEqual([{ ...cosmos, variant: "givree" }]);
    expect(out.save.herbier["cosmos:pink"].variants).toEqual(["givree"]);
  });
});
```

- [ ] **Step 2: Lancer le test, vérifier l'échec**

Run: `bun run test src/garden/core/discovery.test.ts`
Expected: FAIL (module introuvable).

- [ ] **Step 3: Implémenter**

`src/garden/core/discovery.ts` :

```ts
import { growthOf } from "./growth";
import type { ColorId, Flower, GardenSave, SpeciesId } from "./types";
import { rainIntervals, type RainSource } from "./weather";

export const entryId = (species: SpeciesId, color: ColorId): string => `${species}:${color}`;

export function collectDiscoveries(
  save: GardenSave,
  now: number,
  rain: RainSource = rainIntervals,
): { save: GardenSave; found: Flower[] } {
  const found: Flower[] = [];
  let herbier = save.herbier;
  for (const tile of Object.values(save.tiles)) {
    if (tile?.kind !== "plant" || growthOf(tile, now, rain).stage < 4) continue;
    const { species, color, rarity, variant } = tile.seed;
    const id = entryId(species, color);
    const prev = herbier[id];
    if (prev && (!variant || prev.variants.includes(variant))) continue;
    if (herbier === save.herbier) herbier = { ...herbier };
    if (prev) {
      herbier[id] = { ...prev, variants: [...prev.variants, variant!] };
    } else {
      herbier[id] = { discoveredAt: now, pressed: 0, variants: variant ? [variant] : [] };
      found.push({ species, color, rarity, ...(variant && { variant }) });
    }
  }
  return herbier === save.herbier ? { save, found } : { save: { ...save, herbier }, found };
}
```

- [ ] **Step 4: Lancer le test, vérifier le succès**

Run: `bun run test src/garden/core/discovery.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/garden/core/discovery.ts src/garden/core/discovery.test.ts
git commit -m "feat(potager): inscription des éclosions dans l'Herbier"
```

---

### Task 5: Graine de cueillette

**Files:**

- Create: `src/garden/core/rolls.ts`
- Test: `src/garden/core/rolls.test.ts`

**Interfaces:**

- Produces:
  - `type Rng = () => number` (valeur dans [0, 1))
  - `pickSeedChance(beautiful: boolean): number` (0.3 ou 0.45)
  - `rollPickSeed(flower: Flower, beautiful: boolean, rng: Rng): Seed | null` (espèce, couleur, rareté de la fleur ; pas de variante)

- [ ] **Step 1: Écrire le test**

`src/garden/core/rolls.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { pickSeedChance, rollPickSeed } from "./rolls";
import type { Flower } from "./types";

const flower: Flower = { species: "dahlia", color: "red", rarity: "rare", variant: "doree" };

describe("rollPickSeed", () => {
  it("30 % sans belle plante, 45 % avec", () => {
    expect(pickSeedChance(false)).toBe(0.3);
    expect(pickSeedChance(true)).toBe(0.45);
    expect(rollPickSeed(flower, false, () => 0.29)).not.toBeNull();
    expect(rollPickSeed(flower, false, () => 0.3)).toBeNull();
    expect(rollPickSeed(flower, true, () => 0.44)).not.toBeNull();
    expect(rollPickSeed(flower, true, () => 0.45)).toBeNull();
  });

  it("la graine reprend espèce, couleur et rareté, sans variante", () => {
    expect(rollPickSeed(flower, false, () => 0)).toEqual({
      species: "dahlia",
      color: "red",
      rarity: "rare",
    });
  });
});
```

- [ ] **Step 2: Lancer le test, vérifier l'échec**

Run: `bun run test src/garden/core/rolls.test.ts`
Expected: FAIL (module introuvable).

- [ ] **Step 3: Implémenter**

`src/garden/core/rolls.ts` :

```ts
import type { Flower, Seed } from "./types";

export type Rng = () => number;

export const pickSeedChance = (beautiful: boolean): number => (beautiful ? 0.45 : 0.3);

// Provisoire : le tirage complet des graines arrive avec les sachets (sous-projet 4).
export function rollPickSeed(flower: Flower, beautiful: boolean, rng: Rng): Seed | null {
  if (rng() >= pickSeedChance(beautiful)) return null;
  return { species: flower.species, color: flower.color, rarity: flower.rarity };
}
```

- [ ] **Step 4: Lancer le test, vérifier le succès**

Run: `bun run test src/garden/core/rolls.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/garden/core/rolls.ts src/garden/core/rolls.test.ts
git commit -m "feat(potager): chance de graine à la cueillette"
```

---

### Task 6: Description de la case visée

**Files:**

- Create: `src/garden/core/target.ts`
- Test: `src/garden/core/target.test.ts`

**Interfaces:**

- Consumes: `growthOf`, `wetIntervals`, `GROWTH_MS`, `WET_BONUS` (`core/growth.ts`) ; `isSoil` (`core/plots.ts`) ; `harvestTool` (Task 1) ; `DECOR_FR`, `RARITY_FR`, `STAGE_FR`, `flowerName`, `formatDuration` (Task 2).
- Produces:
  - `type TileKind = "grass" | "soil" | "hole" | "plant" | "decor" | "leaves" | "crow"`
  - `interface TileInfo { kind: TileKind; title: string; lines: string[]; progress?: number }`
  - `describeTile(save: GardenSave, key: TileKey, now: number, rain?: RainSource): TileInfo`
  - `describeCrow(): TileInfo`

- [ ] **Step 1: Écrire le test**

`src/garden/core/target.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { createStarterSave } from "./starter";
import { describeCrow, describeTile } from "./target";
import { HOUR } from "./time";
import type { GardenSave, Interval, PlantTile } from "./types";

const noRain = (): Interval[] => [];
const NOW = new Date(2026, 9, 1, 12).getTime();

const aster = (age: number, watered: Interval[] = []): PlantTile => ({
  kind: "plant",
  seed: { species: "aster", color: "violet", rarity: "commune" },
  sownAt: NOW - age,
  watered,
});

function withTiles(tiles: GardenSave["tiles"]): GardenSave {
  return { ...createStarterSave(), tiles };
}

const describe1 = (s: GardenSave, key: `${number},${number}`) => describeTile(s, key, NOW, noRain);

describe("describeTile", () => {
  it("herbe et terre libre", () => {
    const s = withTiles({});
    expect(describe1(s, "0,0")).toEqual({ kind: "grass", title: "Herbe", lines: [] });
    expect(describe1(s, "1,1")).toEqual({
      kind: "soil",
      title: "Terre",
      lines: ["Libre : creuse un trou pour semer"],
    });
  });

  it("trou, avec ou sans graines", () => {
    const s = withTiles({ "1,1": { kind: "hole", dugAt: NOW } });
    expect(describe1(s, "1,1").lines).toEqual(["Prêt à recevoir une graine"]);
    const empty = { ...s, inventory: { ...s.inventory, seeds: [] } };
    expect(describe1(empty, "1,1").lines).toEqual(["Plus de graines"]);
  });

  it("tas de feuilles et décor", () => {
    const s = withTiles({
      "0,0": { kind: "leaves", since: 0 },
      "0,1": { kind: "decor", id: "paille" },
    });
    expect(describe1(s, "0,0")).toMatchObject({ kind: "leaves", title: "Tas de feuilles" });
    expect(describe1(s, "0,1")).toMatchObject({ kind: "decor", title: "Botte de paille" });
  });

  it("graine sèche : temps restant, terre sèche, espèce cachée", () => {
    const info = describe1(withTiles({ "1,1": aster(1 * HOUR) }), "1,1");
    expect(info).toEqual({
      kind: "plant",
      title: "Graine",
      progress: 0.5,
      lines: [
        "Prochaine étape dans ~1 h",
        "Terre sèche : arrose pour pousser plus vite",
        "Espèce et couleur inconnues",
      ],
    });
  });

  it("plante mouillée : temps restant accéléré et durée d'humidité", () => {
    const p = aster(1 * HOUR, [{ start: NOW - HOUR, end: NOW + 5 * HOUR }]);
    const info = describe1(withTiles({ "1,1": p }), "1,1");
    expect(info.progress).toBe(0.75);
    expect(info.lines.slice(0, 2)).toEqual(["Prochaine étape dans ~20 min", "Mouillée encore 5 h"]);
  });

  it("l'humidité qui s'arrête avant l'étape rallonge le temps restant", () => {
    // 45 min efficaces faites, reste 75 : 20 min mouillées en donnent 30, puis 45 min au sec
    const p = aster(30 * 60_000, [{ start: NOW - HOUR, end: NOW + 20 * 60_000 }]);
    const info = describe1(withTiles({ "1,1": p }), "1,1");
    expect(info.lines[0]).toBe("Prochaine étape dans ~1 h 05");
  });

  it("pas de ligne d'espèce après la graine", () => {
    const info = describe1(withTiles({ "1,1": aster(3 * HOUR) }), "1,1");
    expect(info.title).toBe("Pousse");
    expect(info.lines).toHaveLength(2);
  });

  it("fleur éclose : nom, rareté et outil de cueillette", () => {
    const s = withTiles({
      "1,1": aster(9 * HOUR),
      "2,1": {
        kind: "plant",
        seed: { species: "dahlia", color: "red", rarity: "epique" },
        sownAt: NOW - 20 * HOUR,
        watered: [],
      },
    });
    expect(describe1(s, "1,1")).toEqual({
      kind: "plant",
      title: "Aster violet",
      lines: ["Commune - tige fine : à la main"],
    });
    expect(describe1(s, "2,1").lines).toEqual(["Épique - tige épaisse : sécateur"]);
  });
});

describe("describeCrow", () => {
  it("décrit le corbeau", () => {
    expect(describeCrow()).toEqual({
      kind: "crow",
      title: "Corbeau",
      lines: ["Il picore tranquillement."],
    });
  });
});
```

- [ ] **Step 2: Lancer le test, vérifier l'échec**

Run: `bun run test src/garden/core/target.test.ts`
Expected: FAIL (module introuvable).

- [ ] **Step 3: Implémenter**

`src/garden/core/target.ts` :

```ts
import { GROWTH_MS, growthOf, WET_BONUS, wetIntervals } from "./growth";
import { DECOR_FR, flowerName, formatDuration, RARITY_FR, STAGE_FR } from "./labels";
import { isSoil } from "./plots";
import { harvestTool } from "./species";
import type { GardenSave, PlantTile, TileKey } from "./types";
import { rainIntervals, type RainSource } from "./weather";

export type TileKind = "grass" | "soil" | "hole" | "plant" | "decor" | "leaves" | "crow";

export interface TileInfo {
  kind: TileKind;
  title: string;
  lines: string[];
  progress?: number;
}

const RATE = 1 + WET_BONUS;

export function describeTile(
  save: GardenSave,
  key: TileKey,
  now: number,
  rain: RainSource = rainIntervals,
): TileInfo {
  const tile = save.tiles[key];
  if (!tile)
    return isSoil(save.plots, key)
      ? { kind: "soil", title: "Terre", lines: ["Libre : creuse un trou pour semer"] }
      : { kind: "grass", title: "Herbe", lines: [] };
  switch (tile.kind) {
    case "hole":
      return {
        kind: "hole",
        title: "Trou",
        lines: [save.inventory.seeds.length ? "Prêt à recevoir une graine" : "Plus de graines"],
      };
    case "leaves":
      return {
        kind: "leaves",
        title: "Tas de feuilles",
        lines: ["Un coup de râteau et c'est propre."],
      };
    case "decor":
      return { kind: "decor", title: DECOR_FR[tile.id], lines: ["Décor"] };
    case "plant":
      return describePlant(tile, now, rain);
  }
}

export const describeCrow = (): TileInfo => ({
  kind: "crow",
  title: "Corbeau",
  lines: ["Il picore tranquillement."],
});

function describePlant(plant: PlantTile, now: number, rain: RainSource): TileInfo {
  const g = growthOf(plant, now, rain);
  const { species, rarity } = plant.seed;
  if (g.stage === 4) {
    const how =
      harvestTool(species) === "secateur" ? "tige épaisse : sécateur" : "tige fine : à la main";
    return {
      kind: "plant",
      title: flowerName(plant.seed),
      lines: [`${RARITY_FR[rarity]} - ${how}`],
    };
  }

  const remaining = (1 - g.stageProgress) * (GROWTH_MS[rarity] / 4);
  const wetEnd = wetIntervals(plant, now, rain).find((i) => now >= i.start && now < i.end)?.end;
  const wetLeft = wetEnd ? wetEnd - now : 0;
  const real =
    remaining <= wetLeft * RATE ? remaining / RATE : wetLeft + (remaining - wetLeft * RATE);

  const lines = [
    `Prochaine étape dans ~${formatDuration(real)}`,
    wetEnd
      ? `Mouillée encore ${formatDuration(wetLeft)}`
      : "Terre sèche : arrose pour pousser plus vite",
  ];
  if (g.stage === 0) lines.push("Espèce et couleur inconnues");
  return { kind: "plant", title: STAGE_FR[g.stage], lines, progress: g.stageProgress };
}
```

- [ ] **Step 4: Lancer le test, vérifier le succès**

Run: `bun run test src/garden/core/target.test.ts`
Expected: PASS. Si un arrondi flottant fait échouer `progress` (0.75), comparer avec `toBeCloseTo` dans le test.

- [ ] **Step 5: Commit**

```bash
git add src/garden/core/target.ts src/garden/core/target.test.ts
git commit -m "feat(potager): description de la case visée pour l'infobulle"
```

---

### Task 7: Gestes (`planAction`)

**Files:**

- Create: `src/garden/core/actions.ts`
- Test: `src/garden/core/actions.test.ts`

**Interfaces:**

- Consumes: `bump`, `CounterId` (Task 1) ; `setTile` (Task 1) ; `isInField`, `isSoil` (`core/plots.ts`) ; `harvestTool` (Task 1) ; `flowerName`, `pickedWord` (Task 2) ; `rollPickSeed`, `Rng` (Task 5) ; `growthOf`, `WATER_MS` ; `mergeIntervals`.
- Produces:
  - `type Tool = "main" | "creuser" | "semer" | "arroser" | "secateur" | "rateau"`
  - `TOOLS: Tool[]` (dans cet ordre, touches 1 à 6)
  - `type Target = { kind: "tile"; key: TileKey } | { kind: "crow"; id: string }`
  - `type Particle = "dirt" | "water" | "leaves" | "petals" | "feathers"`
  - `type Effect = { kind: "burst"; key: TileKey; particle: Particle } | { kind: "chase"; id: string } | { kind: "toast"; text: string }`
  - `interface Outcome { save: GardenSave; effects: Effect[] }`
  - `type Plan = { ok: true; label: string; apply: () => Outcome } | { ok: false; label: string; reason: string }`
  - `planAction(save, target, tool, now, rng = Math.random, rain = rainIntervals): Plan | null`

- [ ] **Step 1: Écrire le test**

`src/garden/core/actions.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { planAction, type Plan, type Target, type Tool } from "./actions";
import { WATER_MS } from "./growth";
import { createStarterSave } from "./starter";
import { HOUR } from "./time";
import type { GardenSave, Interval, PlantTile, SpeciesId } from "./types";

const noRain = (): Interval[] => [];
const NOW = new Date(2026, 9, 1, 12).getTime();
const tile = (key: `${number},${number}`): Target => ({ kind: "tile", key });

function withTiles(tiles: GardenSave["tiles"]): GardenSave {
  return { ...createStarterSave(), tiles };
}

const flower = (species: SpeciesId, watered: Interval[] = []): PlantTile => ({
  kind: "plant",
  seed: { species, color: "pink", rarity: "commune" },
  sownAt: NOW - 9 * HOUR,
  watered,
});

const young: PlantTile = { ...flower("cosmos"), sownAt: NOW - HOUR };

function plan(s: GardenSave, target: Target, tool: Tool, rng = () => 0.99): Plan | null {
  return planAction(s, target, tool, NOW, rng, noRain);
}

function refused(p: Plan | null) {
  expect(p?.ok).toBe(false);
  return p && !p.ok ? p.reason : "";
}

function run(p: Plan | null) {
  if (!p?.ok) throw new Error("action refusée");
  return p.apply();
}

describe("creuser", () => {
  it("creuse un trou dans la terre libre", () => {
    const out = run(plan(withTiles({}), tile("1,1"), "creuser"));
    expect(out.save.tiles["1,1"]).toEqual({ kind: "hole", dugAt: NOW });
    expect(out.save.progress.counters.dug).toBe(1);
    expect(out.effects).toEqual([{ kind: "burst", key: "1,1", particle: "dirt" }]);
  });

  it("refuse l'herbe et les cases occupées", () => {
    const s = withTiles({ "1,1": { kind: "leaves", since: 0 } });
    expect(refused(plan(s, tile("0,0"), "creuser"))).toBe("seulement dans la terre");
    expect(refused(plan(s, tile("1,1"), "creuser"))).toBe("la case est occupée");
  });
});

describe("semer", () => {
  it("sème la plus ancienne graine dans un trou", () => {
    const s = withTiles({ "1,1": { kind: "hole", dugAt: NOW } });
    const [first, ...rest] = s.inventory.seeds;
    const out = run(plan(s, tile("1,1"), "semer"));
    expect(out.save.tiles["1,1"]).toEqual({ kind: "plant", seed: first, sownAt: NOW, watered: [] });
    expect(out.save.inventory.seeds).toEqual(rest);
    expect(out.save.progress.counters.sown).toBe(1);
  });

  it("explique pourquoi il ne peut pas semer", () => {
    const s = withTiles({ "2,2": { kind: "hole", dugAt: NOW } });
    expect(refused(plan(s, tile("1,1"), "semer"))).toBe("creuse d'abord un trou");
    expect(refused(plan(s, tile("0,0"), "semer"))).toBe("il faut un trou");
    const empty = { ...s, inventory: { ...s.inventory, seeds: [] } };
    expect(refused(plan(empty, tile("2,2"), "semer"))).toBe("plus de graines");
  });
});

describe("arroser", () => {
  it("mouille la plante 6 h", () => {
    const s = withTiles({ "1,1": young });
    const out = run(plan(s, tile("1,1"), "arroser"));
    const p = out.save.tiles["1,1"] as PlantTile;
    expect(p.watered).toEqual([{ start: NOW, end: NOW + WATER_MS }]);
    expect(out.save.progress.counters.watered).toBe(1);
    expect(out.effects).toEqual([{ kind: "burst", key: "1,1", particle: "water" }]);
  });

  it("prolonge un arrosage en cours", () => {
    const s = withTiles({ "1,1": { ...young, watered: [{ start: NOW - HOUR, end: NOW + HOUR }] } });
    const p = run(plan(s, tile("1,1"), "arroser")).save.tiles["1,1"] as PlantTile;
    expect(p.watered).toEqual([{ start: NOW - HOUR, end: NOW + WATER_MS }]);
  });

  it("refuse tout ce qui n'est pas une plante", () => {
    const s = withTiles({ "2,2": { kind: "hole", dugAt: NOW } });
    expect(refused(plan(s, tile("1,1"), "arroser"))).toBe("rien à arroser, sème d'abord");
    expect(refused(plan(s, tile("2,2"), "arroser"))).toBe("rien à arroser, sème d'abord");
  });
});

describe("cueillir", () => {
  it("à la main : la fleur va au panier, la case se libère", () => {
    const s = withTiles({ "1,1": flower("cosmos") });
    const out = run(plan(s, tile("1,1"), "main"));
    expect(out.save.tiles["1,1"]).toBeUndefined();
    expect(out.save.inventory.basket).toEqual([
      { species: "cosmos", color: "pink", rarity: "commune" },
    ]);
    expect(out.save.inventory.seeds).toEqual(s.inventory.seeds);
    expect(out.save.progress.counters.picked).toBe(1);
    expect(out.effects).toEqual([
      { kind: "burst", key: "1,1", particle: "petals" },
      { kind: "toast", text: "Cosmos rose cueilli" },
    ]);
  });

  it("donne parfois une graine de la même fleur", () => {
    const s = withTiles({ "1,1": flower("cosmos") });
    const out = run(plan(s, tile("1,1"), "main", () => 0.1));
    expect(out.save.inventory.seeds.at(-1)).toEqual({
      species: "cosmos",
      color: "pink",
      rarity: "commune",
    });
    expect(out.effects[1]).toEqual({ kind: "toast", text: "Cosmos rose cueilli : +1 graine" });
  });

  it("une belle plante a 45 % de chance", () => {
    const wetAll = [{ start: NOW - 10 * HOUR, end: NOW }];
    const beautiful = withTiles({ "1,1": flower("cosmos", wetAll) });
    const dry = withTiles({ "1,1": flower("cosmos") });
    const rng = () => 0.4;
    expect(run(plan(beautiful, tile("1,1"), "main", rng)).save.inventory.seeds).toHaveLength(4);
    expect(run(plan(dry, tile("1,1"), "main", rng)).save.inventory.seeds).toHaveLength(3);
  });

  it("au sécateur pour les tiges épaisses", () => {
    const s = withTiles({ "1,1": flower("dahlia") });
    const p = plan(s, tile("1,1"), "secateur");
    expect(p).toMatchObject({ ok: true, label: "Couper au sécateur" });
    expect(run(p).save.inventory.basket).toHaveLength(1);
  });

  it("le mauvais outil donne la raison", () => {
    const s = withTiles({ "1,1": flower("dahlia"), "2,1": flower("cosmos") });
    expect(refused(plan(s, tile("1,1"), "main"))).toBe("tige trop épaisse, prends le sécateur");
    expect(refused(plan(s, tile("2,1"), "secateur"))).toBe("tige fragile, cueille-la à la main");
  });

  it("rien à cueillir sur une plante non éclose", () => {
    const s = withTiles({ "1,1": young });
    expect(plan(s, tile("1,1"), "main")).toBeNull();
    expect(refused(plan(s, tile("1,1"), "secateur"))).toBe("rien à couper ici");
  });
});

describe("râteau", () => {
  it("ramasse un tas de feuilles", () => {
    const s = withTiles({ "0,0": { kind: "leaves", since: 0 } });
    const out = run(plan(s, tile("0,0"), "rateau"));
    expect(out.save.tiles["0,0"]).toBeUndefined();
    expect(out.save.progress.counters.raked).toBe(1);
    expect(out.effects).toEqual([{ kind: "burst", key: "0,0", particle: "leaves" }]);
  });

  it("refuse hors des feuilles, et la main renvoie au râteau", () => {
    const s = withTiles({ "0,0": { kind: "leaves", since: 0 } });
    expect(refused(plan(s, tile("1,1"), "rateau"))).toBe("pas de feuilles ici");
    expect(refused(plan(s, tile("0,0"), "main"))).toBe("prends le râteau");
    expect(refused(plan(s, tile("0,0"), "secateur"))).toBe("rien à couper ici");
  });
});

describe("corbeau et limites", () => {
  it.each(["main", "creuser", "semer", "arroser", "secateur", "rateau"] as Tool[])(
    "%s chasse le corbeau",
    (tool) => {
      const out = run(plan(withTiles({}), { kind: "crow", id: "c1" }, tool));
      expect(out.save.progress.counters.crowsChased).toBe(1);
      expect(out.effects).toEqual([{ kind: "chase", id: "c1" }]);
    },
  );

  it("aucune action hors de la grille, ni main sur du décor", () => {
    const s = withTiles({ "0,1": { kind: "decor", id: "lanterne" } });
    expect(plan(s, tile("12,0"), "creuser")).toBeNull();
    expect(plan(s, tile("0,1"), "main")).toBeNull();
    expect(plan(s, tile("0,0"), "main")).toBeNull();
  });

  it("un refus ne touche pas la sauvegarde", () => {
    const s = withTiles({});
    const copy = structuredClone(s);
    plan(s, tile("0,0"), "creuser");
    expect(s).toEqual(copy);
  });
});
```

- [ ] **Step 2: Lancer le test, vérifier l'échec**

Run: `bun run test src/garden/core/actions.test.ts`
Expected: FAIL (module introuvable).

- [ ] **Step 3: Implémenter**

`src/garden/core/actions.ts` :

```ts
import { bump } from "./counters";
import { growthOf, WATER_MS } from "./growth";
import { flowerName, pickedWord } from "./labels";
import { isInField, isSoil } from "./plots";
import { rollPickSeed, type Rng } from "./rolls";
import { harvestTool } from "./species";
import { setTile } from "./tiles";
import { mergeIntervals } from "./time";
import type { Flower, GardenSave, PlantTile, TileKey } from "./types";
import { rainIntervals, type RainSource } from "./weather";

export type Tool = "main" | "creuser" | "semer" | "arroser" | "secateur" | "rateau";
export const TOOLS: Tool[] = ["main", "creuser", "semer", "arroser", "secateur", "rateau"];

export type Target = { kind: "tile"; key: TileKey } | { kind: "crow"; id: string };
export type Particle = "dirt" | "water" | "leaves" | "petals" | "feathers";
export type Effect =
  | { kind: "burst"; key: TileKey; particle: Particle }
  | { kind: "chase"; id: string }
  | { kind: "toast"; text: string };

export interface Outcome {
  save: GardenSave;
  effects: Effect[];
}

export type Plan =
  { ok: true; label: string; apply: () => Outcome } | { ok: false; label: string; reason: string };

const no = (label: string, reason: string): Plan => ({ ok: false, label, reason });
const yes = (label: string, apply: () => Outcome): Plan => ({ ok: true, label, apply });
const burst = (key: TileKey, particle: Particle): Effect => ({ kind: "burst", key, particle });

// Même fonction pour l'infobulle (avant le clic) et pour l'effet (au clic).
export function planAction(
  save: GardenSave,
  target: Target,
  tool: Tool,
  now: number,
  rng: Rng = Math.random,
  rain: RainSource = rainIntervals,
): Plan | null {
  if (target.kind === "crow")
    return yes("Chasser", () => ({
      save: bump(save, "crowsChased"),
      effects: [{ kind: "chase", id: target.id }],
    }));

  const { key } = target;
  if (!isInField(key)) return null;
  const tile = save.tiles[key];
  const soil = isSoil(save.plots, key);

  switch (tool) {
    case "creuser":
      if (!soil) return no("Creuser", "seulement dans la terre");
      if (tile) return no("Creuser", "la case est occupée");
      return yes("Creuser un trou", () => ({
        save: bump(setTile(save, key, { kind: "hole", dugAt: now }), "dug"),
        effects: [burst(key, "dirt")],
      }));

    case "semer": {
      if (tile?.kind !== "hole")
        return no("Semer", soil && !tile ? "creuse d'abord un trou" : "il faut un trou");
      const [seed, ...rest] = save.inventory.seeds;
      if (!seed) return no("Semer", "plus de graines");
      return yes("Semer une graine", () => {
        const next = { ...save, inventory: { ...save.inventory, seeds: rest } };
        const planted = setTile(next, key, { kind: "plant", seed, sownAt: now, watered: [] });
        return { save: bump(planted, "sown"), effects: [burst(key, "dirt")] };
      });
    }

    case "arroser":
      if (tile?.kind !== "plant") return no("Arroser", "rien à arroser, sème d'abord");
      return yes("Arroser", () => {
        const watered = mergeIntervals([...tile.watered, { start: now, end: now + WATER_MS }]);
        return {
          save: bump(setTile(save, key, { ...tile, watered }), "watered"),
          effects: [burst(key, "water")],
        };
      });

    case "rateau":
      if (tile?.kind !== "leaves") return no("Ratisser", "pas de feuilles ici");
      return yes("Ratisser", () => ({
        save: bump(setTile(save, key, undefined), "raked"),
        effects: [burst(key, "leaves")],
      }));

    case "main":
    case "secateur": {
      const cut = tool === "secateur";
      if (tile?.kind === "leaves")
        return cut ? no("Couper", "rien à couper ici") : no("Ramasser", "prends le râteau");
      const g = tile?.kind === "plant" ? growthOf(tile, now, rain) : null;
      if (tile?.kind !== "plant" || !g || g.stage < 4)
        return cut ? no("Couper", "rien à couper ici") : null;
      const needed = harvestTool(tile.seed.species);
      const pick = () => pickFlower(save, key, tile, g.beautiful, rng);
      if (cut)
        return needed === "secateur"
          ? yes("Couper au sécateur", pick)
          : no("Couper", "tige fragile, cueille-la à la main");
      return needed === "main"
        ? yes("Cueillir à la main", pick)
        : no("Cueillir", "tige trop épaisse, prends le sécateur");
    }
  }
}

function pickFlower(
  save: GardenSave,
  key: TileKey,
  plant: PlantTile,
  beautiful: boolean,
  rng: Rng,
): Outcome {
  const { species, color, rarity, variant } = plant.seed;
  const flower: Flower = { species, color, rarity, ...(variant && { variant }) };
  const seed = rollPickSeed(flower, beautiful, rng);
  const cleared = setTile(save, key, undefined);
  const next: GardenSave = {
    ...cleared,
    inventory: {
      ...cleared.inventory,
      basket: [...cleared.inventory.basket, flower],
      seeds: seed ? [...cleared.inventory.seeds, seed] : cleared.inventory.seeds,
    },
  };
  const text = `${flowerName(flower)} ${pickedWord(species)}${seed ? " : +1 graine" : ""}`;
  return {
    save: bump(next, "picked"),
    effects: [burst(key, "petals"), { kind: "toast", text }],
  };
}
```

- [ ] **Step 4: Lancer le test, vérifier le succès**

Run: `bun run test src/garden/core/actions.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/garden/core/actions.ts src/garden/core/actions.test.ts
git commit -m "feat(potager): gestes du champ et raisons des refus"
```

---

### Task 8: Déplacement (`planMove`)

**Files:**

- Create: `src/garden/core/move.ts`
- Test: `src/garden/core/move.test.ts`

**Interfaces:**

- Consumes: `setTile`, `isMovable` (Task 1) ; `isInField`, `isSoil`.
- Produces: `type MoveResult = { ok: true; save: GardenSave } | { ok: false; reason: string }` ; `planMove(save: GardenSave, from: TileKey, to: TileKey): MoveResult`. Si `from === to`, renvoie `{ ok: true, save }` avec la même référence.

- [ ] **Step 1: Écrire le test**

`src/garden/core/move.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { planMove } from "./move";
import { createStarterSave } from "./starter";
import type { GardenSave, PlantTile } from "./types";

const plant: PlantTile = {
  kind: "plant",
  seed: { species: "aster", color: "violet", rarity: "commune" },
  sownAt: 123,
  watered: [{ start: 100, end: 200 }],
};

const s: GardenSave = {
  ...createStarterSave(),
  tiles: {
    "1,1": plant,
    "0,1": { kind: "decor", id: "lanterne" },
    "2,2": { kind: "hole", dugAt: 0 },
    "0,0": { kind: "leaves", since: 0 },
  },
};

describe("planMove", () => {
  it("déplace une plante vers une terre libre en gardant son historique", () => {
    const r = planMove(s, "1,1", "3,3");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.save.tiles["3,3"]).toBe(plant);
    expect(r.save.tiles["1,1"]).toBeUndefined();
  });

  it("une plante ne va que sur de la terre", () => {
    expect(planMove(s, "1,1", "8,0")).toEqual({
      ok: false,
      reason: "une plante ne va que sur de la terre",
    });
  });

  it("le décor va sur l'herbe comme sur la terre", () => {
    expect(planMove(s, "0,1", "8,0").ok).toBe(true);
    expect(planMove(s, "0,1", "4,4").ok).toBe(true);
  });

  it("refuse une case occupée ou hors du champ", () => {
    expect(planMove(s, "0,1", "2,2")).toEqual({ ok: false, reason: "la case est occupée" });
    expect(planMove(s, "0,1", "9,0")).toEqual({ ok: false, reason: "hors du champ" });
  });

  it("trous et tas ne se déplacent pas", () => {
    expect(planMove(s, "2,2", "3,3")).toEqual({ ok: false, reason: "rien à déplacer ici" });
    expect(planMove(s, "0,0", "8,0")).toEqual({ ok: false, reason: "rien à déplacer ici" });
  });

  it("relâcher sur place ne change rien", () => {
    expect(planMove(s, "1,1", "1,1")).toEqual({ ok: true, save: s });
  });
});
```

- [ ] **Step 2: Lancer le test, vérifier l'échec**

Run: `bun run test src/garden/core/move.test.ts`
Expected: FAIL (module introuvable).

- [ ] **Step 3: Implémenter**

`src/garden/core/move.ts` :

```ts
import { isInField, isSoil } from "./plots";
import { isMovable, setTile } from "./tiles";
import type { GardenSave, TileKey } from "./types";

export type MoveResult = { ok: true; save: GardenSave } | { ok: false; reason: string };

export function planMove(save: GardenSave, from: TileKey, to: TileKey): MoveResult {
  const tile = save.tiles[from];
  if (!tile || !isMovable(tile)) return { ok: false, reason: "rien à déplacer ici" };
  if (from === to) return { ok: true, save };
  if (!isInField(to)) return { ok: false, reason: "hors du champ" };
  if (save.tiles[to]) return { ok: false, reason: "la case est occupée" };
  if (tile.kind === "plant" && !isSoil(save.plots, to))
    return { ok: false, reason: "une plante ne va que sur de la terre" };
  return { ok: true, save: setTile(setTile(save, from, undefined), to, tile) };
}
```

- [ ] **Step 4: Lancer le test, vérifier le succès**

Run: `bun run test src/garden/core/move.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/garden/core/move.ts src/garden/core/move.test.ts
git commit -m "feat(potager): déplacement des plantes et du décor"
```

---

### Task 9: Reducer de la fenêtre Potager

**Files:**

- Create: `src/garden/ui/gardenReducer.ts`
- Test: `src/garden/ui/gardenReducer.test.ts`

**Interfaces:**

- Consumes: `planMove` (Task 8), `spawnLeaves` (Task 3), `collectDiscoveries` (Task 4).
- Produces:
  - `interface GardenState { save: GardenSave | null; discoveries: { seq: number; found: Flower[] } }`
  - `INITIAL_GARDEN: GardenState`
  - `type GardenAction = { type: "load"; save: GardenSave } | { type: "set"; save: GardenSave } | { type: "move"; from: TileKey; to: TileKey } | { type: "tick"; now: number }`
  - `gardenReducer(state: GardenState, action: GardenAction): GardenState` (même référence d'état quand rien ne change)

- [ ] **Step 1: Écrire le test**

`src/garden/ui/gardenReducer.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { LEAF_SLOT_MS } from "../core/leaves";
import { createStarterSave } from "../core/starter";
import { HOUR } from "../core/time";
import type { GardenSave } from "../core/types";
import { gardenReducer, INITIAL_GARDEN, type GardenState } from "./gardenReducer";

const NOW = 10_000 * LEAF_SLOT_MS + HOUR;

function loaded(tiles: GardenSave["tiles"] = {}): GardenState {
  const save = { ...createStarterSave(), tiles, leaves: { checkedAt: NOW - HOUR } };
  return gardenReducer(INITIAL_GARDEN, { type: "load", save });
}

describe("gardenReducer", () => {
  it("ignore tout tant que rien n'est chargé", () => {
    expect(gardenReducer(INITIAL_GARDEN, { type: "tick", now: NOW })).toBe(INITIAL_GARDEN);
    expect(gardenReducer(INITIAL_GARDEN, { type: "move", from: "1,1", to: "2,2" })).toBe(
      INITIAL_GARDEN,
    );
  });

  it("set remplace la sauvegarde", () => {
    const state = loaded();
    const save = { ...state.save!, plots: [] };
    expect(gardenReducer(state, { type: "set", save }).save).toBe(save);
  });

  it("move applique un déplacement valide et ignore un refus", () => {
    const state = loaded({ "0,1": { kind: "decor", id: "paille" } });
    const moved = gardenReducer(state, { type: "move", from: "0,1", to: "8,0" });
    expect(moved.save!.tiles["8,0"]).toEqual({ kind: "decor", id: "paille" });
    expect(gardenReducer(state, { type: "move", from: "0,1", to: "9,0" })).toBe(state);
  });

  it("tick inscrit les découvertes et incrémente seq", () => {
    const state = loaded({
      "1,1": {
        kind: "plant",
        seed: { species: "cosmos", color: "pink", rarity: "commune" },
        sownAt: NOW - 9 * HOUR,
        watered: [],
      },
    });
    const next = gardenReducer(state, { type: "tick", now: NOW });
    expect(next.discoveries).toEqual({
      seq: 1,
      found: [{ species: "cosmos", color: "pink", rarity: "commune" }],
    });
    expect(next.save!.herbier["cosmos:pink"]).toBeDefined();
    const again = gardenReducer(next, { type: "tick", now: NOW });
    expect(again).toBe(next);
  });

  it("tick fait tomber les feuilles sans toucher aux découvertes", () => {
    const state = loaded();
    const next = gardenReducer(state, { type: "tick", now: NOW + LEAF_SLOT_MS });
    expect(Object.values(next.save!.tiles).some((t) => t?.kind === "leaves")).toBe(true);
    expect(next.discoveries).toBe(state.discoveries);
  });
});
```

- [ ] **Step 2: Lancer le test, vérifier l'échec**

Run: `bun run test src/garden/ui/gardenReducer.test.ts`
Expected: FAIL (module introuvable).

- [ ] **Step 3: Implémenter**

`src/garden/ui/gardenReducer.ts` :

```ts
import { collectDiscoveries } from "../core/discovery";
import { spawnLeaves } from "../core/leaves";
import { planMove } from "../core/move";
import type { Flower, GardenSave, TileKey } from "../core/types";

export interface GardenState {
  save: GardenSave | null;
  // seq change à chaque lot de découvertes, pour déclencher le toast une seule fois
  discoveries: { seq: number; found: Flower[] };
}

export const INITIAL_GARDEN: GardenState = { save: null, discoveries: { seq: 0, found: [] } };

export type GardenAction =
  | { type: "load"; save: GardenSave }
  | { type: "set"; save: GardenSave }
  | { type: "move"; from: TileKey; to: TileKey }
  | { type: "tick"; now: number };

export function gardenReducer(state: GardenState, action: GardenAction): GardenState {
  if (action.type === "load") return { ...state, save: action.save };
  if (!state.save) return state;
  switch (action.type) {
    case "set":
      return { ...state, save: action.save };
    case "move": {
      const r = planMove(state.save, action.from, action.to);
      return r.ok && r.save !== state.save ? { ...state, save: r.save } : state;
    }
    case "tick": {
      const { save, found } = collectDiscoveries(spawnLeaves(state.save, action.now), action.now);
      if (save === state.save) return state;
      return {
        save,
        discoveries: found.length ? { seq: state.discoveries.seq + 1, found } : state.discoveries,
      };
    }
  }
}
```

- [ ] **Step 4: Lancer le test, vérifier le succès**

Run: `bun run test src/garden/ui/gardenReducer.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/garden/ui/gardenReducer.ts src/garden/ui/gardenReducer.test.ts
git commit -m "feat(potager): reducer de la fenêtre Potager"
```

---

### Task 10: Plante assoiffée et terre sèche

**Files:**

- Modify: `src/garden/render/sceneModel.ts`, `src/garden/render/sceneModel.test.ts`
- Modify: `src/garden/sprites/palette.ts`, `src/garden/sprites/ground.ts`
- Modify: `src/garden/render/ground.ts`, `src/garden/render/billboards.ts`, `src/garden/render/createGardenScene.ts`

**Interfaces:**

- Consumes: `spawnLeaves` (Task 3).
- Produces:
  - `SceneItem.thirsty: boolean` (plante non éclose et non mouillée) ; `itemKey` l'inclut.
  - `SceneModel.dry: Set<TileKey>`
  - `GroundKind = "grass" | "soil" | "wet" | "dry"`, `PAL.dry`
  - `Ground.setDry(keys: Set<TileKey>): void`
  - `THIRSTY_LEAN = 0.14` (radians) dans `billboards.ts`
  - `createGardenScene.sync` applique `spawnLeaves` avant de construire le modèle (le fond passif voit les mêmes tas sans écrire).

- [ ] **Step 1: Écrire le test**

Dans `src/garden/render/sceneModel.test.ts`, ajouter dans `describe("buildSceneModel")` :

```ts
it("marque les plantes assoiffées et leur terre sèche", () => {
  const seed = { species: "aster" as const, color: "violet" as const, rarity: "commune" as const };
  const save = withTiles({
    "1,1": { kind: "plant", seed, sownAt: NOW - HOUR, watered: [] },
    "2,1": {
      kind: "plant",
      seed,
      sownAt: NOW - HOUR,
      watered: [{ start: NOW - HOUR, end: NOW + HOUR }],
    },
    "3,1": { kind: "plant", seed, sownAt: NOW - 9 * HOUR, watered: [] },
    "4,1": { kind: "hole", dugAt: NOW },
  });
  const m = buildSceneModel(save, NOW, noRain);
  expect(m.items.get("1,1")!.thirsty).toBe(true);
  expect(m.items.get("2,1")!.thirsty).toBe(false);
  expect(m.items.get("3,1")!.thirsty).toBe(false);
  expect(m.items.get("4,1")!.thirsty).toBe(false);
  expect([...m.dry]).toEqual(["1,1"]);
});

it("la pluie désaltère tout le champ", () => {
  const seed = { species: "aster" as const, color: "violet" as const, rarity: "commune" as const };
  const save = withTiles({ "1,1": { kind: "plant", seed, sownAt: NOW - HOUR, watered: [] } });
  const rain = (): Interval[] => [{ start: NOW - HOUR, end: NOW + HOUR }];
  const m = buildSceneModel(save, NOW, rain);
  expect(m.items.get("1,1")!.thirsty).toBe(false);
  expect(m.dry.size).toBe(0);
});
```

Dans `describe("diffItems")`, la fabrique `item` doit inclure le nouveau champ, et un test de plus :

```ts
const item = (name: "pousse" | "jeune", thirsty = false): SceneItem => ({
  ref: { name },
  legendary: false,
  sway: true,
  thirsty,
});
```

```ts
it("remplace une plante qui devient assoiffée", () => {
  const prev = new Map<TileKey, SceneItem>([["1,1", item("pousse")]]);
  const next = new Map<TileKey, SceneItem>([["1,1", item("pousse", true)]]);
  expect(diffItems(prev, next)).toEqual({ remove: ["1,1"], add: ["1,1"] });
});
```

(Déplacer la fabrique `item` au niveau du `describe("diffItems")` pour qu'elle serve aux deux tests.)

- [ ] **Step 2: Lancer le test, vérifier l'échec**

Run: `bun run test src/garden/render/sceneModel.test.ts`
Expected: FAIL (`thirsty` et `dry` absents).

- [ ] **Step 3: Implémenter le modèle**

`src/garden/render/sceneModel.ts` :

```ts
export interface SceneItem {
  ref: SpriteRef;
  legendary: boolean;
  sway: boolean;
  thirsty: boolean;
}

export interface SceneModel {
  items: Map<TileKey, SceneItem>;
  soil: TileKey[];
  wet: Set<TileKey>;
  dry: Set<TileKey>;
  raining: boolean;
}
```

```ts
export const itemKey = (item: SceneItem): string =>
  `${spriteKey(item.ref)}:${item.legendary ? 1 : 0}:${item.thirsty ? 1 : 0}`;
```

Remplacer `itemOf` (le paramètre `wet` devient un objet `marks`) :

```ts
function itemOf(
  tile: TileContent,
  now: number,
  rain: RainSource,
  marks: { wet: Set<TileKey>; dry: Set<TileKey> },
  key: TileKey,
): SceneItem {
  const still = { legendary: false, sway: false, thirsty: false };
  switch (tile.kind) {
    case "plant": {
      const g = growthOf(tile, now, rain);
      if (g.wet) marks.wet.add(key);
      if (g.stage < 4) {
        const thirsty = !g.wet;
        if (thirsty) marks.dry.add(key);
        return { ref: STAGE_REFS[g.stage], legendary: false, sway: g.stage > 0, thirsty };
      }
      const { species, color, rarity } = tile.seed;
      return {
        ref: { name: species, color },
        legendary: rarity === "legendaire",
        sway: true,
        thirsty: false,
      };
    }
    case "hole":
      return { ref: { name: "trou" }, ...still };
    case "leaves":
      return { ref: { name: "tas" }, ...still };
    case "decor":
      return { ref: { name: tile.id }, ...still };
  }
}
```

Dans `buildSceneModel` :

```ts
const items = new Map<TileKey, SceneItem>();
const marks = { wet: new Set<TileKey>(), dry: new Set<TileKey>() };
for (const [key, tile] of Object.entries(save.tiles) as [TileKey, TileContent | undefined][]) {
  if (tile) items.set(key, itemOf(tile, now, rain, marks, key));
}
// ... raining inchangé ...
return { items, soil: soilTiles(save.plots), wet: marks.wet, dry: marks.dry, raining };
```

- [ ] **Step 4: Lancer le test, vérifier le succès**

Run: `bun run test src/garden/render/sceneModel.test.ts`
Expected: PASS.

- [ ] **Step 5: Tuile de terre sèche**

`src/garden/sprites/palette.ts`, après `wet` :

```ts
  dry: ["#4a3426", "#7a5a40", "#96765a", "#b4967a"],
```

`src/garden/sprites/ground.ts` : `export type GroundKind = "grass" | "soil" | "wet" | "dry";` puis, dans `paintTile`, à la fin de la branche `else` (après la boucle des cailloux), ajouter les craquelures :

```ts
if (kind === "dry") {
  // craquelures : petites marches aléatoires sombres
  for (let i = 0; i < 4; i++) {
    let x = Math.floor(hash(tx, ty, i + 70) * S);
    let y = Math.floor(hash(ty, tx, i + 80) * S);
    for (let j = 0; j < 9 * K; j++) {
      put(b, x, y, pal[0]);
      x += hash(tx + j, ty, i + 90) > 0.35 ? 1 : 0;
      y += hash(tx, ty + j, i + 95) > 0.5 ? 1 : -1;
    }
  }
}
```

- [ ] **Step 6: Sol et billboards**

`src/garden/render/ground.ts` :

- ajouter `setDry(keys: Set<TileKey>): void;` à l'interface `Ground` ;
- ajouter `let parched = new Set<TileKey>();` à côté de `wet` ;
- dans `paint`, remplacer le choix de tuile sèche :

```ts
const kind = !isSoil ? "grass" : wet.has(key) ? "wet" : parched.has(key) ? "dry" : "soil";
dry.getContext("2d")!.drawImage(groundTile(kind, tx, ty), px, py);
```

- ajouter la méthode, sur le modèle de `setWet` :

```ts
    setDry(keys) {
      const changed = symmetricDiff(parched, keys);
      parched = new Set(keys);
      repaint(changed);
    },
```

`src/garden/render/billboards.ts` :

```ts
export const THIRSTY_LEAN = 0.14;
```

- le tableau devient `const swayers: { mesh: THREE.Mesh; phase: number; lean: number }[] = [];` ;
- dans `add`, après la création du mesh :

```ts
const lean = item.thirsty ? THIRSTY_LEAN : 0;
mesh.rotation.z = lean;
```

et `if (item.sway) swayers.push({ mesh, phase: tx * 1.7 + ty, lean });` ;

- dans `addStatic` : `swayers.push({ mesh, phase, lean: 0 });` ;
- `sway` devient (plante assoiffée : penchée, balancement lent et mou) :

```ts
    sway(t, raining) {
      for (const s of swayers) {
        const limp = s.lean !== 0;
        s.mesh.rotation.z =
          s.lean +
          Math.sin(t * (limp ? 0.5 : 0.9) + s.phase) * (limp ? 0.015 : 0.035) +
          (raining ? Math.sin(t * 3 + s.phase) * 0.02 : 0);
      }
    },
```

`src/garden/render/createGardenScene.ts` : importer `spawnLeaves` depuis `../core/leaves`, puis dans `sync` :

```ts
function sync(save: GardenSave, now: number) {
  // idempotent : le fond passif affiche les mêmes tas que le Potager sans écrire
  const model = buildSceneModel(spawnLeaves(save, now), now);
  // ... remove / add inchangés ...
  ground.setSoil(model.soil);
  ground.setWet(model.wet);
  ground.setDry(model.dry);
  raining = model.raining;
}
```

- [ ] **Step 7: Vérifier types, lint et tests**

Run: `bunx tsc --noEmit && bun run lint && bun run test src/garden`
Expected: aucun échec.

- [ ] **Step 8: Commit**

```bash
git add src/garden/render src/garden/sprites
git commit -m "feat(potager): plante assoiffée qui penche et terre sèche craquelée"
```

---

### Task 11: Sprites des outils et du corbeau

**Files:**

- Create: `src/garden/sprites/tools.ts`
- Modify: `src/garden/sprites/decor.ts`, `src/garden/sprites/sprite.ts`, `src/garden/sprites/sprite.test.ts`

**Interfaces:**

- Produces:
  - `TOOL_DRAW` avec les clés `main`, `transplantoir`, `arrosoir`, `secateur`, `rateau`
  - `DECOR_DRAW.corbeau`
  - `SpriteName` inclut `keyof typeof TOOL_DRAW`
  - `spriteDataUrl(ref: SpriteRef): string` (PNG en data URL, mis en cache)

- [ ] **Step 1: Écrire le test**

Dans `src/garden/sprites/sprite.test.ts`, ajouter :

```ts
describe("icônes et corbeau", () => {
  it.each(["main", "transplantoir", "arrosoir", "secateur", "rateau", "corbeau"] as const)(
    "%s produit un sprite 48x72 non vide",
    (name) => {
      const b = renderSpriteBuf({ name });
      expect([b.w, b.h]).toEqual([48, 72]);
      expect(opaque(b)).toBeGreaterThan(40);
    },
  );
});
```

- [ ] **Step 2: Lancer le test, vérifier l'échec**

Run: `bun run test src/garden/sprites/sprite.test.ts`
Expected: FAIL (erreur de type ou `draw is not a function`).

- [ ] **Step 3: Implémenter**

`src/garden/sprites/tools.ts` (portés de `docs/superpowers/mockups/potager-automne/pixelgen.js`, plus le râteau) :

```ts
import { PAL } from "./palette";
import { ell, petal, sphere, stem, type DrawFn } from "./raster";

export const TOOL_DRAW = {
  main(b, k) {
    ell(b, k, 16, 40, 6, 6.5, 0, sphere(PAL.hay, 0.2));
    (
      [
        [11, -2.2],
        [14, -1.8],
        [17.5, -1.7],
        [21, -2],
      ] as const
    ).forEach(([x, a], i) =>
      petal(b, k, x, 36, a, 7 - Math.abs(i - 1.5), 2.8, PAL.hay, { bias: 0.25 }),
    );
    petal(b, k, 11, 41, -2.7, 6, 2.8, PAL.hay, { bias: 0.2 });
  },
  transplantoir(b, k) {
    stem(b, k, 16, 30, 16, 38, 2.6, PAL.wood);
    petal(b, k, 16, 38, Math.PI / 2, 10, 5, PAL.metal, { bias: 0.2 });
  },
  arrosoir(b, k) {
    ell(b, k, 15, 41, 7, 5.5, 0, sphere(PAL.metal, 0.25));
    stem(b, k, 21, 40, 29, 33, 1.4, PAL.metal);
    ell(b, k, 29.5, 32.5, 1.6, 1.2, -0.6, sphere(PAL.metal, 0.3));
    stem(b, k, 9, 37, 11, 33, 1, PAL.metal, -3);
    stem(b, k, 11, 33, 20, 36, 1, PAL.metal, -2);
  },
  secateur(b, k) {
    stem(b, k, 11, 46, 17, 36, 2.2, PAL.red);
    stem(b, k, 21, 46, 16, 36, 2.2, PAL.red);
    petal(b, k, 16.5, 36, -Math.PI / 2 - 0.25, 8, 2.4, PAL.metal, { bias: 0.25 });
    petal(b, k, 16.5, 36, -Math.PI / 2 + 0.25, 8, 2.4, PAL.metal, { bias: 0.1 });
    ell(b, k, 16.5, 36, 1.2, 1.2, 0, () => PAL.yellow[2]);
  },
  rateau(b, k) {
    stem(b, k, 8, 47, 21, 33, 1.4, PAL.wood);
    stem(b, k, 17, 28, 27, 38, 1.6, PAL.metal);
    for (let i = 0; i < 4; i++)
      stem(b, k, 18 + i * 3, 29 + i * 3, 21 + i * 3, 26 + i * 3, 0.8, PAL.metal);
  },
} satisfies Record<string, DrawFn>;
```

`src/garden/sprites/decor.ts` : ajouter `petal` à l'import depuis `./raster`, puis dans `DECOR_DRAW` :

```ts
  corbeau(b, k) {
    petal(b, k, 11, 41, Math.PI * 0.94, 7, 3, PAL.crow);
    stem(b, k, 14, 44, 13, 47, 0.6, PAL.metal);
    stem(b, k, 17, 44, 18, 47, 0.6, PAL.metal);
    ell(b, k, 15, 40.5, 6.5, 4.2, -0.15, sphere(PAL.crow));
    ell(b, k, 14, 40, 5, 2.4, -0.3, sphere(PAL.crow, -0.2));
    ell(b, k, 21, 35.5, 3.4, 3.2, 0, sphere(PAL.crow, 0.1));
    petal(b, k, 23.8, 36, 0.12, 3.6, 1.6, PAL.metal, { bias: 0.2 });
    put(b, Math.round(22 * k), Math.round(34.6 * k), "#e8e0d0");
  },
```

`src/garden/sprites/sprite.ts` :

```ts
import { TOOL_DRAW } from "./tools";

export type SpriteName =
  | keyof typeof SPECIES_DRAW
  | keyof typeof STAGE_DRAW
  | keyof typeof DECOR_DRAW
  | keyof typeof TOOL_DRAW
  | "arbre";
```

Dans `renderSpriteBuf`, compléter la chaîne de recherche :

```ts
const draw =
  SPECIES_DRAW[ref.name as keyof typeof SPECIES_DRAW] ??
  STAGE_DRAW[ref.name as keyof typeof STAGE_DRAW] ??
  DECOR_DRAW[ref.name as keyof typeof DECOR_DRAW] ??
  TOOL_DRAW[ref.name as keyof typeof TOOL_DRAW];
```

Et à la fin du fichier :

```ts
const urls = new Map<string, string>();

export function spriteDataUrl(ref: SpriteRef): string {
  const key = spriteKey(ref);
  let url = urls.get(key);
  if (!url) {
    url = spriteCanvas(ref).toDataURL();
    urls.set(key, url);
  }
  return url;
}
```

- [ ] **Step 4: Lancer le test, vérifier le succès**

Run: `bun run test src/garden/sprites && bunx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/garden/sprites
git commit -m "feat(potager): icônes des outils et sprite du corbeau"
```

---

### Task 12: Interaction dans la scène (picking, surbrillance, particules, corbeaux, glisser)

Pas de test automatisé (three.js et WebGL) : vérification par types, lint et Task 15.

**Files:**

- Create: `src/garden/render/highlight.ts`, `src/garden/render/particles.ts`, `src/garden/render/crows.ts`, `src/garden/render/picking.ts`, `src/garden/render/interaction.ts`
- Modify: `src/garden/render/billboards.ts`, `src/garden/render/createGardenScene.ts`

**Interfaces:**

- Consumes: `Target`, `Particle` (Task 7) ; `isInField` (Task 1) ; `spriteCanvas` ; `wx`, `wz`, `WORLD`.
- Produces:
  - `billboards.ts` : `export function makeBillboard(canvas, w, h): THREE.Mesh` (stocke `mesh.userData.canvas = canvas`), `export function disposeMesh(mesh)`, et dans `Billboards` : `get(key: TileKey): THREE.Mesh | undefined`, `entries(): [TileKey, THREE.Mesh][]`
  - `type HighlightTone = "ok" | "no" | "info"`
  - `interface PickResult { target: Target; ground: { key: TileKey; x: number; z: number } | null }`
  - `interface GardenInteraction { pickAt(clientX: number, clientY: number, ignore?: TileKey): PickResult | null; setHighlight(key: TileKey | null, tone?: HighlightTone): void; burst(key: TileKey, particle: Particle): void; lift(key: TileKey): void; moveLifted(x: number, z: number): void; drop(): void; addCrow(id: string, key: TileKey): void; chaseCrow(id: string): void; removeCrow(id: string): void; update(t: number): void; dispose(): void }`
  - `GardenScene.interaction?: GardenInteraction` (profil `garden` seulement)

- [ ] **Step 1: Exposer les billboards**

`src/garden/render/billboards.ts` :

- exporter `makeBillboard` et `disposeMesh` (`export function ...`) ;
- dans `makeBillboard`, avant `return mesh;` : `mesh.userData.canvas = canvas;` ;
- ajouter à l'interface `Billboards` :

```ts
  get(key: TileKey): THREE.Mesh | undefined;
  entries(): [TileKey, THREE.Mesh][];
```

- et à l'objet renvoyé :

```ts
    get: (key) => placed.get(key),
    entries: () => [...placed.entries()],
```

- [ ] **Step 2: Surbrillance**

`src/garden/render/highlight.ts` :

```ts
import * as THREE from "three";
import { parseTileKey, type TileKey } from "../core/types";
import { pixelTexture } from "./texture";
import { wx, wz } from "./world";

export type HighlightTone = "ok" | "no" | "info";

const TONES: Record<HighlightTone, string> = { ok: "#9fd46e", no: "#e0a060", info: "#f3dca0" };

export interface Highlight {
  set(key: TileKey | null, tone?: HighlightTone): void;
  update(t: number): void;
  dispose(): void;
}

// Cadre pixel posé au sol : coins en équerre et voile léger.
function frameCanvas(): HTMLCanvasElement {
  const cv = Object.assign(document.createElement("canvas"), { width: 48, height: 48 });
  const g = cv.getContext("2d")!;
  g.fillStyle = "rgba(255,255,255,0.14)";
  g.fillRect(3, 3, 42, 42);
  g.fillStyle = "#fff";
  for (const [x, y, dx, dy] of [
    [1, 1, 1, 1],
    [47, 1, -1, 1],
    [1, 47, 1, -1],
    [47, 47, -1, -1],
  ]) {
    g.fillRect(dx > 0 ? x : x - 12, dy > 0 ? y : y - 3, 12, 3);
    g.fillRect(dx > 0 ? x : x - 3, dy > 0 ? y : y - 12, 3, 12);
  }
  return cv;
}

export function createHighlight(scene: THREE.Scene): Highlight {
  const map = pixelTexture(frameCanvas());
  const material = new THREE.MeshBasicMaterial({
    map,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.visible = false;
  scene.add(mesh);

  return {
    set(key, tone = "info") {
      mesh.visible = key !== null;
      if (!key) return;
      const [tx, ty] = parseTileKey(key);
      mesh.position.set(wx(tx), 0.015, wz(ty));
      material.color.set(TONES[tone]).multiplyScalar(1.5);
    },
    update(t) {
      material.opacity = 0.65 + 0.35 * Math.sin(t * 5);
    },
    dispose() {
      scene.remove(mesh);
      mesh.geometry.dispose();
      material.dispose();
      map.dispose();
    },
  };
}
```

- [ ] **Step 3: Particules**

`src/garden/render/particles.ts` :

```ts
import * as THREE from "three";
import type { Particle } from "../core/actions";
import { parseTileKey, type TileKey } from "../core/types";
import { wx, wz } from "./world";

type Rgb = [number, number, number];

interface Kind {
  n: number;
  cols: Rgb[];
  y: [number, number];
  v: Rgb;
  g: number;
  life: number;
}

// Couleurs au-delà de 1 : captées par le bloom.
const KINDS: Record<Particle, Kind> = {
  water: {
    n: 34,
    cols: [
      [0.55, 0.8, 1.7],
      [0.8, 0.95, 1.8],
    ],
    y: [0.9, 1.4],
    v: [0.3, -2.2, 0.3],
    g: -3,
    life: 0.7,
  },
  dirt: {
    n: 16,
    cols: [
      [0.35, 0.22, 0.14],
      [0.5, 0.34, 0.22],
    ],
    y: [0.02, 0.1],
    v: [1.1, 1.6, 1.1],
    g: -6,
    life: 0.5,
  },
  leaves: {
    n: 30,
    cols: [
      [1.1, 0.4, 0.12],
      [1.2, 0.7, 0.2],
      [1.2, 0.9, 0.3],
    ],
    y: [0.05, 0.3],
    v: [1.6, 2.2, 1.2],
    g: -3.5,
    life: 1.1,
  },
  petals: {
    n: 26,
    cols: [
      [1.6, 0.9, 1.2],
      [1.8, 1.5, 1.6],
      [1.4, 0.6, 0.8],
    ],
    y: [0.8, 1.2],
    v: [1.2, 1.4, 1.0],
    g: -2,
    life: 1.0,
  },
  feathers: {
    n: 14,
    cols: [
      [0.12, 0.1, 0.18],
      [0.25, 0.22, 0.32],
    ],
    y: [0.4, 0.7],
    v: [1.2, 1.2, 1.0],
    g: -1.2,
    life: 1.0,
  },
};

const MAX = 600;

interface Part {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  g: number;
  life: number;
  age: number;
  c: Rgb;
}

export interface Particles {
  burst(key: TileKey, particle: Particle): void;
  update(t: number): void;
  dispose(): void;
}

export function createParticles(scene: THREE.Scene): Particles {
  const pos = new Float32Array(MAX * 3);
  const col = new Float32Array(MAX * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const material = new THREE.PointsMaterial({
    size: 0.055,
    vertexColors: true,
    toneMapped: false,
    transparent: true,
    depthWrite: false,
  });
  const points = new THREE.Points(geo, material);
  points.frustumCulled = false;
  scene.add(points);
  const parts: Part[] = [];
  let prev = 0;

  return {
    burst(key, particle) {
      const [tx, ty] = parseTileKey(key);
      const k = KINDS[particle];
      for (let i = 0; i < k.n; i++) {
        if (parts.length >= MAX) parts.shift();
        parts.push({
          x: wx(tx) + (Math.random() - 0.5) * 0.6,
          y: k.y[0] + Math.random() * (k.y[1] - k.y[0]),
          z: wz(ty) + 0.35 + (Math.random() - 0.5) * 0.3,
          vx: (Math.random() - 0.5) * k.v[0],
          vy: particle === "water" ? k.v[1] * (0.6 + Math.random() * 0.4) : Math.random() * k.v[1],
          vz: (Math.random() - 0.5) * k.v[2],
          g: k.g,
          life: k.life * (0.6 + Math.random() * 0.6),
          age: 0,
          c: k.cols[i % k.cols.length],
        });
      }
    },
    update(t) {
      const dt = Math.min(0.05, Math.max(0, t - prev));
      prev = t;
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.age += dt;
        if (p.age > p.life) {
          parts.splice(i, 1);
          continue;
        }
        p.vy += p.g * dt;
        p.x += p.vx * dt;
        p.y = Math.max(0.01, p.y + p.vy * dt);
        p.z += p.vz * dt;
      }
      parts.forEach((p, i) => {
        const f = 1 - p.age / p.life;
        pos.set([p.x, p.y, p.z], i * 3);
        col.set([p.c[0] * f, p.c[1] * f, p.c[2] * f], i * 3);
      });
      geo.attributes.position.needsUpdate = true;
      geo.attributes.color.needsUpdate = true;
      geo.setDrawRange(0, parts.length);
    },
    dispose() {
      scene.remove(points);
      geo.dispose();
      material.dispose();
    },
  };
}
```

(Lancer `bunx prettier --write src/garden/render/particles.ts` si le lint signale la table `KINDS`.)

- [ ] **Step 4: Corbeaux**

`src/garden/render/crows.ts` :

```ts
import type * as THREE from "three";
import { parseTileKey, type TileKey } from "../core/types";
import { spriteCanvas } from "../sprites/sprite";
import { disposeMesh, makeBillboard } from "./billboards";
import { wx, wz } from "./world";

interface Crow {
  mesh: THREE.Mesh;
  key: TileKey;
  born: number;
  flying: number | null;
}

export interface Crows {
  add(id: string, key: TileKey, t: number): void;
  fly(id: string, t: number): TileKey | null;
  perched(): { id: string; mesh: THREE.Mesh }[];
  update(t: number): void;
  dispose(): void;
}

const FLIGHT_S = 1.6;

export function createCrows(scene: THREE.Scene): Crows {
  const crows = new Map<string, Crow>();

  function remove(id: string) {
    const c = crows.get(id);
    if (!c) return;
    scene.remove(c.mesh);
    disposeMesh(c.mesh);
    crows.delete(id);
  }

  return {
    add(id, key, t) {
      if (crows.has(id)) return;
      const [tx, ty] = parseTileKey(key);
      const mesh = makeBillboard(spriteCanvas({ name: "corbeau" }), 0.8, 1.2);
      mesh.position.set(wx(tx) + 0.28, 0, wz(ty) + 0.45);
      scene.add(mesh);
      crows.set(id, { mesh, key, born: t, flying: null });
    },
    // renvoie la case quittée (pour les plumes), null si le corbeau n'est plus là
    fly(id, t) {
      const c = crows.get(id);
      if (!c || c.flying !== null) return null;
      c.flying = t;
      return c.key;
    },
    perched: () =>
      [...crows.entries()]
        .filter(([, c]) => c.flying === null)
        .map(([id, c]) => ({ id, mesh: c.mesh })),
    update(t) {
      for (const [id, c] of crows) {
        const [tx, ty] = parseTileKey(c.key);
        if (c.flying === null) {
          c.mesh.position.y = Math.max(0, Math.sin(t * 7 + c.born) * 0.05);
          c.mesh.rotation.z = Math.sin(t * 2.3 + c.born) > 0.7 ? 0.25 : 0;
          continue;
        }
        const a = t - c.flying;
        c.mesh.position.set(
          wx(tx) + 0.28 + a * a * 4,
          a * 2.6 + a * a * 2,
          wz(ty) + 0.45 - a * 1.5,
        );
        c.mesh.rotation.z = -0.4 * Math.min(1, a * 3);
        if (a > FLIGHT_S) remove(id);
      }
    },
    dispose() {
      for (const id of [...crows.keys()]) remove(id);
    },
  };
}
```

- [ ] **Step 5: Picking**

`src/garden/render/picking.ts` :

```ts
import * as THREE from "three";
import type { Target } from "../core/actions";
import { isInField } from "../core/plots";
import { tileKey, type TileKey } from "../core/types";
import { WORLD } from "./world";

export interface PickResult {
  target: Target;
  ground: { key: TileKey; x: number; z: number } | null;
}

export interface Pickable {
  mesh: THREE.Mesh;
  target: Target;
}

const alphaCache = new WeakMap<HTMLCanvasElement, Uint8ClampedArray>();

// Vrai si le pixel du sprite sous le rayon est opaque : on vise à travers les vides.
function opaqueAt(canvas: HTMLCanvasElement, uv: THREE.Vector2): boolean {
  let data = alphaCache.get(canvas);
  if (!data) {
    data = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height).data;
    alphaCache.set(canvas, data);
  }
  const px = Math.min(canvas.width - 1, Math.floor(uv.x * canvas.width));
  const py = Math.min(canvas.height - 1, Math.floor((1 - uv.y) * canvas.height));
  return data[(py * canvas.width + px) * 4 + 3] > 0;
}

export function createPicker(camera: THREE.Camera, canvas: HTMLCanvasElement) {
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hit = new THREE.Vector3();

  return function pickAt(
    clientX: number,
    clientY: number,
    pickables: Pickable[],
  ): PickResult | null {
    const r = canvas.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);

    const onFloor = ray.ray.intersectPlane(floor, hit);
    const ground = onFloor
      ? { key: tileKey(Math.floor(hit.x - WORLD.X0), Math.floor(hit.z + 2)), x: hit.x, z: hit.z }
      : null;

    const meshes = pickables.map((p) => p.mesh);
    for (const h of ray.intersectObjects(meshes, false)) {
      const canvasOf = h.object.userData.canvas as HTMLCanvasElement | undefined;
      if (!h.uv || !canvasOf || !opaqueAt(canvasOf, h.uv)) continue;
      return { target: pickables[meshes.indexOf(h.object as THREE.Mesh)].target, ground };
    }
    if (!ground || !isInField(ground.key)) return null;
    return { target: { kind: "tile", key: ground.key }, ground };
  };
}
```

- [ ] **Step 6: Regrouper l'interaction**

`src/garden/render/interaction.ts` :

```ts
import type * as THREE from "three";
import type { Particle } from "../core/actions";
import { parseTileKey, type TileKey } from "../core/types";
import type { Billboards } from "./billboards";
import { createCrows } from "./crows";
import { createHighlight, type HighlightTone } from "./highlight";
import { createParticles } from "./particles";
import { createPicker, type Pickable, type PickResult } from "./picking";
import { wx, wz } from "./world";

export interface GardenInteraction {
  pickAt(clientX: number, clientY: number, ignore?: TileKey): PickResult | null;
  setHighlight(key: TileKey | null, tone?: HighlightTone): void;
  burst(key: TileKey, particle: Particle): void;
  lift(key: TileKey): void;
  moveLifted(x: number, z: number): void;
  drop(): void;
  addCrow(id: string, key: TileKey): void;
  chaseCrow(id: string): void;
  removeCrow(id: string): void;
  update(t: number): void;
  dispose(): void;
}

export function createInteraction(
  scene: THREE.Scene,
  camera: THREE.Camera,
  canvas: HTMLCanvasElement,
  billboards: Billboards,
): GardenInteraction {
  const pick = createPicker(camera, canvas);
  const highlight = createHighlight(scene);
  const particles = createParticles(scene);
  const crows = createCrows(scene);
  let lifted: TileKey | null = null;
  let clock = 0;

  // la clé est relue à chaque image : sync peut avoir recréé le mesh entre-temps
  const liftedMesh = () => (lifted ? billboards.get(lifted) : undefined);

  function resetLifted() {
    const mesh = liftedMesh();
    if (mesh && lifted) {
      const [tx, ty] = parseTileKey(lifted);
      mesh.position.set(wx(tx), 0, wz(ty) + 0.35);
      mesh.renderOrder = 0;
    }
    lifted = null;
  }

  return {
    pickAt(clientX, clientY, ignore) {
      const pickables: Pickable[] = [
        ...crows.perched().map(({ id, mesh }) => ({ mesh, target: { kind: "crow" as const, id } })),
        ...billboards
          .entries()
          .filter(([key]) => key !== ignore)
          .map(([key, mesh]) => ({ mesh, target: { kind: "tile" as const, key } })),
      ];
      return pick(clientX, clientY, pickables);
    },
    setHighlight: highlight.set,
    burst: particles.burst,
    lift(key) {
      resetLifted();
      lifted = key;
      const mesh = liftedMesh();
      if (mesh) mesh.renderOrder = 2;
    },
    moveLifted(x, z) {
      const mesh = liftedMesh();
      if (mesh) mesh.position.set(x, mesh.position.y, z + 0.35);
    },
    drop: resetLifted,
    addCrow(id, key) {
      crows.add(id, key, clock);
    },
    chaseCrow(id) {
      const key = crows.fly(id, clock);
      if (key) particles.burst(key, "feathers");
    },
    removeCrow(id) {
      crows.fly(id, clock);
    },
    update(t) {
      clock = t;
      highlight.update(t);
      particles.update(t);
      crows.update(t);
      const mesh = liftedMesh();
      if (mesh) mesh.position.y = 0.2 + Math.sin(t * 6) * 0.04;
    },
    dispose() {
      highlight.dispose();
      particles.dispose();
      crows.dispose();
    },
  };
}
```

- [ ] **Step 7: Brancher sur la scène**

`src/garden/render/createGardenScene.ts` :

- importer `createInteraction, type GardenInteraction` depuis `./interaction` ;
- ajouter `readonly interaction?: GardenInteraction;` à l'interface `GardenScene` ;
- après la création de `post` :

```ts
const interaction =
  profile === "garden" ? createInteraction(scene, camera, canvas, billboards) : undefined;
```

- dans `draw`, juste après `billboards.sway(t, raining);` (le balancement réécrit `rotation.z`, le soulèvement agit sur `position.y`) :

```ts
interaction?.update(t);
```

- dans l'objet renvoyé : `interaction,` ;
- dans `dispose`, avant `billboards.dispose();` : `interaction?.dispose();`.

- [ ] **Step 8: Vérifier types et lint**

Run: `bunx tsc --noEmit && bun run lint && bun run test src/garden`
Expected: aucun échec.

- [ ] **Step 9: Commit**

```bash
git add src/garden/render
git commit -m "feat(potager): picking, surbrillance, particules, corbeaux et soulèvement"
```

---

### Task 13: Composants de l'onglet Champ

**Files:**

- Create: `src/garden/ui/toolMeta.ts`, `src/garden/ui/hover.ts`, `src/garden/ui/SpriteIcon.tsx`, `src/garden/ui/ToolBar.tsx`, `src/garden/ui/TileTooltip.tsx`, `src/garden/ui/SidePanel.tsx`, `src/garden/ui/DiscoveryToast.tsx`, `src/garden/ui/useCrows.ts`
- Test: `src/garden/ui/hover.test.ts`

**Interfaces:**

- Consumes: `Tool`, `TOOLS`, `Target`, `Plan`, `planAction` (Task 7) ; `describeTile`, `describeCrow`, `TileInfo` (Task 6) ; `isMovable` (Task 1) ; `flowerName`, `RARITY_FR` (Task 2) ; `spriteDataUrl`, `SpriteRef` (Task 11) ; `GardenInteraction` (Task 12) ; `fieldTiles` (Task 1).
- Produces:
  - `TOOL_META: Record<Tool, { label: string; icon: SpriteRef }>`, `RARITY_COLOR: Record<Rarity, string>`
  - `interface HoverView { info: TileInfo; plan: Plan | null; movable: boolean }`
  - `describeTarget(save: GardenSave, target: Target, tool: Tool, now: number): HoverView`
  - `toneOf(view: HoverView): HighlightTone`
  - `<SpriteIcon sprite={SpriteRef} className? />`
  - `<ToolBar tool={Tool} onSelect={(t: Tool) => void} />` (touches 1 à 6, Échap)
  - `<TileTooltip x y view={HoverView} />`
  - `<SidePanel save={GardenSave} raining={boolean} />`
  - `<DiscoveryToast found={Flower[]} />`
  - `useCrows(sceneRef: RefObject<GardenScene | null>, saveRef: RefObject<GardenSave | null>): { spawn(): void }`

- [ ] **Step 1: Écrire le test**

`src/garden/ui/hover.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { createStarterSave } from "../core/starter";
import type { GardenSave } from "../core/types";
import { describeTarget, toneOf } from "./hover";

const NOW = new Date(2026, 9, 1, 12).getTime();
const s: GardenSave = {
  ...createStarterSave(),
  tiles: { "0,1": { kind: "decor", id: "lanterne" } },
};

describe("describeTarget", () => {
  it("case : description, action et tonalité", () => {
    const ok = describeTarget(s, { kind: "tile", key: "1,1" }, "creuser", NOW);
    expect(ok.info.title).toBe("Terre");
    expect(ok.plan).toMatchObject({ ok: true, label: "Creuser un trou" });
    expect(toneOf(ok)).toBe("ok");

    const no = describeTarget(s, { kind: "tile", key: "0,0" }, "creuser", NOW);
    expect(toneOf(no)).toBe("no");
  });

  it("la Main sur du décor propose le déplacement", () => {
    const v = describeTarget(s, { kind: "tile", key: "0,1" }, "main", NOW);
    expect(v.plan).toBeNull();
    expect(v.movable).toBe(true);
    expect(toneOf(v)).toBe("info");
    expect(describeTarget(s, { kind: "tile", key: "0,1" }, "arroser", NOW).movable).toBe(false);
  });

  it("corbeau", () => {
    const v = describeTarget(s, { kind: "crow", id: "c" }, "rateau", NOW);
    expect(v.info.title).toBe("Corbeau");
    expect(v.plan).toMatchObject({ ok: true, label: "Chasser" });
  });
});
```

- [ ] **Step 2: Lancer le test, vérifier l'échec**

Run: `bun run test src/garden/ui/hover.test.ts`
Expected: FAIL (module introuvable).

- [ ] **Step 3: Implémenter les modules purs**

`src/garden/ui/toolMeta.ts` :

```ts
import type { Tool } from "../core/actions";
import type { Rarity } from "../core/types";
import type { SpriteRef } from "../sprites/sprite";

export const TOOL_META: Record<Tool, { label: string; icon: SpriteRef }> = {
  main: { label: "Main", icon: { name: "main" } },
  creuser: { label: "Creuser", icon: { name: "transplantoir" } },
  semer: { label: "Semer", icon: { name: "graine", color: "cream" } },
  arroser: { label: "Arroser", icon: { name: "arrosoir" } },
  secateur: { label: "Sécateur", icon: { name: "secateur" } },
  rateau: { label: "Râteau", icon: { name: "rateau" } },
};

export const RARITY_COLOR: Record<Rarity, string> = {
  commune: "#d6cdbf",
  rare: "#6db6f0",
  epique: "#be8cf0",
  legendaire: "#f3c34a",
};
```

`src/garden/ui/hover.ts` :

```ts
import { planAction, type Plan, type Target, type Tool } from "../core/actions";
import { describeCrow, describeTile, type TileInfo } from "../core/target";
import { isMovable } from "../core/tiles";
import type { GardenSave } from "../core/types";
import type { HighlightTone } from "../render/highlight";

export interface HoverView {
  info: TileInfo;
  plan: Plan | null;
  movable: boolean;
}

export function describeTarget(
  save: GardenSave,
  target: Target,
  tool: Tool,
  now: number,
): HoverView {
  const plan = planAction(save, target, tool, now);
  if (target.kind === "crow") return { info: describeCrow(), plan, movable: false };
  return {
    info: describeTile(save, target.key, now),
    plan,
    movable: tool === "main" && isMovable(save.tiles[target.key]),
  };
}

export const toneOf = (view: HoverView): HighlightTone =>
  !view.plan ? "info" : view.plan.ok ? "ok" : "no";
```

- [ ] **Step 4: Lancer le test, vérifier le succès**

Run: `bun run test src/garden/ui/hover.test.ts`
Expected: PASS.

- [ ] **Step 5: Composants**

`src/garden/ui/SpriteIcon.tsx` :

```tsx
import { spriteDataUrl, type SpriteRef } from "../sprites/sprite";

// Sprite 48x72 : l'objet est dessiné dans le bas de l'image.
export function SpriteIcon({ sprite, className }: { sprite: SpriteRef; className?: string }) {
  return (
    <img
      src={spriteDataUrl(sprite)}
      alt=""
      draggable={false}
      className={`[image-rendering:pixelated] ${className ?? ""}`}
    />
  );
}
```

`src/garden/ui/ToolBar.tsx` :

```tsx
import { useEffect } from "react";
import { TOOLS, type Tool } from "../core/actions";
import { SpriteIcon } from "./SpriteIcon";
import { TOOL_META } from "./toolMeta";

export function ToolBar({ tool, onSelect }: { tool: Tool; onSelect: (tool: Tool) => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onSelect("main");
      const next = TOOLS[Number(e.key) - 1];
      if (next) onSelect(next);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onSelect]);

  return (
    <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-2xl border border-amber-300/35 bg-[#1a1216]/85 p-1.5 backdrop-blur">
      {TOOLS.map((id, i) => (
        <button
          key={id}
          type="button"
          onClick={() => onSelect(id)}
          aria-pressed={tool === id}
          className={`relative flex h-[58px] w-[62px] flex-col items-center justify-center gap-0.5 rounded-lg border text-[10.5px] ${
            tool === id
              ? "border-[#d9b46a] bg-amber-300/20 shadow-[0_0_12px_rgba(243,220,160,0.3)]"
              : "border-amber-300/20 bg-black/25 hover:bg-black/40"
          }`}
        >
          <span className="absolute left-1.5 top-0.5 text-[9px] text-[#a99a8a]">{i + 1}</span>
          <SpriteIcon sprite={TOOL_META[id].icon} className="-mt-3 w-[26px]" />
          {TOOL_META[id].label}
        </button>
      ))}
    </div>
  );
}
```

`src/garden/ui/TileTooltip.tsx` :

```tsx
import type { HoverView } from "./hover";

export function TileTooltip({ x, y, view }: { x: number; y: number; view: HoverView }) {
  const { info, plan, movable } = view;
  return (
    <div
      className="pointer-events-none absolute max-w-[230px] translate-x-3.5 translate-y-3.5 rounded-[10px] border border-amber-300/35 bg-[#1a1216]/90 px-2.5 py-1.5 text-xs"
      style={{ left: x, top: y }}
    >
      <b className="block font-serif text-base text-[#f3dca0]">{info.title}</b>
      {info.lines.map((line) => (
        <div key={line}>{line}</div>
      ))}
      {info.progress !== undefined && (
        <div className="mt-1.5 h-1 overflow-hidden rounded bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-[#6aa83e] to-[#d9b46a]"
            style={{ width: `${info.progress * 100}%` }}
          />
        </div>
      )}
      {plan && (
        <div className={`mt-1 ${plan.ok ? "text-[#9fd46e]" : "text-[#d98a7a]"}`}>
          {plan.ok ? `Clic : ${plan.label}` : `${plan.label} : ${plan.reason}`}
        </div>
      )}
      {movable && <div className="mt-1 text-[#a99a8a]">Maintenir et glisser pour déplacer</div>}
    </div>
  );
}
```

`src/garden/ui/SidePanel.tsx` :

```tsx
import { flowerName, RARITY_FR } from "../core/labels";
import type { GardenSave } from "../core/types";
import { SpriteIcon } from "./SpriteIcon";
import { RARITY_COLOR } from "./toolMeta";

const section = "rounded-xl border border-amber-300/30 bg-[#1a1216]/85 px-2.5 py-2 backdrop-blur";
const heading = "mb-1.5 font-serif text-[17px] text-[#f3dca0]";

export function SidePanel({ save, raining }: { save: GardenSave; raining: boolean }) {
  const { seeds, basket } = save.inventory;
  const counters = save.progress.counters;
  return (
    <aside className="absolute right-3 top-2.5 flex w-[210px] flex-col gap-2 text-xs">
      <section className={section}>
        <h4 className={heading}>Graines</h4>
        <div className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-[3px] bg-[#c8c6a8]" />
          Graine mystère
          <b className="ml-auto text-[#f3dca0]">x{seeds.length}</b>
        </div>
      </section>
      <section className={section}>
        <h4 className={heading}>Panier</h4>
        <div className="flex max-h-[150px] flex-col gap-1 overflow-auto">
          {basket.length === 0 && (
            <em className="text-[11px] text-[#a99a8a]">Rien de cueilli pour l'instant.</em>
          )}
          {basket.map((f, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <SpriteIcon sprite={{ name: f.species, color: f.color }} className="w-[22px]" />
              <span className="flex-1 leading-tight">
                {flowerName(f)}
                <small className="block text-[10px]" style={{ color: RARITY_COLOR[f.rarity] }}>
                  {RARITY_FR[f.rarity]}
                </small>
              </span>
            </div>
          ))}
        </div>
      </section>
      <section className={section}>
        <div className="flex justify-between">
          <span className="text-[#a99a8a]">Corbeaux chassés</span>
          <b className="text-[#f3dca0]">{counters.crowsChased ?? 0}</b>
        </div>
        <div className="flex justify-between">
          <span className="text-[#a99a8a]">Tas ramassés</span>
          <b className="text-[#f3dca0]">{counters.raked ?? 0}</b>
        </div>
        {raining && <div className="mt-1 text-[#9fc4e6]">La pluie arrose tout le champ</div>}
      </section>
    </aside>
  );
}
```

`src/garden/ui/DiscoveryToast.tsx` :

```tsx
import { flowerName, RARITY_FR } from "../core/labels";
import type { Flower } from "../core/types";
import { RARITY_COLOR } from "./toolMeta";

export function DiscoveryToast({ found }: { found: Flower[] }) {
  return (
    <div className="text-center">
      <div className="text-xs text-[#a99a8a]">
        {found.length > 1 ? "Nouvelles découvertes" : "Nouvelle découverte"}
      </div>
      {found.map((f) => (
        <b key={`${f.species}:${f.color}`} className="block font-serif text-lg">
          {flowerName(f)}{" "}
          <span style={{ color: RARITY_COLOR[f.rarity] }}>
            ({RARITY_FR[f.rarity].toLowerCase()})
          </span>
        </b>
      ))}
    </div>
  );
}
```

`src/garden/ui/useCrows.ts` :

```ts
import { useCallback, useEffect, type RefObject } from "react";
import { fieldTiles } from "../core/plots";
import type { GardenSave } from "../core/types";
import type { GardenScene } from "../render/createGardenScene";

const MIN_DELAY = 2 * 60_000;
const MAX_DELAY = 5 * 60_000;
const STAY_MS = 90_000;
const MAX_CROWS = 2;

// Corbeaux éphémères : ils ne vivent que dans la scène, rien n'est enregistré.
export function useCrows(
  sceneRef: RefObject<GardenScene | null>,
  saveRef: RefObject<GardenSave | null>,
) {
  const spawn = useCallback(() => {
    const interaction = sceneRef.current?.interaction;
    const save = saveRef.current;
    if (!interaction || !save) return;
    const spots = fieldTiles().filter((key) => {
      const tile = save.tiles[key];
      return !tile || tile.kind === "plant";
    });
    if (!spots.length) return;
    const id = crypto.randomUUID();
    interaction.addCrow(id, spots[Math.floor(Math.random() * spots.length)]);
    setTimeout(() => sceneRef.current?.interaction?.removeCrow(id), STAY_MS);
  }, [sceneRef, saveRef]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let alive = 0;
    const plan = () => {
      timer = setTimeout(
        () => {
          if (document.visibilityState === "visible" && alive < MAX_CROWS) {
            spawn();
            alive++;
            setTimeout(() => alive--, STAY_MS);
          }
          plan();
        },
        MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY),
      );
    };
    plan();
    return () => clearTimeout(timer);
  }, [spawn]);

  return { spawn };
}
```

- [ ] **Step 6: Vérifier types, lint et accents**

Run: `bunx tsc --noEmit && bun run lint && bun run test src/garden src/lib/accents.test.ts`
Expected: aucun échec.

- [ ] **Step 7: Commit**

```bash
git add src/garden/ui
git commit -m "feat(potager): barre d'outils, infobulle, panneau et toast de découverte"
```

---

### Task 14: `FieldView` et branchement dans `GardenApp`

**Files:**

- Create: `src/garden/ui/FieldView.tsx`
- Modify: `src/garden/ui/GardenApp.tsx`, `src/garden/ui/GardenDevBar.tsx`

**Interfaces:**

- Consumes: tout ce qui précède.
- Produces: `<FieldView save={GardenSave} now={number} dispatch={Dispatch<GardenAction>} />`, `<GardenDevBar onSeed onLeaves onCrow />`.

- [ ] **Step 1: Barre de développement**

`src/garden/ui/GardenDevBar.tsx` :

```tsx
const button =
  "rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-300 ring-1 ring-amber-500/30 hover:bg-amber-500/25";

export function GardenDevBar({
  onSeed,
  onLeaves,
  onCrow,
}: {
  onSeed: () => void;
  onLeaves: () => void;
  onCrow: () => void;
}) {
  return (
    <div className="absolute bottom-3 left-3 z-10 flex flex-col items-start gap-1">
      <button onClick={onSeed} className={button}>
        Dev : semer des plantes de démonstration
      </button>
      <button onClick={onLeaves} className={button}>
        Dev : faire tomber des feuilles
      </button>
      <button onClick={onCrow} className={button}>
        Dev : faire venir un corbeau
      </button>
    </div>
  );
}
```

- [ ] **Step 2: `FieldView`**

`src/garden/ui/FieldView.tsx` :

```tsx
import { useCallback, useEffect, useRef, useState, type Dispatch, type PointerEvent } from "react";
import { toast } from "sonner";
import type { Effect, Tool } from "../core/actions";
import { planAction } from "../core/actions";
import { withDemoPlants } from "../core/demo";
import { planMove } from "../core/move";
import { HOUR } from "../core/time";
import { isMovable } from "../core/tiles";
import type { GardenSave, TileKey } from "../core/types";
import { isRaining } from "../core/weather";
import { createGardenScene, type GardenScene } from "../render/createGardenScene";
import type { PickResult } from "../render/picking";
import type { GardenAction } from "./gardenReducer";
import { GardenDevBar } from "./GardenDevBar";
import { describeTarget, toneOf } from "./hover";
import { SidePanel } from "./SidePanel";
import { TileTooltip } from "./TileTooltip";
import { ToolBar } from "./ToolBar";
import { useCrows } from "./useCrows";

const DRAG_PX = 6;
const FLASH_MS = 1600;

interface Pointer {
  x: number;
  y: number;
  pick: PickResult | null;
}

export function FieldView({
  save,
  now,
  dispatch,
}: {
  save: GardenSave;
  now: number;
  dispatch: Dispatch<GardenAction>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<GardenScene | null>(null);
  const saveRef = useRef<GardenSave | null>(save);
  const down = useRef<Pointer | null>(null);
  const drag = useRef<{ from: TileKey; to: TileKey | null; reason: string | null } | null>(null);
  const [tool, setTool] = useState<Tool>("main");
  const [dragging, setDragging] = useState(false);
  const [hover, setHover] = useState<Pointer | null>(null);
  const [flash, setFlash] = useState<{ x: number; y: number; text: string } | null>(null);
  const { spawn } = useCrows(sceneRef, saveRef);

  useEffect(() => {
    const scene = createGardenScene(canvasRef.current!, "garden");
    sceneRef.current = scene;
    scene.start();
    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    saveRef.current = save;
    sceneRef.current?.sync(save, now);
  }, [save, now]);

  useEffect(() => {
    if (!flash) return;
    const id = setTimeout(() => setFlash(null), FLASH_MS);
    return () => clearTimeout(id);
  }, [flash]);

  // vue dérivée à chaque rendu : suit la sauvegarde, l'outil et l'heure
  const view = hover?.pick && !dragging ? describeTarget(save, hover.pick.target, tool, now) : null;
  const shown = view && !(view.info.kind === "grass" && !view.plan) ? view : null;

  useEffect(() => {
    const interaction = sceneRef.current?.interaction;
    if (!interaction || dragging) return;
    interaction.setHighlight(
      shown ? (hover?.pick?.ground?.key ?? null) : null,
      shown ? toneOf(shown) : undefined,
    );
  }, [shown, hover, dragging]);

  const local = (e: PointerEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const runEffects = useCallback((effects: Effect[]) => {
    const interaction = sceneRef.current?.interaction;
    for (const fx of effects) {
      if (fx.kind === "burst") interaction?.burst(fx.key, fx.particle);
      else if (fx.kind === "chase") interaction?.chaseCrow(fx.id);
      else toast(fx.text);
    }
  }, []);

  function onPointerMove(e: PointerEvent<HTMLCanvasElement>) {
    const interaction = sceneRef.current?.interaction;
    if (!interaction) return;
    const at = local(e);
    const start = down.current;
    const startKey = start?.pick?.target.kind === "tile" ? start.pick.target.key : null;
    if (
      start &&
      !drag.current &&
      tool === "main" &&
      startKey &&
      isMovable(save.tiles[startKey]) &&
      Math.hypot(at.x - start.x, at.y - start.y) > DRAG_PX
    ) {
      drag.current = { from: startKey, to: null, reason: null };
      interaction.lift(startKey);
      setDragging(true);
      setHover(null);
    }
    if (drag.current) {
      const pick = interaction.pickAt(e.clientX, e.clientY, drag.current.from);
      if (!pick?.ground) return;
      interaction.moveLifted(pick.ground.x, pick.ground.z);
      const result = planMove(save, drag.current.from, pick.ground.key);
      drag.current.to = pick.ground.key;
      drag.current.reason = result.ok ? null : result.reason;
      interaction.setHighlight(pick.ground.key, result.ok ? "ok" : "no");
      return;
    }
    setHover({ ...at, pick: interaction.pickAt(e.clientX, e.clientY) });
  }

  function onPointerDown(e: PointerEvent<HTMLCanvasElement>) {
    const interaction = sceneRef.current?.interaction;
    if (!interaction || e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    down.current = { ...local(e), pick: interaction.pickAt(e.clientX, e.clientY) };
  }

  function onPointerUp(e: PointerEvent<HTMLCanvasElement>) {
    const interaction = sceneRef.current?.interaction;
    const start = down.current;
    down.current = null;
    if (!interaction) return;
    if (drag.current) {
      const { from, to, reason } = drag.current;
      drag.current = null;
      setDragging(false);
      interaction.drop();
      interaction.setHighlight(null);
      if (to && to !== from) {
        if (reason) setFlash({ ...local(e), text: reason });
        else dispatch({ type: "move", from, to });
      }
      return;
    }
    if (!start?.pick) return;
    const plan = planAction(save, start.pick.target, tool, Date.now());
    if (!plan?.ok) return;
    const out = plan.apply();
    dispatch({ type: "set", save: out.save });
    runEffects(out.effects);
  }

  function onPointerLeave() {
    if (drag.current) return;
    setHover(null);
  }

  const cursor = shown?.plan?.ok ? "pointer" : shown?.movable ? "grab" : "default";

  return (
    <div className="relative flex-1 select-none overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        style={{ cursor: dragging ? "grabbing" : cursor }}
        onPointerMove={onPointerMove}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
      />
      <SidePanel save={save} raining={isRaining(now)} />
      {shown && hover && <TileTooltip x={hover.x} y={hover.y} view={shown} />}
      {flash && (
        <div
          className="pointer-events-none absolute translate-x-3.5 translate-y-3.5 rounded-lg border border-amber-300/35 bg-[#1a1216]/90 px-2.5 py-1 text-xs text-[#d98a7a]"
          style={{ left: flash.x, top: flash.y }}
        >
          {flash.text}
        </div>
      )}
      <ToolBar tool={tool} onSelect={setTool} />
      {import.meta.env.DEV && (
        <GardenDevBar
          onSeed={() => dispatch({ type: "set", save: withDemoPlants(save, Date.now()) })}
          onLeaves={() => {
            const t = Date.now();
            dispatch({ type: "set", save: { ...save, leaves: { checkedAt: t - 12 * HOUR } } });
            dispatch({ type: "tick", now: t });
          }}
          onCrow={spawn}
        />
      )}
    </div>
  );
}
```

Notes pour l'implémenteur :

- Les refs (`drag`, `down`) ne sont lues que dans les gestionnaires ; le rendu lit l'état `dragging` (règle `react-hooks/refs`).
- `setTool` est stable (fonction de `useState`), donc l'effet clavier de `ToolBar` ne se réinscrit pas à chaque rendu.

- [ ] **Step 3: `GardenApp`**

Remplacer le contenu de `src/garden/ui/GardenApp.tsx` :

```tsx
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useReducer, useRef, useState } from "react";
import { toast, Toaster } from "sonner";
import { isBrowserPreview } from "@/lib/devTauriShim";
import { hasWebgl } from "../render/webgl";
import { createSaveScheduler, loadGarden } from "../storage/gardenStore";
import { DiscoveryToast } from "./DiscoveryToast";
import { FieldView } from "./FieldView";
import { gardenReducer, INITIAL_GARDEN } from "./gardenReducer";
import { announceGardenClosed, announceGardenOpened } from "./gardenWindow";

const TICK_MS = 60_000;

export default function GardenApp() {
  const [saver] = useState(() => createSaveScheduler());
  const [webglOk] = useState(hasWebgl);
  const [state, dispatch] = useReducer(gardenReducer, INITIAL_GARDEN);
  const [now, setNow] = useState(Date.now);
  const toastedSeq = useRef(0);

  useEffect(() => {
    let alive = true;
    loadGarden().then(({ save, recovered }) => {
      if (!alive) return;
      if (recovered)
        toast.error(
          "Sauvegarde du Potager illisible : une copie a été mise de côté et un nouveau champ a été créé.",
        );
      dispatch({ type: "load", save });
      dispatch({ type: "tick", now: Date.now() });
    });
    void announceGardenOpened();
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      dispatch({ type: "tick", now: t });
    }, TICK_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (state.save) saver.schedule(state.save);
  }, [state.save, saver]);

  useEffect(() => {
    const { seq, found } = state.discoveries;
    if (seq === toastedSeq.current) return;
    toastedSeq.current = seq;
    toast(<DiscoveryToast found={found} />, { duration: 6000 });
  }, [state.discoveries]);

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
      <Toaster theme="dark" position="top-center" />
      <nav className="flex gap-1 border-b border-amber-300/25 px-4 pt-2">
        <span className="rounded-t-lg bg-amber-300/10 px-4 py-2 font-serif text-lg font-semibold text-[#f3dca0] shadow-[inset_0_-2px_0_#d9b46a]">
          Champ
        </span>
      </nav>
      {!webglOk ? (
        <div className="flex flex-1 items-center justify-center p-6 text-center text-sm">
          Le Potager a besoin de WebGL, qui n'est pas disponible sur cet appareil.
        </div>
      ) : (
        state.save && <FieldView save={state.save} now={now} dispatch={dispatch} />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Vérifier types, lint et tests**

Run: `bunx tsc --noEmit && bun run lint && bun run test`
Expected: aucun échec.

- [ ] **Step 5: Commit**

```bash
git add src/garden/ui
git commit -m "feat(potager): onglet Champ jouable dans la fenêtre Potager"
```

---

### Task 15: Vérification dans l'aperçu navigateur

**Files:** aucun, sauf corrections trouvées pendant la vérification (et `src/lib/accents.test.ts` si un mot non accentué est repéré).

- [ ] **Step 1: Démarrer l'aperçu**

Lancer le serveur `vite` via `preview_start` (`.claude/launch.json` ; `vite-alt` sur le port 4180 si 1420 est pris), puis ouvrir `/?window=garden` dans le panneau navigateur.

- [ ] **Step 2: Parcourir les gestes**

Vérifier, avec `read_page`, `computer` et des captures :

1. La hotbar affiche 6 outils avec icônes ; les touches 1 à 6 et Échap changent l'outil.
2. Creuser sur la terre : trou et éclats de terre ; sur l'herbe : infobulle rouge "Creuser : seulement dans la terre".
3. Semer sur un trou : graine, pile "Graines" décrémentée ; sur la terre libre : "creuse d'abord un trou".
4. La graine non arrosée penche et sa case est craquelée ; Arroser : éclats d'eau, plante redressée, terre foncée, infobulle "Mouillée encore 6 h".
5. "Dev : semer des plantes de démonstration" puis `tick` : toast "Nouvelles découvertes" groupé.
6. Main sur un cosmos éclos : cueilli, panier rempli, toast ; Main sur un dahlia : "tige trop épaisse, prends le sécateur" ; Sécateur sur le dahlia : cueilli.
7. "Dev : faire tomber des feuilles" : jusqu'à 4 tas ; Râteau : tas retiré, compteur "Tas ramassés" incrémenté ; Main sur un tas : "prends le râteau".
8. Main, maintenir et glisser une plante vers l'herbe : refus affiché, la plante revient ; vers une terre libre : déplacée. Glisser une lanterne sur l'herbe : déplacée.
9. "Dev : faire venir un corbeau" : clic avec n'importe quel outil, envol et plumes, compteur "Corbeaux chassés" incrémenté.
10. `read_console_messages` : aucune erreur.
11. Recharger la page : l'état (panier, compteurs, plantes déplacées) est conservé.

- [ ] **Step 3: Vérifier le fond passif**

Ouvrir `/` : le fond affiche les mêmes tas de feuilles et la terre sèche, sans surbrillance ni infobulle.

- [ ] **Step 4: Vérification finale**

Run: `bun run test && bunx tsc --noEmit && bun run lint`
Expected: aucun échec.

- [ ] **Step 5: Commit des corrections éventuelles**

```bash
git add src/garden src/lib/accents.test.ts
git commit -m "fix(potager): corrections de l'onglet Champ après vérification"
```

(Ne rien commiter si aucune correction n'a été nécessaire. Ne pas inclure les fichiers du bouton "Mon potager" non commités par ailleurs : `src/components/GardenButton.tsx`, `src/components/PixelSprite.tsx`, `src/components/gardenButtonSprites.ts`, `src/App.tsx`, `src/index.css`, `src/pages/MainPage.tsx`.)
