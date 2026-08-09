# Roulette a films - plan d'implementation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un onglet "Roulette" a la page Decouverte qui tire un film au hasard parmi les genres coches, avec l'animation de ruban horizontal des ouvertures de caisses CS:GO, et branche le gagnant sur le pipeline releases existant.

**Architecture:** Le gagnant est tire avant l'animation ; le ruban de 60 cases est construit autour de lui et un unique `translateX` decelerant amene la case 52 sous le curseur central. Les helpers purs (rarete, geometrie du ruban, choix de page TMDB) vivent dans `src/lib/` et sont testes ; les composants ne font que du rendu.

**Tech Stack:** React 19 + TypeScript, motion/react, TanStack Query (via `cachedTmdb`), Tailwind 4, vitest.

Spec : `docs/superpowers/specs/2026-08-09-roulette-film-design.md`
Branche : `feat/discover-roulette` (deja creee, la spec y est commitee)

## Global Constraints

- Langue de l'interface : francais. Les libelles visibles utilisent des accents.
- Pas d'em-dash, pas de guillemets typographiques, pas d'Unicode decoratif dans le code et les commentaires.
- Commentaires rares, uniquement la ou la logique n'est pas evidente.
- Un composant par fichier. Aucun fichier de ce plan ne doit depasser ~150 lignes.
- Import alias : `@/` pointe sur `src/`.
- Clef API TMDB jamais dans une queryKey TanStack.
- Tests : `bun run test` (vitest, environnement `node`, fichiers `src/**/*.test.ts`).
- Type-check : `bunx tsc --noEmit`. Lint : `bun run lint`.
- Le hook pre-commit lance `lint-staged` + `tsc --noEmit` : un commit echoue si le type-check echoue.
- Messages de commit en anglais, prefixe conventionnel (`feat(...)`, `test(...)`), sans co-author.

---

### Task 1: Rarete des films

**Files:**

- Create: `src/lib/rouletteRarity.ts`
- Test: `src/lib/rouletteRarity.test.ts`

**Interfaces:**

- Consumes: rien.
- Produces: `type Rarity = "common" | "uncommon" | "rare" | "veryRare" | "exceptional"`, `rarityOf(voteAverage: number): Rarity`, `RARITY_STYLE: Record<Rarity, { label: string; color: string }>`.

- [ ] **Step 1: Write the failing test**

Fichier `src/lib/rouletteRarity.test.ts` :

```ts
import { describe, it, expect } from "vitest";
import { rarityOf, RARITY_STYLE, type Rarity } from "./rouletteRarity";

describe("rarityOf", () => {
  it("classe les notes basses en commun", () => {
    expect(rarityOf(0)).toBe("common");
    expect(rarityOf(5.9)).toBe("common");
  });

  it("bascule en peu commun a 6,0", () => {
    expect(rarityOf(6)).toBe("uncommon");
    expect(rarityOf(6.9)).toBe("uncommon");
  });

  it("bascule en rare a 7,0", () => {
    expect(rarityOf(7)).toBe("rare");
    expect(rarityOf(7.6)).toBe("rare");
  });

  it("bascule en tres rare a 7,7", () => {
    expect(rarityOf(7.7)).toBe("veryRare");
    expect(rarityOf(8.3)).toBe("veryRare");
  });

  it("bascule en exceptionnel a 8,4", () => {
    expect(rarityOf(8.4)).toBe("exceptional");
    expect(rarityOf(10)).toBe("exceptional");
  });
});

describe("RARITY_STYLE", () => {
  it("couvre les cinq paliers avec une couleur hexa", () => {
    const tiers: Rarity[] = ["common", "uncommon", "rare", "veryRare", "exceptional"];
    for (const t of tiers) {
      expect(RARITY_STYLE[t].label.length).toBeGreaterThan(0);
      expect(RARITY_STYLE[t].color).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
bun run test src/lib/rouletteRarity.test.ts
```

Attendu : FAIL, `Failed to resolve import "./rouletteRarity"`.

- [ ] **Step 3: Write minimal implementation**

Fichier `src/lib/rouletteRarity.ts` :

```ts
// Raretes du ruban, derivees de la note TMDB. Les seuils CS:GO litteraux (9+
// pour l'or) sont inatteignables avec vote_count.gte=200 : ils sont recalibres
// sur la distribution reelle. Purement descriptif, le tirage reste uniforme.
export type Rarity = "common" | "uncommon" | "rare" | "veryRare" | "exceptional";

const TIERS: Array<{ min: number; rarity: Rarity }> = [
  { min: 8.4, rarity: "exceptional" },
  { min: 7.7, rarity: "veryRare" },
  { min: 7.0, rarity: "rare" },
  { min: 6.0, rarity: "uncommon" },
];

export const RARITY_STYLE: Record<Rarity, { label: string; color: string }> = {
  common: { label: "Commun", color: "#4b69ff" },
  uncommon: { label: "Peu commun", color: "#8847ff" },
  rare: { label: "Rare", color: "#d32ce6" },
  veryRare: { label: "Très rare", color: "#eb4b4b" },
  exceptional: { label: "Exceptionnel", color: "#ffd700" },
};

export function rarityOf(voteAverage: number): Rarity {
  return TIERS.find((t) => voteAverage >= t.min)?.rarity ?? "common";
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
bun run test src/lib/rouletteRarity.test.ts
```

