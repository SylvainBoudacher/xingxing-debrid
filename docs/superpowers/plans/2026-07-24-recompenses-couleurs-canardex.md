# Récompenses de couleurs du Canardex - Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter trois canards de récompense décernés pour avoir collectionné toutes les couleurs de corps d'une, cinq puis dix espèces.

**Architecture:** Un catalogue de récompenses (`src/lib/duckRewards.ts`) remplace les paires de fonctions écrites à la main dans `duckDex.ts` et pilote une nouvelle section Récompenses du Canardex. La progression "famille complète" est une fonction pure sur les entrées du dex. Les trois nouveaux effets visuels sont dessinés en ligne dans la boucle de rendu de `PixelPool.tsx`, comme les effets existants.

**Tech Stack:** React 19 + TypeScript, Vite, Vitest, Canvas 2D, tauri-plugin-store.

**Spec:** `docs/superpowers/specs/2026-07-24-recompenses-couleurs-canardex-design.md`

## Global Constraints

- Les clés de store `reward_claimed` (Supernova) et `god_claimed` (Zeus) doivent être conservées telles quelles : les joueurs existants ont déjà ces drapeaux dans `duckdex.json`.
- Seules les espèces avec `maxColors > 1` comptent comme familles (27 sur 42).
- Seuils : 1 famille (Caméléon), 5 familles (Paon), 10 familles (Phénix Chromatique).
- Les trois nouveaux effets ne doivent jamais sortir d'un tirage aléatoire : ils ne sont ajoutés à aucune table de `duckRandom.ts`.
- Textes d'interface en français, sans em dash ni guillemets typographiques.
- Commandes : `bunx vitest run <fichier>` pour les tests, `bunx tsc --noEmit` pour le typage.

---

## File Structure

- `src/lib/duckDex.ts` (modifié) : progression du dex, ajout de `COLOR_SPECIES` et `completedFamilies`, remplacement des accesseurs de récompense par un couple générique.
- `src/lib/duckRewards.ts` (créé) : catalogue des cinq récompenses, `DexProgress`, `rewardProgress`, `familyRewardAt`, `isRewardEffect`.
- `src/components/duckTypes.ts` (modifié) : trois valeurs de plus dans l'union `Effect`.
- `src/components/duckRandom.ts` (modifié) : `getRarity` reconnaît les trois effets.
- `src/components/DuckDex.tsx` (modifié) : section Récompenses en grille, pied de modale supprimé.
- `src/components/PixelPool.tsx` (modifié) : rendu des trois effets.
- `src/components/DuckShop.tsx` (modifié) : toast de famille complète.
- `src/lib/duckDex.test.ts` (modifié) : progression des familles, compatibilité des clés de store.
- `src/components/duckRandom.test.ts` (modifié) : rareté des trois effets.

---

### Task 1: Progression des familles

**Files:**

- Modify: `src/lib/duckDex.ts`
- Test: `src/lib/duckDex.test.ts`

**Interfaces:**

- Consumes: `SPECIES`, `SPECIES_BY_ID`, `speciesOf` de `@/components/duckSpecies` (déjà importés).
- Produces:
  - `COLOR_SPECIES: DuckSpecies[]` - les espèces avec `maxColors > 1`
  - `completedFamilies(entries: DexEntries): number`
  - `DiscoveryResult` gagne `familyComplete: boolean` et `familiesComplete: number`

- [ ] **Step 1: Écrire les tests qui échouent**

Ajouter à la fin de `src/lib/duckDex.test.ts` :

```ts
describe("completedFamilies", () => {
  const PIRATE: Variant = { body: "#FFD21E", beak: "#2A2A2A", acc: "pirate" };

  // Enregistre `count` couleurs distinctes pour une même espèce. Les teintes
  // sont arbitraires: seul le nombre d'entrées compte pour la progression.
  async function fillFamily(base: Variant, count: number) {
    let last = null as Awaited<ReturnType<typeof recordDiscovery>> | null;
    for (let i = 0; i < count; i++) {
      last = await recordDiscovery({ ...base, body: `#0000${i.toString(16).padStart(2, "0")}` });
    }
    return last!;
  }

  it("counts nothing on an empty dex", () => {
    expect(completedFamilies({})).toBe(0);
  });

  it("never counts a fixed-look species", async () => {
    await recordDiscovery(PIRATE);
    expect(completedFamilies(await getDex())).toBe(0);
  });

  it("counts a colorable species only on its last color", async () => {
    const shades = SPECIES_BY_ID.get("shades")!;
    await fillFamily(SHADES, shades.maxColors - 1);
    expect(completedFamilies(await getDex())).toBe(0);
    await fillFamily(SHADES, shades.maxColors);
    expect(completedFamilies(await getDex())).toBe(1);
  });

  it("counts families independently", async () => {
    const shades = SPECIES_BY_ID.get("shades")!;
    const wizard = SPECIES_BY_ID.get("wizard")!;
    await fillFamily(SHADES, shades.maxColors);
    await fillFamily(WIZARD, wizard.maxColors);
    expect(completedFamilies(await getDex())).toBe(2);
  });

  it("exposes 27 colorable species", () => {
    expect(COLOR_SPECIES).toHaveLength(27);
    expect(COLOR_SPECIES.every((s) => s.maxColors > 1)).toBe(true);
  });
});

