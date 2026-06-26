import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Store en mémoire pour remplacer le LazyStore de Tauri.
const backing = new Map<string, unknown>();
const saveSpy = vi.fn(async () => {});
const setSpy = vi.fn(async (k: string, v: unknown) => {
  backing.set(k, v);
});

vi.mock("@tauri-apps/plugin-store", () => ({
  LazyStore: class {
    async get<T>(key: string): Promise<T | undefined> {
      return backing.get(key) as T | undefined;
    }
    set(key: string, value: unknown) {
      return setSpy(key, value);
    }
    save() {
      return saveSpy();
    }
  },
}));

import {
  applyEnrichment,
  flushLibrary,
  getCachedLibrary,
  groupBySeason,
  groupLibraryEntries,
  hasMultipleSeasons,
  isSeries,
  isWholeWatched,
  libraryCounts,
  loadLibrary,
  nextUnwatched,
  prefetchLibrary,
  progressRatio,
  recordDownload,
  saveLibrary,
  saveLibraryDebounced,
  seasonOf,
  setFilesWatched,
  setWholeWatched,
  toggleFile,
  totalCount,
  videoFiles,
  watchedCount,
  type LibraryEntry,
} from "./library";
import type { DebridFile } from "./debrid";

function file(name: string, link = name, size = 100): DebridFile {
  return { name, link, size };
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
    enriched: true,
    watched: {},
    ...over,
  };
}

const ep1 = file("Show.S01E01.mkv");
const ep2 = file("Show.S01E02.mkv");
const ep3 = file("Show.S02E01.mkv");

beforeEach(() => {
  backing.clear();
  saveSpy.mockClear();
  setSpy.mockClear();
});

describe("seasonOf", () => {
  it("lit le numéro depuis SxxExx", () => {
    expect(seasonOf("Show.S01E02.mkv")).toBe(1);
    expect(seasonOf("Show.S12E03.mkv")).toBe(12);
  });

  it("lit 'Saison N' et 'Season N'", () => {
    expect(seasonOf("Truc Saison 3 episode 1.mkv")).toBe(3);
    expect(seasonOf("Truc Season 2.mkv")).toBe(2);
  });

  it("ignore le chemin et garde le nom de fichier", () => {
    expect(seasonOf("Saison 5/episode.S02E01.mkv")).toBe(2);
  });

  it("retourne null sans marqueur", () => {
    expect(seasonOf("Film.2021.mkv")).toBeNull();
  });
});

describe("videoFiles", () => {
  it("ne garde que les fichiers vidéo", () => {
    const e = entry({ files: [ep1, file("sub.srt"), file("info.nfo")] });
    expect(videoFiles(e)).toEqual([ep1]);
  });

  it("renvoie la même référence pour le même tableau (cache)", () => {
    const e = entry({ files: [ep1, ep2] });
    expect(videoFiles(e)).toBe(videoFiles(e));
  });
});

describe("isSeries", () => {
  it("vrai si enrichie avec plusieurs vidéos", () => {
    expect(isSeries(entry({ files: [ep1, ep2] }))).toBe(true);
  });

  it("faux pour une seule vidéo", () => {
    expect(isSeries(entry({ files: [ep1] }))).toBe(false);
  });

  it("faux si non enrichie", () => {
    expect(isSeries(entry({ files: [ep1, ep2], enriched: false }))).toBe(false);
  });
});

describe("groupBySeason / hasMultipleSeasons", () => {
  it("regroupe et trie par saison croissante, null en dernier", () => {
    const groups = groupBySeason([ep3, file("autre.mkv"), ep1]);
    expect(groups.map((g) => g.season)).toEqual([1, 2, null]);
  });

  it("hasMultipleSeasons vrai avec deux saisons", () => {
    expect(hasMultipleSeasons(entry({ files: [ep1, ep2, ep3] }))).toBe(true);
  });

  it("hasMultipleSeasons faux avec une seule saison", () => {
    expect(hasMultipleSeasons(entry({ files: [ep1, ep2] }))).toBe(false);
  });
});

