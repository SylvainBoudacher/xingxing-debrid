import { describe, expect, it } from "vitest";
import type { DisplayItem, LibraryEntry, TmdbMeta } from "./library";
import { buildLibraryBlocks, filterByGenres, genreOptions } from "./librarySections";

function meta(id: number, mediaType: "movie" | "tv", genreIds?: number[]): TmdbMeta {
  return {
    id,
    mediaType,
    title: `T${id}`,
    posterPath: null,
    year: "2024",
    voteAverage: 7,
    overview: "",
    genreIds,
  };
}

function movie(id: number, genreIds?: number[]): DisplayItem {
  const entry = {
    infoHash: `m${id}`,
    title: `T${id}`,
    provider: "discover",
    category: 1,
    size: 1,
    addedAt: id,
    files: [],
    enriched: true,
    watched: {},
    tmdb: meta(id, "movie", genreIds),
  } as LibraryEntry;
  return { type: "single", entry };
}

function series(id: number, genreIds?: number[]): DisplayItem {
  return { type: "group", group: { tmdbId: id, tmdb: meta(id, "tv", genreIds), entries: [] } };
}

function raw(hash: string): DisplayItem {
  return {
    type: "single",
    entry: {
      infoHash: hash,
      title: hash,
      provider: "c411",
      category: 1,
      size: 1,
      addedAt: 0,
      files: [],
      enriched: true,
      watched: {},
    } as LibraryEntry,
  };
}

describe("buildLibraryBlocks", () => {
  it("garde tout dans un bloc sans titre en mode none", () => {
    const blocks = buildLibraryBlocks([movie(1), series(2)], "none");
    expect(blocks).toHaveLength(1);
    expect(blocks[0].label).toBeNull();
    expect(blocks[0].sections[0].items).toHaveLength(2);
  });

  it("sépare films et séries en mode type", () => {
    const blocks = buildLibraryBlocks([movie(1), series(2), raw("x")], "type");
    expect(blocks.map((b) => b.label)).toEqual(["Sans info TMDB", "Films", "Séries"]);
    expect(blocks.every((b) => b.sections.length === 1 && b.sections[0].label === null)).toBe(true);
  });

  it("garde films et séries séparés en mode genre", () => {
    const blocks = buildLibraryBlocks([movie(1, [28]), series(2, [18])], "genre");
    expect(blocks.map((b) => b.label)).toEqual(["Films", "Séries"]);
    expect(blocks[0].sections.map((s) => s.label)).toEqual(["Action"]);
    expect(blocks[1].sections.map((s) => s.label)).toEqual(["Drame"]);
  });

  it("ne range un titre que dans son genre principal", () => {
    const blocks = buildLibraryBlocks([movie(1, [18, 80]), movie(2, [80])], "genre");
    const sections = blocks[0].sections;
    expect(sections.map((s) => s.label)).toEqual(["Crime", "Drame"]);
    // Le film 1 est dans Drame (son 1er genre), pas dans Crime : pas de doublon.
    expect(sections.flatMap((s) => s.items)).toHaveLength(2);
    expect(sections.find((s) => s.label === "Crime")!.items).toHaveLength(1);
  });

  it("n'affiche jamais deux fois le même titre", () => {
    const items = [movie(1, [28, 12, 878]), movie(2, [18, 80]), movie(3, [16, 35, 10751])];
    const shown = buildLibraryBlocks(items, "genre").flatMap((b) =>
      b.sections.flatMap((s) => s.items),
    );
    expect(shown).toHaveLength(3);
    expect(new Set(shown).size).toBe(3);
  });

  it("range les titres sans genre dans Autres, en dernier", () => {
    const blocks = buildLibraryBlocks([movie(1), movie(2, [28]), movie(3, [])], "genre");
    const sections = blocks[0].sections;
    expect(sections.map((s) => s.label)).toEqual(["Action", "Autres"]);
    expect(sections[1].items).toHaveLength(2);
  });

  it("ne découpe pas par genre les entrées sans info TMDB", () => {
    const blocks = buildLibraryBlocks([raw("x")], "genre");
    expect(blocks[0].label).toBe("Sans info TMDB");
    expect(blocks[0].sections[0].label).toBeNull();
  });
});

describe("genreOptions", () => {
  it("compte les genres secondaires et trie par nombre de titres", () => {
    const opts = genreOptions([movie(1, [18, 80]), movie(2, [80]), series(3, [16])]);
    expect(opts).toEqual([
      { name: "Crime", count: 2 },
      { name: "Animation", count: 1 },
      { name: "Drame", count: 1 },
    ]);
  });

  it("ignore les titres sans genre", () => {
    expect(genreOptions([movie(1), raw("x")])).toEqual([]);
  });
});

describe("filterByGenres", () => {
  const items = [movie(1, [18, 80]), movie(2, [27, 878]), series(3, [16, 35])];

  it("ne filtre rien sans sélection", () => {
    expect(filterByGenres(items, new Set())).toHaveLength(3);
  });

  it("garde les titres portant le genre, même en secondaire", () => {
    // Science-fiction est le 2e genre du film 2 : il doit quand même sortir.
    const kept = filterByGenres(items, new Set(["Science-fiction"]));
    expect(kept).toEqual([items[1]]);
  });

  it("combine plusieurs genres en OU", () => {
    expect(filterByGenres(items, new Set(["Drame", "Animation"]))).toEqual([items[0], items[2]]);
  });

  it("exclut les titres sans genre", () => {
    expect(filterByGenres([...items, raw("x")], new Set(["Drame"]))).toEqual([items[0]]);
  });
});