describe("recordDiscovery family flags", () => {
  it("flags familyComplete only on the color that completes the family", async () => {
    const shades = SPECIES_BY_ID.get("shades")!;
    let disc = await recordDiscovery(SHADES);
    expect(disc.familyComplete).toBe(false);
    expect(disc.familiesComplete).toBe(0);
    for (let i = 1; i < shades.maxColors - 1; i++) {
      disc = await recordDiscovery({ ...SHADES, body: `#0000${i.toString(16).padStart(2, "0")}` });
      expect(disc.familyComplete).toBe(false);
    }
    disc = await recordDiscovery({ ...SHADES, body: "#abcdef" });
    expect(disc.familyComplete).toBe(true);
    expect(disc.familiesComplete).toBe(1);
  });

  it("never flags familyComplete for a fixed-look species", async () => {
    const disc = await recordDiscovery({ body: "#FFD21E", beak: "#2A2A2A", acc: "pirate" });
    expect(disc.familyComplete).toBe(false);
  });

  it("does not re-flag familyComplete on a duplicate color", async () => {
    const shades = SPECIES_BY_ID.get("shades")!;
    for (let i = 0; i < shades.maxColors; i++) {
      await recordDiscovery({ ...SHADES, body: `#0000${i.toString(16).padStart(2, "0")}` });
    }
    const dup = await recordDiscovery({ ...SHADES, body: "#000000" });
    expect(dup.familyComplete).toBe(false);
    expect(dup.familiesComplete).toBe(1);
  });
});
```

Étendre les imports existants en haut du fichier de test :

```ts
import { SPECIES, SPECIES_BY_ID, speciesOf } from "@/components/duckSpecies";
```

et ajouter `COLOR_SPECIES` et `completedFamilies` à l'import depuis `./duckDex`.

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

Run: `bunx vitest run src/lib/duckDex.test.ts`
Expected: FAIL, `completedFamilies is not a function` et `COLOR_SPECIES is not defined`.

- [ ] **Step 3: Implémenter**

Dans `src/lib/duckDex.ts`, sous la déclaration du store (après la ligne `const store = new LazyStore(...)`) :

```ts
// Espèces dont le corps peut prendre plusieurs teintes: les seules qui peuvent
// former une "famille complète". Les espèces à apparence fixe seraient
// complètes dès leur découverte et videraient les paliers de leur sens.
export const COLOR_SPECIES = SPECIES.filter((s) => s.maxColors > 1);

