import { describe, it, expect } from "vitest";
import { pickSeeds, scoreRecommendations, ownedTmdbKeys, type SeedList } from "./recommendations";
import type { LikedItem } from "./likes";
import type { LibraryEntry } from "./library";
import type { TmdbRawResult } from "./services/tmdb";

function liked(id: number, likedAt: number, title = `L${id}`): LikedItem {
  return {
    id,
    mediaType: "movie",
    title,
    originalTitle: "",
    posterPath: null,
    year: "2020",
    voteAverage: 7,
    overview: "",
    likedAt,
  };
}

function entry(tmdbId: number, mediaType: "movie" | "tv" = "movie"): LibraryEntry {
  return {
    infoHash: `h${tmdbId}`,
    title: `E${tmdbId}`,
    provider: "discover",
    category: 0,
    size: 0,
    addedAt: 0,
    files: [],
    enriched: true,
    watched: {},
    tmdb: {
      id: tmdbId,
      mediaType,
      title: `Lib${tmdbId}`,
      posterPath: null,
      year: "2020",
      voteAverage: 8,
      overview: "",
    },
  } as LibraryEntry;
}

function raw(id: number, vote = 7): TmdbRawResult {
  return { id, poster_path: null, vote_average: vote };
}

describe("pickSeeds", () => {
  it("met les likes recents en premier, puis la bibliotheque, dedupliquee", () => {
    const likes = [liked(1, 100), liked(2, 200)];
    const library = [entry(2), entry(3)];
    const seeds = pickSeeds(likes, library);
    // like le plus recent d'abord (id 2), puis like 1, puis lib 3 (lib 2 dedup)
    expect(seeds.map((s) => s.id)).toEqual([2, 1, 3]);
    expect(seeds[0].weight).toBe(2);
    expect(seeds[2].weight).toBe(1);
  });

  it("cape a 5 graines", () => {
    const likes = Array.from({ length: 8 }, (_, i) => liked(i + 1, i));
    expect(pickSeeds(likes, [])).toHaveLength(5);
  });
});

describe("scoreRecommendations", () => {
  it("cumule le score quand plusieurs graines recommandent le meme titre", () => {
    const lists: SeedList[] = [
      { seed: { id: 1, mediaType: "movie", title: "A", weight: 2 }, results: [raw(99)] },
      { seed: { id: 2, mediaType: "movie", title: "B", weight: 1 }, results: [raw(99), raw(50)] },
    ];
    const scored = scoreRecommendations(lists, new Set());
    expect(scored[0].result.id).toBe(99);
    expect(scored[0].score).toBeGreaterThan(scored[1].score);
  });

  it("attribue becauseOf a la graine la plus contributive", () => {
    const lists: SeedList[] = [
      { seed: { id: 1, mediaType: "movie", title: "Faible", weight: 1 }, results: [raw(99, 5)] },
      { seed: { id: 2, mediaType: "movie", title: "Fort", weight: 2 }, results: [raw(99, 9)] },
    ];
    expect(scoreRecommendations(lists, new Set())[0].becauseOf).toBe("Fort");
  });

  it("exclut les titres deja possedes et les graines", () => {
    const lists: SeedList[] = [
      {
        seed: { id: 1, mediaType: "movie", title: "A", weight: 2 },
        results: [raw(1), raw(2), raw(3)],
      },
    ];
    // 1 est la graine elle-meme, 2 est possede -> seul 3 ressort
    const scored = scoreRecommendations(lists, new Set(["movie-2"]));
    expect(scored.map((s) => s.result.id)).toEqual([3]);
  });
});

describe("ownedTmdbKeys", () => {
  it("indexe par mediaType-id", () => {
    const keys = ownedTmdbKeys([entry(5, "tv"), entry(6)]);
    expect(keys.has("tv-5")).toBe(true);
    expect(keys.has("movie-6")).toBe(true);
  });
});
