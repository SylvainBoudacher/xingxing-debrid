import { describe, expect, it, vi } from "vitest";

vi.mock("@tauri-apps/plugin-store", () => ({ LazyStore: class {} }));

import type { LibraryEntry, TmdbMeta } from "./library";
import { formatLibrarySize, libraryStats } from "./libraryStats";

function meta(id: number, mediaType: "movie" | "tv"): TmdbMeta {
  return {
    id,
    mediaType,
    title: `T${id}`,
    posterPath: null,
    year: "",
    voteAverage: 0,
    overview: "",
  };
}

function entry(over: Partial<LibraryEntry> = {}): LibraryEntry {
  return {
    infoHash: "hash",
    title: "Title",
    provider: "c411",
    category: 0,
    size: 0,
    addedAt: 0,
    files: [],
    enriched: false,
    watched: {},
    ...over,
  };
}

const watched = { watched: { __whole__: true } };

describe("libraryStats", () => {
  it("renvoie des zéros pour une bibliothèque vide", () => {
    expect(libraryStats([])).toEqual({ titles: 0, movies: 0, series: 0, size: 0, watched: 0 });
  });

  it("compte une série multi-saisons comme un seul titre", () => {
    const stats = libraryStats([
      entry({ infoHash: "a", tmdb: meta(1, "tv"), size: 10 }),
      entry({ infoHash: "b", tmdb: meta(1, "tv"), size: 20 }),
      entry({ infoHash: "m", tmdb: meta(2, "movie"), size: 5 }),
    ]);
    expect(stats).toEqual({ titles: 2, movies: 1, series: 1, size: 35, watched: 0 });
  });

  it("classe en série une entrée sans TMDB qui contient plusieurs épisodes", () => {
    const stats = libraryStats([
      entry({
        enriched: true,
        files: [
          { name: "Show.S01E01.mkv", link: "1", size: 1 },
          { name: "Show.S01E02.mkv", link: "2", size: 1 },
        ],
      }),
    ]);
    expect(stats.series).toBe(1);
    expect(stats.movies).toBe(0);
  });

  it("ne compte une série comme vue que si toutes ses entrées le sont", () => {
    const stats = libraryStats([
      entry({ infoHash: "a", tmdb: meta(1, "tv"), ...watched }),
      entry({ infoHash: "b", tmdb: meta(1, "tv") }),
      entry({ infoHash: "m", tmdb: meta(2, "movie"), ...watched }),
    ]);
    expect(stats.watched).toBe(1);
  });
});

describe("formatLibrarySize", () => {
  it("passe en To au-delà de 1024 Go", () => {
    expect(formatLibrarySize(1.5 * 1024 ** 4)).toBe("1,5 To");
  });

  it("reste en Go en dessous", () => {
    expect(formatLibrarySize(250 * 1024 ** 3)).toBe("250 Go");
  });
});