export function completedFamilies(entries: DexEntries): number {
  return COLOR_SPECIES.filter((s) => (entries[s.id]?.length ?? 0) >= s.maxColors).length;
}
```

Ajouter les deux champs à `DiscoveryResult` :

```ts
familyComplete: boolean; // cette prise vient de compléter les couleurs de l'espèce
familiesComplete: number; // familles complètes après la prise
```

Dans `recordDiscovery`, remplacer le bloc de retour par :

```ts
const id = speciesOf(v);
const sp = SPECIES_BY_ID.get(id)!;
const colorCount = entries[id]?.length ?? 0;
return {
  species: sp,
  newSpecies: unlocked === "species",
  newColor: unlocked === "color",
  newShiny,
  discoveredSpecies: SPECIES.filter((s) => (entries[s.id]?.length ?? 0) > 0).length,
  totalSpecies: SPECIES.length,
  colorCount,
  shinyCount: shiny.length,
  familyComplete: unlocked === "color" && sp.maxColors > 1 && colorCount === sp.maxColors,
  familiesComplete: completedFamilies(entries),
};
```

- [ ] **Step 4: Lancer les tests pour vérifier qu'ils passent**

Run: `bunx vitest run src/lib/duckDex.test.ts`
Expected: PASS, tous les tests du fichier.

- [ ] **Step 5: Vérifier le typage**

Run: `bunx tsc --noEmit`
Expected: aucune sortie.

- [ ] **Step 6: Commit**

```bash
git add src/lib/duckDex.ts src/lib/duckDex.test.ts
git commit -m "feat(canardex): compte les familles de couleurs completes"
```

---

### Task 2: Trois nouveaux effets et leur rareté

**Files:**

- Modify: `src/components/duckTypes.ts`
- Modify: `src/components/duckRandom.ts:172-180`
- Test: `src/components/duckRandom.test.ts`

**Interfaces:**

- Produces: l'union `Effect` accepte `"chameleon"`, `"peacock"` et `"phoenix"`. `getRarity` renvoie `"legendary"` pour `chameleon`, `"mythic"` pour `peacock` et `phoenix`.

- [ ] **Step 1: Écrire le test qui échoue**

Ajouter à la fin de `src/components/duckRandom.test.ts` :

```ts
describe("reward effects rarity", () => {
  const BEAK = "#F5811F";

  it("ranks the chameleon as legendary", () => {
    expect(getRarity({ body: "#FFD21E", beak: BEAK, acc: "none", effect: "chameleon" })).toBe(
      "legendary",
    );
  });

  it("ranks the peacock and the phoenix as mythic", () => {
    expect(getRarity({ body: "#2E6B5E", beak: BEAK, acc: "none", effect: "peacock" })).toBe(
      "mythic",
    );
    expect(getRarity({ body: "#FFF3D6", beak: BEAK, acc: "none", effect: "phoenix" })).toBe(
      "mythic",
    );
  });

  it("keeps Zeus alone in the god tier", () => {
    expect(getRarity({ body: "#F4EFE4", beak: "#E8B93C", acc: "laurel", effect: "godly" })).toBe(
      "god",
    );
  });
});
```

Si `getRarity` n'est pas déjà importé dans ce fichier de test, l'ajouter à l'import existant depuis `./duckRandom`.

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `bunx vitest run src/components/duckRandom.test.ts`
Expected: FAIL, TypeScript rejette `"chameleon"` qui n'appartient pas à l'union `Effect`.

- [ ] **Step 3: Étendre l'union `Effect`**

Dans `src/components/duckTypes.ts`, ajouter les trois valeurs à la fin de l'union `Effect` :

```ts
export type Effect =
  | "glow"
  | "ghost"
  | "sparkle"
  | "bubbles"
  | "prismatic"
  | "golden"
  | "ooze"
  | "electric"
  | "royal"
  | "fire"
  | "frost"
  | "nova"
  | "godly"
  | "chameleon"
  | "peacock"
  | "phoenix";
```

- [ ] **Step 4: Classer les trois effets dans `getRarity`**

Dans `src/components/duckRandom.ts`, ajouter `"chameleon"` au set `LEGENDARY_EFFECTS` :

```ts
const LEGENDARY_EFFECTS = new Set<Effect>([
  "ghost",
  "sparkle",
  "prismatic",
  "golden",
  "ooze",
  "electric",
  "fire",
  "chameleon",
]);
```

et étendre la ligne mythique de `getRarity` :

```ts
if (v.effect === "royal" || v.effect === "nova" || v.effect === "peacock" || v.effect === "phoenix")
  return "mythic";
