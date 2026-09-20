# Potager - Sous-projet 4 : sachets et pity visible

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Donner au Potager sa source de graines : un sachet gratuit par jour, un tirage complet avec deux jauges de pity affichées et expliquées, et une page Sachets.

**Architecture:** Toute la logique est pure dans `src/garden/core/` (jauges, tirage, sachet quotidien), testée avec une source de hasard injectée. L'interface ajoute un onglet Sachets à la fenêtre Potager et remplace le compteur de graines du Champ par un détail par rareté. Aucun rendu three.js n'est touché.

**Tech Stack:** TypeScript, React 19, `motion/react` pour les animations, Vitest, Tailwind.

**Spec:** [docs/superpowers/specs/2026-09-20-potager-sachets-design.md](../specs/2026-09-20-potager-sachets-design.md)

## Global Constraints

- Tout texte affiché est en français **correctement accentué** ("rareté", "nouveauté", "légendaire", "découverte"). Les identifiants restent ASCII. `src/lib/accents.test.ts` est le garde-fou : on complète sa liste `WRONG`, on ne la désactive jamais.
- `src/garden/core/` ne doit importer ni React ni three.js.
- Aucun import depuis `src/game/` (le jeu des canards) : `src/garden/core/pity.ts` est indépendant de `src/game/pity.ts`.
- Le hasard est toujours injecté (`Rng = () => number`), jamais `Math.random` dans `core/`.
- La sauvegarde reste en `version: 1`. Une sauvegarde existante doit continuer à se charger.
- Commandes de vérification : `bun run test`, `bunx tsc --noEmit`, `bun run lint`.
- Un fichier par composant React ; les helpers purs vivent dans des modules voisins.

## Écarts assumés par rapport à la spec

- La spec prévoit `core/catalog/entries.ts`. La liste à plat existe déjà : `CATALOG_ENTRIES` dans `core/catalog/species.ts`. On y ajoute simplement l'index par rareté, sans créer de fichier.
- `openSachet(save, rng)` ne prend pas `now` : il n'en avait aucun usage et le lint refuse un paramètre mort.
- `SeedReveal` ne reçoit pas `seq` : la page le remonte avec `key={opened.seq}`, ce qui remet l'état à zéro sans `setState` dans un effet (interdit par `react-hooks/set-state-in-effect`).
- Deux petits modules en plus, pour suivre la règle "les helpers purs sortent des composants" : `ui/sachets/reveal.ts` (délais de retournement, testé) et `ui/sachets/devSachets.ts` (les deux transformations des boutons de développement).
- La spec écrit l'infobulle du trou "Plus de graines rares" quand la rareté choisie est vide. Comme le semis retombe alors sur la plus ancienne graine restante, l'infobulle annonce la graine **réellement semée** ("Prêt à recevoir une graine commune") et ne dit "Plus de graines" que si l'inventaire est vide. Sinon elle mentirait.

---

### Task 1 : Modèle - `pending` devient une liste de types

**Files:**

- Modify: `src/garden/core/types.ts`
- Modify: `src/garden/core/starter.ts:31`
- Modify: `src/garden/core/save.ts`
- Test: `src/garden/core/save.test.ts`

**Interfaces:**

- Produces: `type SachetType = "quotidien"` ; `GardenSave["sachets"] = { lastDailyAt: number; pending: SachetType[] }`.

- [ ] **Step 1: Écrire les tests qui échouent**

Dans `src/garden/core/save.test.ts`, remplacer l'assertion `expect(s.sachets.pending).toBe(1);` par `expect(s.sachets.pending).toEqual(["quotidien"]);`, puis ajouter dans le `describe("parseSave")` :

```ts
it("convertit un pending numérique des anciennes sauvegardes", () => {
  const old = { ...createStarterSave(), sachets: { lastDailyAt: 123, pending: 3 } };
  expect(parseSave(old)?.sachets).toEqual({
    lastDailyAt: 123,
    pending: ["quotidien", "quotidien", "quotidien"],
  });
});

it("laisse intact un pending déjà en tableau, et rend une liste vide sinon", () => {
  const s = createStarterSave();
  expect(parseSave({ ...s, sachets: { lastDailyAt: 1, pending: [] } })?.sachets.pending).toEqual(
    [],
  );
  expect(parseSave({ ...s, sachets: { lastDailyAt: 1, pending: 0 } })?.sachets.pending).toEqual([]);
  expect(parseSave({ ...s, sachets: { lastDailyAt: 1 } })?.sachets.pending).toEqual([]);
});
```

- [ ] **Step 2: Lancer les tests pour les voir échouer**