Attendu : PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/rouletteRarity.ts src/lib/rouletteRarity.test.ts
git commit -m "feat(roulette): add TMDB rating to rarity tiers"
```

---

### Task 2: Geometrie et construction du ruban

**Files:**

- Create: `src/lib/rouletteStrip.ts`
- Test: `src/lib/rouletteStrip.test.ts`

**Interfaces:**

- Consumes: `TmdbItem` depuis `@/lib/tmdbItem`.
- Produces: constantes `CARD_W = 110`, `CARD_GAP = 10`, `PITCH = 120`, `STRIP_LEN = 60`, `WINNER_INDEX = 52`, `JITTER_RATIO = 0.35`, `SPIN_MS = 6000`, `SPIN_EASE`. Fonctions `buildStrip(pool: TmdbItem[], winner: TmdbItem): TmdbItem[]` et `stripOffset(containerWidth: number, random?: number): number`.

Note : la spec ecrivait `PAS / 2` dans la formule d'offset. C'est `CARD_W / 2` qui est correct : une case occupe `CARD_W` et la gouttiere vient apres, donc le centre de la case `i` est a `i * PITCH + CARD_W / 2`. Ecart de 5 px, corrige ici.

- [ ] **Step 1: Write the failing test**

Fichier `src/lib/rouletteStrip.test.ts` :

```ts
import { describe, it, expect } from "vitest";
import {
  buildStrip,
  stripOffset,
  CARD_W,
  PITCH,
  STRIP_LEN,
  WINNER_INDEX,
  JITTER_RATIO,
} from "./rouletteStrip";
import type { TmdbItem } from "./tmdbItem";

function movie(id: number): TmdbItem {
  return {
    id,
    mediaType: "movie",
    title: `Film ${id}`,
    originalTitle: `Film ${id}`,
    posterPath: `/p${id}.jpg`,
    year: "2020",
    voteAverage: 7,
    overview: "",
    genreIds: [28],
  };
}

describe("buildStrip", () => {
  const pool = Array.from({ length: 40 }, (_, i) => movie(i + 1));

  it("produit toujours STRIP_LEN cases pleines", () => {
    const strip = buildStrip(pool, pool[3]);
    expect(strip).toHaveLength(STRIP_LEN);
    expect(strip.every((c) => !!c && typeof c.id === "number")).toBe(true);
  });

  it("place le gagnant a WINNER_INDEX", () => {
    const winner = pool[17];
    for (let i = 0; i < 50; i++) {
      expect(buildStrip(pool, winner)[WINNER_INDEX].id).toBe(winner.id);
    }
  });

  it("evite deux voisines identiques quand le pool le permet", () => {
    const strip = buildStrip(pool, pool[0]);
    for (let i = 1; i < strip.length; i++) {
      if (i === WINNER_INDEX || i === WINNER_INDEX + 1) continue;
      expect(strip[i].id).not.toBe(strip[i - 1].id);
    }
  });

  it("fonctionne avec un pool minuscule sans boucler", () => {
    const tiny = [movie(1), movie(2), movie(3)];
    const strip = buildStrip(tiny, tiny[1]);
    expect(strip).toHaveLength(STRIP_LEN);
    expect(strip[WINNER_INDEX].id).toBe(2);
  });

  it("fonctionne avec un pool d'un seul film", () => {
    const one = [movie(9)];
    const strip = buildStrip(one, one[0]);
    expect(strip).toHaveLength(STRIP_LEN);
    expect(strip.every((c) => c.id === 9)).toBe(true);
  });
});