```

Ne toucher à aucune des tables de tirage (`LEGENDARY`, `RARE`, `COMMON_ACC`, `UNCOMMON_ACC`) : ces effets ne doivent jamais sortir au hasard.

- [ ] **Step 5: Lancer les tests pour vérifier qu'ils passent**

Run: `bunx vitest run src/components/duckRandom.test.ts`
Expected: PASS.

- [ ] **Step 6: Vérifier le typage**

Run: `bunx tsc --noEmit`
Expected: aucune sortie.

- [ ] **Step 7: Commit**

```bash
git add src/components/duckTypes.ts src/components/duckRandom.ts src/components/duckRandom.test.ts
git commit -m "feat(canardex): declare les effets chameleon, peacock et phoenix"
```

---

### Task 3: Catalogue des récompenses et section Récompenses

Tâche la plus grosse du lot : elle crée le catalogue, recâble `duckDex.ts` dessus et remplace le pied de modale du Canardex par une section en grille. Les trois parties sont indissociables, sinon l'application ne compile pas entre deux commits.

**Files:**

- Create: `src/lib/duckRewards.ts`
- Modify: `src/lib/duckDex.ts`
- Modify: `src/components/DuckDex.tsx`
- Test: `src/lib/duckDex.test.ts`

**Interfaces:**

- Consumes: `COLOR_SPECIES`, `completedFamilies` (Task 1), l'union `Effect` étendue (Task 2).
- Produces:
  - `DexProgress { species: number; shiny: number; families: number }`
  - `DuckReward { id, name, scale, storeKey, metric, threshold, unit, lockedHint, claimToast, variant }`
  - `REWARDS: DuckReward[]`
  - `rewardProgress(r: DuckReward, p: DexProgress): { done: number; total: number }`
  - `familyRewardAt(families: number): DuckReward | undefined`
  - `isRewardEffect(e?: Effect): boolean`
  - Dans `duckDex.ts` : `isClaimed(storeKey: string): Promise<boolean>` et `markClaimed(storeKey: string): Promise<void>`, en remplacement de `isRewardClaimed` / `markRewardClaimed` / `isGodRewardClaimed` / `markGodRewardClaimed`. `rewardVariant`, `godVariant`, `REWARD_DUCK_*` et `GOD_DUCK_*` disparaissent de `duckDex.ts` au profit du catalogue.

- [ ] **Step 1: Écrire les tests qui échouent**

Dans `src/lib/duckDex.test.ts`, remplacer le bloc `describe("reward", ...)` existant par :

```ts
describe("rewards", () => {
  it("keeps the legacy store keys of the two existing rewards", () => {
    expect(REWARDS.find((r) => r.id === "canardex-reward")!.storeKey).toBe("reward_claimed");
    expect(REWARDS.find((r) => r.id === "canardex-god")!.storeKey).toBe("god_claimed");
  });

  it("catalogs five rewards with distinct ids, keys and effects", () => {
    expect(REWARDS).toHaveLength(5);
    expect(new Set(REWARDS.map((r) => r.id)).size).toBe(5);
    expect(new Set(REWARDS.map((r) => r.storeKey)).size).toBe(5);
    expect(new Set(REWARDS.map((r) => r.variant().effect)).size).toBe(5);
  });

  it("sets the family thresholds to 1, 5 and 10", () => {
    const families = REWARDS.filter((r) => r.metric === "families").map((r) => r.threshold);
    expect(families).toEqual([1, 5, 10]);
  });

  it("no reward variant unlocks anything in the dex", async () => {
    for (const r of REWARDS) {
      const disc = await recordDiscovery(r.variant());
      expect(disc.newSpecies).toBe(false);
      expect(disc.newColor).toBe(false);
      expect(disc.familyComplete).toBe(false);
      expect(dexStatusOf(r.variant())).toBe(null);
    }
    expect(await getDex()).toEqual({});
  });

  it("caps the displayed progress at the threshold", () => {
    const phoenix = REWARDS.find((r) => r.metric === "families" && r.threshold === 10)!;
    expect(rewardProgress(phoenix, { species: 0, shiny: 0, families: 3 })).toEqual({
      done: 3,
      total: 10,
    });
    expect(rewardProgress(phoenix, { species: 0, shiny: 0, families: 15 })).toEqual({
      done: 10,
      total: 10,
    });
  });

  it("maps a family count to the reward it unlocks", () => {
    expect(familyRewardAt(1)!.name).toBe("Canard Caméléon");
    expect(familyRewardAt(5)!.name).toBe("Canard Paon");
    expect(familyRewardAt(10)!.name).toBe("Canard Phénix Chromatique");
    expect(familyRewardAt(2)).toBeUndefined();
  });

  it("claim flags persist independently per store key", async () => {
    expect(await isClaimed("reward_claimed")).toBe(false);
    await markClaimed("reward_claimed");
    expect(await isClaimed("reward_claimed")).toBe(true);
    expect(await isClaimed("god_claimed")).toBe(false);
  });
});
```

Mettre à jour les imports du fichier de test : retirer `godVariant`, `isGodRewardClaimed`, `isRewardClaimed`, `markGodRewardClaimed`, `markRewardClaimed`, `rewardVariant` de l'import `./duckDex`, ajouter `isClaimed` et `markClaimed`, et ajouter :

```ts
import { familyRewardAt, REWARDS, rewardProgress } from "./duckRewards";
```

Le test `"reward variant is mythic and maps to a cataloged species"` supprimé avec l'ancien bloc est remplacé par la couverture ci-dessus ; `getRarity` et `speciesOf` peuvent devenir des imports inutilisés dans ce fichier, les retirer si ESLint le signale.

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

Run: `bunx vitest run src/lib/duckDex.test.ts`
Expected: FAIL, `Cannot find module './duckRewards'`.

- [ ] **Step 3: Créer le catalogue**

Créer `src/lib/duckRewards.ts` :

```ts
import { SPECIES } from "@/components/duckSpecies";
import type { Effect, Variant } from "@/components/duckTypes";

// Catalogue des canards de récompense: ils ne sortent jamais d'un tirage, ils
// se réclament dans le Canardex. Chaque récompense vise une métrique de
// progression et un seuil, et mémorise son déblocage sous sa propre clé de
// store dans duckdex.json.

export interface DexProgress {
  species: number; // espèces découvertes
  shiny: number; // espèces collectionnées en shiny
  families: number; // espèces colorables dont toutes les couleurs sont prises
}

export type RewardMetric = keyof DexProgress;

export interface DuckReward {
  id: string;
  name: string;
  scale: number;
  storeKey: string;
  metric: RewardMetric;
  threshold: number;
  unit: string; // libellé du compteur de progression
  lockedHint: string;
  claimToast: string;
  variant: () => Variant;
}