Run: `bunx vitest run src/garden/core/save.test.ts`
Expected: FAIL (`pending` vaut encore `1`, la conversion n'existe pas).

- [ ] **Step 3: Changer le type**

Dans `src/garden/core/types.ts`, ajouter le type et modifier le champ :

```ts
export type SachetType = "quotidien";
```

```ts
  sachets: { lastDailyAt: number; pending: SachetType[] };
```

- [ ] **Step 4: Mettre à jour la sauvegarde de départ**

Dans `src/garden/core/starter.ts` :

```ts
    sachets: { lastDailyAt: 0, pending: ["quotidien"] },
```

- [ ] **Step 5: Convertir à la lecture**

Dans `src/garden/core/save.ts`, importer `SachetType` et, juste avant le `return`, ajouter :

```ts
// pending était un nombre avant le sous-projet 4 : le validateur ne regarde pas
// l'intérieur de sachets, une sauvegarde de développement casserait en silence.
const count = typeof sachets.pending === "number" ? Math.max(0, Math.floor(sachets.pending)) : 0;
const pending: SachetType[] = Array.isArray(sachets.pending)
  ? (sachets.pending as SachetType[])
  : Array.from({ length: count }, () => "quotidien");
```

puis remplacer le `return` par :

```ts
return {
  ...(raw as unknown as GardenSave),
  leaves,
  sachets: { lastDailyAt: Number(sachets.lastDailyAt) || 0, pending },
};
```

- [ ] **Step 6: Lancer les tests**

Run: `bunx vitest run src/garden/core/save.test.ts && bunx tsc --noEmit`
Expected: PASS. `tsc` signale les autres usages de `pending` s'il en reste ; il n'y en a pas encore.

- [ ] **Step 7: Commit**

```bash
git add src/garden/core/types.ts src/garden/core/starter.ts src/garden/core/save.ts src/garden/core/save.test.ts
git commit -m "feat(potager): sachets en attente stockés par type"
```

---

### Task 2 : Les deux jauges de pity

**Files:**

- Create: `src/garden/core/pity.ts`
- Test: `src/garden/core/pity.test.ts`

**Interfaces:**

- Produces: `interface Gauge { base; step; cap }`, `GAUGES.discovery`, `GAUGES.rare`, `chanceOf(gauge, dry)`, `advance(gauge, dry)`, `maxDry(gauge)`.

- [ ] **Step 1: Écrire le test qui échoue**

Create `src/garden/core/pity.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { advance, chanceOf, GAUGES, maxDry } from "./pity";

describe("jauges de pity", () => {
  it("part de 25 % et monte de 2 points par graine sèche", () => {
    expect(chanceOf(GAUGES.discovery, 0)).toBeCloseTo(0.25);
    expect(chanceOf(GAUGES.discovery, 1)).toBeCloseTo(0.27);
    expect(chanceOf(GAUGES.discovery, 10)).toBeCloseTo(0.45);
    expect(chanceOf(GAUGES.rare, 5)).toBeCloseTo(0.35);
  });

  it("plafonne à 75 % (nouveauté) et 70 % (rareté)", () => {
    expect(chanceOf(GAUGES.discovery, 25)).toBeCloseTo(0.75);
    expect(chanceOf(GAUGES.discovery, 999)).toBeCloseTo(0.75);
    expect(chanceOf(GAUGES.rare, 23)).toBeCloseTo(0.7);
    expect(chanceOf(GAUGES.rare, 999)).toBeCloseTo(0.7);
  });

  it("un compteur négatif ou absent vaut la base", () => {
    expect(chanceOf(GAUGES.rare, -3)).toBeCloseTo(0.25);
  });

  it("avance d'une graine sans dépasser le compteur utile", () => {
    expect(advance(GAUGES.discovery, 0)).toBe(1);
    expect(maxDry(GAUGES.discovery)).toBe(25);
    expect(maxDry(GAUGES.rare)).toBe(23);
    expect(advance(GAUGES.discovery, 25)).toBe(25);
    expect(advance(GAUGES.rare, 999)).toBe(23);
  });
});
```

- [ ] **Step 2: Lancer le test pour le voir échouer**

Run: `bunx vitest run src/garden/core/pity.test.ts`
Expected: FAIL, "Cannot find module './pity'".

- [ ] **Step 3: Écrire `pity.ts`**

Create `src/garden/core/pity.ts` :

```ts
// Pity du Potager, sans aucun lien avec src/game/pity.ts (le jeu des canards).
// Les jauges sont stockées en nombre de graines sèches, jamais en pourcentage :
// la règle affichée et la règle appliquée sont la même.
export interface Gauge {
  base: number;
  step: number;
  cap: number;
}

export const GAUGES = {
  discovery: { base: 0.25, step: 0.02, cap: 0.75 },
  rare: { base: 0.25, step: 0.02, cap: 0.7 },
} as const satisfies Record<string, Gauge>;

export const maxDry = (g: Gauge): number => Math.ceil((g.cap - g.base) / g.step);

export const chanceOf = (g: Gauge, dry: number): number =>
  Math.min(g.base + g.step * Math.max(0, dry), g.cap);

export const advance = (g: Gauge, dry: number): number => Math.min(dry + 1, maxDry(g));
```

- [ ] **Step 4: Lancer le test**

Run: `bunx vitest run src/garden/core/pity.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/garden/core/pity.ts src/garden/core/pity.test.ts
git commit -m "feat(potager): jauges de pity, nouveauté et rareté"
```

---

### Task 3 : Index du catalogue par rareté et ensemble des entrées connues

**Files:**

- Modify: `src/garden/core/catalog/species.ts` (fin du fichier)
- Modify: `src/garden/core/discovery.ts`
- Test: `src/garden/core/catalog/catalog.test.ts`, `src/garden/core/discovery.test.ts`

**Interfaces:**

- Consumes: `CATALOG_ENTRIES` (déjà présent).
- Produces: `entriesOfRarity(rarity): CatalogEntry[]`, `type CatalogEntry = { species: SpeciesId; color: ColorId; rarity: Rarity }`, `knownEntries(save): Set<string>`.

- [ ] **Step 1: Écrire les tests qui échouent**

Dans `src/garden/core/catalog/catalog.test.ts`, ajouter :

```ts
describe("entriesOfRarity", () => {
  it("répartit les 65 entrées en 26 / 18 / 11 / 10", () => {
    expect(entriesOfRarity("commune")).toHaveLength(26);
    expect(entriesOfRarity("rare")).toHaveLength(18);
    expect(entriesOfRarity("epique")).toHaveLength(11);
    expect(entriesOfRarity("legendaire")).toHaveLength(10);
    expect(entriesOfRarity("commune").every((e) => e.rarity === "commune")).toBe(true);
  });

  it("l'index couvre exactement le catalogue", () => {
    const total = (["commune", "rare", "epique", "legendaire"] as const).flatMap(entriesOfRarity);
    expect(total).toHaveLength(CATALOG_ENTRIES.length);
  });
});
```

(compléter l'import en tête du fichier avec `entriesOfRarity` et `CATALOG_ENTRIES`.)

Dans `src/garden/core/discovery.test.ts`, ajouter :

```ts
describe("knownEntries", () => {
  it("réunit l'Herbier, les graines en inventaire et les plantes en terre", () => {
    const base = createStarterSave();
    const save: GardenSave = {
      ...base,
      herbier: { "aster:violet": { discoveredAt: 1, pressed: 0, variants: [] } },
      inventory: {
        ...base.inventory,
        seeds: [{ species: "dahlia", color: "red", rarity: "commune" }],
      },
      tiles: {
        ...base.tiles,
        "1,1": {
          kind: "plant",
          seed: { species: "cosmos", color: "white", rarity: "commune" },
          sownAt: 0,
          watered: [],
        },
      },
    };
    const known = knownEntries(save);
    expect(known.has("aster:violet")).toBe(true);
    expect(known.has("dahlia:red")).toBe(true);
    expect(known.has("cosmos:white")).toBe(true);
    expect(known.has("tournesol:yellow")).toBe(false);
  });
});
```

(compléter les imports : `knownEntries` depuis `./discovery`, `createStarterSave` depuis `./starter`, `type GardenSave` depuis `./types`.)

- [ ] **Step 2: Lancer les tests pour les voir échouer**

Run: `bunx vitest run src/garden/core/catalog/catalog.test.ts src/garden/core/discovery.test.ts`
Expected: FAIL, `entriesOfRarity` et `knownEntries` n'existent pas.

- [ ] **Step 3: Ajouter l'index par rareté**

À la fin de `src/garden/core/catalog/species.ts` :

```ts
export interface CatalogEntry {
  species: SpeciesId;
  color: ColorId;
  rarity: Rarity;
}

const BY_RARITY = CATALOG_ENTRIES.reduce<Record<string, CatalogEntry[]>>((acc, e) => {
  (acc[e.rarity] ??= []).push(e);
  return acc;
}, {});

export const entriesOfRarity = (rarity: Rarity): CatalogEntry[] => BY_RARITY[rarity] ?? [];
```

- [ ] **Step 4: Ajouter `knownEntries`**

Dans `src/garden/core/discovery.ts`, après `entryId` :

```ts
// Une entrée déjà tenue en graine ou déjà en terre ne doit pas ressortir comme
// nouveauté : on gaspillerait une remise à zéro de la jauge sans que ça se voie.
export function knownEntries(save: GardenSave): Set<string> {
  const known = new Set(Object.keys(save.herbier));
  for (const seed of save.inventory.seeds) known.add(entryId(seed.species, seed.color));
  for (const tile of Object.values(save.tiles))
    if (tile?.kind === "plant") known.add(entryId(tile.seed.species, tile.seed.color));
  return known;
}
```

- [ ] **Step 5: Lancer les tests**

Run: `bunx vitest run src/garden/core/catalog src/garden/core/discovery.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/garden/core/catalog/species.ts src/garden/core/catalog/catalog.test.ts src/garden/core/discovery.ts src/garden/core/discovery.test.ts
git commit -m "feat(potager): index du catalogue par rareté et entrées connues"
```

---

### Task 4 : Tirage d'une graine de sachet

**Files:**

- Modify: `src/garden/core/rolls.ts`
- Test: `src/garden/core/rolls.test.ts`

**Interfaces:**

- Consumes: `chanceOf`, `GAUGES` (Task 2) ; `entriesOfRarity`, `knownEntries` (Task 3).
- Produces: `VARIANT_CHANCE`, `rollVariant(rng): VariantId | undefined`, `rollSachetSeed(known: Set<string>, pity: { dryDiscovery: number; dryRare: number }, rng): Seed`.

Ordre de consommation du hasard, fixé pour les tests : rareté, poids de rareté (si rare ou mieux), nouveauté, poids de promotion (si promotion), index dans la réserve, variante, choix de la variante.

- [ ] **Step 1: Écrire les tests qui échouent**

Dans `src/garden/core/rolls.test.ts`, ajouter (le helper `seq` existe déjà en haut du fichier) :

```ts
describe("rollSachetSeed", () => {
  const none = new Set<string>();
  const pity = { dryDiscovery: 0, dryRare: 0 };
  // Ordre des tirages : rareté, poids (seulement si rare ou mieux), nouveauté,
  // poids de promotion (seulement si promotion), index, variante.
  // `seq` boucle sur ses valeurs : une séquence trop longue ou trop courte passe inaperçue.
  const noVariant = 0.99;

  it("sous 25 % la graine est commune, au-dessus elle est rare ou mieux", () => {
    expect(rollSachetSeed(none, pity, seq(0.24, 0, 0, 0, noVariant)).rarity).toBe("rare");
    expect(rollSachetSeed(none, pity, seq(0.25, 0, 0, noVariant)).rarity).toBe("commune");
  });

  it("répartit rare, épique et légendaire selon les poids du catalogue", () => {
    const at = (weight: number) =>
      rollSachetSeed(none, pity, seq(0, weight, 0, 0, noVariant)).rarity;
    expect(at(0)).toBe("rare");
    expect(at(25 / 40 + 0.01)).toBe("epique");
    expect(at(0.99)).toBe("legendaire");
  });

  it("suit la jauge de rareté quand elle est montée", () => {
    const hot = { dryDiscovery: 0, dryRare: 10 }; // 45 %
    expect(rollSachetSeed(none, hot, seq(0.44, 0, 0, 0, noVariant)).rarity).toBe("rare");
    expect(rollSachetSeed(none, hot, seq(0.45, 0, 0, noVariant)).rarity).toBe("commune");
  });

  it("pioche une inconnue quand le jet de nouveauté réussit", () => {
    const known = new Set(
      entriesOfRarity("commune")
        .slice(1)
        .map((e) => entryId(e.species, e.color)),
    );
    const first = entriesOfRarity("commune")[0];
    const seed = rollSachetSeed(known, pity, seq(0.99, 0.24, 0, noVariant));
    expect(entryId(seed.species, seed.color)).toBe(entryId(first.species, first.color));
  });

  it("pioche une connue quand le jet de nouveauté échoue", () => {
    const first = entriesOfRarity("commune")[0];
    const known = new Set([entryId(first.species, first.color)]);
    const seed = rollSachetSeed(known, pity, seq(0.99, 0.99, 0, noVariant));
    expect(entryId(seed.species, seed.color)).toBe(entryId(first.species, first.color));
  });

  it("début de partie : jet manqué mais aucune connue, la graine est quand même une nouveauté", () => {
    const seed = rollSachetSeed(none, pity, seq(0.99, 0.99, 0, noVariant));
    expect(seed.rarity).toBe("commune");
    expect(
      entriesOfRarity("commune").some((e) => e.color === seed.color && e.species === seed.species),
    ).toBe(true);
  });

  it("promeut la graine quand la rareté tirée n'a plus d'inconnue", () => {
    const known = new Set(entriesOfRarity("commune").map((e) => entryId(e.species, e.color)));
    // rareté manquée (commune), nouveauté réussie, promotion pondérée sur rare/épique/légendaire
    const seed = rollSachetSeed(known, pity, seq(0.99, 0, 0, 0, noVariant));
    expect(seed.rarity).not.toBe("commune");
  });

  it("Herbier complet : la graine reste dans sa rareté", () => {
    const all = new Set(CATALOG_ENTRIES.map((e) => entryId(e.species, e.color)));
    const seed = rollSachetSeed(all, pity, seq(0.99, 0, 0, noVariant));
    expect(seed.rarity).toBe("commune");
  });
});

describe("rollVariant", () => {
  it("2 % de chance, les trois variantes à parts égales", () => {
    expect(VARIANT_CHANCE).toBe(0.02);
    expect(rollVariant(seq(0.02))).toBeUndefined();
    expect(rollVariant(seq(0.019, 0))).toBe("givree");
    expect(rollVariant(seq(0, 0.4))).toBe("doree");
    expect(rollVariant(seq(0, 0.9))).toBe("lumineuse");
  });
});
```

(compléter les imports du fichier : `rollSachetSeed`, `rollVariant`, `VARIANT_CHANCE` depuis `./rolls`, `entriesOfRarity`, `CATALOG_ENTRIES` depuis `./catalog/species`, `entryId` depuis `./discovery`.)

- [ ] **Step 2: Lancer les tests pour les voir échouer**

Run: `bunx vitest run src/garden/core/rolls.test.ts`
Expected: FAIL, `rollSachetSeed` n'existe pas.

- [ ] **Step 3: Écrire le tirage**

Dans `src/garden/core/rolls.ts`, ajouter les imports (`entriesOfRarity`, `type CatalogEntry`, `entryId`, `chanceOf`, `GAUGES`, `type VariantId`) puis :

```ts
export const VARIANT_CHANCE = 0.02;
const VARIANTS: VariantId[] = ["givree", "doree", "lumineuse"];
const RARITIES: Rarity[] = ["commune", "rare", "epique", "legendaire"];

const pick = <T>(list: T[], rng: Rng): T =>
  list[Math.min(list.length - 1, Math.floor(rng() * list.length))];

export function rollVariant(rng: Rng): VariantId | undefined {
  return rng() < VARIANT_CHANCE ? pick(VARIANTS, rng) : undefined;
}

function weightedRarity(pool: Rarity[], rng: Rng): Rarity {
  const total = pool.reduce((sum, r) => sum + RARITY_WEIGHT[r], 0);
  let r = rng() * total;
  return pool.find((x) => (r -= RARITY_WEIGHT[x]) < 0) ?? pool[pool.length - 1];
}

export interface PityState {
  dryDiscovery: number;
  dryRare: number;
}

// Rareté d'abord, nouveauté ensuite : la rareté annoncée est celle tirée, sauf
// en fin de collection où la graine est promue vers une rareté qui a encore des inconnues.
export function rollSachetSeed(known: Set<string>, pity: PityState, rng: Rng): Seed {
  let rarity: Rarity =
    rng() < chanceOf(GAUGES.rare, pity.dryRare)
      ? weightedRarity(["rare", "epique", "legendaire"], rng)
      : "commune";

  const unknownOf = (r: Rarity): CatalogEntry[] =>
    entriesOfRarity(r).filter((e) => !known.has(entryId(e.species, e.color)));

  let pool = unknownOf(rarity);
  if (rng() < chanceOf(GAUGES.discovery, pity.dryDiscovery)) {
    if (!pool.length) {
      const left = RARITIES.filter((r) => unknownOf(r).length);
      if (left.length) {
        rarity = weightedRarity(left, rng);
        pool = unknownOf(rarity);
      }
    }
  } else {
    const seen = entriesOfRarity(rarity).filter((e) => known.has(entryId(e.species, e.color)));
    if (seen.length) pool = seen;
  }
  if (!pool.length) pool = entriesOfRarity(rarity);

  const entry = pick(pool, rng);
  const variant = rollVariant(rng);
  return { species: entry.species, color: entry.color, rarity, ...(variant && { variant }) };
}
```

Supprimer le commentaire « Provisoire : le tirage complet des graines arrive avec les sachets (sous-projet 4). » au-dessus de `rollPickSeed`.

- [ ] **Step 4: Lancer les tests**

Run: `bunx vitest run src/garden/core/rolls.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/garden/core/rolls.ts src/garden/core/rolls.test.ts
git commit -m "feat(potager): tirage d'une graine de sachet"
```

---

### Task 5 : Variantes distribuées par les trois sources

**Files:**

- Modify: `src/garden/core/rolls.ts` (`rollPickSeed`, `rollPressSeed`)
- Test: `src/garden/core/rolls.test.ts`

**Interfaces:**

- Consumes: `rollVariant` (Task 4).

- [ ] **Step 1: Écrire les tests qui échouent**

Dans `src/garden/core/rolls.test.ts`, ajouter :

```ts
describe("variantes des graines de cueillette et de pressage", () => {
  const cosmos: Flower = { species: "cosmos", color: "pink", rarity: "commune" };

  it("la cueillette peut donner une variante, 2 % du temps", () => {
    // tirage de la graine, variante, choix de la variante
    expect(rollPickSeed(cosmos, false, seq(0, 0.01, 0))?.variant).toBe("givree");
    expect(rollPickSeed(cosmos, false, seq(0, 0.5, 0))?.variant).toBeUndefined();
  });

  it("le pressage aussi", () => {
    // tirage, couleur, variante, choix de la variante
    expect(rollPressSeed(cosmos, seq(0, 0, 0.01, 0.9))?.variant).toBe("lumineuse");
    expect(rollPressSeed(cosmos, seq(0, 0, 0.5))?.variant).toBeUndefined();
  });
});
```

Adapter le test existant « la graine reprend espèce, couleur et rareté, sans variante » : avec `() => 0` la variante sort maintenant. Le remplacer par :

```ts
it("la graine reprend espèce, couleur et rareté de la fleur", () => {
  expect(rollPickSeed(flower, false, seq(0, 0.5))).toEqual({
    species: "dahlia",
    color: "red",
    rarity: "rare",
  });
});
```

- [ ] **Step 2: Lancer les tests pour les voir échouer**

Run: `bunx vitest run src/garden/core/rolls.test.ts`
Expected: FAIL, les graines n'ont pas de variante.

- [ ] **Step 3: Brancher `rollVariant`**

Dans `rollPickSeed` :

```ts
export function rollPickSeed(flower: Flower, beautiful: boolean, rng: Rng): Seed | null {
  if (rng() >= pickSeedChance(beautiful)) return null;
  const variant = rollVariant(rng);
  return {
    species: flower.species,
    color: flower.color,
    rarity: flower.rarity,
    ...(variant && { variant }),
  };
}
```

Dans `rollPressSeed`, remplacer le `return` final par :

```ts
const variant = rollVariant(rng);
return {
  species: flower.species,
  color: pick.color,
  rarity: pick.rarity,
  ...(variant && { variant }),
};
```

(attention : la variable locale `pick` de `rollPressSeed` existe déjà et masquerait le helper `pick` ajouté en Task 4 ; renommer la locale en `chosen` dans `rollPressSeed`.)

- [ ] **Step 4: Lancer les tests**

Run: `bunx vitest run src/garden/core/rolls.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/garden/core/rolls.ts src/garden/core/rolls.test.ts
git commit -m "feat(potager): variantes tirées à la cueillette et au pressage"
```

---

### Task 6 : Sachet du jour et ouverture

**Files:**

- Create: `src/garden/core/sachets.ts`
- Modify: `src/garden/core/time.ts` (ajout de `startOfDay`)
- Modify: `src/garden/core/counters.ts` (compteur `sachetsOpened`)
- Test: `src/garden/core/sachets.test.ts`

**Interfaces:**

- Consumes: `rollSachetSeed`, `knownEntries`, `advance`, `GAUGES`.
- Produces: `MAX_PENDING = 7`, `SEEDS_PER_SACHET = 3`, `creditDaily(save, now): GardenSave`, `openSachet(save, now, rng): { save; seeds } | null`, `nextSachetAt(now): number`.

- [ ] **Step 1: Écrire les tests qui échouent**

Create `src/garden/core/sachets.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { creditDaily, MAX_PENDING, openSachet, SEEDS_PER_SACHET } from "./sachets";
import { createStarterSave } from "./starter";
import { startOfDay } from "./time";
import type { GardenSave, SachetType } from "./types";

const NOW = new Date(2026, 9, 20, 15, 30).getTime();
const day = (n: number) => startOfDay(NOW) - n * 24 * 3_600_000;

const withSachets = (lastDailyAt: number, pending: SachetType[]): GardenSave => ({
  ...createStarterSave(),
  sachets: { lastDailyAt, pending },
});

describe("creditDaily", () => {
  it("première partie : pose la date du jour sans rien créditer", () => {
    const s = creditDaily(withSachets(0, ["quotidien"]), NOW);
    expect(s.sachets).toEqual({ lastDailyAt: startOfDay(NOW), pending: ["quotidien"] });
  });

  it("crédite un sachet par jour écoulé", () => {
    expect(creditDaily(withSachets(day(1), []), NOW).sachets.pending).toEqual(["quotidien"]);
    expect(creditDaily(withSachets(day(3), []), NOW).sachets.pending).toHaveLength(3);
  });

  it("ne crédite rien deux fois le même jour et rend la même sauvegarde", () => {
    const s = withSachets(day(0), ["quotidien"]);
    expect(creditDaily(s, NOW)).toBe(s);
  });

  it("plafonne à 7 sachets en attente", () => {
    const s = creditDaily(withSachets(day(30), ["quotidien"]), NOW);
    expect(s.sachets.pending).toHaveLength(MAX_PENDING);
    expect(s.sachets.lastDailyAt).toBe(startOfDay(NOW));
  });

  it("horloge qui recule : recale la date sans créditer", () => {
    const future = startOfDay(NOW) + 5 * 24 * 3_600_000;
    const s = creditDaily(withSachets(future, []), NOW);
    expect(s.sachets).toEqual({ lastDailyAt: startOfDay(NOW), pending: [] });
  });

  it("passage à l'heure d'hiver : un jour de 25 h reste un jour", () => {
    const after = new Date(2026, 9, 25, 12).getTime();
    const before = startOfDay(new Date(2026, 9, 24, 12).getTime());
    expect(creditDaily(withSachets(before, []), after).sachets.pending).toHaveLength(1);
  });
});

describe("openSachet", () => {
  it("retire un sachet et rend trois graines rangées dans l'inventaire", () => {
    const base = withSachets(day(0), ["quotidien", "quotidien"]);
    const r = openSachet(base, NOW, () => 0.5)!;
    expect(r.seeds).toHaveLength(SEEDS_PER_SACHET);
    expect(r.save.sachets.pending).toEqual(["quotidien"]);
    expect(r.save.inventory.seeds).toHaveLength(base.inventory.seeds.length + SEEDS_PER_SACHET);
    expect(r.save.progress.counters.sachetsOpened).toBe(1);
  });

  it("sans sachet en attente, ne fait rien", () => {
    expect(openSachet(withSachets(day(0), []), NOW, () => 0.5)).toBeNull();
  });

  it("une nouveauté remet la jauge de découverte à zéro, une commune fait monter celle de rareté", () => {
    const base: GardenSave = {
      ...withSachets(day(0), ["quotidien"]),
      inventory: { ...createStarterSave().inventory, seeds: [] },
      pity: { dryDiscovery: 9, dryRare: 4 },
    };
    // 0.99 : pas de rare ; 0.99 : pas de nouveauté (mais rien n'est connu, donc nouveauté quand même)
    const r = openSachet(base, NOW, () => 0.99)!;
    expect(r.seeds.every((s) => s.rarity === "commune")).toBe(true);
    expect(r.save.pity.dryDiscovery).toBe(0);
    expect(r.save.pity.dryRare).toBe(7);
  });

  it("ne tire jamais deux fois la même entrée dans un sachet", () => {
    const base: GardenSave = {
      ...withSachets(day(0), ["quotidien"]),
      inventory: { ...createStarterSave().inventory, seeds: [] },
    };
    const r = openSachet(base, NOW, () => 0)!;
    const ids = r.seeds.map((s) => `${s.species}:${s.color}`);
    expect(new Set(ids).size).toBe(SEEDS_PER_SACHET);
  });
});
```

- [ ] **Step 2: Lancer les tests pour les voir échouer**

Run: `bunx vitest run src/garden/core/sachets.test.ts`
Expected: FAIL, "Cannot find module './sachets'".

- [ ] **Step 3: Ajouter `startOfDay` et le compteur**

Dans `src/garden/core/time.ts` :

```ts
export function startOfDay(t: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
```

Dans `src/garden/core/counters.ts`, ajouter `"sachetsOpened"` à l'union `CounterId`.

- [ ] **Step 4: Écrire `sachets.ts`**

Create `src/garden/core/sachets.ts` :

```ts
import { bump } from "./counters";
import { entryId, knownEntries } from "./discovery";
import { advance, GAUGES } from "./pity";
import { rollSachetSeed, type Rng } from "./rolls";
import { DAY, startOfDay } from "./time";
import type { GardenSave, SachetType, Seed } from "./types";

export const MAX_PENDING = 7;
export const SEEDS_PER_SACHET = 3;

export const nextSachetAt = (now: number): number => startOfDay(now) + DAY;

export function creditDaily(save: GardenSave, now: number): GardenSave {
  const today = startOfDay(now);
  const { lastDailyAt, pending } = save.sachets;
  if (lastDailyAt === today) return save;
  // première partie, ou horloge qui recule : on recale sans créditer
  if (lastDailyAt <= 0 || today < lastDailyAt)
    return { ...save, sachets: { ...save.sachets, lastDailyAt: today } };

  const days = Math.round((today - lastDailyAt) / DAY);
  const added = Math.min(days, Math.max(0, MAX_PENDING - pending.length));
  const grown: SachetType[] = added
    ? [...pending, ...Array.from({ length: added }, () => "quotidien" as const)]
    : pending;
  return { ...save, sachets: { lastDailyAt: today, pending: grown } };
}

export function openSachet(
  save: GardenSave,
  now: number,
  rng: Rng,
): { save: GardenSave; seeds: Seed[] } | null {
  const [first, ...rest] = save.sachets.pending;
  if (!first) return null;

  const known = knownEntries(save);
  const pity = { ...save.pity };
  const seeds: Seed[] = [];
  for (let i = 0; i < SEEDS_PER_SACHET; i++) {
    const seed = rollSachetSeed(known, pity, rng);
    const id = entryId(seed.species, seed.color);
    pity.dryDiscovery = known.has(id) ? advance(GAUGES.discovery, pity.dryDiscovery) : 0;
    pity.dryRare = seed.rarity === "commune" ? advance(GAUGES.rare, pity.dryRare) : 0;
    known.add(id);
    seeds.push(seed);
  }

  const next: GardenSave = {
    ...save,
    inventory: { ...save.inventory, seeds: [...save.inventory.seeds, ...seeds] },
    sachets: { ...save.sachets, pending: rest },
    pity,
  };
  return { save: bump(next, "sachetsOpened"), seeds };
}
```

Le paramètre `now` n'est pas utilisé par `openSachet` aujourd'hui ; il l'est par la signature attendue du réducteur et par les préparations de l'atelier. Si le lint s'en plaint, le retirer de la signature et adapter l'appelant en Task 8.

- [ ] **Step 5: Lancer les tests**

Run: `bunx vitest run src/garden/core/sachets.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/garden/core/sachets.ts src/garden/core/sachets.test.ts src/garden/core/time.ts src/garden/core/counters.ts
git commit -m "feat(potager): sachet quotidien et ouverture"
```

---

### Task 7 : Semer la rareté choisie

**Files:**

- Modify: `src/garden/core/actions.ts`
- Modify: `src/garden/core/target.ts`
- Modify: `src/garden/ui/hover.ts`
- Test: `src/garden/core/actions.test.ts`, `src/garden/core/target.test.ts`

**Interfaces:**

- Produces: `interface PlanOptions { rng?: Rng; rain?: RainSource; seedRarity?: Rarity | null }` ; `planAction(save, target, tool, now, opts?)` ; `nextSeedIndex(seeds, rarity): number` ; `describeTile(save, key, now, opts?)` ; `describeTarget(save, target, tool, now, seedRarity?)`.

- [ ] **Step 1: Écrire les tests qui échouent**

Dans `src/garden/core/actions.test.ts`, le helper local devient :

```ts
const plan = (s: GardenSave, target: Target, tool: Tool, opts = {}) =>
  planAction(s, target, tool, NOW, { rng, rain: noRain, ...opts });
```

(adapter les appels existants qui passaient `rng` en 5e paramètre), puis ajouter :

```ts
describe("semer une rareté choisie", () => {
  const seeds: Seed[] = [
    { species: "tournesol", color: "yellow", rarity: "commune" },
    { species: "dahlia", color: "blue", rarity: "legendaire" },
    { species: "cosmos", color: "pink", rarity: "commune" },
  ];
  const withHole = (): GardenSave => {
    const base = createStarterSave();
    return {
      ...base,
      inventory: { ...base.inventory, seeds },
      tiles: { ...base.tiles, "1,1": { kind: "hole", dugAt: NOW - 1000 } },
    };
  };

  it("sème la plus ancienne graine de la rareté demandée", () => {
    const p = plan(withHole(), { kind: "tile", key: "1,1" }, "semer", { seedRarity: "legendaire" });
    expect(p?.ok).toBe(true);
    const out = (p as { apply: () => { save: GardenSave } }).apply();
    const tile = out.save.tiles["1,1"];
    expect(tile?.kind === "plant" && tile.seed.rarity).toBe("legendaire");
    expect(out.save.inventory.seeds.map((s) => s.species)).toEqual(["tournesol", "cosmos"]);
  });

  it("sans rareté demandée, sème la plus ancienne", () => {
    const p = plan(withHole(), { kind: "tile", key: "1,1" }, "semer");
    const out = (p as { apply: () => { save: GardenSave } }).apply();
    const tile = out.save.tiles["1,1"];
    expect(tile?.kind === "plant" && tile.seed.species).toBe("tournesol");
  });

  it("rareté demandée absente : retombe sur la plus ancienne", () => {
    const p = plan(withHole(), { kind: "tile", key: "1,1" }, "semer", { seedRarity: "epique" });
    const out = (p as { apply: () => { save: GardenSave } }).apply();
    const tile = out.save.tiles["1,1"];
    expect(tile?.kind === "plant" && tile.seed.species).toBe("tournesol");
  });

  it("inventaire vide : refus", () => {
    const base = withHole();
    const empty = { ...base, inventory: { ...base.inventory, seeds: [] } };
    expect(plan(empty, { kind: "tile", key: "1,1" }, "semer")).toEqual({
      ok: false,
      label: "Semer",
      reason: "plus de graines",
    });
  });
});
```

Dans `src/garden/core/target.test.ts`, ajouter :

```ts
it("l'infobulle du trou annonce la rareté réellement semée", () => {
  const base = createStarterSave();
  const save: GardenSave = {
    ...base,
    inventory: {
      ...base.inventory,
      seeds: [
        { species: "tournesol", color: "yellow", rarity: "commune" },
        { species: "dahlia", color: "blue", rarity: "legendaire" },
      ],
    },
    tiles: { ...base.tiles, "1,1": { kind: "hole", dugAt: 0 } },
  };
  expect(describeTile(save, "1,1", NOW).lines).toEqual(["Prêt à recevoir une graine commune"]);
  expect(describeTile(save, "1,1", NOW, { seedRarity: "legendaire" }).lines).toEqual([
    "Prêt à recevoir une graine légendaire",
  ]);
  const empty = { ...save, inventory: { ...save.inventory, seeds: [] } };
  expect(describeTile(empty, "1,1", NOW).lines).toEqual(["Plus de graines"]);
});
```

- [ ] **Step 2: Lancer les tests pour les voir échouer**

Run: `bunx vitest run src/garden/core/actions.test.ts src/garden/core/target.test.ts`
Expected: FAIL (signature et textes).

- [ ] **Step 3: Regrouper les options de `planAction`**

Dans `src/garden/core/actions.ts`, remplacer la signature et le cas `semer` :

```ts
export interface PlanOptions {
  rng?: Rng;
  rain?: RainSource;
  seedRarity?: Rarity | null;
}

export function nextSeedIndex(seeds: Seed[], rarity: Rarity | null | undefined): number {
  if (rarity) {
    const i = seeds.findIndex((s) => s.rarity === rarity);
    if (i >= 0) return i;
  }
  return seeds.length ? 0 : -1;
}

export function planAction(
  save: GardenSave,
  target: Target,
  tool: Tool,
  now: number,
  opts: PlanOptions = {},
): Plan | null {
  const { rng = Math.random, rain = rainIntervals, seedRarity = null } = opts;
```

```ts
    case "semer": {
      if (tile?.kind !== "hole")
        return no("Semer", soil && !tile ? "creuse d'abord un trou" : "il faut un trou");
      const index = nextSeedIndex(save.inventory.seeds, seedRarity);
      if (index < 0) return no("Semer", "plus de graines");
      const seed = save.inventory.seeds[index];
      return yes("Semer une graine", () => {
        const rest = save.inventory.seeds.filter((_, i) => i !== index);
        const next = { ...save, inventory: { ...save.inventory, seeds: rest } };
        const planted = setTile(next, key, { kind: "plant", seed, sownAt: now, watered: [] });
        return { save: bump(planted, "sown"), effects: [burst(key, "dirt")] };
      });
    }
```

Importer `Rarity` et `Seed` depuis `./types`.

- [ ] **Step 4: Adapter l'infobulle**

Dans `src/garden/core/target.ts`, remplacer la signature et le cas `hole` :

```ts
export interface DescribeOptions {
  rain?: RainSource;
  seedRarity?: Rarity | null;
}

export function describeTile(
  save: GardenSave,
  key: TileKey,
  now: number,
  opts: DescribeOptions = {},
): TileInfo {
  const { rain = rainIntervals, seedRarity = null } = opts;
```

```ts
    case "hole": {
      const seed = save.inventory.seeds[nextSeedIndex(save.inventory.seeds, seedRarity)];
      return {
        kind: "hole",
        title: "Trou",
        lines: [
          seed ? `Prêt à recevoir une graine ${RARITY_FR[seed.rarity].toLowerCase()}` : "Plus de graines",
        ],
      };
    }
```

Importer `nextSeedIndex` depuis `./actions` et `Rarity` depuis `./types`.

- [ ] **Step 5: Ouvrir le passage dans `hover.ts`**

Dans `src/garden/ui/hover.ts` :

```ts
export function describeTarget(
  save: GardenSave,
  target: Target,
  tool: Tool,
  now: number,
  seedRarity: Rarity | null = null,
): HoverView {
  const plan = planAction(save, target, tool, now, { seedRarity });
  if (target.kind === "crow") return { info: describeCrow(), plan, movable: false };
  return {
    info: describeTile(save, target.key, now, { seedRarity }),
    plan,
    movable: tool === "main" && isMovable(save.tiles[target.key]),
  };
}
```

Importer `Rarity` depuis `../core/types`. `FieldView` n'est pas touché ici : ses appels restent valides (les options ont des valeurs par défaut), la sélection y arrive en Task 9.

- [ ] **Step 6: Lancer les tests**

Run: `bun run test && bunx tsc --noEmit`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/garden/core/actions.ts src/garden/core/actions.test.ts src/garden/core/target.ts src/garden/core/target.test.ts src/garden/ui/hover.ts
git commit -m "feat(potager): semer la graine de la rareté choisie"
```

---

### Task 8 : Réducteur - ouverture et crédit quotidien

**Files:**

- Modify: `src/garden/ui/gardenReducer.ts`
- Test: `src/garden/ui/gardenReducer.test.ts`

**Interfaces:**

- Consumes: `creditDaily`, `openSachet` (Task 6).
- Produces: action `{ type: "open-sachet"; now: number; rng: Rng }` ; état `opened: { seq: number; seeds: Seed[] }`.

- [ ] **Step 1: Écrire les tests qui échouent**

Dans `src/garden/ui/gardenReducer.test.ts`, ajouter :

```ts
describe("open-sachet", () => {
  it("ouvre un sachet, range les graines et avance le compteur de lot", () => {
    const base = {
      ...createStarterSave(),
      sachets: { lastDailyAt: startOfDay(NOW), pending: ["quotidien" as const] },
    };
    const state = gardenReducer(INITIAL_GARDEN, { type: "load", save: base });
    const next = gardenReducer(state, { type: "open-sachet", now: NOW, rng: () => 0.5 });
    expect(next.opened.seq).toBe(1);
    expect(next.opened.seeds).toHaveLength(3);
    expect(next.save!.sachets.pending).toEqual([]);
  });

  it("sans sachet en attente, l'état ne bouge pas", () => {
    const base = { ...createStarterSave(), sachets: { lastDailyAt: startOfDay(NOW), pending: [] } };
    const state = gardenReducer(INITIAL_GARDEN, { type: "load", save: base });
    expect(gardenReducer(state, { type: "open-sachet", now: NOW, rng: () => 0.5 })).toBe(state);
  });
});

describe("tick", () => {
  it("crédite le sachet du jour", () => {
    const base = {
      ...createStarterSave(),
      sachets: { lastDailyAt: startOfDay(NOW) - 2 * DAY, pending: [] },
    };
    const state = gardenReducer(INITIAL_GARDEN, { type: "load", save: base });
    const next = gardenReducer(state, { type: "tick", now: NOW });
    expect(next.save!.sachets.pending).toHaveLength(2);
  });
});
```

(compléter les imports : `startOfDay`, `DAY` depuis `../core/time`, `createStarterSave` depuis `../core/starter`.)

- [ ] **Step 2: Lancer les tests pour les voir échouer**

Run: `bunx vitest run src/garden/ui/gardenReducer.test.ts`
Expected: FAIL, l'action n'existe pas.

- [ ] **Step 3: Étendre le réducteur**

Dans `src/garden/ui/gardenReducer.ts` : importer `creditDaily`, `openSachet` et `type Seed`, ajouter à `GardenState` :

```ts
  // seq change à chaque sachet ouvert, pour rejouer l'animation de révélation
  opened: { seq: number; seeds: Seed[] };
```

`INITIAL_GARDEN` gagne `opened: { seq: 0, seeds: [] }`, `GardenAction` gagne :

```ts
  | { type: "open-sachet"; now: number; rng: Rng }
```

et le `switch` :

```ts
    case "open-sachet": {
      const r = openSachet(creditDaily(state.save, action.now), action.now, action.rng);
      if (!r) return state;
      return { ...state, save: r.save, opened: { seq: state.opened.seq + 1, seeds: r.seeds } };
    }
```

Dans le cas `tick`, envelopper la sauvegarde : `collectDiscoveries(spawnLeaves(creditDaily(state.save, action.now), action.now), action.now)`.

- [ ] **Step 4: Lancer les tests**

Run: `bunx vitest run src/garden/ui/gardenReducer.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/garden/ui/gardenReducer.ts src/garden/ui/gardenReducer.test.ts
git commit -m "feat(potager): ouverture de sachet dans le réducteur"
```

---

### Task 9 : Panneau des graines par rareté

**Files:**

- Modify: `src/garden/ui/SidePanel.tsx`
- Modify: `src/garden/ui/FieldView.tsx`

**Interfaces:**

- Consumes: `describeTarget(..., seedRarity)` et `planAction(..., { seedRarity })` (Task 7), `RARITY_COLOR`, `RARITY_FR`.
- Produces: `SidePanel` reçoit `seedRarity: Rarity | null` et `onSeedRarity: (r: Rarity) => void`.

- [ ] **Step 1: Lister les graines par rareté dans le panneau**

Dans `src/garden/ui/SidePanel.tsx`, remplacer la section "Graines" :

```tsx
const RARITIES: Rarity[] = ["commune", "rare", "epique", "legendaire"];
```

```tsx
<section className={section}>
  <h4 className={heading}>Graines</h4>
  {seeds.length === 0 && (
    <em className="text-[11px] text-[#a99a8a]">Plus de graines. Ouvre un sachet.</em>
  )}
  <div className="flex flex-col gap-0.5">
    {RARITIES.map((r) => {
      const n = seeds.filter((s) => s.rarity === r).length;
      if (!n) return null;
      const on = r === selected;
      return (
        <button
          key={r}
          onClick={() => onSeedRarity(r)}
          aria-pressed={on}
          className={`flex items-center gap-1.5 rounded-md px-1.5 py-1 text-left ${
            on ? "bg-amber-300/15 ring-1 ring-amber-300/40" : "hover:bg-amber-300/10"
          }`}
        >
          <span
            className="inline-block size-2.5 rounded-[3px]"
            style={{ background: RARITY_COLOR[r] }}
          />
          {RARITY_FR[r]}
          <b className="ml-auto text-[#f3dca0]">x{n}</b>
        </button>
      );
    })}
  </div>
</section>
```

La prop `selected` est la rareté réellement semée : `const selected = seeds.some((s) => s.rarity === seedRarity) ? seedRarity : (seeds[0]?.rarity ?? null);` en tête du composant. Ajouter `seedRarity` et `onSeedRarity` aux props, importer `Rarity` et `RARITY_FR`.

- [ ] **Step 2: Brancher la sélection dans `FieldView`**

Dans `src/garden/ui/FieldView.tsx`, ajouter l'état près des autres (`const [tool, setTool] = useState<Tool>("main");`) :

```ts
const [seedRarity, setSeedRarity] = useState<Rarity | null>(null);
```

le faire suivre aux deux endroits qui décrivent ou appliquent un geste - `describeTarget(save, target, tool, at, seedRarity)` dans le calcul du survol, et `planAction(save, start.pick.target, tool, t, { seedRarity })` dans `onPointerUp` - puis passer les deux props au panneau :

```tsx
<SidePanel
  save={save}
  raining={isRaining(at)}
  seedRarity={seedRarity}
  onSeedRarity={setSeedRarity}
  onPress={(index) => dispatch({ type: "press", index, now: Date.now(), rng: Math.random })}
/>
```

- [ ] **Step 3: Vérifier dans l'aperçu**

Run: `bun run dev` (port 1420, ou 4180 s'il est pris), ouvrir le Potager, panneau du navigateur visible.
Expected: le panneau liste "Commune x3" au départ ; après un semis le compte baisse ; cliquer une rareté la met en surbrillance et l'infobulle du trou annonce cette rareté.

- [ ] **Step 4: Vérifications automatiques**

Run: `bun run test && bunx tsc --noEmit && bun run lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/garden/ui/SidePanel.tsx src/garden/ui/FieldView.tsx
git commit -m "feat(potager): graines détaillées par rareté dans le Champ"
```

---

### Task 10 : Onglet et page Sachets

**Files:**

- Modify: `src/garden/ui/GardenTabs.tsx`
- Modify: `src/garden/ui/GardenApp.tsx`
- Create: `src/garden/ui/sachets/SachetsPage.tsx`
- Create: `src/garden/ui/sachets/SachetPack.tsx`
- Create: `src/garden/ui/sachets/PityGauge.tsx`

**Interfaces:**

- Consumes: `MAX_PENDING`, `nextSachetAt`, `chanceOf`, `GAUGES`, état `opened` (Task 8).
- Produces: `SachetsPage({ save, opened, onOpen })`.

- [ ] **Step 1: Ajouter l'onglet**

Dans `src/garden/ui/GardenTabs.tsx` : `export type GardenTab = "champ" | "herbier" | "sachets";`, entrée `{ id: "sachets", label: "Sachets" }`, et une pastille quand `badge` est fourni :

```tsx
export function GardenTabs({
  tab,
  onTab,
  sachets,
}: {
  tab: GardenTab;
  onTab: (tab: GardenTab) => void;
  sachets: number;
}) {
```

Dans le bouton, après `{label}` :

```tsx
{
  id === "sachets" && sachets > 0 && (
    <span className="ml-1.5 rounded-full bg-[#c0452f] px-1.5 py-px text-[10px] font-bold text-white">
      {sachets}
    </span>
  );
}
```

- [ ] **Step 2: Écrire la jauge**

Create `src/garden/ui/sachets/PityGauge.tsx` :

```tsx
export function PityGauge({
  title,
  chance,
  rule,
}: {
  title: string;
  chance: number;
  rule: string;
}) {
  return (
    <section className="rounded-xl border border-amber-300/30 bg-[#1a1216]/85 px-3 py-2.5">
      <h4 className="mb-2 font-serif text-[15px] text-[#f3dca0]">{title}</h4>
      <div className="h-3 overflow-hidden rounded-full bg-[#2c2027] ring-1 ring-inset ring-amber-300/25">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#8a6a3a] to-[#f3c34a] transition-[width] duration-700"
          style={{ width: `${Math.round(chance * 100)}%` }}
        />
      </div>
      <p className="mt-1.5 text-[11px] leading-snug text-[#a99a8a]">
        <b className="text-[#f3dca0]">{Math.round(chance * 100)} %</b> - {rule}
      </p>
    </section>
  );
}
```

- [ ] **Step 3: Écrire le sachet**

Create `src/garden/ui/sachets/SachetPack.tsx` :

```tsx
import { MAX_PENDING } from "../../core/sachets";

export function SachetPack({ pending, onOpen }: { pending: number; onOpen: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={`flex h-[112px] w-[88px] items-end justify-center rounded-t-md rounded-b-xl pb-2.5 text-[11px] text-[#3a2418] shadow-[inset_0_0_0_3px_#6a4428,0_6px_14px_rgba(0,0,0,.5)] ${
          pending ? "bg-gradient-to-b from-[#caa46a] to-[#a9804a]" : "bg-[#5a4a3a] text-[#8a7a6a]"
        }`}
      >
        Sachet du jour
      </div>
      <button
        onClick={onOpen}
        disabled={!pending}
        className="rounded-lg border border-amber-300/50 bg-amber-300/15 px-5 py-1.5 font-serif text-[15px] text-[#f3dca0] hover:bg-amber-300/25 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Ouvrir
      </button>
      <p className="text-[11px] text-[#a99a8a]">
        {pending > 0
          ? `${pending} en attente (${MAX_PENDING} au maximum)`
          : "Prochain sachet à minuit"}
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Écrire la page**

Create `src/garden/ui/sachets/SachetsPage.tsx` :

```tsx
import { herbierProgress } from "../../core/herbier";
import { chanceOf, GAUGES } from "../../core/pity";
import type { GardenSave, Seed } from "../../core/types";
import { PityGauge } from "./PityGauge";
import { SachetPack } from "./SachetPack";

export function SachetsPage({
  save,
  opened,
  onOpen,
}: {
  save: GardenSave;
  opened: { seq: number; seeds: Seed[] };
  onOpen: () => void;
}) {
  const herbier = herbierProgress(save);
  const complete = herbier.found === herbier.total;
  return (
    <div className="flex flex-1 gap-4 overflow-auto p-5">
      <div className="flex flex-1 flex-col items-center justify-center gap-6 rounded-xl bg-[radial-gradient(60%_60%_at_50%_40%,rgba(243,195,74,.10),transparent)]">
        <SachetPack pending={save.sachets.pending.length} onOpen={onOpen} />
      </div>
      <aside className="flex w-[240px] flex-col gap-2.5">
        {complete ? (
          <section className="rounded-xl border border-amber-300/30 bg-[#1a1216]/85 px-3 py-2.5 text-[11px] text-[#a99a8a]">
            Toutes les fleurs sont découvertes.
          </section>
        ) : (
          <PityGauge
            title="Chance de nouveauté"
            chance={chanceOf(GAUGES.discovery, save.pity.dryDiscovery)}
            rule="+2 points par graine sans nouveauté, jusqu'à 75 %. Retour à 25 % dès qu'une fleur inconnue sort."
          />
        )}
        <PityGauge
          title="Chance de rare ou mieux"
          chance={chanceOf(GAUGES.rare, save.pity.dryRare)}
          rule="+2 points par graine sans rare, jusqu'à 70 %. Retour à 25 % dès qu'une rare sort."
        />
      </aside>
    </div>
  );
}
```

(`opened` n'est affiché qu'en Task 11 ; le laisser dans les props dès maintenant évite de retoucher la signature.)

- [ ] **Step 5: Brancher dans `GardenApp`**

Dans `src/garden/ui/GardenApp.tsx` : importer `SachetsPage`, passer `sachets={state.save?.sachets.pending.length ?? 0}` à `GardenTabs`, et rendre la page :

```tsx
{
  tab === "sachets" && state.save && (
    <SachetsPage
      save={state.save}
      opened={state.opened}
      onOpen={() => dispatch({ type: "open-sachet", now: Date.now(), rng: Math.random })}
    />
  );
}
```

Vérifier que la condition `!webglOk` n'empêche pas l'affichage : elle ne doit court-circuiter que l'onglet Champ (`tab === "champ"`), ce qui est déjà le cas.

- [ ] **Step 6: Vérifier dans l'aperçu**

Run: `bun run dev`, onglet Sachets.
Expected: pastille "1" sur l'onglet, sachet allumé, jauges à 25 %, "1 en attente (7 au maximum)". Après un clic sur Ouvrir : trois graines rangées dans l'inventaire du Champ, sachet éteint, bouton désactivé, "Prochain sachet à minuit".

- [ ] **Step 7: Vérifications automatiques**

Run: `bun run test && bunx tsc --noEmit && bun run lint`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/garden/ui/GardenTabs.tsx src/garden/ui/GardenApp.tsx src/garden/ui/sachets
git commit -m "feat(potager): onglet et page Sachets"
```

---

### Task 11 : Animation d'ouverture, cartes retournées

**Files:**

- Create: `src/garden/ui/sachets/SeedReveal.tsx`
- Modify: `src/garden/ui/sachets/SachetsPage.tsx`

**Interfaces:**

- Consumes: `opened: { seq: number; seeds: Seed[] }`, `RARITY_FR`, `RARITY_COLOR`.
- Produces: `SeedReveal({ seq, seeds })`.

- [ ] **Step 1: Écrire la révélation**

Create `src/garden/ui/sachets/SeedReveal.tsx` :

```tsx
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { RARITY_FR } from "../../core/labels";
import type { Seed } from "../../core/types";
import { RARITY_COLOR } from "../toolMeta";

const STEP_MS = 350;
const LEGENDARY_PAUSE_MS = 1000;

// Délai cumulé de chaque carte : une légendaire retient la suivante.
function delays(seeds: Seed[]): number[] {
  let t = 0;
  return seeds.map((s) => {
    const at = t;
    t += STEP_MS + (s.rarity === "legendaire" ? LEGENDARY_PAUSE_MS : 0);
    return at;
  });
}

export function SeedReveal({ seq, seeds }: { seq: number; seeds: Seed[] }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    setShown(0);
    const timers = delays(seeds).map((at, i) =>
      setTimeout(() => setShown((n) => Math.max(n, i + 1)), at),
    );
    return () => timers.forEach(clearTimeout);
  }, [seq, seeds]);

  if (!seeds.length) return null;
  return (
    <div
      className="flex cursor-pointer gap-3.5"
      onClick={() => setShown(seeds.length)}
      title="Cliquer pour tout révéler"
    >
      {seeds.map((seed, i) => {
        const open = i < shown;
        const color = RARITY_COLOR[seed.rarity];
        return (
          <div key={i} className="flex w-[70px] flex-col items-center gap-1.5">
            <motion.div
              className="relative size-[52px]"
              style={{ transformStyle: "preserve-3d" }}
              initial={{ rotateY: 0 }}
              animate={{ rotateY: open ? 180 : 0 }}
              transition={{ duration: 0.4 }}
            >
              <div
                className="absolute inset-0 flex items-center justify-center rounded-[10px] bg-[#3a2b33] text-[#7a6a5a] ring-2 ring-inset ring-amber-300/35"
                style={{ backfaceVisibility: "hidden" }}
              >
                ?
              </div>
              <div
                className="absolute inset-0 flex items-center justify-center rounded-[10px] bg-[#241a20] text-xl"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                  color,
                  boxShadow:
                    seed.rarity === "legendaire"
                      ? `inset 0 0 0 2px ${color}, 0 0 20px rgba(243,195,74,.6)`
                      : `inset 0 0 0 2px ${color}`,
                }}
              >
                ●
              </div>
            </motion.div>
            <small className="text-[10px]" style={{ color: open ? color : "transparent" }}>
              {RARITY_FR[seed.rarity]}
            </small>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Poser la rangée sous le sachet**

Dans `SachetsPage.tsx`, importer `SeedReveal` et l'ajouter sous `SachetPack` :

```tsx
<SeedReveal seq={opened.seq} seeds={opened.seeds} />
```

- [ ] **Step 3: Retarder l'animation des jauges**

Les jauges ne doivent bouger qu'après la dernière carte. Dans `SachetsPage.tsx`, garder une copie du pity affiché :

```tsx
const [pity, setPity] = useState(save.pity);
useEffect(() => {
  const total = opened.seeds.reduce((t, s) => t + 350 + (s.rarity === "legendaire" ? 1000 : 0), 0);
  const id = setTimeout(() => setPity(save.pity), total);
  return () => clearTimeout(id);
}, [opened.seq, save.pity]);
```

et lire `pity.dryDiscovery` / `pity.dryRare` dans les deux `PityGauge`.

- [ ] **Step 4: Vérifier dans l'aperçu**

Run: `bun run dev`, onglet Sachets, bouton de développement "+1 sachet" (Task 12) ou sachet du jour.
Expected: les trois cartes se retournent l'une après l'autre, une légendaire retient la suivante et brille, un clic révèle tout de suite, les jauges bougent après la dernière carte.

- [ ] **Step 5: Vérifications automatiques**

Run: `bun run test && bunx tsc --noEmit && bun run lint`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/garden/ui/sachets
git commit -m "feat(potager): animation d'ouverture des sachets"
```

---

### Task 12 : Boutons de développement, accents et vérification finale

**Files:**

- Create: `src/garden/ui/devButton.ts`
- Modify: `src/garden/ui/GardenDevBar.tsx`
- Modify: `src/garden/ui/sachets/SachetsPage.tsx`
- Modify: `src/garden/ui/GardenApp.tsx`
- Modify: `src/lib/accents.test.ts`

- [ ] **Step 1: Extraire la classe du bouton de développement**

Create `src/garden/ui/devButton.ts` :

```ts
export const DEV_BUTTON =
  "rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-300 ring-1 ring-amber-500/30 hover:bg-amber-500/25";
```

Dans `GardenDevBar.tsx`, remplacer la constante locale `button` par cet import.

- [ ] **Step 2: Ajouter les deux boutons à la page Sachets**

Dans `SachetsPage.tsx`, deux props optionnelles `onDevSachet` et `onDevNextDay`, rendues sous le sachet :

```tsx
{
  import.meta.env.DEV && (
    <div className="flex gap-1">
      <button onClick={onDevSachet} className={DEV_BUTTON}>
        Dev : +1 sachet
      </button>
      <button onClick={onDevNextDay} className={DEV_BUTTON}>
        Dev : jour suivant
      </button>
    </div>
  );
}
```

Dans `GardenApp.tsx` :

```tsx
          onDevSachet={() =>
            dispatch({
              type: "set",
              save: {
                ...state.save,
                sachets: {
                  ...state.save.sachets,
                  pending: [...state.save.sachets.pending, "quotidien"],
                },
              },
            })
          }
          onDevNextDay={() => {
            dispatch({
              type: "set",
              save: {
                ...state.save,
                sachets: { ...state.save.sachets, lastDailyAt: state.save.sachets.lastDailyAt - DAY },
              },
            });
            dispatch({ type: "tick", now: Date.now() });
          }}
```

(`state.save` est déjà garanti non nul par la condition d'affichage ; importer `DAY` depuis `../core/time`.)

- [ ] **Step 3: Compléter le garde-fou des accents**

Dans `src/lib/accents.test.ts`, ajouter à la liste `WRONG`, en gardant l'ordre alphabétique : `"nouveaute"` et `"rarete"`. Les deux apparaissent dans les textes de la page Sachets et ne sont pas encore couverts.

- [ ] **Step 4: Suite complète**

Run: `bun run test && bunx tsc --noEmit && bun run lint`
Expected: PASS, aucune erreur.

- [ ] **Step 5: Parcours complet dans l'aperçu (panneau visible)**

Nouvelle sauvegarde (`localStorage.removeItem("devstore:garden.json")` puis recharger), puis :

1. Onglet Sachets : pastille "1", jauges à 25 %, ouvrir, voir les trois cartes.
2. "Dev : +1 sachet" trois fois, enchaîner les ouvertures, vérifier que les jauges montent quand rien de rare ne sort et retombent quand une rare sort.
3. "Dev : jour suivant" : la pastille monte d'une unité ; sept fois d'affilée, elle plafonne à 7.
4. Onglet Champ : le panneau liste les raretés, sélectionner une rareté, creuser, semer, vérifier dans l'infobulle du trou que la rareté annoncée est la bonne, et que la plante semée a bien cette durée d'étape.
5. Vérifier qu'une graine à variante finit par sortir (forcer au besoin en abaissant `VARIANT_CHANCE` le temps d'un essai, puis le remettre à 0.02).
6. `read_console_messages` sans erreur. Capture d'écran de la page Sachets pour l'utilisateur.

- [ ] **Step 6: Contrôle de la spec**

Relire `docs/superpowers/specs/2026-09-20-potager-sachets-design.md` section par section et noter tout écart non listé dans "Écarts assumés" ; le corriger ou le signaler à l'utilisateur.

- [ ] **Step 7: Commit**

```bash
git add -A src/garden src/lib/accents.test.ts
git commit -m "feat(potager): boutons de développement des sachets"
```
