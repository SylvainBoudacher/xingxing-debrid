# Potager - Ouverture des sachets façon TCG

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer l'ouverture actuelle des sachets (un bouton, trois points colorés) par une ouverture façon booster : pile de sachets pixel-art, bande à déchirer, cartes révélées une par une avec indice de rareté et effets croissants, récapitulatif.

**Architecture:** La logique est pure et testée : `freshFlags` dans `core/sachets.ts`, machine d'états et réglages par rareté dans `ui/sachets/packFlow.ts`, particules dans `ui/sachets/burst.ts`, dessin du sachet dans `sprites/sachet.ts`. Les composants React (motion/react pour le DOM, un canvas superposé pour les particules) ne font qu'afficher et relayer les événements. La face des cartes réutilise le rendu animé de l'Herbier, déplacé dans `ui/cards/`.

**Tech Stack:** TypeScript, React 19, `motion/react` 12, Tailwind 4, Vitest (environnement `node`).

**Spec:** [docs/superpowers/specs/2026-09-23-sachets-ouverture-tcg-design.md](../specs/2026-09-23-sachets-ouverture-tcg-design.md)

## Global Constraints

- Tout texte affiché est en français **correctement accentué** ("Tout révéler", "Prochain sachet à minuit", "Légendaire"). Les identifiants restent ASCII (`dore`, `legendaire`, `revealAll`). `src/lib/accents.test.ts` est le garde-fou : on complète sa liste `WRONG`, on ne la désactive jamais.
- Pas de tiret long, pas de guillemets typographiques, pas de symbole Unicode décoratif : tirets simples et guillemets droits.
- `src/garden/core/` n'importe ni React ni le DOM. Le hasard y est toujours injecté (`Rng`).
- Aucun import depuis `src/game/` (le jeu des canards).
- Tirage, probabilités, pity et format de sauvegarde inchangés (`version: 1`).
- Pas de son.
- Un composant React par fichier ; helpers purs et constantes dans des modules voisins.
- Commandes de vérification : `bun run test`, `bunx tsc --noEmit`, `bun run lint`.
- Chaque commit se termine par la ligne `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` (second `-m` dans les commandes ci-dessous).
- Ne jamais committer `src/garden/core/catalog/tree.ts` ni `src/garden/ui/progression/treeLayout.test.ts` : ce sont des modifications en cours de l'utilisateur, hors de ce chantier. Toujours `git add` des chemins explicites.
- Aperçu navigateur : `bun run dev` (port 1420, ou configuration `vite-alt` sur 4180 si pris), fenêtre Potager ouverte par `?window=garden`. Le panneau doit être visible : `requestAnimationFrame` est gelé quand il est caché.

## Écarts assumés par rapport à la spec