export const REWARDS: DuckReward[] = [
  {
    id: "canardex-chameleon",
    name: "Canard Caméléon",
    scale: 1,
    storeKey: "chameleon_claimed",
    metric: "families",
    threshold: 1,
    unit: "famille",
    lockedHint: "Collectionne toutes les couleurs d'une même espèce.",
    claimToast: "Canard Caméléon a rejoint ta collection !",
    variant: () => ({ body: "#8FD14F", beak: "#F5811F", acc: "none", effect: "chameleon" }),
  },
  {
    id: "canardex-peacock",
    name: "Canard Paon",
    scale: 1.2,
    storeKey: "peacock_claimed",
    metric: "families",
    threshold: 5,
    unit: "familles",
    lockedHint: "Complète les couleurs de 5 espèces.",
    claimToast: "Canard Paon déploie sa roue !",
    variant: () => ({ body: "#2E6B5E", beak: "#F5811F", acc: "none", effect: "peacock" }),
  },
  {
    id: "canardex-phoenix",
    name: "Canard Phénix Chromatique",
    scale: 1.7,
    storeKey: "phoenix_claimed",
    metric: "families",
    threshold: 10,
    unit: "familles",
    lockedHint: "Complète les couleurs de 10 espèces.",
    claimToast: "Le Phénix Chromatique renaît de ses cendres !",
    variant: () => ({ body: "#FFF3D6", beak: "#E8B93C", acc: "none", effect: "phoenix" }),
  },
  {
    id: "canardex-reward",
    name: "Canard Supernova",
    scale: 1.15,
    storeKey: "reward_claimed",
    metric: "species",
    threshold: SPECIES.length,
    unit: "espèces",
    lockedHint: `Découvre les ${SPECIES.length} espèces.`,
    claimToast: "Canard Supernova a rejoint ta collection !",
    variant: () => ({
      body: "#1B1035",
      beak: "#FFD21E",
      acc: "halo",
      pattern: "galaxy",
      effect: "nova",
    }),
  },
  {
    id: "canardex-god",
    name: "Zeus, le Dieu Canard",
    scale: 1.7,
    storeKey: "god_claimed",
    metric: "shiny",
    threshold: SPECIES.length,
    unit: "shiny",
    lockedHint: `Collectionne la version shiny des ${SPECIES.length} espèces.`,
    claimToast: "Zeus, le Dieu Canard descend de l'Olympe !",
    variant: () => ({ body: "#F4EFE4", beak: "#E8B93C", acc: "laurel", effect: "godly" }),
  },
];

// Progression affichée sur une carte, plafonnée au seuil: le compteur de
// familles peut dépasser 10 sans que la carte affiche 15/10.
export function rewardProgress(r: DuckReward, p: DexProgress): { done: number; total: number } {
  return { done: Math.min(p[r.metric], r.threshold), total: r.threshold };
}

// La récompense que ce nombre exact de familles vient de débloquer, s'il y en a.
export function familyRewardAt(families: number): DuckReward | undefined {
  return REWARDS.find((r) => r.metric === "families" && r.threshold === families);
}

const REWARD_EFFECTS = new Set<Effect>(REWARDS.map((r) => r.variant().effect!));

// Une récompense n'est pas une espèce: la re-sauvegarder ne doit rien débloquer.
export function isRewardEffect(e?: Effect): boolean {
  return !!e && REWARD_EFFECTS.has(e);
}
```

- [ ] **Step 4: Recâbler `duckDex.ts` sur le catalogue**

Dans `src/lib/duckDex.ts` :

Ajouter l'import :

```ts
import { isRewardEffect, REWARDS } from "./duckRewards";
```

Remplacer les trois tests écrits en dur. Dans `dexStatusOf` :

```ts
if (isRewardEffect(v.effect)) return null; // les récompenses ne débloquent rien
```

Dans `merge` :

```ts
if (isRewardEffect(v.effect)) return null;
```

Dans `mergeShiny` :

```ts
if (!v.shiny || isRewardEffect(v.effect)) return false;
```

Supprimer les blocs `REWARD_DUCK_ID` / `REWARD_DUCK_NAME` / `REWARD_DUCK_SCALE` / `rewardVariant`, `GOD_DUCK_ID` / `GOD_DUCK_NAME` / `GOD_DUCK_SCALE` / `godVariant`, ainsi que `isRewardClaimed`, `markRewardClaimed`, `isGodRewardClaimed` et `markGodRewardClaimed`. Les remplacer par :

```ts
export async function isClaimed(storeKey: string): Promise<boolean> {
  return (await store.get<boolean>(storeKey)) ?? false;
}

