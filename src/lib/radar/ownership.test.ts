import { describe, expect, test } from "vitest";
import type { DebridFile } from "@/lib/debrid";
import type { LibraryEntry } from "@/lib/library";
import { ownedContents } from "./ownership";
import { movieEntry, tmdbItem, tvEntry } from "./testFixtures";

const file = (name: string) => ({ n: name, name, s: 1, size: 1 }) as unknown as DebridFile;

function libEntry(patch: Partial<LibraryEntry>): LibraryEntry {
  return {
    infoHash: "h",
    title: "x",
    provider: "alldebrid",
    category: 0,
    size: 1,
    addedAt: 0,
    files: [],
    enriched: true,
    watched: {},
    ...patch,
  } as LibraryEntry;
}

const tmdbOf = (id: number, mediaType: "movie" | "tv") => ({
  id,
  mediaType,
  title: "t",
  posterPath: null,
  year: "2024",
  voteAverage: 0,
  overview: "",
});

describe("ownedContents", () => {
  test("identifiant TMDB certain, pack couvre ses fichiers de la bonne saison", () => {
    const pack = libEntry({
      tmdb: tmdbOf(10, "tv"),
      files: [file("Show.S03E05.mkv"), file("Show.S03E06.mkv"), file("Show.S02E01.mkv")],
    });
    expect([...ownedContents(tvEntry(), [pack]).certain]).toEqual(["e5", "e6"]);
  });

  test("sans identifiant TMDB, le nom seul reste incertain", () => {
    const byName = libEntry({
      title: "Les Veilleurs S03E02",
      files: [file("Les.Veilleurs.S03E02.mkv")],
    });
    const owned = ownedContents(tvEntry(), [byName]);
    expect(owned.certain.size).toBe(0);
    expect([...owned.uncertain]).toEqual(["e2"]);
  });

  test("ce qui est certain n'apparaît pas en incertain", () => {
    const a = libEntry({ tmdb: tmdbOf(10, "tv"), files: [file("Show.S03E02.mkv")] });
    const b = libEntry({ title: "Les Veilleurs", files: [file("Les.Veilleurs.S03E02.mkv")] });
    expect(ownedContents(tvEntry(), [a, b]).uncertain.size).toBe(0);
  });

  test("une autre série n'est pas retenue", () => {
    const other = libEntry({ tmdb: tmdbOf(99, "tv"), files: [file("Show.S03E02.mkv")] });
    expect(ownedContents(tvEntry(), [other]).certain.size).toBe(0);
  });

  test("entrée non enrichie : l'étendue vient du nom de release", () => {
    const pending = libEntry({
      tmdb: tmdbOf(10, "tv"),
      enriched: false,
      releaseName: "Show.S03E04.1080p",
    });
    expect([...ownedContents(tvEntry(), [pending]).certain]).toEqual(["e4"]);
  });

  test("un film par identifiant TMDB", () => {
    const m = libEntry({ tmdb: tmdbOf(4, "movie") });
    expect([...ownedContents(movieEntry(), [m]).certain]).toEqual(["movie"]);
  });

  test("un film sans identifiant exige l'année", () => {
    const entry = movieEntry({ item: tmdbItem(4, "movie", "L'Écluse", "2026") });
    expect(ownedContents(entry, [libEntry({ title: "L Ecluse 2019 1080p" })]).uncertain.size).toBe(
      0,
    );
    expect([
      ...ownedContents(entry, [libEntry({ title: "L.Ecluse.2026.1080p" })]).uncertain,
    ]).toEqual(["movie"]);
  });
});
