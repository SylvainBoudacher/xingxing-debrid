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