export async function markClaimed(storeKey: string): Promise<void> {
  await store.set(storeKey, true);
  await store.save();
}
```

Mettre à jour `debugResetDex` pour remettre à zéro toutes les clés du catalogue :

```ts
export async function debugResetDex(): Promise<void> {
  cache = {};
  shinyCache = [];
  await store.set("entries", {});
  await store.set("shiny", []);
  for (const r of REWARDS) await store.set(r.storeKey, false);
  await store.save();
}
```

- [ ] **Step 5: Lancer les tests pour vérifier qu'ils passent**

Run: `bunx vitest run src/lib/duckDex.test.ts`
Expected: PASS.

- [ ] **Step 6: Remplacer le pied de modale par la section Récompenses**

Dans `src/components/DuckDex.tsx` :

Remplacer l'import depuis `@/lib/duckDex` par :

```ts
import {
  completedFamilies,
  debugCompleteDex,
  debugCompleteShinyDex,
  debugResetDex,
  getDex,
  getShinyDex,
  isClaimed,
  markClaimed,
  syncDexWithCollection,
  type DexEntries,
  type ShinyEntries,
} from "@/lib/duckDex";
import { REWARDS, rewardProgress, type DexProgress, type DuckReward } from "@/lib/duckRewards";
```

Retirer `Lock` et `Sparkles` de l'import `lucide-react` (ils ne servaient qu'au pied de modale) et retirer `isDexComplete` / `isShinyDexComplete` s'ils ne sont plus utilisés ailleurs dans le fichier.

Remplacer les états `claimed` et `godClaimed` par un seul :

```ts
const [claimed, setClaimed] = useState<Record<string, boolean>>({});
```

Remplacer le corps de `openDex` par :

```ts
async function openDex() {
  const synced = await syncDexWithCollection();
  const flags = await Promise.all(
    REWARDS.map(async (r) => [r.id, await isClaimed(r.storeKey)] as const),
  );
  setEntries(synced);
  setShiny(await getShinyDex());
  setClaimed(Object.fromEntries(flags));
  setOpen(true);
}
```

Remplacer les deux fonctions `claim` et `claimGod` par une seule :

```ts
async function claim(reward: DuckReward) {
  const duck = {
    id: reward.id,
    name: reward.name,
    variant: reward.variant(),
    scale: reward.scale,
    savedAt: Date.now(),
  };
  await upsertSavedDuck(duck);
  injectDuck({ id: duck.id, name: duck.name, variant: duck.variant, scale: duck.scale });
  await markClaimed(reward.storeKey);
  setClaimed((prev) => ({ ...prev, [reward.id]: true }));
  toast.success(reward.claimToast);
}
```

Dans `devReset`, remplacer `setClaimed(false); setGodClaimed(false);` par `setClaimed({});`.

Remplacer les dérivations `complete` / `shinyComplete` par :

```ts
const discovered = SPECIES.filter((s) => (entries[s.id]?.length ?? 0) > 0).length;
const families = completedFamilies(entries);
const progress: DexProgress = { species: discovered, shiny: shiny.length, families };
const complete = discovered === SPECIES.length;
```

`complete` reste utilisé par l'en-tête pour révéler la barre shiny.

Supprimer entièrement le bloc du pied de modale (le `<div className="space-y-3 border-t border-black/10 dark:border-white/10 px-5 py-4">` et tout son contenu), et ajouter la section Récompenses juste après la fermeture du `SECTIONS.map(...)`, à l'intérieur du conteneur défilant :

```tsx
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, delay: 0.4, ease: "easeOut" }}
>
  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
    Récompenses · {families} familles complètes
  </p>
  <div className="grid grid-cols-4 gap-2">
    {REWARDS.map((r) => {
      const { done, total } = rewardProgress(r, progress);
      const unlocked = done >= total;
      const got = claimed[r.id];
      return (
        <div
          key={r.id}
          title={got ? r.name : r.lockedHint}
          className={`relative flex flex-col items-center gap-1 rounded-xl bg-white/70 dark:bg-zinc-800/60 px-2 py-3 ring-1 ${got ? "ring-yellow-300/50" : unlocked ? "ring-amber-400/70" : "ring-black/5 dark:ring-white/5"}`}
        >
          <span className={got ? "" : "brightness-0 opacity-25 dark:invert"}>
            <DuckPreview variant={r.variant()} size={52} />
          </span>
          <p className="w-full truncate text-center text-[11px] font-medium text-zinc-800 dark:text-zinc-200">
            {got ? r.name : "???"}
          </p>
          {got ? (
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500">Obtenu</p>
          ) : unlocked ? (
            <Button size="sm" className="h-6 px-2 text-[10px]" onClick={() => claim(r)}>
              Réclamer
            </Button>
          ) : (
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
              {done}/{total} {r.unit}
            </p>
          )}
        </div>
      );
    })}
  </div>