- Le sachet est un module de sprite autonome (`sachetBuf`, `sachetDataUrl`) et n'est pas enregistré dans `renderSpriteBuf`, parce qu'il n'a ni le format 48x72 d'une case ni de rampe de couleur. La bande et le corps sont la même image, découpée par `clip-path` à la ligne `TEAR_ROW` au lieu de deux sprites.
- Le dernier lot vu (`seenSeq`) est tenu en `useState` dans `GardenApp`, pas en `useRef` : la règle `react-hooks` interdit de lire un ref pendant le rendu.
- La déchirure se déclenche quand on relâche la bande au-delà du seuil, pas en plein glisser (motion ne permet pas d'animer proprement une valeur encore tenue par le drag).
- La déchirure au clic dure 250 ms de traction plus 350 ms d'envol, soit 600 ms.
- Fichiers ajoutés en plus de la spec, pour respecter "un composant par fichier" : `NewStamp.tsx`, `EmptyPack.tsx`, `RevealStage.tsx`, `styles.ts`, `ui/cards/LiveFlower.tsx`.
- Le lot du bouton "Dev : sachet légendaire" est présenté comme un sachet doré, et il ne consomme pas de sachet en attente.
- En mouvement réduit, les particules restent, mais le flash, la secousse, le tremblement et le flottement sont retirés.

## Fichiers

| Fichier                                                           | Rôle                                                                 |
| ----------------------------------------------------------------- | -------------------------------------------------------------------- |
| `src/garden/core/sachets.ts`                                      | + `freshFlags`                                                       |
| `src/garden/ui/gardenReducer.ts`                                  | `OpenedLot` (`fresh`, `type`), action `dev-reveal`                   |
| `src/garden/ui/sachets/devSachets.ts`                             | + `devLegendarySeeds`                                                |
| `src/garden/ui/sachets/burst.ts` (nouveau)                        | Particules, rayons et flash, sans DOM                                |
| `src/garden/ui/sachets/packFlow.ts` (nouveau)                     | Phases, transitions, pile, réglages par rareté, seuil de déchirure   |
| `src/garden/sprites/sachet.ts` (nouveau)                          | Dessin pixel-art des trois sachets, ligne de déchirure               |
| `src/garden/ui/cards/cardFx.ts`, `useCardFx.ts` (déplacés)        | Rendu animé d'une fleur de carte, partagé Herbier et Sachets         |
| `src/garden/ui/cards/LiveFlower.tsx` (nouveau)                    | Canvas de fleur animée                                               |
| `src/garden/ui/herbier/SpecimenCard.tsx`                          | Utilise `LiveFlower`                                                 |
| `src/garden/ui/sachets/CardBack.tsx` (nouveau)                    | Dos de carte teinté par la rareté                                    |
| `src/garden/ui/sachets/NewStamp.tsx` (nouveau)                    | Tampon "Nouveau !"                                                   |
| `src/garden/ui/sachets/RevealCard.tsx` (nouveau)                  | Carte en grand (tremble puis se retourne) ou en petit                |
| `src/garden/ui/sachets/CardDeck.tsx` (nouveau)                    | Paquet face cachée                                                   |
| `src/garden/ui/sachets/BurstLayer.tsx` (nouveau)                  | Canvas superposé piloté par `burst.ts`                               |
| `src/garden/ui/sachets/useScreenShake.ts` (nouveau)               | Secousse du conteneur                                                |
| `src/garden/ui/sachets/TearablePack.tsx` (nouveau)                | Sachet du dessus : bande à tirer, clic, lueur, reflet doré           |
| `src/garden/ui/sachets/PackStack.tsx` (nouveau)                   | Sachets en attente empilés                                           |
| `src/garden/ui/sachets/EmptyPack.tsx` (nouveau)                   | Sachet grisé, "Prochain sachet à minuit"                             |
| `src/garden/ui/sachets/RevealStage.tsx` (nouveau)                 | Phase de révélation : paquet, carte en grand, rangée, "Tout révéler" |
| `src/garden/ui/sachets/PackSummary.tsx` (nouveau)                 | Récapitulatif et boutons de fin                                      |
| `src/garden/ui/sachets/styles.ts` (nouveau)                       | Classes des boutons                                                  |
| `src/garden/ui/sachets/SachetsPage.tsx`                           | Réécrit : orchestre les phases                                       |
| `src/garden/ui/GardenApp.tsx`                                     | `seenSeq`, `onGoToField`, `onDevLegendary`                           |
| `src/lib/accents.test.ts`                                         | + `reveler`                                                          |
| `SachetPack.tsx`, `SeedReveal.tsx`, `reveal.ts`, `reveal.test.ts` | Supprimés                                                            |

## Review Focus

1. Changement d'onglet en pleine déchirure ou révélation : au retour, on voit le récapitulatif du lot, sans rejouer la révélation et sans rien perdre. Épinglé par les tests `initialPhase` (Task 3).
2. Double clic pendant la pause d'une légendaire : la légendaire ne doit pas être sautée avant d'avoir été vue. Épinglé par les tests `lockFor` (Task 3) et le verrou de `RevealStage` (Task 8).
3. Bande relâchée avant le seuil, puis nouveau glisser ou clic : on ne doit pas ouvrir un deuxième sachet. Épinglé par le test "startTear en pleine déchirure ne change rien" (Task 3) et la garde `started` de `TearablePack` (Task 7).
4. Même fleur deux fois dans un sachet : seule la première porte "Nouveau !". Épinglé par les tests `freshFlags` (Task 1).
5. Dernier sachet ouvert : la pile se vide proprement, "Sachet suivant" disparaît, le sachet grisé apparaît après "reset". Épinglé par les tests `stackOf` (Task 3).

---

### Task 1: Nouveauté et type du lot ouvert

**Files:**

- Modify: `src/garden/core/sachets.ts`
- Modify: `src/garden/core/sachets.test.ts`
- Modify: `src/garden/ui/gardenReducer.ts`
- Modify: `src/garden/ui/gardenReducer.test.ts`
- Modify: `src/garden/ui/sachets/devSachets.ts`

**Interfaces:**

- Consumes: `knownEntries(save): Set<string>` et `entryId(species, color)` de `core/discovery.ts`, `rollSeedOfRarity(rarity, rng)` de `core/rolls.ts`.
- Produces:
  - `freshFlags(known: Set<string>, seeds: Seed[]): boolean[]` (`core/sachets.ts`)
  - `export interface OpenedLot { seq: number; seeds: Seed[]; fresh: boolean[]; type: SachetType }` (`ui/gardenReducer.ts`), `GardenState.opened: OpenedLot`
  - action `{ type: "dev-reveal"; seeds: Seed[] }`
  - `devLegendarySeeds(rng: Rng): Seed[]` (`ui/sachets/devSachets.ts`)

- [ ] **Step 1: Écrire les tests de `freshFlags`**

Dans `src/garden/core/sachets.test.ts`, compléter l'import et ajouter à la fin du fichier :

```ts
import { creditDaily, freshFlags, MAX_PENDING, openSachet, SEEDS_PER_SACHET } from "./sachets";
import type { GardenSave, SachetType, Seed } from "./types";
```

```ts
describe("freshFlags", () => {
  const seed = (species: Seed["species"], color: Seed["color"]): Seed => ({
    species,
    color,
    rarity: "commune",
  });

  it("marque les fleurs inconnues", () => {
    const known = new Set(["cosmos:pink"]);
    expect(freshFlags(known, [seed("cosmos", "pink"), seed("aster", "violet")])).toEqual([
      false,
      true,
    ]);
  });

  it("une fleur tirée deux fois n'est nouvelle que la première fois", () => {
    const seeds = [seed("aster", "blue"), seed("cosmos", "red"), seed("aster", "blue")];
    expect(freshFlags(new Set(), seeds)).toEqual([true, true, false]);
  });

  it("ne modifie pas l'ensemble reçu", () => {
    const known = new Set<string>();
    freshFlags(known, [seed("aster", "blue")]);
    expect(known.size).toBe(0);
  });
});
```

- [ ] **Step 2: Vérifier que les tests échouent**

Run: `bun run test src/garden/core/sachets.test.ts`
Expected: FAIL, `freshFlags` n'est pas exporté.

- [ ] **Step 3: Implémenter `freshFlags`**

Dans `src/garden/core/sachets.ts`, ajouter après `nextSachetAt` :

```ts
// Nouveauté de chaque graine à l'ouverture : une fleur tirée deux fois dans le même
// sachet n'est nouvelle que la première fois.
export function freshFlags(known: Set<string>, seeds: Seed[]): boolean[] {
  const seen = new Set(known);
  return seeds.map((s) => {
    const id = entryId(s.species, s.color);
    const fresh = !seen.has(id);
    seen.add(id);
    return fresh;
  });
}
```

- [ ] **Step 4: Vérifier que les tests passent**

Run: `bun run test src/garden/core/sachets.test.ts`
Expected: PASS

- [ ] **Step 5: Écrire les tests du reducer**

Dans `src/garden/ui/gardenReducer.test.ts`, ajouter aux imports :

```ts
import { knownEntries } from "../core/discovery";
import { freshFlags } from "../core/sachets";
import type { GardenSave, SachetType, Seed } from "../core/types";
```

(remplacer l'import existant `import type { GardenSave } from "../core/types";`), élargir le helper du bloc `describe("sachets")` :

```ts
  const withSachets = (lastDailyAt: number, pending: SachetType[]): GardenState =>
```

et ajouter dans ce bloc :

```ts
it("renseigne la nouveauté et le type du sachet ouvert", () => {
  const state = withSachets(startOfDay(NOW), ["dore", "quotidien"]);
  const next = gardenReducer(state, { type: "open-sachet", now: NOW, rng: () => 0.5 });
  expect(next.opened.type).toBe("dore");
  expect(next.opened.fresh).toEqual(freshFlags(knownEntries(state.save!), next.opened.seeds));
  expect(next.opened.fresh).toHaveLength(3);
});

it("dev-reveal range les graines imposées et les présente comme un sachet doré", () => {
  const state = withSachets(startOfDay(NOW), []);
  const seeds: Seed[] = [{ species: "cosmos", color: "black", rarity: "legendaire" }];
  const next = gardenReducer(state, { type: "dev-reveal", seeds });
  expect(next.opened).toEqual({ seq: 1, seeds, fresh: [true], type: "dore" });
  expect(next.save!.inventory.seeds.slice(-1)).toEqual(seeds);
  expect(next.save!.sachets.pending).toEqual([]);
});
```

- [ ] **Step 6: Vérifier que les tests échouent**

Run: `bun run test src/garden/ui/gardenReducer.test.ts`
Expected: FAIL (`opened.type` indéfini, action `dev-reveal` inconnue).

- [ ] **Step 7: Mettre à jour le reducer**

Dans `src/garden/ui/gardenReducer.ts` :

Imports :

```ts
import { collectDiscoveries, knownEntries } from "../core/discovery";
import { creditDaily, freshFlags, openSachet } from "../core/sachets";
import type { Flower, GardenSave, SachetType, Seed, SpeciesId, TileKey } from "../core/types";
```

Avant `GardenState` :

```ts
// Dernier lot ouvert ; seq change à chaque sachet, pour rejouer la révélation.
export interface OpenedLot {
  seq: number;
  seeds: Seed[];
  fresh: boolean[];
  type: SachetType;
}
```

Dans `GardenState`, remplacer les deux lignes de `opened` par :

```ts
opened: OpenedLot;
```

Dans `INITIAL_GARDEN` :

```ts
  opened: { seq: 0, seeds: [], fresh: [], type: "quotidien" },
```

Dans `GardenAction`, ajouter :

```ts
  | { type: "dev-reveal"; seeds: Seed[] }
```

Remplacer le cas `open-sachet` et ajouter `dev-reveal` :

```ts
    case "open-sachet": {
      const before = creditDaily(state.save, action.now, sachetsPerDay(state.save));
      const r = openSachet(before, action.rng);
      if (!r) return state;
      return {
        ...state,
        save: r.save,
        opened: {
          seq: state.opened.seq + 1,
          seeds: r.seeds,
          fresh: freshFlags(knownEntries(before), r.seeds),
          type: before.sachets.pending[0],
        },
      };
    }
    case "dev-reveal": {
      const { inventory } = state.save;
      return {
        ...state,
        save: {
          ...state.save,
          inventory: { ...inventory, seeds: [...inventory.seeds, ...action.seeds] },
        },
        opened: {
          seq: state.opened.seq + 1,
          seeds: action.seeds,
          fresh: freshFlags(knownEntries(state.save), action.seeds),
          type: "dore",
        },
      };
    }
```

- [ ] **Step 8: Ajouter `devLegendarySeeds`**

Dans `src/garden/ui/sachets/devSachets.ts`, ajouter les imports et la fonction :

```ts
import { rollSeedOfRarity, type Rng } from "../../core/rolls";
import type { GardenSave, Seed } from "../../core/types";
```

(remplace `import type { GardenSave } from "../../core/types";`)

```ts
// Lot imposé pour tester la mise en scène haut de gamme sans compter sur la chance.
export const devLegendarySeeds = (rng: Rng): Seed[] =>
  (["commune", "epique", "legendaire"] as const).map((r) => rollSeedOfRarity(r, rng));
```

- [ ] **Step 9: Vérifier tests et types**

Run: `bun run test src/garden && bunx tsc --noEmit`
Expected: tests PASS. `tsc` peut signaler `SachetsPage` (inchangé, il lit encore `opened.seeds`, qui existe toujours) : aucune erreur attendue.

- [ ] **Step 10: Commit**

```bash
git add src/garden/core/sachets.ts src/garden/core/sachets.test.ts src/garden/ui/gardenReducer.ts src/garden/ui/gardenReducer.test.ts src/garden/ui/sachets/devSachets.ts
git commit -m "feat(potager): nouveauté et type du sachet ouvert" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Particules de l'ouverture

**Files:**

- Create: `src/garden/ui/sachets/burst.ts`
- Test: `src/garden/ui/sachets/burst.test.ts`

**Interfaces:**

- Consumes: `Rng` de `core/rolls.ts`.
- Produces:
  - `type BurstKind = "paper" | "sparks" | "rays" | "gold"`
  - `interface Particle`, `interface Ray`, `interface Burst { parts: Particle[]; rays: Ray[]; flash: number }`
  - `MAX_PARTICLES = 160`, `newBurst(): Burst`, `emit(b, kind, x, y, rng?)`, `stepBurst(b, dt)`, `isIdle(b): boolean`

- [ ] **Step 1: Écrire les tests**

`src/garden/ui/sachets/burst.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { emit, isIdle, MAX_PARTICLES, newBurst, stepBurst, type BurstKind } from "./burst";

const rng = () => 0.5;

describe("burst", () => {
  it("chaque type émet son nombre de particules", () => {
    const counts: [BurstKind, number][] = [
      ["paper", 36],
      ["sparks", 24],
      ["rays", 28],
      ["gold", 90],
    ];
    for (const [kind, n] of counts) {
      const b = newBurst();
      emit(b, kind, 0, 0, rng);
      expect(b.parts).toHaveLength(n);
    }
  });

  it("plafonne le nombre de particules", () => {
    const b = newBurst();
    emit(b, "gold", 0, 0, rng);
    emit(b, "gold", 0, 0, rng);
    expect(b.parts).toHaveLength(MAX_PARTICLES);
  });

  it("les épiques ajoutent des rayons, les légendaires des rayons et un flash", () => {
    const rays = newBurst();
    emit(rays, "rays", 10, 20, rng);
    expect(rays.rays).toHaveLength(1);
    expect(rays.flash).toBe(0);
    const gold = newBurst();
    emit(gold, "gold", 10, 20, rng);
    expect(gold.rays).toHaveLength(1);
    expect(gold.flash).toBe(1);
  });

  it("tout s'éteint en fin de vie", () => {
    const b = newBurst();
    emit(b, "gold", 0, 0, rng);
    expect(isIdle(b)).toBe(false);
    for (let i = 0; i < 60; i++) stepBurst(b, 0.05);
    expect(isIdle(b)).toBe(true);
  });

  it("les confettis retombent", () => {
    const b = newBurst();
    emit(b, "paper", 0, 0, rng);
    for (let i = 0; i < 10; i++) stepBurst(b, 0.08);
    expect(b.parts[0].y).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Vérifier que les tests échouent**

Run: `bun run test src/garden/ui/sachets/burst.test.ts`
Expected: FAIL, module introuvable.

- [ ] **Step 3: Implémenter**

`src/garden/ui/sachets/burst.ts` :

```ts
import type { Rng } from "../../core/rolls";

export type BurstKind = "paper" | "sparks" | "rays" | "gold";

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  g: number;
  rot: number;
  vr: number;
  size: number;
  color: string;
  star: boolean;
  life: number;
  max: number;
}

export interface Ray {
  x: number;
  y: number;
  color: string;
  life: number;
  max: number;
}

export interface Burst {
  parts: Particle[];
  rays: Ray[];
  flash: number;
}

interface Recipe {
  count: number;
  colors: string[];
  speed: [number, number];
  life: [number, number];
  size: [number, number];
  star: boolean;
  gravity: number;
  ray?: { color: string; life: number };
  flash?: number;
}

export const MAX_PARTICLES = 160;
const DRAG = 1.8;
const FLASH_FADE = 2.5;

// Vitesses en px/s, gravité en px/s².
const RECIPES: Record<BurstKind, Recipe> = {
  paper: {
    count: 36,
    colors: ["#caa46a", "#a9804a", "#e8d3a8"],
    speed: [180, 420],
    life: [0.8, 1.4],
    size: [4, 8],
    star: false,
    gravity: 900,
  },
  sparks: {
    count: 24,
    colors: ["#6db6f0", "#dff2ff"],
    speed: [120, 300],
    life: [0.5, 0.9],
    size: [6, 10],
    star: true,
    gravity: 0,
  },
  rays: {
    count: 28,
    colors: ["#be8cf0", "#e0c8ff"],
    speed: [80, 240],
    life: [0.9, 1.5],
    size: [3, 6],
    star: false,
    gravity: -60,
    ray: { color: "#be8cf0", life: 1.4 },
  },
  gold: {
    count: 90,
    colors: ["#f3c34a", "#fff1b0", "#ffe38a"],
    speed: [150, 520],
    life: [1.4, 2.4],
    size: [4, 10],
    star: true,
    gravity: 220,
    ray: { color: "#f3c34a", life: 2.6 },
    flash: 1,
  },
};

const between = (rng: Rng, [a, b]: [number, number]) => a + rng() * (b - a);

export const newBurst = (): Burst => ({ parts: [], rays: [], flash: 0 });

export function emit(b: Burst, kind: BurstKind, x: number, y: number, rng: Rng = Math.random) {
  const r = RECIPES[kind];
  const n = Math.min(r.count, Math.max(0, MAX_PARTICLES - b.parts.length));
  for (let i = 0; i < n; i++) {
    const ang = rng() * Math.PI * 2;
    const speed = between(rng, r.speed);
    const life = between(rng, r.life);
    b.parts.push({
      x,
      y,
      vx: Math.cos(ang) * speed,
      // ce qui retombe part d'abord vers le haut
      vy: Math.sin(ang) * speed - (r.gravity > 0 ? speed * 0.4 : 0),
      g: r.gravity,
      rot: rng() * Math.PI * 2,
      vr: (rng() - 0.5) * 12,
      size: between(rng, r.size),
      color: r.colors[Math.min(r.colors.length - 1, Math.floor(rng() * r.colors.length))],
      star: r.star,
      life,
      max: life,
    });
  }
  if (r.ray) b.rays.push({ x, y, color: r.ray.color, life: r.ray.life, max: r.ray.life });
  if (r.flash) b.flash = Math.max(b.flash, r.flash);
}

export function stepBurst(b: Burst, dt: number) {
  const keep = Math.max(0, 1 - DRAG * dt);
  for (const p of b.parts) {
    p.life -= dt;
    p.vx *= keep;
    p.vy = p.vy * keep + p.g * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rot += p.vr * dt;
  }
  b.parts = b.parts.filter((p) => p.life > 0);
  for (const r of b.rays) r.life -= dt;
  b.rays = b.rays.filter((r) => r.life > 0);
  b.flash = Math.max(0, b.flash - FLASH_FADE * dt);
}

export const isIdle = (b: Burst): boolean => !b.parts.length && !b.rays.length && b.flash === 0;
```

- [ ] **Step 4: Vérifier que les tests passent**

Run: `bun run test src/garden/ui/sachets/burst.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/garden/ui/sachets/burst.ts src/garden/ui/sachets/burst.test.ts
git commit -m "feat(potager): particules de l'ouverture des sachets" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Machine d'états de l'ouverture

**Files:**

- Create: `src/garden/ui/sachets/packFlow.ts`
- Test: `src/garden/ui/sachets/packFlow.test.ts`

**Interfaces:**

- Consumes: `BurstKind` de `./burst` (Task 2).
- Produces:
  - `type Phase = { kind: "idle" } | { kind: "tearing" } | { kind: "revealing"; current: number } | { kind: "summary" }`
  - `type FlowEvent = "startTear" | "tear" | "next" | "revealAll" | "reset"`
  - `IDLE: Phase`, `step(phase, event, count): Phase`, `initialPhase(openedSeq, seenSeq): Phase`
  - `stackOf(phase, pending: SachetType[], openedType: SachetType): { top: SachetType | null; under: SachetType[] }`
  - `bestRarity(seeds: Seed[]): Rarity`
  - `interface RevealFx { hold: number; shake: number; burst: BurstKind | null }`, `REVEAL_FX: Record<Rarity, RevealFx>`
  - `FLIP_MS = 450`, `lockFor(rarity): number`
  - `TEAR_THRESHOLD = 0.7`, `tearProgress(dx, width): number`, `PACK_SCALE = 4`

- [ ] **Step 1: Écrire les tests**

`src/garden/ui/sachets/packFlow.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import type { Seed } from "../../core/types";
import {
  bestRarity,
  FLIP_MS,
  IDLE,
  initialPhase,
  lockFor,
  REVEAL_FX,
  stackOf,
  step,
  tearProgress,
  type Phase,
} from "./packFlow";

const seed = (rarity: Seed["rarity"]): Seed => ({ species: "cosmos", color: "pink", rarity });

describe("step", () => {
  it("déroule repos, déchirure, révélation carte par carte, récapitulatif", () => {
    let p: Phase = IDLE;
    p = step(p, "startTear", 3);
    expect(p).toEqual({ kind: "tearing" });
    p = step(p, "tear", 3);
    expect(p).toEqual({ kind: "revealing", current: -1 });
    p = step(p, "next", 3);
    p = step(p, "next", 3);
    p = step(p, "next", 3);
    expect(p).toEqual({ kind: "revealing", current: 2 });
    p = step(p, "next", 3);
    expect(p).toEqual({ kind: "summary" });
    expect(step(p, "reset", 3)).toBe(IDLE);
  });

  it("Tout révéler saute au récapitulatif", () => {
    expect(step({ kind: "revealing", current: 0 }, "revealAll", 3)).toEqual({ kind: "summary" });
  });

  it("startTear en pleine déchirure ne change rien", () => {
    const tearing: Phase = { kind: "tearing" };
    expect(step(tearing, "startTear", 3)).toBe(tearing);
  });

  it("ignore les événements hors phase", () => {
    expect(step(IDLE, "next", 3)).toBe(IDLE);
    expect(step(IDLE, "tear", 3)).toBe(IDLE);
    const summary: Phase = { kind: "summary" };
    expect(step(summary, "next", 3)).toBe(summary);
  });
});

describe("initialPhase", () => {
  it("reprend au récapitulatif un lot pas vu jusqu'au bout", () => {
    expect(initialPhase(4, 3)).toEqual({ kind: "summary" });
  });

  it("repart au repos sinon", () => {
    expect(initialPhase(0, 0)).toBe(IDLE);
    expect(initialPhase(4, 4)).toBe(IDLE);
  });
});

describe("stackOf", () => {
  it("au repos, le premier sachet en attente est dessus", () => {
    expect(stackOf(IDLE, ["dore", "quotidien"], "famille")).toEqual({
      top: "dore",
      under: ["quotidien"],
    });
  });

  it("pendant la déchirure, le sachet déjà consommé reste dessus", () => {
    expect(stackOf({ kind: "tearing" }, ["quotidien"], "dore")).toEqual({
      top: "dore",
      under: ["quotidien"],
    });
    expect(stackOf({ kind: "tearing" }, [], "quotidien")).toEqual({
      top: "quotidien",
      under: [],
    });
  });

  it("plus de sachet : rien dessus", () => {
    expect(stackOf(IDLE, [], "quotidien")).toEqual({ top: null, under: [] });
  });
});

describe("réglages", () => {
  it("bestRarity garde la plus haute rareté", () => {
    expect(bestRarity([seed("commune"), seed("epique"), seed("rare")])).toBe("epique");
    expect(bestRarity([])).toBe("commune");
  });

  it("les effets grandissent avec la rareté", () => {
    expect(REVEAL_FX.commune).toEqual({ hold: 0, shake: 0, burst: null });
    expect(REVEAL_FX.rare.burst).toBe("sparks");
    expect(REVEAL_FX.epique).toEqual({ hold: 300, shake: 4, burst: "rays" });
    expect(REVEAL_FX.legendaire).toEqual({ hold: 900, shake: 10, burst: "gold" });
  });

  it("une légendaire verrouille le paquet jusqu'à la fin de son retournement", () => {
    expect(lockFor("commune")).toBe(FLIP_MS);
    expect(lockFor("legendaire")).toBe(900 + FLIP_MS);
  });

  it("tearProgress est borné entre 0 et 1", () => {
    expect(tearProgress(70, 100)).toBe(0.7);
    expect(tearProgress(-20, 100)).toBe(0);
    expect(tearProgress(300, 100)).toBe(1);
    expect(tearProgress(10, 0)).toBe(0);
  });
});
```

- [ ] **Step 2: Vérifier que les tests échouent**

Run: `bun run test src/garden/ui/sachets/packFlow.test.ts`
Expected: FAIL, module introuvable.

- [ ] **Step 3: Implémenter**

`src/garden/ui/sachets/packFlow.ts` :

```ts
import type { Rarity, SachetType, Seed } from "../../core/types";
import type { BurstKind } from "./burst";

export type Phase =
  | { kind: "idle" }
  | { kind: "tearing" }
  // current : carte montrée en grand, -1 tant qu'aucune n'est sortie du paquet
  | { kind: "revealing"; current: number }
  | { kind: "summary" };

export type FlowEvent = "startTear" | "tear" | "next" | "revealAll" | "reset";

export const IDLE: Phase = { kind: "idle" };

export function step(phase: Phase, event: FlowEvent, count: number): Phase {
  switch (phase.kind) {
    case "idle":
      return event === "startTear" ? { kind: "tearing" } : phase;
    case "tearing":
      return event === "tear" ? { kind: "revealing", current: -1 } : phase;
    case "revealing":
      if (event === "revealAll") return { kind: "summary" };
      if (event !== "next") return phase;
      return phase.current < count - 1
        ? { kind: "revealing", current: phase.current + 1 }
        : { kind: "summary" };
    case "summary":
      return event === "reset" ? IDLE : phase;
  }
}

// Un lot ouvert mais pas vu jusqu'au bout (onglet quitté en route) reprend au récapitulatif.
export const initialPhase = (openedSeq: number, seenSeq: number): Phase =>
  openedSeq > seenSeq ? { kind: "summary" } : IDLE;

// Pendant la déchirure, le sachet est déjà consommé mais reste affiché sur la pile.
export function stackOf(
  phase: Phase,
  pending: SachetType[],
  openedType: SachetType,
): { top: SachetType | null; under: SachetType[] } {
  if (phase.kind === "tearing") return { top: openedType, under: pending };
  return { top: pending[0] ?? null, under: pending.slice(1) };
}

const RARITY_ORDER: Rarity[] = ["commune", "rare", "epique", "legendaire"];

export const bestRarity = (seeds: Seed[]): Rarity =>
  seeds.reduce<Rarity>(
    (best, s) => (RARITY_ORDER.indexOf(s.rarity) > RARITY_ORDER.indexOf(best) ? s.rarity : best),
    "commune",
  );

export interface RevealFx {
  // pause avant le retournement, en ms
  hold: number;
  // amplitude de la secousse, en px
  shake: number;
  burst: BurstKind | null;
}

export const REVEAL_FX: Record<Rarity, RevealFx> = {
  commune: { hold: 0, shake: 0, burst: null },
  rare: { hold: 0, shake: 0, burst: "sparks" },
  epique: { hold: 300, shake: 4, burst: "rays" },
  legendaire: { hold: 900, shake: 10, burst: "gold" },
};

export const FLIP_MS = 450;

// Clics ignorés tant que la carte n'est pas retournée : pas de légendaire sautée par un double clic.
export const lockFor = (rarity: Rarity): number => REVEAL_FX[rarity].hold + FLIP_MS;

export const TEAR_THRESHOLD = 0.7;

export const tearProgress = (dx: number, width: number): number =>
  width > 0 ? Math.min(1, Math.max(0, dx / width)) : 0;

// Un pixel du sprite du sachet vaut PACK_SCALE pixels à l'écran.
export const PACK_SCALE = 4;
```

- [ ] **Step 4: Vérifier que les tests passent**

Run: `bun run test src/garden/ui/sachets/packFlow.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/garden/ui/sachets/packFlow.ts src/garden/ui/sachets/packFlow.test.ts
git commit -m "feat(potager): machine d'états de l'ouverture des sachets" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Sprite pixel-art des sachets

**Files:**

- Create: `src/garden/sprites/sachet.ts`
- Test: `src/garden/sprites/sachet.test.ts`

**Interfaces:**

- Consumes: `buf`, `crop`, `ell`, `outline`, `put`, `rampAt`, `sphere`, `toCanvas`, `Buf`, `Ramp` de `./raster` ; `PAL` de `./palette`.
- Produces: `sachetBuf(type: SachetType): Buf` (image recadrée), `sachetDataUrl(type): string` (mise en cache), `SACHET_W`, `SACHET_H` (taille de l'image recadrée en pixels), `TEAR_ROW` (ligne de déchirure dans l'image recadrée).

- [ ] **Step 1: Écrire les tests**

`src/garden/sprites/sachet.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import type { SachetType } from "../core/types";
import { PAL } from "./palette";
import { SACHET_H, SACHET_W, sachetBuf, TEAR_ROW } from "./sachet";

const TYPES: SachetType[] = ["quotidien", "dore", "famille"];
const opaque = (b: { c: (string | null)[] }) => b.c.filter(Boolean).length;

describe("sachetBuf", () => {
  it("dessine trois sachets de même taille, tous différents", () => {
    const bufs = TYPES.map(sachetBuf);
    for (const b of bufs) {
      expect([b.w, b.h]).toEqual([SACHET_W, SACHET_H]);
      expect(opaque(b)).toBeGreaterThan(900);
    }
    expect(bufs[0].c).not.toEqual(bufs[1].c);
    expect(bufs[0].c).not.toEqual(bufs[2].c);
    expect(bufs[1].c).not.toEqual(bufs[2].c);
  });

  it("la ligne de déchirure est en pointillés sur TEAR_ROW", () => {
    const b = sachetBuf("quotidien");
    const row = b.c.slice(TEAR_ROW * b.w, (TEAR_ROW + 1) * b.w);
    expect(row.filter((c) => c === PAL.hay[0]).length).toBeGreaterThan(10);
  });
});
```

- [ ] **Step 2: Vérifier que les tests échouent**

Run: `bun run test src/garden/sprites/sachet.test.ts`
Expected: FAIL, module introuvable.

- [ ] **Step 3: Implémenter**

`src/garden/sprites/sachet.ts` :

```ts
import type { SachetType } from "../core/types";
import { PAL } from "./palette";
import {
  buf,
  crop,
  ell,
  outline,
  put,
  rampAt,
  sphere,
  toCanvas,
  type Buf,
  type Ramp,
} from "./raster";

// Géométrie en unités 32x48 comme les autres sprites, rendue à l'échelle 1,5.
const K = 1.5;
const X0 = 5;
const X1 = 27;
const Y0 = 6;
const Y1 = 46;
// bas de la bande à déchirer
const BAND = 12;

const px = (u: number) => Math.round(u * K);

// L'image est recadrée sur le sachet, contour d'un pixel compris.
export const SACHET_W = px(X1) - px(X0) + 2;
export const SACHET_H = px(Y1) - px(Y0) + 2;
export const TEAR_ROW = px(BAND) - px(Y0) + 1;

const PAPER: Record<SachetType, Ramp> = {
  quotidien: PAL.hay,
  dore: PAL.glow,
  famille: PAL.apricot,
};

function paper(b: Buf, ramp: Ramp) {
  const [x0, x1, y0, y1] = [px(X0), px(X1), px(Y0), px(Y1)];
  for (let y = y0; y < y1; y++)
    for (let x = x0; x < x1; x++) {
      // bord du haut dentelé
      if (y === y0 && x % 3 === 0) continue;
      const edge = x === x0 || x === x1 - 1 || y === y1 - 1;
      put(b, x, y, rampAt(ramp, 0.9 - ((x - x0) / (x1 - x0)) * 0.5 - (edge ? 0.35 : 0)));
    }
  for (let x = x0 + 1; x < x1 - 1; x++) put(b, x, px(Y0 + 2.5), ramp[1]);
  for (let x = x0 + 1; x < x1 - 1; x += 2) put(b, x, px(BAND), ramp[0]);
}

function label(b: Buf) {
  for (let y = px(19); y < px(36); y++)
    for (let x = px(9); x < px(23); x++) put(b, x, y, PAL.cream[2]);
}

function flower(b: Buf, cx: number, cy: number, r: number) {
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    ell(b, K, cx + Math.cos(a) * r, cy + Math.sin(a) * r, r * 0.7, r * 0.7, 0, sphere(PAL.pink));
  }
  ell(b, K, cx, cy, r * 0.6, r * 0.6, 0, sphere(PAL.yellow));
}

const DECOR: Record<SachetType, (b: Buf) => void> = {
  quotidien(b) {
    label(b);
    ell(b, K, 16, 27.5, 3, 4.2, 0.4, sphere(PAL.brown));
  },
  dore(b) {
    label(b);
    const [cx, cy] = [px(16), px(27.5)];
    for (let d = -5; d <= 5; d++) {
      put(b, cx + d, cy, PAL.yellow[1]);
      put(b, cx, cy + d, PAL.yellow[1]);
    }
    for (let d = -3; d <= 3; d++) {
      put(b, cx + d, cy + d, PAL.yellow[2]);
      put(b, cx + d, cy - d, PAL.yellow[2]);
    }
    // reflets obliques entre la bande et l'étiquette
    for (const x0 of [px(17), px(21)])
      for (let i = 0; i < 6; i++) put(b, x0 + i, px(18) - i, PAL.glow[3]);
  },
  famille(b) {
    const spots: [number, number][] = [
      [10, 18],
      [22, 22],
      [15, 29],
      [11, 36],
      [21, 38],
      [16, 42],
    ];
    for (const [x, y] of spots) flower(b, x, y, 1.6);
  },
};

export function sachetBuf(type: SachetType): Buf {
  const b = buf(48, 72);
  paper(b, PAPER[type]);
  DECOR[type](b);
  outline(b);
  return crop(b);
}

const urls = new Map<SachetType, string>();

export function sachetDataUrl(type: SachetType): string {
  let url = urls.get(type);
  if (!url) {
    url = toCanvas(sachetBuf(type)).toDataURL();
    urls.set(type, url);
  }
  return url;
}
```

- [ ] **Step 4: Vérifier que les tests passent**

Run: `bun run test src/garden/sprites/sachet.test.ts`
Expected: PASS. Si la taille ne correspond pas, un décor dépasse du papier : corriger la position du décor, pas les constantes.

- [ ] **Step 5: Commit**

```bash
git add src/garden/sprites/sachet.ts src/garden/sprites/sachet.test.ts
git commit -m "feat(potager): sprite pixel-art des trois sachets" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Face de carte partagée

**Files:**

- Move: `src/garden/ui/herbier/cardFx.ts` -> `src/garden/ui/cards/cardFx.ts`
- Move: `src/garden/ui/herbier/useCardFx.ts` -> `src/garden/ui/cards/useCardFx.ts`
- Create: `src/garden/ui/cards/LiveFlower.tsx`
- Modify: `src/garden/ui/herbier/SpecimenCard.tsx`

**Interfaces:**

- Consumes: `useCardFx(ref, species, color, rarity, variant)`, `CARD_W`, `CARD_H`.
- Produces: `LiveFlower({ species, color, rarity, variant, className? })`, dans `ui/cards/LiveFlower.tsx`. `variant: VariantId | null`.

- [ ] **Step 1: Déplacer les fichiers**

```bash
mkdir -p src/garden/ui/cards
git mv src/garden/ui/herbier/cardFx.ts src/garden/ui/cards/cardFx.ts
git mv src/garden/ui/herbier/useCardFx.ts src/garden/ui/cards/useCardFx.ts
```

Leurs imports relatifs (`../../core/types`, `../../sprites/sprite`, `./cardFx`) restent valides, à la même profondeur.

- [ ] **Step 2: Créer `LiveFlower`**

`src/garden/ui/cards/LiveFlower.tsx` :

```tsx
import { useRef } from "react";
import type { ColorId, Rarity, SpeciesId, VariantId } from "../../core/types";
import { CARD_H, CARD_W } from "./cardFx";
import { useCardFx } from "./useCardFx";

// Fleur animée d'une carte : halo, lueur, reflet et particules selon la rareté.
export function LiveFlower({
  species,
  color,
  rarity,
  variant,
  className,
}: {
  species: SpeciesId;
  color: ColorId;
  rarity: Rarity;
  variant: VariantId | null;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useCardFx(ref, species, color, rarity, variant);
  return (
    <canvas
      ref={ref}
      width={CARD_W}
      height={CARD_H}
      className={`block [image-rendering:pixelated] ${className ?? ""}`}
    />
  );
}
```

- [ ] **Step 3: Brancher `SpecimenCard`**

Dans `src/garden/ui/herbier/SpecimenCard.tsx` :

- Remplacer `import { useRef, useState } from "react";` par `import { useState } from "react";`.
- Supprimer les imports `CARD_H, CARD_W` et `useCardFx`, et ajouter `import { LiveFlower } from "../cards/LiveFlower";`.
- Retirer `SpeciesId` de l'import de types s'il n'est plus utilisé (il l'est encore dans les props de `SpecimenCard` : le garder).
- Supprimer la fonction `LiveSprite` entière.
- Remplacer `<LiveSprite species={species} specimen={specimen} variant={shown} />` par :

```tsx
<LiveFlower
  species={species}
  color={specimen.color}
  rarity={specimen.rarity}
  variant={shown}
  className="mx-auto w-[112px]"
/>
```

- [ ] **Step 4: Vérifier**

Run: `bunx tsc --noEmit && bun run lint && bun run test src/garden`
Expected: aucune erreur, tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/garden/ui/cards src/garden/ui/herbier/SpecimenCard.tsx src/garden/ui/herbier/cardFx.ts src/garden/ui/herbier/useCardFx.ts
git commit -m "refactor(potager): face de carte animée partagée dans ui/cards" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Cartes, paquet, particules et secousse

**Files:**

- Create: `src/garden/ui/sachets/styles.ts`
- Create: `src/garden/ui/sachets/CardBack.tsx`
- Create: `src/garden/ui/sachets/NewStamp.tsx`
- Create: `src/garden/ui/sachets/RevealCard.tsx`
- Create: `src/garden/ui/sachets/CardDeck.tsx`
- Create: `src/garden/ui/sachets/BurstLayer.tsx`
- Create: `src/garden/ui/sachets/useScreenShake.ts`

**Interfaces:**

- Consumes: `REVEAL_FX`, `FLIP_MS` (Task 3) ; `emit`, `isIdle`, `newBurst`, `stepBurst`, `Burst`, `BurstKind` (Task 2) ; `LiveFlower` (Task 5) ; `RARITY_COLOR` de `ui/toolMeta.ts` ; `flowerName`, `RARITY_FR`, `VARIANT_FR` de `core/labels.ts` ; `SpriteIcon`.
- Produces:
  - `BUTTON`, `BUTTON_GHOST` (classes)
  - `CardBack({ rarity, className? })`
  - `NewStamp({ delay })` (delay en secondes)
  - `RevealCard({ seed, fresh, size: "big" | "small" })`
  - `CardDeck({ seeds, offset, onNext })`
  - `interface BurstHandle { fire(kind: BurstKind, clientX: number, clientY: number): void }`, `BurstLayer({ ref })`
  - `useScreenShake(ref): (strength: number) => void`

Ces composants ne sont branchés qu'à la Task 8 ; la vérification ici est `tsc` et `lint`.

- [ ] **Step 1: Classes des boutons**

`src/garden/ui/sachets/styles.ts` :

```ts
export const BUTTON =
  "rounded-lg border border-amber-300/50 bg-amber-300/15 px-5 py-1.5 font-serif text-[15px] text-[#f3dca0] hover:bg-amber-300/25";

export const BUTTON_GHOST =
  "rounded-lg px-4 py-1.5 font-serif text-[14px] text-[#a99a8a] hover:text-[#f3dca0]";
```

- [ ] **Step 2: Dos de carte**

`src/garden/ui/sachets/CardBack.tsx` :

```tsx
import { motion } from "motion/react";
import type { Rarity } from "../../core/types";
import { SpriteIcon } from "../SpriteIcon";
import { RARITY_COLOR } from "../toolMeta";

const NEUTRAL = "#7a6a5a";

// La teinte du dos trahit la rareté ; la lueur pulse à partir de rare.
export function CardBack({ rarity, className }: { rarity: Rarity; className?: string }) {
  const color = rarity === "commune" ? NEUTRAL : RARITY_COLOR[rarity];
  const ring = `inset 0 0 0 3px ${color}`;
  const glow = rarity !== "commune";
  return (
    <motion.div
      className={`flex items-center justify-center rounded-xl bg-[#2c2027] bg-[repeating-linear-gradient(45deg,rgba(255,255,255,.04)_0_6px,transparent_6px_12px)] ${className ?? ""}`}
      style={{ boxShadow: ring }}
      animate={
        glow
          ? { boxShadow: [`${ring}, 0 0 8px ${color}55`, `${ring}, 0 0 28px ${color}cc`] }
          : undefined
      }
      transition={glow ? { duration: 1.1, repeat: Infinity, repeatType: "reverse" } : undefined}
    >
      <SpriteIcon sprite={{ name: "graine", color: "cream" }} cropped className="w-10 opacity-60" />
    </motion.div>
  );
}
```

- [ ] **Step 3: Tampon "Nouveau !"**

`src/garden/ui/sachets/NewStamp.tsx` :

```tsx
import { motion } from "motion/react";

// Tombe sur la carte une fois retournée ; delay en secondes.
export function NewStamp({ delay }: { delay: number }) {
  return (
    <motion.span
      className="absolute -right-3 -top-3 z-10 rounded-md border-2 border-[#e8603a] bg-[#2a1410] px-2 py-0.5 font-serif text-sm font-bold text-[#ffb08a] shadow-[0_0_12px_rgba(232,96,58,.6)]"
      initial={{ scale: 2.4, opacity: 0, rotate: -12 }}
      animate={{ scale: 1, opacity: 1, rotate: -12 }}
      transition={{ delay, type: "spring", stiffness: 500, damping: 18 }}
    >
      Nouveau !
    </motion.span>
  );
}
```

- [ ] **Step 4: Carte révélée**

`src/garden/ui/sachets/RevealCard.tsx` :

```tsx
import { motion, useReducedMotion } from "motion/react";
import { flowerName, RARITY_FR, VARIANT_FR } from "../../core/labels";
import type { Seed } from "../../core/types";
import { LiveFlower } from "../cards/LiveFlower";
import { RARITY_COLOR } from "../toolMeta";
import { CardBack } from "./CardBack";
import { NewStamp } from "./NewStamp";
import { FLIP_MS, REVEAL_FX } from "./packFlow";

const SIZE = {
  big: { box: "h-[400px] w-[256px]", flower: "w-[224px]", name: "text-xl" },
  small: { box: "h-[232px] w-[144px]", flower: "w-[112px]", name: "text-sm" },
};

// big : tremble le temps de la pause de sa rareté, puis se retourne.
// small : déjà retournée, pour la rangée et le récapitulatif.
export function RevealCard({
  seed,
  fresh,
  size,
}: {
  seed: Seed;
  fresh: boolean;
  size: "big" | "small";
}) {
  const reduced = useReducedMotion();
  const s = SIZE[size];
  const big = size === "big";
  const color = RARITY_COLOR[seed.rarity];
  const hold = big ? REVEAL_FX[seed.rarity].hold / 1000 : 0;
  const shake = big && hold > 0 && !reduced;
  return (
    <motion.div
      className={`relative ${s.box}`}
      animate={shake ? { x: [0, -2, 2, -3, 3, -4, 4, -5, 5, 0] } : undefined}
      transition={shake ? { duration: hold, ease: "easeIn" } : undefined}
    >
      <motion.div
        className="relative size-full"
        style={{ transformStyle: "preserve-3d" }}
        initial={big ? { rotateY: 180 } : false}
        animate={{ rotateY: 0 }}
        transition={{ delay: hold, duration: FLIP_MS / 1000, ease: "easeOut" }}
      >
        <div
          className="absolute inset-0 [backface-visibility:hidden]"
          style={{ transform: "rotateY(180deg)" }}
        >
          <CardBack rarity={seed.rarity} className="size-full" />
        </div>
        <div
          className="absolute inset-0 flex flex-col items-center gap-1 rounded-xl bg-[#241a20] p-3 [backface-visibility:hidden]"
          style={{ boxShadow: `inset 0 0 0 3px ${color}` }}
        >
          <LiveFlower
            species={seed.species}
            color={seed.color}
            rarity={seed.rarity}
            variant={seed.variant ?? null}
            className={s.flower}
          />
          <b className={`text-center font-serif ${s.name} text-[#f3dca0]`}>{flowerName(seed)}</b>
          <span className="text-xs" style={{ color }}>
            {RARITY_FR[seed.rarity]}
            {seed.variant && ` - ${VARIANT_FR[seed.variant]}`}
          </span>
          {fresh && <NewStamp delay={big ? hold + FLIP_MS / 1000 : 0} />}
        </div>
      </motion.div>
    </motion.div>
  );
}
```

- [ ] **Step 5: Paquet face cachée**

`src/garden/ui/sachets/CardDeck.tsx` :

```tsx
import { motion } from "motion/react";
import type { Seed } from "../../core/types";
import { CardBack } from "./CardBack";

// Cartes encore face cachée, la première sur le dessus ; offset = index de la première
// dans le lot, pour garder des clés stables quand le paquet s'amincit.
export function CardDeck({
  seeds,
  offset,
  onNext,
}: {
  seeds: Seed[];
  offset: number;
  onNext: () => void;
}) {
  return (
    <button
      onClick={onNext}
      disabled={!seeds.length}
      title="Retourner la carte suivante"
      className="relative h-[232px] w-[144px] disabled:cursor-default"
    >
      {seeds.map((seed, i) => (
        <motion.div
          key={offset + i}
          className="absolute inset-0"
          style={{ zIndex: seeds.length - i }}
          initial={{ y: 80, opacity: 0, scale: 0.6 }}
          animate={{ y: i * -6, x: i * 4, opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.08, type: "spring", stiffness: 260, damping: 22 }}
        >
          <CardBack rarity={seed.rarity} className="size-full" />
        </motion.div>
      ))}
    </button>
  );
}
```

- [ ] **Step 6: Canvas des particules**

`src/garden/ui/sachets/BurstLayer.tsx` :

```tsx
import { useReducedMotion } from "motion/react";
import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import { emit, isIdle, newBurst, stepBurst, type Burst, type BurstKind } from "./burst";

export interface BurstHandle {
  fire(kind: BurstKind, clientX: number, clientY: number): void;
}

const RAY_COUNT = 12;

function draw(g: CanvasRenderingContext2D, b: Burst, t: number) {
  const { width: w, height: h } = g.canvas;
  const len = Math.hypot(w, h);
  g.clearRect(0, 0, w, h);
  for (const r of b.rays) {
    g.save();
    g.translate(r.x, r.y);
    g.rotate(t * 0.6);
    g.globalAlpha = Math.min(1, (r.life / r.max) * 2) * 0.3;
    g.fillStyle = r.color;
    for (let i = 0; i < RAY_COUNT; i++) {
      g.rotate((Math.PI * 2) / RAY_COUNT);
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(-len * 0.08, -len);
      g.lineTo(len * 0.08, -len);
      g.fill();
    }
    g.restore();
  }
  for (const p of b.parts) {
    g.save();
    g.globalAlpha = Math.min(1, (p.life / p.max) * 2);
    g.translate(p.x, p.y);
    g.rotate(p.rot);
    g.fillStyle = p.color;
    if (p.star) {
      g.fillRect(-p.size / 2, -1, p.size, 2);
      g.fillRect(-1, -p.size / 2, 2, p.size);
    } else g.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    g.restore();
  }
  if (b.flash > 0) {
    g.globalAlpha = b.flash * 0.75;
    g.fillStyle = "#fff4c8";
    g.fillRect(0, 0, w, h);
    g.globalAlpha = 1;
  }
}

// Canvas posé sur toute la scène ; la boucle ne tourne que tant qu'il reste à dessiner.
export function BurstLayer({ ref }: { ref: Ref<BurstHandle> }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const burst = useRef(newBurst());
  const raf = useRef(0);
  const reduced = useReducedMotion();

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  useImperativeHandle(
    ref,
    () => ({
      fire(kind, clientX, clientY) {
        const cv = canvas.current;
        if (!cv) return;
        if (cv.width !== cv.clientWidth || cv.height !== cv.clientHeight) {
          cv.width = cv.clientWidth;
          cv.height = cv.clientHeight;
        }
        const box = cv.getBoundingClientRect();
        emit(burst.current, kind, clientX - box.left, clientY - box.top);
        if (reduced) burst.current.flash = 0;
        if (raf.current) return;
        let last = performance.now();
        const frame = (now: number) => {
          const dt = Math.min(0.05, (now - last) / 1000);
          last = now;
          stepBurst(burst.current, dt);
          draw(cv.getContext("2d")!, burst.current, now / 1000);
          raf.current = isIdle(burst.current) ? 0 : requestAnimationFrame(frame);
        };
        raf.current = requestAnimationFrame(frame);
      },
    }),
    [reduced],
  );

  return <canvas ref={canvas} className="pointer-events-none absolute inset-0 z-20 size-full" />;
}
```

- [ ] **Step 7: Secousse**

`src/garden/ui/sachets/useScreenShake.ts` :

```ts
import { useCallback, type RefObject } from "react";

const STEPS = 8;

// Secousse brève du conteneur ; strength en pixels, 0 pour ne rien faire.
export function useScreenShake(ref: RefObject<HTMLElement | null>) {
  return useCallback(
    (strength: number) => {
      const el = ref.current;
      if (!el || !strength) return;
      const frames = Array.from({ length: STEPS }, (_, i) => {
        const a = strength * (1 - i / STEPS);
        const dx = (Math.random() * 2 - 1) * a;
        const dy = (Math.random() * 2 - 1) * a;
        return { transform: `translate(${dx}px, ${dy}px)` };
      });
      el.animate([...frames, { transform: "translate(0, 0)" }], {
        duration: 420,
        easing: "ease-out",
      });
    },
    [ref],
  );
}
```

- [ ] **Step 8: Vérifier**

Run: `bunx tsc --noEmit && bun run lint`
Expected: aucune erreur.

- [ ] **Step 9: Commit**

```bash
git add src/garden/ui/sachets/styles.ts src/garden/ui/sachets/CardBack.tsx src/garden/ui/sachets/NewStamp.tsx src/garden/ui/sachets/RevealCard.tsx src/garden/ui/sachets/CardDeck.tsx src/garden/ui/sachets/BurstLayer.tsx src/garden/ui/sachets/useScreenShake.ts
git commit -m "feat(potager): cartes, paquet et particules de l'ouverture" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Sachet à déchirer et pile

**Files:**

- Create: `src/garden/ui/sachets/TearablePack.tsx`
- Create: `src/garden/ui/sachets/PackStack.tsx`
- Create: `src/garden/ui/sachets/EmptyPack.tsx`

**Interfaces:**

- Consumes: `sachetDataUrl`, `SACHET_W`, `SACHET_H`, `TEAR_ROW` (Task 4) ; `PACK_SCALE`, `TEAR_THRESHOLD`, `tearProgress` (Task 3) ; `SpriteIcon`, `SpriteRef` ; `RARITY_COLOR`.
- Produces:
  - `TearablePack({ type, glow: Rarity | null, familyIcon: SpriteRef | null, onStart, onRip(clientX, clientY), onTorn })`
  - `PackStack({ under: SachetType[], children })`
  - `EmptyPack()`

- [ ] **Step 1: Sachet à déchirer**

`src/garden/ui/sachets/TearablePack.tsx` :

```tsx
import {
  animate,
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { useRef, useState } from "react";
import type { Rarity, SachetType } from "../../core/types";
import { SACHET_H, SACHET_W, sachetDataUrl, TEAR_ROW } from "../../sprites/sachet";
import type { SpriteRef } from "../../sprites/sprite";
import { SpriteIcon } from "../SpriteIcon";
import { RARITY_COLOR } from "../toolMeta";
import { PACK_SCALE, TEAR_THRESHOLD, tearProgress } from "./packFlow";

const W = SACHET_W * PACK_SCALE;
const H = SACHET_H * PACK_SCALE;
const BAND = TEAR_ROW * PACK_SCALE;

// Sachet du dessus. onStart part au premier geste (glisser ou clic) : le sachet est
// ouvert et sauvegardé tout de suite, d'où la lueur de rareté par la fente.
export function TearablePack({
  type,
  glow,
  familyIcon,
  onStart,
  onRip,
  onTorn,
}: {
  type: SachetType;
  glow: Rarity | null;
  familyIcon: SpriteRef | null;
  onStart: () => void;
  onRip: (clientX: number, clientY: number) => void;
  onTorn: () => void;
}) {
  const reduced = useReducedMotion();
  const url = sachetDataUrl(type);
  const bandRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const ripped = useRef(false);
  const [torn, setTorn] = useState(false);
  const x = useMotionValue(0);
  const bandY = useMotionValue(0);
  const bandRotate = useMotionValue(0);
  const shakeX = useMotionValue(0);
  const progress = useTransform(x, (v) => tearProgress(v, W));
  const glowOpacity = useTransform(progress, (p) => Math.min(1, 0.2 + p * 1.2));

  useAnimationFrame((t) => {
    shakeX.set(reduced || ripped.current ? 0 : Math.sin(t / 22) * progress.get() * 4);
  });

  const start = () => {
    if (started.current) return;
    started.current = true;
    onStart();
  };

  const rip = () => {
    if (ripped.current) return;
    ripped.current = true;
    setTorn(true);
    const box = bandRef.current?.getBoundingClientRect();
    if (box) onRip(box.left + box.width / 2, box.bottom);
    animate(bandY, -160, { duration: 0.35, ease: "easeOut" });
    animate(bandRotate, 35, { duration: 0.35 });
    animate(x, W * 1.4, { duration: 0.35, ease: "easeIn" }).then(onTorn);
  };

  const autoTear = () => {
    if (ripped.current) return;
    start();
    animate(x, W * TEAR_THRESHOLD, { duration: 0.25, ease: "easeInOut" }).then(rip);
  };

  return (
    <motion.div
      className="relative"
      style={{ width: W, height: H, x: shakeX }}
      animate={reduced ? undefined : { y: [0, -6, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      <div
        className="absolute inset-0 cursor-pointer"
        style={{ clipPath: `inset(${BAND}px 0 0 0)` }}
        onClick={autoTear}
      >
        <img src={url} alt="" draggable={false} className="size-full [image-rendering:pixelated]" />
        {type === "dore" && (
          <motion.div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(110deg, transparent 40%, rgba(255,255,240,.55) 50%, transparent 60%)",
              backgroundSize: "300% 100%",
              WebkitMaskImage: `url(${url})`,
              maskImage: `url(${url})`,
              WebkitMaskSize: "100% 100%",
              maskSize: "100% 100%",
            }}
            animate={{ backgroundPosition: ["150% 0%", "-50% 0%"] }}
            transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1, ease: "easeInOut" }}
          />
        )}
        {familyIcon && (
          <motion.div
            className="absolute inset-x-0 top-[42%] flex justify-center"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <SpriteIcon sprite={familyIcon} cropped className="w-16 drop-shadow-[0_0_6px_#fff8]" />
          </motion.div>
        )}
      </div>
      {glow && (
        <motion.div
          className="pointer-events-none absolute inset-x-1 blur-[4px]"
          style={{
            top: BAND - 10,
            height: 20,
            opacity: glowOpacity,
            background: `radial-gradient(50% 50% at 50% 50%, ${RARITY_COLOR[glow]}, transparent)`,
          }}
        />
      )}
      <motion.div
        ref={bandRef}
        className="absolute left-0 top-0 cursor-grab overflow-hidden active:cursor-grabbing"
        style={{ width: W, height: BAND, x, y: bandY, rotate: bandRotate }}
        drag={torn ? false : "x"}
        dragConstraints={{ left: 0, right: W }}
        dragElastic={0}
        dragMomentum={false}
        onDragStart={start}
        onDragEnd={() => {
          if (progress.get() >= TEAR_THRESHOLD) rip();
          else animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
        }}
        onTap={autoTear}
      >
        <img
          src={url}
          alt=""
          draggable={false}
          className="absolute left-0 top-0 max-w-none [image-rendering:pixelated]"
          style={{ width: W, height: H }}
        />
      </motion.div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Pile**

`src/garden/ui/sachets/PackStack.tsx` :

```tsx
import type { ReactNode } from "react";
import type { SachetType } from "../../core/types";
import { SACHET_H, SACHET_W, sachetDataUrl } from "../../sprites/sachet";
import { PACK_SCALE } from "./packFlow";

const TILT = [-7, 5, -3, 8, -5, 3];

// Sachets en attente sous celui du dessus, décalés et tournés ; les plus profonds d'abord.
export function PackStack({ under, children }: { under: SachetType[]; children: ReactNode }) {
  const shown = under.slice(0, TILT.length);
  return (
    <div
      className="relative"
      style={{ width: SACHET_W * PACK_SCALE, height: SACHET_H * PACK_SCALE }}
    >
      {shown
        .map((type, i) => (
          <img
            key={i}
            src={sachetDataUrl(type)}
            alt=""
            draggable={false}
            className="absolute inset-0 size-full brightness-75 [image-rendering:pixelated]"
            style={{
              transform: `translate(${(i + 1) * 6}px, ${(i + 1) * 5}px) rotate(${TILT[i]}deg)`,
            }}
          />
        ))
        .reverse()}
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Pile vide**

`src/garden/ui/sachets/EmptyPack.tsx` :

```tsx
import { SACHET_H, SACHET_W, sachetDataUrl } from "../../sprites/sachet";
import { PACK_SCALE } from "./packFlow";

export function EmptyPack() {
  return (
    <div className="flex flex-col items-center gap-3">
      <img
        src={sachetDataUrl("quotidien")}
        alt=""
        draggable={false}
        className="brightness-50 grayscale [image-rendering:pixelated]"
        style={{ width: SACHET_W * PACK_SCALE, height: SACHET_H * PACK_SCALE }}
      />
      <p className="text-xs text-[#a99a8a]">Prochain sachet à minuit</p>
    </div>
  );
}
```

- [ ] **Step 4: Vérifier**

Run: `bunx tsc --noEmit && bun run lint`
Expected: aucune erreur. Si `onTap` n'est pas accepté sur un élément déplaçable dans la version installée de motion, retirer `onTap` : le clic sur le corps suffit.

- [ ] **Step 5: Commit**

```bash
git add src/garden/ui/sachets/TearablePack.tsx src/garden/ui/sachets/PackStack.tsx src/garden/ui/sachets/EmptyPack.tsx
git commit -m "feat(potager): sachet à déchirer et pile des sachets" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Page Sachets branchée

**Files:**

- Create: `src/garden/ui/sachets/RevealStage.tsx`
- Create: `src/garden/ui/sachets/PackSummary.tsx`
- Rewrite: `src/garden/ui/sachets/SachetsPage.tsx`
- Modify: `src/garden/ui/GardenApp.tsx`
- Modify: `src/lib/accents.test.ts`
- Delete: `src/garden/ui/sachets/SachetPack.tsx`, `SeedReveal.tsx`, `reveal.ts`, `reveal.test.ts`

**Interfaces:**

- Consumes: tout ce qui précède ; `OpenedLot` (Task 1) ; `chanceOf`, `GAUGES` ; `herbierProgress` ; `MAX_PENDING` ; `PityGauge` ; `DEV_BUTTON`.
- Produces:
  - `RevealStage({ seeds, fresh, current, onNext, onRevealAll, onFlip(rarity, clientX, clientY) })`
  - `PackSummary({ seeds, fresh, pending, onNextPack, onGoToField })`
  - `SachetsPage({ save, opened, seenSeq, onSeen, onOpen, onGoToField, onDevSachet, onDevNextDay, onDevLegendary })`

- [ ] **Step 1: Scène de révélation**

`src/garden/ui/sachets/RevealStage.tsx` :

```tsx
import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import type { Rarity, Seed } from "../../core/types";
import { CardDeck } from "./CardDeck";
import { FLIP_MS, lockFor, REVEAL_FX } from "./packFlow";
import { RevealCard } from "./RevealCard";
import { BUTTON_GHOST } from "./styles";

export function RevealStage({
  seeds,
  fresh,
  current,
  onNext,
  onRevealAll,
  onFlip,
}: {
  seeds: Seed[];
  fresh: boolean[];
  current: number;
  onNext: () => void;
  onRevealAll: () => void;
  onFlip: (rarity: Rarity, clientX: number, clientY: number) => void;
}) {
  const card = useRef<HTMLDivElement>(null);
  const lockUntil = useRef(0);

  // Effets au milieu du retournement, une fois la pause de la rareté écoulée.
  useEffect(() => {
    if (current < 0) return;
    const { rarity } = seeds[current];
    lockUntil.current = performance.now() + lockFor(rarity);
    const id = setTimeout(
      () => {
        const box = card.current?.getBoundingClientRect();
        if (box) onFlip(rarity, box.left + box.width / 2, box.top + box.height * 0.4);
      },
      REVEAL_FX[rarity].hold + FLIP_MS / 2,
    );
    return () => clearTimeout(id);
  }, [current, seeds, onFlip]);

  const next = () => {
    if (performance.now() >= lockUntil.current) onNext();
  };

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex items-center gap-10">
        <CardDeck seeds={seeds.slice(current + 1)} offset={current + 1} onNext={next} />
        <div className="flex h-[400px] w-[256px] items-center justify-center">
          {current >= 0 ? (
            <motion.div
              key={current}
              ref={card}
              className="cursor-pointer"
              onClick={next}
              initial={{ x: -180, scale: 0.55, opacity: 0 }}
              animate={{ x: 0, scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 220, damping: 24 }}
            >
              <RevealCard seed={seeds[current]} fresh={fresh[current]} size="big" />
            </motion.div>
          ) : (
            <p className="text-center text-sm text-[#a99a8a]">
              Cliquer sur le paquet pour retourner une carte
            </p>
          )}
        </div>
      </div>
      <div className="flex h-[232px] gap-3">
        {seeds.slice(0, Math.max(0, current)).map((seed, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <RevealCard seed={seed} fresh={fresh[i]} size="small" />
          </motion.div>
        ))}
      </div>
      <button onClick={onRevealAll} className={BUTTON_GHOST}>
        Tout révéler
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Récapitulatif**

`src/garden/ui/sachets/PackSummary.tsx` :

```tsx
import { motion } from "motion/react";
import type { Seed } from "../../core/types";
import { RevealCard } from "./RevealCard";
import { BUTTON, BUTTON_GHOST } from "./styles";

export function PackSummary({
  seeds,
  fresh,
  pending,
  onNextPack,
  onGoToField,
}: {
  seeds: Seed[];
  fresh: boolean[];
  pending: number;
  onNextPack: () => void;
  onGoToField: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-4">
        {seeds.map((seed, i) => (
          <motion.div
            key={i}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.08 }}
          >
            <RevealCard seed={seed} fresh={fresh[i]} size="small" />
          </motion.div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        {pending > 0 && (
          <button onClick={onNextPack} className={BUTTON}>
            Sachet suivant ({pending})
          </button>
        )}
        <button onClick={onGoToField} className={BUTTON_GHOST}>
          Aller au champ
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Réécrire la page**

Remplacer tout le contenu de `src/garden/ui/sachets/SachetsPage.tsx` :

```tsx
import { useReducedMotion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { herbierProgress } from "../../core/herbier";
import { chanceOf, GAUGES } from "../../core/pity";
import { MAX_PENDING } from "../../core/sachets";
import type { GardenSave, Rarity } from "../../core/types";
import { DEV_BUTTON } from "../devButton";
import type { OpenedLot } from "../gardenReducer";
import { BurstLayer, type BurstHandle } from "./BurstLayer";
import { EmptyPack } from "./EmptyPack";
import { PackStack } from "./PackStack";
import { PackSummary } from "./PackSummary";
import {
  bestRarity,
  initialPhase,
  REVEAL_FX,
  stackOf,
  step,
  type FlowEvent,
  type Phase,
} from "./packFlow";
import { PityGauge } from "./PityGauge";
import { RevealStage } from "./RevealStage";
import { TearablePack } from "./TearablePack";
import { useScreenShake } from "./useScreenShake";

export function SachetsPage({
  save,
  opened,
  seenSeq,
  onSeen,
  onOpen,
  onGoToField,
  onDevSachet,
  onDevNextDay,
  onDevLegendary,
}: {
  save: GardenSave;
  opened: OpenedLot;
  seenSeq: number;
  onSeen: (seq: number) => void;
  onOpen: () => void;
  onGoToField: () => void;
  onDevSachet: () => void;
  onDevNextDay: () => void;
  onDevLegendary: () => void;
}) {
  const [phase, setPhase] = useState<Phase>(() => initialPhase(opened.seq, seenSeq));
  // jauges d'avant l'ouverture, affichées jusqu'au récapitulatif
  const [frozenPity, setFrozenPity] = useState(save.pity);
  const stage = useRef<HTMLDivElement>(null);
  const burst = useRef<BurstHandle>(null);
  const reduced = useReducedMotion();
  const shake = useScreenShake(stage);

  const go = (event: FlowEvent) => {
    const next = step(phase, event, opened.seeds.length);
    if (next === phase) return;
    setPhase(next);
    if (next.kind === "summary") onSeen(opened.seq);
  };

  const startTear = (open: () => void) => {
    if (phase.kind !== "idle") return;
    setFrozenPity(save.pity);
    open();
    go("startTear");
  };

  const onFlip = useCallback(
    (rarity: Rarity, cx: number, cy: number) => {
      const fx = REVEAL_FX[rarity];
      if (fx.burst) burst.current?.fire(fx.burst, cx, cy);
      if (!reduced) shake(fx.shake);
    },
    [reduced, shake],
  );

  const herbier = herbierProgress(save);
  const pending = save.sachets.pending;
  const busy = phase.kind === "tearing" || phase.kind === "revealing";
  const pity = busy ? frozenPity : save.pity;
  const { top, under } = stackOf(phase, pending, opened.type);
  // pendant la déchirure, opened est le lot du sachet tenu en main
  const lot = phase.kind === "tearing" ? opened : null;
  const best = lot ? bestRarity(lot.seeds) : "commune";
  const familyIcon =
    lot?.type === "famille" && lot.seeds[0]
      ? { name: lot.seeds[0].species, color: lot.seeds[0].color }
      : null;
  // même clé au repos et pendant la déchirure du même sachet : opened.seq avance au premier geste
  const packKey = opened.seq + (phase.kind === "idle" ? 1 : 0);

  return (
    <div className="flex flex-1 gap-4 overflow-auto p-5">
      <div
        ref={stage}
        className="relative flex flex-1 flex-col items-center justify-center gap-6 overflow-hidden rounded-xl bg-[radial-gradient(60%_60%_at_50%_40%,rgba(243,195,74,.10),transparent)]"
      >
        <BurstLayer ref={burst} />
        {phase.kind === "revealing" ? (
          <RevealStage
            seeds={opened.seeds}
            fresh={opened.fresh}
            current={phase.current}
            onNext={() => go("next")}
            onRevealAll={() => go("revealAll")}
            onFlip={onFlip}
          />
        ) : phase.kind === "summary" ? (
          <PackSummary
            seeds={opened.seeds}
            fresh={opened.fresh}
            pending={pending.length}
            onNextPack={() => go("reset")}
            onGoToField={onGoToField}
          />
        ) : top ? (
          <div className="flex flex-col items-center gap-4">
            <PackStack under={under}>
              <TearablePack
                key={packKey}
                type={top}
                glow={best === "commune" ? null : best}
                familyIcon={familyIcon}
                onStart={() => startTear(onOpen)}
                onRip={(x, y) => burst.current?.fire("paper", x, y)}
                onTorn={() => go("tear")}
              />
            </PackStack>
            <p className="text-sm text-[#d9c9a8]">
              {phase.kind === "idle"
                ? "Tirer la bande vers la droite, ou cliquer sur le sachet"
                : " "}
            </p>
            <p className="text-[11px] text-[#a99a8a]">
              {pending.length} en attente ({MAX_PENDING} au maximum)
            </p>
          </div>
        ) : (
          <EmptyPack />
        )}
        {import.meta.env.DEV && (
          <div className="flex gap-1">
            <button onClick={onDevSachet} className={DEV_BUTTON}>
              Dev : +1 sachet
            </button>
            <button onClick={onDevNextDay} className={DEV_BUTTON}>
              Dev : jour suivant
            </button>
            <button onClick={() => startTear(onDevLegendary)} className={DEV_BUTTON}>
              Dev : sachet légendaire
            </button>
          </div>
        )}
      </div>
      <aside className="flex w-[240px] flex-col gap-2.5">
        {herbier.found === herbier.total ? (
          <section className="rounded-xl border border-amber-300/30 bg-[#1a1216]/85 px-3 py-2.5 text-[11px] text-[#a99a8a]">
            Toutes les fleurs sont découvertes.
          </section>
        ) : (
          <PityGauge
            title="Chance de nouveauté"
            chance={chanceOf(GAUGES.discovery, pity.dryDiscovery)}
            rule="+2 points par graine sans nouveauté, jusqu'à 75 %. Retour à 25 % dès qu'une fleur inconnue sort."
          />
        )}
        <PityGauge
          title="Chance de rare ou mieux"
          chance={chanceOf(GAUGES.rare, pity.dryRare)}
          rule="+2 points par graine sans rare, jusqu'à 70 %. Retour à 25 % dès qu'une rare sort."
        />
      </aside>
    </div>
  );
}
```

Note : le bouton Dev "sachet légendaire" fonctionne même sans sachet en attente, puisque `stackOf` affiche `opened.type` pendant la déchirure. Au repos, sans sachet, `EmptyPack` s'affiche et le bouton Dev reste disponible.

- [ ] **Step 4: Brancher `GardenApp`**

Dans `src/garden/ui/GardenApp.tsx` :

- Remplacer l'import de `devSachets` par :

```ts
import { devLegendarySeeds, withExtraSachet, withPreviousDay } from "./sachets/devSachets";
```

- Après `const [tab, setTab] = useState<GardenTab>("champ");`, ajouter :

```ts
// dernier lot de sachet vu jusqu'au récapitulatif, pour ne pas rejouer la révélation
const [seenSachet, setSeenSachet] = useState(0);
```

- Remplacer le bloc `<SachetsPage ... />` par :

```tsx
<SachetsPage
  save={state.save}
  opened={state.opened}
  seenSeq={seenSachet}
  onSeen={setSeenSachet}
  onOpen={() => dispatch({ type: "open-sachet", now: Date.now(), rng: Math.random })}
  onGoToField={() => setTab("champ")}
  onDevSachet={() => dispatch({ type: "set", save: withExtraSachet(state.save!) })}
  onDevNextDay={() => {
    dispatch({ type: "set", save: withPreviousDay(state.save!) });
    dispatch({ type: "tick", now: Date.now() });
  }}
  onDevLegendary={() => dispatch({ type: "dev-reveal", seeds: devLegendarySeeds(Math.random) })}
/>
```

- [ ] **Step 5: Supprimer l'ancienne ouverture**

```bash
git rm src/garden/ui/sachets/SachetPack.tsx src/garden/ui/sachets/SeedReveal.tsx src/garden/ui/sachets/reveal.ts src/garden/ui/sachets/reveal.test.ts
```

- [ ] **Step 6: Garde-fou des accents**

Dans `src/lib/accents.test.ts`, ajouter `"reveler",` à la liste `WRONG`, juste après `"revelee",`.

- [ ] **Step 7: Vérifier**

Run: `bun run test && bunx tsc --noEmit && bun run lint`
Expected: tout PASS, aucune erreur.

- [ ] **Step 8: Vérification visuelle**

Démarrer l'aperçu (`preview_start` avec `vite`, ou `vite-alt` si 1420 est pris), ouvrir `?window=garden`, onglet Sachets, panneau visible. Vérifier et capturer :

1. Pile de sachets en attente (ajouter avec "Dev : +1 sachet"), le sachet du dessus flotte.
2. Glisser la bande à moitié et relâcher : elle revient, le compteur d'attente a baissé de 1, la pile affiche encore le sachet ; glisser à nouveau au-delà du seuil : la bande s'envole, confettis.
3. Clic simple sur un autre sachet : déchirure automatique.
4. Paquet face cachée, dos teintés ; clic : la carte arrive au centre et se retourne avec nom, rareté, tampon "Nouveau !" si nouvelle.
5. "Dev : sachet légendaire" : lueur dorée par la fente, puis légendaire qui tremble, flash, rayons, paillettes, secousse. Double-cliquer vite sur le paquet pendant la pause : la légendaire n'est pas sautée.
6. "Tout révéler" saute au récapitulatif ; les jauges bougent à ce moment ; "Sachet suivant (n)" et "Aller au champ" fonctionnent.
7. Déchirer puis changer d'onglet avant la fin de la révélation, revenir : récapitulatif du lot.
8. Ouvrir le dernier sachet : après "Sachet suivant" absent, sachet grisé "Prochain sachet à minuit" une fois l'onglet rouvert.
9. Console sans erreur (`read_console_messages`).

Corriger ce qui cloche avant de committer.

- [ ] **Step 9: Commit**

```bash
git add src/garden/ui/sachets src/garden/ui/GardenApp.tsx src/lib/accents.test.ts
git commit -m "feat(potager): ouverture des sachets façon booster" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