describe("watched helpers", () => {
  it("toggleFile bascule un fichier", () => {
    const e = entry({ files: [ep1, ep2] });
    const next = toggleFile(e, ep1.name);
    expect(next.watched[ep1.name]).toBe(true);
    expect(e.watched[ep1.name]).toBeUndefined(); // immuable
  });

  it("setFilesWatched marque un ensemble", () => {
    const e = setFilesWatched(entry({ files: [ep1, ep2] }), [ep1.name, ep2.name], true);
    expect(watchedCount(e)).toBe(2);
    expect(totalCount(e)).toBe(2);
  });

  it("isWholeWatched suit la coche __whole__ sans fichiers", () => {
    expect(isWholeWatched(entry({ files: [], watched: { __whole__: true } }))).toBe(true);
    expect(isWholeWatched(entry({ files: [] }))).toBe(false);
  });

  it("setWholeWatched coche tous les fichiers vidéo", () => {
    const e = setWholeWatched(entry({ files: [ep1, ep2] }), true);
    expect(isWholeWatched(e)).toBe(true);
  });

  it("setWholeWatched utilise __whole__ sans fichiers", () => {
    const e = setWholeWatched(entry({ files: [] }), true);
    expect(e.watched.__whole__).toBe(true);
  });

  it("nextUnwatched renvoie le premier épisode non vu", () => {
    const e = entry({ files: [ep1, ep2], watched: { [ep1.name]: true } });
    expect(nextUnwatched(e)).toBe(ep2);
  });

  it("nextUnwatched renvoie null si tout est vu", () => {
    const e = setWholeWatched(entry({ files: [ep1] }), true);
    expect(nextUnwatched(e)).toBeNull();
  });

  it("progressRatio reflète l'avancement", () => {
    expect(progressRatio(entry({ files: [ep1, ep2], watched: { [ep1.name]: true } }))).toBe(0.5);
    expect(progressRatio(entry({ files: [], watched: { __whole__: true } }))).toBe(1);
    expect(progressRatio(entry({ files: [] }))).toBe(0);
  });
});

describe("applyEnrichment", () => {
  it("migre la coche __whole__ vers le fichier unique", () => {
    const e = entry({ enriched: false, files: [], watched: { __whole__: true } });
    const next = applyEnrichment(e, [ep1]);
    expect(next.enriched).toBe(true);
    expect(next.watched[ep1.name]).toBe(true);
    expect(next.watched.__whole__).toBeUndefined();
  });

  it("ne migre pas la coche quand plusieurs vidéos", () => {
    const e = entry({ enriched: false, files: [], watched: { __whole__: true } });
    const next = applyEnrichment(e, [ep1, ep2]);
    expect(next.watched[ep1.name]).toBeUndefined();
    expect(next.watched.__whole__).toBeUndefined();
  });
});

describe("recordDownload", () => {
  it("insère une nouvelle entrée", async () => {
    await recordDownload({
      infoHash: "h1",
      title: "New",
      provider: "c411",
      category: 0,
      size: 10,
      files: [ep1],
      enriched: true,
    });
    const lib = await loadLibrary();
    expect(lib).toHaveLength(1);
    expect(lib[0].title).toBe("New");
  });

  it("met à jour en préservant addedAt et l'état de visionnage", async () => {
    backing.set("library", [
      entry({ infoHash: "h1", addedAt: 123, files: [ep1], watched: { [ep1.name]: true } }),
    ]);
    await recordDownload({
      infoHash: "h1",
      title: "Renamed",
      provider: "c411",
      category: 0,
      size: 20,
      files: [ep1, ep2],
      enriched: true,
    });
    const lib = await loadLibrary();
    expect(lib).toHaveLength(1);
    expect(lib[0].addedAt).toBe(123);
    expect(lib[0].title).toBe("Renamed");
    expect(lib[0].watched[ep1.name]).toBe(true);
  });
});

describe("cache mémoire", () => {
  it("prefetchLibrary alimente le cache synchrone", async () => {
    backing.set("library", [entry({ infoHash: "h1" })]);
    await prefetchLibrary();
    expect(getCachedLibrary()).toHaveLength(1);
  });

  it("saveLibrary met le cache à jour", async () => {
    await saveLibrary([entry({ infoHash: "h2" })]);
    expect(getCachedLibrary()?.[0].infoHash).toBe("h2");
    expect(saveSpy).toHaveBeenCalledTimes(1);
  });
});

describe("saveLibraryDebounced / flushLibrary", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("met le cache à jour tout de suite mais écrit après le délai", () => {
    saveLibraryDebounced([entry({ infoHash: "d1" })]);
    expect(getCachedLibrary()?.[0].infoHash).toBe("d1");
    expect(setSpy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(400);
    expect(setSpy).toHaveBeenCalledTimes(1);
  });

  it("regroupe une rafale en une seule écriture", () => {
    saveLibraryDebounced([entry({ infoHash: "a" })]);
    saveLibraryDebounced([entry({ infoHash: "b" })]);
    saveLibraryDebounced([entry({ infoHash: "c" })]);
    vi.advanceTimersByTime(400);
    expect(setSpy).toHaveBeenCalledTimes(1);
    expect(setSpy).toHaveBeenLastCalledWith("library", [
      expect.objectContaining({ infoHash: "c" }),
    ]);
  });

  it("flushLibrary force l'écriture en attente", () => {
    saveLibraryDebounced([entry({ infoHash: "f" })]);
    flushLibrary();
    expect(setSpy).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(400);
    expect(setSpy).toHaveBeenCalledTimes(1); // pas de double écriture
  });

  it("flushLibrary ne fait rien sans écriture en attente", () => {
    flushLibrary();
    expect(setSpy).not.toHaveBeenCalled();
  });
});