</motion.div>
```

- [ ] **Step 7: Vérifier le typage et le lint**

Run: `bunx tsc --noEmit && bunx eslint src`
Expected: aucune sortie. Corriger les imports devenus inutilisés si ESLint les signale.

- [ ] **Step 8: Vérifier à l'écran**

Run: `bun run dev`, ouvrir la piscine, ouvrir le Canardex par le pokédex pixel art.
Expected: le pied de modale a disparu ; une section Récompenses apparaît en bas de la liste avec cinq silhouettes et leurs compteurs (`0/1 famille`, `0/5 familles`, `0/10 familles`, `0/42 espèces`, `0/42 shiny`). Le bouton DEV: compléter fait passer le Supernova en Réclamer.

- [ ] **Step 9: Commit**

```bash
git add src/lib/duckRewards.ts src/lib/duckDex.ts src/lib/duckDex.test.ts src/components/DuckDex.tsx
git commit -m "feat(canardex): catalogue de recompenses et section dediee"
```

---

### Task 4: Rendu des trois effets

**Files:**

- Modify: `src/components/PixelPool.tsx:127-131` (rang de poussée)
- Modify: `src/components/PixelPool.tsx:1089-1091` (effets d'arrière-plan)
- Modify: `src/components/PixelPool.tsx:1217-1225` (dessin du canard)
- Modify: `src/components/PixelPool.tsx:1248-1250` (effets d'avant-plan)

**Interfaces:**

- Consumes: les valeurs d'effet déclarées en Task 2 et les variantes du catalogue de Task 3.
- Produces: aucun export nouveau, uniquement du rendu.

Aucun test unitaire : le canvas n'est pas couvert par Vitest dans ce projet. La vérification est visuelle.

- [ ] **Step 1: Donner au Phénix son rang de poussée**

Dans `src/components/PixelPool.tsx`, remplacer `pushRank` :

```ts
// Push hierarchy: the king, the supernova and the phoenix stand their ground
// against ordinary ducks and cannonballs; only Zeus the duck god can shove
// them, and Zeus himself yields to nothing.
function pushRank(d: Duck): number {
  if (d.effect === "godly") return 2;
  if (d.effect === "royal" || d.effect === "nova" || d.effect === "phoenix") return 1;
  return 0;
}
```

- [ ] **Step 2: Dessiner la roue du Paon et les flammes du Phénix derrière le canard**

Insérer juste après le bloc `if (d.effect === "frost") { ... }` et avant le commentaire `// supernova (dex completion reward)` :