describe("stripOffset", () => {
  it("aligne le centre du gagnant sur le curseur quand le jitter est nul", () => {
    const width = 1000;
    const offset = stripOffset(width, 0.5);
    const winnerCenter = PITCH * WINNER_INDEX + CARD_W / 2;
    expect(winnerCenter - offset).toBeCloseTo(width / 2, 6);
  });

  it("borne le jitter a +/- JITTER_RATIO d'une case", () => {
    const width = 1000;
    const base = stripOffset(width, 0.5);
    const max = JITTER_RATIO * PITCH;
    expect(stripOffset(width, 0) - base).toBeCloseTo(-max, 6);
    expect(stripOffset(width, 1) - base).toBeCloseTo(max, 6);
    for (let i = 0; i < 200; i++) {
      expect(Math.abs(stripOffset(width) - base)).toBeLessThanOrEqual(max + 1e-9);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
bun run test src/lib/rouletteStrip.test.ts
```

Attendu : FAIL, `Failed to resolve import "./rouletteStrip"`.

- [ ] **Step 3: Write minimal implementation**

Fichier `src/lib/rouletteStrip.ts` :

```ts
import type { TmdbItem } from "@/lib/tmdbItem";

// Geometrie du ruban. Le centre de la case i est a i * PITCH + CARD_W / 2 :
// la gouttiere vient apres la case, pas autour.
export const CARD_W = 110;
export const CARD_GAP = 10;
export const PITCH = CARD_W + CARD_GAP;
export const STRIP_LEN = 60;
export const WINNER_INDEX = 52;
export const JITTER_RATIO = 0.35;

export const SPIN_MS = 6000;
// Depart tres rapide, longue trainee : les dernieres cases prennent la moitie
// du temps.
export const SPIN_EASE: [number, number, number, number] = [0.08, 0.82, 0.17, 1];

function shuffled(items: TmdbItem[]): TmdbItem[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Le pool (~40 films) est tire sans remise puis rebrasse, ce qui evite qu'un
// meme film revienne trois cases plus loin. La case du gagnant est ecrasee en
// dernier : c'est elle qui doit tomber sous le curseur.
export function buildStrip(pool: TmdbItem[], winner: TmdbItem): TmdbItem[] {
  const strip: TmdbItem[] = [];
  let bag: TmdbItem[] = [];
  while (strip.length < STRIP_LEN) {
    if (bag.length === 0) bag = shuffled(pool);
    const next = bag.pop() as TmdbItem;
    const prev = strip[strip.length - 1];
    if (prev && prev.id === next.id && bag.length > 0) {
      strip.push(bag.pop() as TmdbItem);
      bag.push(next);
      continue;
    }
    strip.push(next);
  }
  strip[WINNER_INDEX] = winner;
  return strip;
}

// random est injectable pour les tests. Le jitter empeche l'arret pile au
// centre, comme dans les vraies ouvertures de caisses.
export function stripOffset(containerWidth: number, random: number = Math.random()): number {
  const jitter = (random * 2 - 1) * JITTER_RATIO * PITCH;
  return PITCH * WINNER_INDEX + CARD_W / 2 - containerWidth / 2 + jitter;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
bun run test src/lib/rouletteStrip.test.ts
```

Attendu : PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/rouletteStrip.ts src/lib/rouletteStrip.test.ts
git commit -m "feat(roulette): add strip geometry and builder"
```

---

### Task 3: Vivier TMDB (service + helpers purs)

**Files:**

- Modify: `src/lib/services/tmdb.ts` (ajouter dans `tmdbKeys` vers la ligne 76, et la fonction apres `discoverAnimation` vers la ligne 145)
- Create: `src/lib/rouletteGenres.ts`
- Create: `src/lib/roulettePool.ts`
- Test: `src/lib/roulettePool.test.ts`

**Interfaces:**

- Consumes: `TmdbListResponse`, `TmdbRawResult`, `tmdbKeys` de `@/lib/services/tmdb` ; `mapTmdb`, `TmdbItem` de `@/lib/tmdbItem`.
- Produces:
  - `discoverByGenres(genreIds: number[], page: number, apiKey: string): Promise<TmdbListResponse>`
  - `tmdbKeys.roulette(genreIds: number[], page: number)`
  - `ROULETTE_GENRES: Array<{ id: number; name: string }>`
  - `MAX_POOL_PAGE = 15`, `POOL_MIN = 10`
  - `pickPoolPage(totalPages: number, random?: number): number`
  - `usablePool(results: TmdbRawResult[]): TmdbItem[]`

- [ ] **Step 1: Write the failing test**

Fichier `src/lib/roulettePool.test.ts` :

```ts
import { describe, it, expect } from "vitest";
import { pickPoolPage, usablePool, MAX_POOL_PAGE } from "./roulettePool";
import type { TmdbRawResult } from "./services/tmdb";

function raw(id: number, poster: string | null): TmdbRawResult {
  return {
    id,
    title: `Film ${id}`,
    original_title: `Film ${id}`,
    poster_path: poster,
    release_date: "2019-05-02",
    vote_average: 7.4,
    overview: "resume",
    genre_ids: [28],
  };
}

describe("pickPoolPage", () => {
  it("reste dans 1..MAX_POOL_PAGE", () => {
    expect(pickPoolPage(500, 0)).toBe(1);
    expect(pickPoolPage(500, 0.999)).toBe(MAX_POOL_PAGE);
  });

  it("ne depasse jamais le nombre de pages disponibles", () => {
    expect(pickPoolPage(7, 0.999)).toBe(7);
    expect(pickPoolPage(1, 0.999)).toBe(1);
  });

  it("renvoie 1 quand TMDB annonce zero page", () => {
    expect(pickPoolPage(0, 0.5)).toBe(1);
  });

  it("tire toujours une page valide sans random injecte", () => {
    for (let i = 0; i < 200; i++) {
      const p = pickPoolPage(40);
      expect(p).toBeGreaterThanOrEqual(1);
      expect(p).toBeLessThanOrEqual(MAX_POOL_PAGE);
    }
  });
});

describe("usablePool", () => {
  it("ecarte les films sans jaquette", () => {
    const pool = usablePool([raw(1, "/a.jpg"), raw(2, null), raw(3, "/c.jpg")]);
    expect(pool.map((p) => p.id)).toEqual([1, 3]);
  });

  it("mappe vers des TmdbItem de type movie", () => {
    const [item] = usablePool([raw(42, "/a.jpg")]);
    expect(item.mediaType).toBe("movie");
    expect(item.title).toBe("Film 42");
    expect(item.year).toBe("2019");
  });

  it("accepte une liste vide", () => {
    expect(usablePool([])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
bun run test src/lib/roulettePool.test.ts
```

Attendu : FAIL, `Failed to resolve import "./roulettePool"`.

- [ ] **Step 3a: Write `src/lib/roulettePool.ts`**

```ts
import type { TmdbRawResult } from "@/lib/services/tmdb";
import { mapTmdb, type TmdbItem } from "@/lib/tmdbItem";

// TMDB trie par popularite : au-dela de la 15e page on tombe dans des titres
// que personne ne reconnait, ce qui casse le plaisir du tirage.
export const MAX_POOL_PAGE = 15;
// En dessous, le ruban tournerait sur trop peu de films distincts.
export const POOL_MIN = 10;

export function pickPoolPage(totalPages: number, random: number = Math.random()): number {
  const max = Math.max(1, Math.min(totalPages, MAX_POOL_PAGE));
  return Math.min(max, Math.floor(random * max) + 1);
}

export function usablePool(results: TmdbRawResult[]): TmdbItem[] {
  return results.filter((r) => !!r.poster_path).map((r) => mapTmdb(r, "movie"));
}
```

- [ ] **Step 3b: Write `src/lib/rouletteGenres.ts`**

```ts
// Genres proposes par la roulette : le sous-ensemble film de la table TMDB
// (voir src/lib/tmdbGenres.ts), dans l'ordre d'affichage des puces.
export const ROULETTE_GENRES: Array<{ id: number; name: string }> = [
  { id: 28, name: "Action" },
  { id: 12, name: "Aventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comédie" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentaire" },
  { id: 18, name: "Drame" },
  { id: 10751, name: "Familial" },
  { id: 14, name: "Fantastique" },
  { id: 36, name: "Histoire" },
  { id: 27, name: "Horreur" },
  { id: 10402, name: "Musique" },
  { id: 9648, name: "Mystère" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Science-fiction" },
  { id: 53, name: "Thriller" },
  { id: 10752, name: "Guerre" },
  { id: 37, name: "Western" },
];
```

- [ ] **Step 3c: Modify `src/lib/services/tmdb.ts`**

Ajouter la constante sous `export const ANIMATION_GENRE_ID = 16;` (ligne 4) :

```ts
// Plancher de votes du vivier de la roulette : ecarte les films fantomes sans
// note fiable, sans reduire le vivier a une poignee de classiques.
export const ROULETTE_VOTE_MIN = 200;
```

Ajouter dans l'objet `tmdbKeys`, apres la ligne `discoverAnimation: ...` :

```ts
  roulette: (genreIds: number[], page: number) =>
    ["tmdb", "roulette", [...genreIds].sort((a, b) => a - b).join(","), page] as const,
```

Ajouter apres la fonction `discoverAnimation` :

```ts
// Vivier de la roulette : les genres sont joints par "," (le OU de TMDB), la
// liste vide retire le filtre et ouvre le tirage a tout le catalogue.
export function discoverByGenres(genreIds: number[], page: number, apiKey: string) {
  const genres = genreIds.length ? `&with_genres=${genreIds.join(",")}` : "";
  return get<TmdbListResponse>(
    `${BASE}/discover/movie?api_key=${apiKey}&language=fr-FR&include_adult=false` +
      `&sort_by=popularity.desc&vote_count.gte=${ROULETTE_VOTE_MIN}${genres}&page=${page}`,
  );
}
```

- [ ] **Step 4: Run tests and type-check**

```bash
bun run test src/lib/roulettePool.test.ts
```

Attendu : PASS, 7 tests.

```bash
bunx tsc --noEmit
```

Attendu : aucune sortie.

- [ ] **Step 5: Commit**

```bash
git add src/lib/roulettePool.ts src/lib/roulettePool.test.ts src/lib/rouletteGenres.ts src/lib/services/tmdb.ts
git commit -m "feat(roulette): add genre discover endpoint and pool helpers"
```

---

### Task 4: Hook `useMovieRoulette`

**Files:**

- Create: `src/lib/useMovieRoulette.ts`

**Interfaces:**

- Consumes: `discoverByGenres`, `tmdbKeys` (Task 3), `pickPoolPage`, `usablePool`, `POOL_MIN` (Task 3), `buildStrip` (Task 2), `cachedTmdb` de `@/lib/tmdbCache`, `networkErrorMessage` de `@/lib/networkError`.
- Produces: `export type RouletteStatus = "idle" | "loading" | "spinning" | "revealed"`, `export const EMPTY_POOL_MESSAGE: string`, et `export function useMovieRoulette(tmdbKey: string)` dont le type de retour est infere :

```ts
{
  genreIds: number[];
  status: RouletteStatus;
  strip: TmdbItem[];
  winner: TmdbItem | null;
  error: string | null;
  spin: number;
  toggleGenre: (id: number) => void;
  clearGenres: () => void;
  roll: () => void;
  finishSpin: () => void;
}
```

Pas de test unitaire : le hook n'est que de l'orchestration d'etat autour de helpers deja testes, et le repo n'a pas de setup React Testing Library.

- [ ] **Step 1: Write the implementation**

Fichier `src/lib/useMovieRoulette.ts` :

```ts
import { networkErrorMessage } from "@/lib/networkError";
import { pickPoolPage, usablePool, POOL_MIN } from "@/lib/roulettePool";
import { buildStrip } from "@/lib/rouletteStrip";
import { discoverByGenres, tmdbKeys } from "@/lib/services/tmdb";
import { cachedTmdb } from "@/lib/tmdbCache";
import type { TmdbItem } from "@/lib/tmdbItem";
import { useState } from "react";

export type RouletteStatus = "idle" | "loading" | "spinning" | "revealed";

export const EMPTY_POOL_MESSAGE = "Pas assez de films pour ce genre, essayez d'en cocher un autre.";

// Deux pages consecutives, soit ~40 films apres filtrage : assez pour que le
// ruban ne tourne pas sur les memes jaquettes. Trop court (genre de niche), on
// retombe sur la page 1, la plus fournie.
async function loadPool(genreIds: number[], apiKey: string): Promise<TmdbItem[]> {
  const fetchPage = (page: number) =>
    cachedTmdb(tmdbKeys.roulette(genreIds, page), () => discoverByGenres(genreIds, page, apiKey));

  const first = await fetchPage(1);
  const page = pickPoolPage(first.total_pages);
  const [a, b] =
    page === 1
      ? [first, await fetchPage(2)]
      : await Promise.all([fetchPage(page), fetchPage(page + 1)]);

  const pool = usablePool([...a.results, ...b.results]);
  return pool.length >= POOL_MIN ? pool : usablePool(first.results);
}

// idle -> loading -> spinning -> revealed. Relancer repart de loading.
export function useMovieRoulette(tmdbKey: string) {
  const [genreIds, setGenreIds] = useState<number[]>([]);
  const [status, setStatus] = useState<RouletteStatus>("idle");
  const [strip, setStrip] = useState<TmdbItem[]>([]);
  const [winner, setWinner] = useState<TmdbItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Incremente a chaque tirage : remonte le ruban pour repartir de x = 0.
  const [spin, setSpin] = useState(0);

  const busy = status === "loading" || status === "spinning";

  function toggleGenre(id: number) {
    if (busy) return;
    setError(null);
    setGenreIds((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
  }

  function clearGenres() {
    if (busy) return;
    setError(null);
    setGenreIds([]);
  }

  async function roll() {
    if (busy) return;
    setStatus("loading");
    setError(null);
    setWinner(null);
    try {
      const pool = await loadPool(genreIds, tmdbKey);
      if (pool.length === 0) {
        setError(EMPTY_POOL_MESSAGE);
        setStatus("idle");
        return;
      }
      const picked = pool[Math.floor(Math.random() * pool.length)];
      setWinner(picked);
      setStrip(buildStrip(pool, picked));
      setSpin((s) => s + 1);
      setStatus("spinning");
    } catch (err) {
      setError(networkErrorMessage(err));
      setStatus("idle");
    }
  }

  function finishSpin() {
    setStatus((s) => (s === "spinning" ? "revealed" : s));
  }

  return {
    genreIds,
    status,
    strip,
    winner,
    error,
    spin,
    toggleGenre,
    clearGenres,
    roll: () => void roll(),
    finishSpin,
  };
}
```

- [ ] **Step 2: Type-check**

```bash
bunx tsc --noEmit
```

Attendu : aucune sortie.

- [ ] **Step 3: Lint**

```bash
bun run lint
```

Attendu : aucune erreur.

- [ ] **Step 4: Commit**

```bash
git add src/lib/useMovieRoulette.ts
git commit -m "feat(roulette): add movie roulette state hook"
```

---

### Task 5: Case du ruban et ruban anime

**Files:**

- Create: `src/components/RouletteCard.tsx`
- Create: `src/components/RouletteStrip.tsx`

**Interfaces:**

- Consumes: `CARD_W`, `CARD_GAP`, `STRIP_LEN`, `WINNER_INDEX`, `SPIN_MS`, `SPIN_EASE`, `stripOffset` (Task 2) ; `rarityOf`, `RARITY_STYLE` (Task 1) ; `posterUrl` de `@/lib/posterPreload`.
- Produces:

```ts
function RouletteCard(props: { item: TmdbItem | null; highlight: boolean }): JSX.Element;
function RouletteStrip(props: {
  strip: TmdbItem[];
  spin: number;
  spinning: boolean;
  revealed: boolean;
  instant: boolean;
  onSpinEnd: () => void;
}): JSX.Element;
```

- [ ] **Step 1: Write `src/components/RouletteCard.tsx`**

```tsx
import { posterUrl } from "@/lib/posterPreload";
import { RARITY_STYLE, rarityOf } from "@/lib/rouletteRarity";
import { CARD_W } from "@/lib/rouletteStrip";
import type { TmdbItem } from "@/lib/tmdbItem";
import { memo } from "react";

// item null : case grisee de l'etat idle, pour que le ruban ait sa hauteur
// definitive avant le premier lancer.
export const RouletteCard = memo(function RouletteCard({
  item,
  highlight,
}: {
  item: TmdbItem | null;
  highlight: boolean;
}) {
  const color = item ? RARITY_STYLE[rarityOf(item.voteAverage)].color : "#3f3f46";
  return (
    <div
      style={{
        width: CARD_W,
        borderBottomColor: color,
        backgroundImage: `linear-gradient(to top, ${color}40, transparent 65%)`,
        boxShadow: highlight ? `0 0 30px 6px ${color}80` : undefined,
      }}
      className="relative aspect-[2/3] shrink-0 overflow-hidden rounded-lg border-b-[3px] bg-zinc-200 ring-1 ring-black/10 transition-shadow duration-500 dark:bg-zinc-900 dark:ring-white/10"
    >
      {item?.posterPath && (
        <img
          src={posterUrl(item.posterPath, "w185")}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
        />
      )}
    </div>
  );
});
```

- [ ] **Step 2: Write `src/components/RouletteStrip.tsx`**

```tsx
import { RouletteCard } from "@/components/RouletteCard";
import {
  CARD_GAP,
  SPIN_EASE,
  SPIN_MS,
  STRIP_LEN,
  WINNER_INDEX,
  stripOffset,
} from "@/lib/rouletteStrip";
import type { TmdbItem } from "@/lib/tmdbItem";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion } from "motion/react";
import { useLayoutEffect, useRef, useState } from "react";

interface RouletteStripProps {
  strip: TmdbItem[];
  /** Incremente a chaque tirage : remonte le ruban pour repartir de x = 0. */
  spin: number;
  spinning: boolean;
  revealed: boolean;
  /** Mouvement reduit : le ruban se pose directement sur le gagnant. */
  instant: boolean;
  onSpinEnd: () => void;
}

const IDLE_CELLS: null[] = Array.from({ length: STRIP_LEN }, () => null);

export function RouletteStrip({
  strip,
  spin,
  spinning,
  revealed,
  instant,
  onSpinEnd,
}: RouletteStripProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  // Mesure avant peinture : l'offset doit etre connu au premier frame du
  // nouveau ruban, sinon l'animation demarre sur une cible a zero.
  useLayoutEffect(() => {
    if (spin === 0) return;
    setOffset(stripOffset(boxRef.current?.clientWidth ?? 0));
  }, [spin]);

  const cells: (TmdbItem | null)[] = strip.length ? strip : IDLE_CELLS;

  return (
    <div
      ref={boxRef}
      className="relative overflow-hidden py-5 [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]"
    >
      <motion.div
        key={spin}
        initial={{ x: 0 }}
        animate={{ x: -offset }}
        transition={instant ? { duration: 0 } : { duration: SPIN_MS / 1000, ease: SPIN_EASE }}
        onAnimationComplete={() => {
          if (spinning && offset !== 0) onSpinEnd();
        }}
        style={{ gap: CARD_GAP }}
        className="flex"
      >
        {cells.map((item, i) => (
          <RouletteCard key={i} item={item} highlight={revealed && i === WINNER_INDEX} />
        ))}
      </motion.div>

      <div className="pointer-events-none absolute inset-y-3 left-1/2 w-px -translate-x-1/2 bg-indigo-400 shadow-[0_0_12px_2px_rgba(129,140,248,0.7)]" />
      <ChevronDown className="pointer-events-none absolute left-1/2 top-0 h-4 w-4 -translate-x-1/2 text-indigo-400" />
      <ChevronUp className="pointer-events-none absolute bottom-0 left-1/2 h-4 w-4 -translate-x-1/2 text-indigo-400" />
    </div>
  );
}
```

- [ ] **Step 3: Type-check and lint**

```bash
bunx tsc --noEmit && bun run lint
```

Attendu : aucune sortie, aucune erreur.

- [ ] **Step 4: Commit**

```bash
git add src/components/RouletteCard.tsx src/components/RouletteStrip.tsx
git commit -m "feat(roulette): add animated case strip"
```

---

### Task 6: Selecteur de genres

**Files:**

- Create: `src/components/RouletteGenrePicker.tsx`

**Interfaces:**

- Consumes: `ROULETTE_GENRES` (Task 3).
- Produces:

```ts
function RouletteGenrePicker(props: {
  selected: number[];
  disabled: boolean;
  onToggle: (id: number) => void;
  onClear: () => void;
}): JSX.Element;
```

- [ ] **Step 1: Write the implementation**

Fichier `src/components/RouletteGenrePicker.tsx` :

```tsx
import { ROULETTE_GENRES } from "@/lib/rouletteGenres";

interface RouletteGenrePickerProps {
  selected: number[];
  /** Desactive pendant le chargement et l'animation. */
  disabled: boolean;
  onToggle: (id: number) => void;
  onClear: () => void;
}

// Puces multi-selection. Aucune cochee = tirage sur tout le catalogue, ce que
// la puce "Tous genres" rend explicite au lieu de le laisser deviner.
export function RouletteGenrePicker({
  selected,
  disabled,
  onToggle,
  onClear,
}: RouletteGenrePickerProps) {
  const pill = (active: boolean) =>
    `cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-medium ring-1 transition-colors disabled:cursor-default disabled:opacity-40 ${
      active
        ? "bg-indigo-600 text-white ring-indigo-500"
        : "bg-white/90 text-zinc-500 ring-black/10 hover:bg-zinc-100 hover:text-zinc-900 dark:bg-zinc-800/80 dark:text-zinc-400 dark:ring-white/10 dark:hover:bg-zinc-700/80 dark:hover:text-white"
    }`;

  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      <button disabled={disabled} onClick={onClear} className={pill(selected.length === 0)}>
        Tous genres
      </button>
      {ROULETTE_GENRES.map((g) => (
        <button
          key={g.id}
          disabled={disabled}
          onClick={() => onToggle(g.id)}
          className={pill(selected.includes(g.id))}
        >
          {g.name}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Type-check and lint**

```bash
bunx tsc --noEmit && bun run lint
```

Attendu : aucune sortie, aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add src/components/RouletteGenrePicker.tsx
git commit -m "feat(roulette): add multi-select genre picker"
```

---

### Task 7: Carte resultat

**Files:**

- Create: `src/components/RouletteResult.tsx`

**Interfaces:**

- Consumes: `rarityOf`, `RARITY_STYLE` (Task 1) ; `posterUrl` de `@/lib/posterPreload` ; `TmdbGenres` de `@/components/TmdbGenres` ; `ExpandableText` de `@/components/ExpandableText`.
- Produces:

```ts
function RouletteResult(props: {
  item: TmdbItem;
  liked: boolean;
  tmdbKey: string;
  onOpen: (item: TmdbItem) => void;
  onToggleLike: (item: TmdbItem) => void;
  onReroll: () => void;
}): JSX.Element;
```

- [ ] **Step 1: Write the implementation**

Fichier `src/components/RouletteResult.tsx` :

```tsx
import { ExpandableText } from "@/components/ExpandableText";
import { TmdbGenres } from "@/components/TmdbGenres";
import { posterUrl } from "@/lib/posterPreload";
import { RARITY_STYLE, rarityOf } from "@/lib/rouletteRarity";
import type { TmdbItem } from "@/lib/tmdbItem";
import { Heart, RotateCcw, Star } from "lucide-react";
import { motion } from "motion/react";

interface RouletteResultProps {
  item: TmdbItem;
  liked: boolean;
  tmdbKey: string;
  onOpen: (item: TmdbItem) => void;
  onToggleLike: (item: TmdbItem) => void;
  onReroll: () => void;
}

export function RouletteResult({
  item,
  liked,
  tmdbKey,
  onOpen,
  onToggleLike,
  onReroll,
}: RouletteResultProps) {
  const rarity = RARITY_STYLE[rarityOf(item.voteAverage)];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      style={{ borderColor: `${rarity.color}55` }}
      className="mt-6 flex gap-5 rounded-2xl border bg-white/70 p-5 ring-1 ring-black/5 backdrop-blur-xl dark:bg-zinc-900/60 dark:ring-white/5"
    >
      <div className="w-[120px] shrink-0 overflow-hidden rounded-xl bg-zinc-200 dark:bg-zinc-800">
        {item.posterPath && (
          <img src={posterUrl(item.posterPath)} alt={item.title} className="w-full" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <span
          style={{ color: rarity.color, backgroundColor: `${rarity.color}1a` }}
          className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
        >
          {rarity.label}
        </span>

        <h3 className="mt-2 text-lg font-semibold leading-tight text-zinc-900 dark:text-white">
          {item.title}
        </h3>

        <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
          <span>{item.year}</span>
          {item.voteAverage > 0 && (
            <span className="flex items-center gap-1 text-amber-500">
              <Star className="h-3 w-3 fill-amber-500" />
              {item.voteAverage.toFixed(1)}
            </span>
          )}
        </div>

        <TmdbGenres
          mediaType="movie"
          id={item.id}
          genreIds={item.genreIds}
          tmdbKey={tmdbKey}
          className="mt-2"
        />

        {item.overview && (
          <ExpandableText
            text={item.overview}
            lines={3}
            className="mt-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400"
          />
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() => onOpen(item)}
            className="cursor-pointer rounded-full bg-indigo-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo-500"
          >
            Voir les releases
          </button>
          <button
            onClick={() => onToggleLike(item)}
            className="flex cursor-pointer items-center gap-1.5 rounded-full bg-white/90 px-4 py-2 text-xs font-medium text-zinc-600 ring-1 ring-black/10 transition-colors hover:text-zinc-900 dark:bg-zinc-800/80 dark:text-zinc-400 dark:ring-white/10 dark:hover:text-white"
          >
            <Heart className={`h-3.5 w-3.5 ${liked ? "fill-rose-500 text-rose-500" : ""}`} />
            {liked ? "Dans ma liste" : "Ajouter à ma liste"}
          </button>
          <button
            onClick={onReroll}
            className="flex cursor-pointer items-center gap-1.5 rounded-full bg-white/90 px-4 py-2 text-xs font-medium text-zinc-600 ring-1 ring-black/10 transition-colors hover:text-zinc-900 dark:bg-zinc-800/80 dark:text-zinc-400 dark:ring-white/10 dark:hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Relancer
          </button>
        </div>
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Type-check and lint**

```bash
bunx tsc --noEmit && bun run lint
```

Attendu : aucune sortie, aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add src/components/RouletteResult.tsx
git commit -m "feat(roulette): add winner result card"
```

---

### Task 8: Section d'orchestration

**Files:**

- Create: `src/components/RouletteSection.tsx`

**Interfaces:**

- Consumes: `useMovieRoulette`, `EMPTY_POOL_MESSAGE` (Task 4) ; `RouletteStrip` (Task 5) ; `RouletteGenrePicker` (Task 6) ; `RouletteResult` (Task 7) ; `NetworkErrorState` de `@/components/NetworkErrorState`.
- Produces:

```ts
function RouletteSection(props: {
  tmdbKey: string;
  likedKeys: Set<string>;
  onOpen: (item: TmdbItem) => void;
  onToggleLike: (item: TmdbItem) => void;
}): JSX.Element;
```

Note : le message de vivier vide n'est pas une erreur reseau, il ne passe donc pas par `NetworkErrorState` (dont le bouton relancerait la meme requete infructueuse).

- [ ] **Step 1: Write the implementation**

Fichier `src/components/RouletteSection.tsx` :

```tsx
import { NetworkErrorState } from "@/components/NetworkErrorState";
import { RouletteGenrePicker } from "@/components/RouletteGenrePicker";
import { RouletteResult } from "@/components/RouletteResult";
import { RouletteStrip } from "@/components/RouletteStrip";
import type { TmdbItem } from "@/lib/tmdbItem";
import { EMPTY_POOL_MESSAGE, useMovieRoulette } from "@/lib/useMovieRoulette";
import { Dices, Loader2 } from "lucide-react";
import { AnimatePresence, useReducedMotion } from "motion/react";
import { useEffect } from "react";

interface RouletteSectionProps {
  tmdbKey: string;
  likedKeys: Set<string>;
  onOpen: (item: TmdbItem) => void;
  onToggleLike: (item: TmdbItem) => void;
}

export function RouletteSection({
  tmdbKey,
  likedKeys,
  onOpen,
  onToggleLike,
}: RouletteSectionProps) {
  const r = useMovieRoulette(tmdbKey);
  const prefersReducedMotion = useReducedMotion();
  const busy = r.status === "loading" || r.status === "spinning";

  // Mouvement reduit : le ruban se pose sans defiler, onAnimationComplete ne
  // suffit pas a garantir le passage en revealed sur une transition nulle.
  useEffect(() => {
    if (prefersReducedMotion && r.status === "spinning") r.finishSpin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefersReducedMotion, r.status]);

  return (
    <div>
      <RouletteGenrePicker
        selected={r.genreIds}
        disabled={busy}
        onToggle={r.toggleGenre}
        onClear={r.clearGenres}
      />

      <div className="mt-6">
        <RouletteStrip
          strip={r.strip}
          spin={r.spin}
          spinning={r.status === "spinning"}
          revealed={r.status === "revealed"}
          instant={!!prefersReducedMotion}
          onSpinEnd={r.finishSpin}
        />
      </div>

      <div className="mt-4 flex justify-center">
        <button
          onClick={r.roll}
          disabled={busy}
          className="flex cursor-pointer items-center gap-2 rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-default disabled:opacity-50"
        >
          {r.status === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Dices className="h-4 w-4" />
          )}
          {r.status === "revealed" ? "Relancer" : "Lancer la roulette"}
        </button>
      </div>

      {r.error === EMPTY_POOL_MESSAGE && (
        <p className="mt-4 text-center text-sm text-zinc-500">{r.error}</p>
      )}
      {r.error && r.error !== EMPTY_POOL_MESSAGE && (
        <NetworkErrorState message={r.error} onRetry={r.roll} className="mt-4" />
      )}

      <AnimatePresence mode="wait">
        {r.status === "revealed" && r.winner && (
          <RouletteResult
            key={r.winner.id}
            item={r.winner}
            liked={likedKeys.has(`movie-${r.winner.id}`)}
            tmdbKey={tmdbKey}
            onOpen={onOpen}
            onToggleLike={onToggleLike}
            onReroll={r.roll}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 2: Type-check and lint**

```bash
bunx tsc --noEmit && bun run lint
```

Attendu : aucune sortie, aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add src/components/RouletteSection.tsx
git commit -m "feat(roulette): add roulette section orchestration"
```

---

### Task 9: Branchement dans la page Decouverte

**Files:**

- Modify: `src/lib/useDiscoverFeed.ts` (ligne 23, ligne 166, ligne 362, ligne 375, lignes 404-410)
- Modify: `src/components/DiscoverTabs.tsx` (ligne 4, apres la ligne 95)
- Modify: `src/pages/DiscoverPage.tsx` (ligne 344, et un nouveau bloc juste avant)

**Interfaces:**

- Consumes: `RouletteSection` (Task 8).
- Produces: l'onglet `"roulette"` du type `DiscoverTab`.

- [ ] **Step 1: Modify `src/lib/useDiscoverFeed.ts`**

Ligne 23, ajouter `"roulette"` a l'union :

```ts
export type DiscoverTab = BrowseType | "likes" | "recos" | "manga" | "roulette";
```

Dans l'effet de scroll infini (vers la ligne 166), etendre la garde :

```ts
if (
  !el ||
  !tmdbKey ||
  mediaType === "likes" ||
  mediaType === "recos" ||
  mediaType === "manga" ||
  mediaType === "roulette"
)
  return;
```

Dans `switchType` (vers la ligne 362), etendre le retour anticipe :

```ts
if (type === "likes" || type === "recos" || type === "manga" || type === "roulette") return;
```

Dans `switchFeed` (vers la ligne 375), etendre la garde :

```ts
if (
  f === feed ||
  !tmdbKey ||
  mediaType === "likes" ||
  mediaType === "recos" ||
  mediaType === "manga" ||
  mediaType === "roulette" ||
  mediaType === "all"
)
  return;
```

Dans le calcul de `gridKey` (vers la ligne 404) :

```ts
const gridKey =
  mediaType === "likes" || mediaType === "manga" || mediaType === "roulette"
    ? mediaType
    : mediaType === "recos"
      ? "recos"
      : mode === "search"
        ? `search:${searchedFilter}`
        : `${mediaType}:${feed}`;
```

- [ ] **Step 2: Modify `src/components/DiscoverTabs.tsx`**

Ligne 4, ajouter `Dices` a l'import lucide :

```tsx
import { BookOpen, Clapperboard, Dices, Heart, Sparkles, Tv, Wand2 } from "lucide-react";
```

Apres le bouton "Mangas" (ferme a la ligne 95), ajouter le bouton Roulette dans le meme conteneur flex :

```tsx
<button
  onClick={() => onSwitchType("roulette")}
  className={`flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium ring-1 transition-colors ${
    mediaType === "roulette"
      ? "bg-indigo-600 text-white ring-indigo-500"
      : "bg-white/90 text-zinc-500 ring-black/10 hover:text-zinc-900 dark:bg-zinc-800/80 dark:text-zinc-400 dark:ring-white/10 dark:hover:text-white"
  }`}
>
  <Dices className="h-3.5 w-3.5" />
  Roulette
</button>
```

Mettre a jour le commentaire de tete du composant (ligne 17) :

```tsx
// Onglets de navigation (Films, Séries, Animations, Mangas, Roulette, Pour vous,
// Ma liste) et sources TMDB (Tendances, Populaires…) sous les onglets Films / Séries.
```

- [ ] **Step 3: Modify `src/pages/DiscoverPage.tsx`**

Ajouter l'import avec les autres composants (apres la ligne 8) :

```tsx
import { RouletteSection } from "@/components/RouletteSection";
```

Inserer le bloc de la roulette juste avant le bloc `{tmdbKey && !tmdbKeyInvalid && mediaType !== "manga" && (` (ligne 344) :

```tsx
{
  tmdbKey && !tmdbKeyInvalid && mediaType === "roulette" && (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 pb-10 sm:px-8">
      <RouletteSection
        tmdbKey={tmdbKey}
        likedKeys={likedKeys}
        onOpen={openItem}
        onToggleLike={toggleLike}
      />
    </div>
  );
}
```

Puis exclure la roulette du bloc de la grille, ligne 344 :

```tsx
      {tmdbKey && !tmdbKeyInvalid && mediaType !== "manga" && mediaType !== "roulette" && (
```

- [ ] **Step 4: Type-check and lint**

```bash
bunx tsc --noEmit && bun run lint
```

Attendu : aucune sortie, aucune erreur. Si `tsc` signale un cas non couvert dans un `switch` ou un ternaire exhaustif sur `DiscoverTab`, traiter `"roulette"` comme `"manga"` au meme endroit.

- [ ] **Step 5: Run the full test suite**

```bash
bun run test
```

Attendu : PASS, aucun test casse.

- [ ] **Step 6: Commit**

```bash
git add src/lib/useDiscoverFeed.ts src/components/DiscoverTabs.tsx src/pages/DiscoverPage.tsx
git commit -m "feat(discover): wire the roulette tab into the discover page"
```

---

### Task 10: Verification dans le navigateur

**Files:** aucun (verification seule ; corrections eventuelles dans les fichiers des taches 5 a 9).

Prerequis : `.env.local` contient une cle TMDB de dev (`VITE_DEV_TMDB_KEY`, voir `.env.example`). Sans elle, l'onglet affiche l'ecran "clef TMDB manquante" et rien ne peut etre verifie.

- [ ] **Step 1: Start the dev server**

Creer `.claude/launch.json` s'il n'existe pas :

```json
{
  "version": "0.0.1",
  "configurations": [
    {
      "name": "vite",
      "runtimeExecutable": "bun",
      "runtimeArgs": ["run", "dev"],
      "port": 1420
    }
  ]
}
```

Demarrer via l'outil de preview (nom `vite`), pas via un shell.

- [ ] **Step 2: Verify the tab and a first spin**

1. Ouvrir la page Decouverte, cliquer l'onglet "Roulette".
2. Verifier que la barre de recherche est masquee et que le ruban idle affiche des cases grisees.
3. Cocher "Action" et "Comédie", cliquer "Lancer la roulette".
4. Verifier dans les requetes reseau : deux appels `discover/movie` avec `with_genres=28,35` et `vote_count.gte=200`.
5. Verifier que le ruban defile ~6 s, decelere, et s'arrete avec une case sous le curseur, decalee du centre.
6. Verifier que la case sous le curseur porte un halo et que la carte resultat affiche le meme film.

- [ ] **Step 3: Verify the state machine**

1. Cliquer "Relancer" : le ruban repart de la gauche, pas depuis sa position d'arret.
2. Pendant l'animation, verifier que les puces de genres et le bouton sont desactives.
3. Cliquer "Voir les releases" : `DiscoverReleasesModal` s'ouvre sur le bon film.
4. Fermer la modale, cliquer le coeur : le film apparait dans l'onglet "Ma liste".

- [ ] **Step 4: Check the console**

Lire les messages de console : aucune erreur, aucun avertissement React (cles manquantes, mise a jour d'etat sur composant demonte).

- [ ] **Step 5: Screenshot and commit any fix**

Prendre une capture de l'etat revele et la joindre au compte rendu. Si une correction a ete necessaire :

```bash
git add -A
git commit -m "fix(roulette): <ce qui a ete corrige>"
```

---

## Self-Review

**Couverture de la spec**

| Section de la spec                                       | Tache   |
| -------------------------------------------------------- | ------- |
| Onglet dedie dans DiscoverTabs                           | 9       |
| Vivier `/discover/movie` filtre qualite                  | 3       |
| Multi-selection de genres, OU logique, vide = tous       | 3, 6    |
| Raretes derivees de la note, sans ponderation            | 1, 5, 7 |
| Carte resultat + acces a DiscoverReleasesModal           | 7, 9    |
| Tirage pur, sans anti-redite                             | 4       |
| Films uniquement                                         | 3       |
| Machine a etats idle/loading/spinning/revealed           | 4, 8    |
| Cache TanStack avec queryKey roulette, cle hors queryKey | 3, 4    |
| Geometrie du ruban, jitter, curseur, masque lateral      | 2, 5    |
| Animation 6 s, easing, halo au reveal                    | 2, 5, 7 |
| Mouvement reduit                                         | 5, 8    |
| Erreur reseau -> NetworkErrorState                       | 4, 8    |
| Vivier maigre -> repli page 1 puis message               | 4, 8    |
| Tests rarityOf / buildStrip / stripOffset                | 1, 2    |
| Verification visuelle via devTauriShim                   | 10      |

Aucune section de la spec n'est sans tache.

**Ecart assume par rapport a la spec**

- `stripOffset` utilise `CARD_W / 2` la ou la spec ecrivait `PAS / 2` (ecart de 5 px, la spec etait imprecise). Justifie en tete de la tache 2.
- La spec listait `src/lib/rouletteStrip.ts` comme unique module pur ; les helpers de vivier sont sortis dans `src/lib/roulettePool.ts` pour que le hook reste mince et que `pickPoolPage` soit testable.