function tvMeta(id: number): NonNullable<LibraryEntry["tmdb"]> {
  return {
    id,
    mediaType: "tv",
    title: `Series ${id}`,
    posterPath: null,
    year: "2020",
    voteAverage: 0,
    overview: "",
  };
}

function movieMeta(id: number): NonNullable<LibraryEntry["tmdb"]> {
  return { ...tvMeta(id), mediaType: "movie", title: `Movie ${id}` };
}

// Entrée vue (sans fichiers : coche globale) / à voir.
const done = { files: [] as DebridFile[], watched: { __whole__: true } };
const todo = { files: [] as DebridFile[], watched: {} };

describe("groupLibraryEntries", () => {
  it("regroupe les entrées TV partageant le même id TMDB", () => {
    const items = groupLibraryEntries([
      entry({ infoHash: "a", tmdb: tvMeta(1) }),
      entry({ infoHash: "b", tmdb: tvMeta(1) }),
    ]);
    expect(items).toHaveLength(1);
    expect(items[0].type).toBe("group");
    if (items[0].type === "group") expect(items[0].group.entries).toHaveLength(2);
  });

  it("collapse un groupe à une seule entrée en single", () => {
    const items = groupLibraryEntries([entry({ infoHash: "a", tmdb: tvMeta(1) })]);
    expect(items).toHaveLength(1);
    expect(items[0].type).toBe("single");
  });

  it("garde films et entrées sans TMDB en singles, dans l'ordre d'apparition", () => {
    const items = groupLibraryEntries([
      entry({ infoHash: "m", tmdb: movieMeta(9) }),
      entry({ infoHash: "x" }),
    ]);
    expect(items.map((i) => i.type)).toEqual(["single", "single"]);
  });
});

describe("libraryCounts", () => {
  it("compte films et entrées hors-série par état", () => {
    const counts = libraryCounts([
      entry({ infoHash: "m1", tmdb: movieMeta(1), ...done }),
      entry({ infoHash: "m2", tmdb: movieMeta(2), ...todo }),
      entry({ infoHash: "x", ...todo }),
    ]);
    expect(counts).toEqual({ all: 3, done: 1, todo: 2 });
  });

  it("compte une série multi-entrées comme un seul élément", () => {
    const counts = libraryCounts([
      entry({ infoHash: "a", tmdb: tvMeta(1), ...done }),
      entry({ infoHash: "b", tmdb: tvMeta(1), ...done }),
      entry({ infoHash: "c", tmdb: tvMeta(1), ...done }),
    ]);
    expect(counts).toEqual({ all: 1, done: 1, todo: 0 });
  });

  it("compte une série mixte dans done ET todo", () => {
    const counts = libraryCounts([
      entry({ infoHash: "a", tmdb: tvMeta(1), ...done }),
      entry({ infoHash: "b", tmdb: tvMeta(1), ...todo }),
    ]);
    expect(counts).toEqual({ all: 1, done: 1, todo: 1 });
  });

  it("équivaut à groupLibraryEntries sur les sous-ensembles filtrés", () => {
    const entries = [
      entry({ infoHash: "m1", tmdb: movieMeta(1), ...done }),
      entry({ infoHash: "m2", tmdb: movieMeta(2), ...todo }),
      entry({ infoHash: "x", ...todo }),
      entry({ infoHash: "a", tmdb: tvMeta(1), ...done }),
      entry({ infoHash: "b", tmdb: tvMeta(1), ...done }),
      entry({ infoHash: "c", tmdb: tvMeta(2), ...done }),
      entry({ infoHash: "d", tmdb: tvMeta(2), ...todo }),
    ];
    const counts = libraryCounts(entries);
    expect(counts.all).toBe(groupLibraryEntries(entries).length);
    expect(counts.done).toBe(groupLibraryEntries(entries.filter((e) => isWholeWatched(e))).length);
    expect(counts.todo).toBe(groupLibraryEntries(entries.filter((e) => !isWholeWatched(e))).length);
  });
});