```ts
// peacock (5 families reward): a fan of ocellated feathers opening behind
// the duck, breathing slowly while it idles
if (d.effect === "peacock") {
  const cx = d.x;
  const cy = d.y + bob + dh * 0.12;
  const open = 0.72 + Math.sin(t * 0.0012 + d.phase) * 0.28;
  const feathers = 11;
  const spread = Math.PI * 0.9 * open;
  for (let i = 0; i < feathers; i++) {
    const a = -Math.PI / 2 + (i / (feathers - 1) - 0.5) * spread;
    const len = dh * (0.95 + Math.sin(i * 1.1) * 0.06);
    const tx = cx + Math.cos(a) * len;
    const ty = cy + Math.sin(a) * len;
    ctx.strokeStyle = `hsla(${170 + i * 9},68%,42%,0.85)`;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    const tw = (Math.sin(t * 0.004 + i * 1.3 + d.phase) + 1) / 2;
    ctx.fillStyle = `rgba(232,190,60,${0.6 + tw * 0.4})`;
    ctx.beginPath();
    ctx.arc(tx, ty, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(40,90,180,${0.75 + tw * 0.25})`;
    ctx.beginPath();
    ctx.arc(tx, ty, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

// phoenix (10 families reward): rainbow flames instead of the infernal
// duck's orange ones, flaring up on a slow rebirth cycle (~20s)
if (d.effect === "phoenix") {
  const cycle = (t * 0.00005 + d.phase * 0.1) % 1;
  const burn = cycle > 0.92 ? (cycle - 0.92) / 0.08 : 0;
  for (let i = 0; i < 9; i++) {
    const p = (t * 0.0011 + d.phase + i * 0.11) % 1;
    const fx = d.x + Math.sin(t * 0.0022 + i * 1.7 + d.phase) * dw * 0.42;
    const fy = d.y + bob + dh * 0.18 - p * dh * (1 + burn * 0.6);
    const r = (3 + i * 0.5) * (1 - p * 0.5) * (1 + burn);
    const hue = (t * 0.06 + i * 40) % 360;
    ctx.fillStyle = `hsla(${hue},100%,65%,${(0.55 + burn * 0.35) * (1 - p)})`;
    ctx.beginPath();
    ctx.arc(fx, fy, r, 0, Math.PI * 2);
    ctx.fill();
  }
}
```

- [ ] **Step 3: Faire dériver la teinte du Caméléon**

Remplacer le bloc `// duck` :

```ts
// duck
ctx.save();
ctx.globalAlpha = d.effect === "ghost" ? 0.5 : 1;
// chameleon (1 family reward): the sprite is baked once, so the body can
// only change colour at draw time — one full hue cycle every ~24s, beak
// and accessory included
if (d.effect === "chameleon") ctx.filter = `hue-rotate(${(t * 0.015) % 360}deg)`;
ctx.translate(d.x, d.y + bob);
ctx.rotate(tilt);
ctx.scale(flip, 1);
ctx.imageSmoothingEnabled = true;
ctx.drawImage(d.sprite, -dw / 2, -dh / 2, dw, dh);
ctx.restore();
```

- [ ] **Step 4: Ajouter les cendres du Phénix en avant-plan**

Insérer juste après le bloc `if (d.effect === "royal") { ... }` des étincelles royales et avant le commentaire `// godly foreground` :

```ts
// phoenix ashes: coloured embers drifting up in front of the duck
if (d.effect === "phoenix") {
  for (let i = 0; i < 6; i++) {
    const p = (t * 0.0006 + d.phase + i * 0.17) % 1;
    const ax = d.x + Math.sin(t * 0.0015 + i * 2.3 + d.phase) * dw * 0.55;
    const ay = d.y + bob + dh * 0.3 - p * dh * 1.4;
    const hue = (t * 0.06 + i * 60) % 360;
    const s = 1.6 + (1 - p) * 1.4;
    ctx.fillStyle = `hsla(${hue},100%,72%,${0.7 * (1 - p)})`;
    ctx.fillRect(ax - s / 2, ay - s / 2, s, s);
  }
}
```

- [ ] **Step 5: Vérifier le typage**

Run: `bunx tsc --noEmit`
Expected: aucune sortie.

- [ ] **Step 6: Vérifier à l'écran**

Run: `bun run dev`, ouvrir le Canardex, cliquer DEV: compléter puis DEV: shiny pour débloquer les cinq récompenses, et les réclamer une par une.
Expected:

- le Caméléon glisse continuellement en teinte, corps, bec et accessoire compris
- le Paon affiche une roue de plumes qui s'ouvre et se referme, ocelles dorés et bleus qui scintillent en décalé
- le Phénix est entouré de flammes arc-en-ciel et de cendres colorées qui montent, avec une bouffée plus intense toutes les vingt secondes
- le Phénix n'est pas poussé par les canards ordinaires

- [ ] **Step 7: Commit**

```bash
git add src/components/PixelPool.tsx
git commit -m "feat(piscine): rendu des canards cameleon, paon et phenix"
```

---

### Task 5: Toast de famille complète

**Files:**

- Modify: `src/components/DuckShop.tsx:234-238`

**Interfaces:**

- Consumes: `DiscoveryResult.familyComplete` et `.familiesComplete` (Task 1), `familyRewardAt` (Task 3).

- [ ] **Step 1: Importer le sélecteur de récompense**

Dans `src/components/DuckShop.tsx`, ajouter :

```ts
import { familyRewardAt } from "@/lib/duckRewards";
```

- [ ] **Step 2: Dédoubler la branche `newColor`**

Remplacer le bloc `} else if (disc.newColor) { ... }` par :

```ts
    } else if (disc.newColor && disc.familyComplete) {
      const reward = familyRewardAt(disc.familiesComplete);
      toast.success(`Famille complète : ${disc.species.name} !`, {
        description: reward
          ? `${reward.name} t'attend dans le pokédex.`
          : `${disc.familiesComplete} familles complètes`,
        duration: 6000,
      });
    } else if (disc.newColor) {
      toast.info(`Nouvelle couleur pour ${disc.species.name}`, {
        description: `${disc.colorCount}/${disc.species.maxColors} couleurs collectionnées`,
      });
    }
```

- [ ] **Step 3: Vérifier le typage et le lint**

Run: `bunx tsc --noEmit && bunx eslint src`
Expected: aucune sortie.

- [ ] **Step 4: Lancer toute la suite de tests**

Run: `bun run test`
Expected: PASS sur l'ensemble des fichiers.

- [ ] **Step 5: Commit**

```bash
git add src/components/DuckShop.tsx
git commit -m "feat(canardex): celebre la completion d'une famille de couleurs"
```

---

## Notes de vérification finale

Après la dernière tâche, vérifier à la main dans `bun run dev` :

1. Ouvrir le Canardex, cliquer DEV: reset, confirmer que les cinq récompenses repassent en silhouette avec leurs compteurs à zéro.
2. Confirmer que la barre shiny de l'en-tête n'apparaît toujours qu'une fois les 42 espèces découvertes.
3. Confirmer qu'un joueur ayant déjà réclamé le Supernova avant la mise à jour le retrouve marqué Obtenu : la clé `reward_claimed` de `duckdex.json` n'a pas changé.
