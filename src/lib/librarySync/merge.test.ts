import { describe, expect, it } from "vitest";
import type { LibraryEntry } from "@/lib/library";
import type { CategoryConfig } from "@/lib/libraryCategories";
import { LIBRARY_FORMAT_VERSION, type LibraryPayload } from "./format";
import { mergeLibrary, type LocalState } from "./merge";

const EXPORTED_AT = 1_000_000;

function entry(over: Partial<LibraryEntry> = {}): LibraryEntry {
  return {
    infoHash: "h1",
    title: "Titre",
    provider: "c411",
    category: 0,
    size: 100,
    addedAt: EXPORTED_AT - 5000,
    files: [],
    enriched: false,
    watched: {},
    ...over,
  };
}

const NO_CATEGORIES: CategoryConfig = { categories: [], assign: {} };

function local(entries: LibraryEntry[], categories = NO_CATEGORIES): LocalState {
  return { entries, categories };
}

function payload(entries: LibraryEntry[], categories = NO_CATEGORIES): LibraryPayload {
  return {
    version: LIBRARY_FORMAT_VERSION,
    exportedAt: EXPORTED_AT,
    entries,
    categories,
  };
}

describe("mergeLibrary", () => {
  it("ajoute une entrée présente uniquement dans le fichier", () => {
    const result = mergeLibrary(local([]), payload([entry({ infoHash: "new" })]));

    expect(result.entries.map((e) => e.infoHash)).toEqual(["new"]);
    expect(result.added).toBe(1);
    expect(result.missing).toEqual([]);
  });

  it("garde la version locale quand elle est la plus récente", () => {
    const mine = entry({ title: "Local", updatedAt: 5000 });
    const theirs = entry({ title: "Distant", updatedAt: 4000 });

    const result = mergeLibrary(local([mine]), payload([theirs]));

    expect(result.entries[0].title).toBe("Local");
    expect(result.unchanged).toBe(1);
    expect(result.updated).toBe(0);
  });

  it("prend la version du fichier quand elle est la plus récente", () => {
    const mine = entry({ title: "Local", updatedAt: 4000 });
    const theirs = entry({ title: "Distant", updatedAt: 5000 });

    const result = mergeLibrary(local([mine]), payload([theirs]));

    expect(result.entries[0].title).toBe("Distant");
    expect(result.updated).toBe(1);
  });

  it("retombe sur addedAt quand updatedAt est absent", () => {
    const mine = entry({ title: "Local", addedAt: 4000 });
    const theirs = entry({ title: "Distant", addedAt: 5000 });

    const result = mergeLibrary(local([mine]), payload([theirs]));

    expect(result.entries[0].title).toBe("Distant");
  });

  it("fait l'union des épisodes vus", () => {
    const mine = entry({ watched: { "e1.mkv": true, "e2.mkv": false }, updatedAt: 5000 });
    const theirs = entry({ watched: { "e2.mkv": true, "e3.mkv": true }, updatedAt: 4000 });

    const result = mergeLibrary(local([mine]), payload([theirs]));

    expect(result.entries[0].watched).toEqual({
      "e1.mkv": true,
      "e2.mkv": true,
      "e3.mkv": true,
    });
    expect(result.updated).toBe(1);
  });

  it("conserve sans rien demander une entrée ajoutée après l'export", () => {
    const recent = entry({ infoHash: "recent", addedAt: EXPORTED_AT + 1 });

    const result = mergeLibrary(local([recent]), payload([]));

    expect(result.missing).toEqual([]);
    expect(result.entries.map((e) => e.infoHash)).toEqual(["recent"]);
    expect(result.unchanged).toBe(1);
  });

  it("signale une entrée antérieure à l'export et absente du fichier", () => {
    const old = entry({ infoHash: "old", addedAt: EXPORTED_AT - 1 });

    const result = mergeLibrary(local([old]), payload([]));

    expect(result.missing.map((e) => e.infoHash)).toEqual(["old"]);
    expect(result.entries.map((e) => e.infoHash)).toEqual(["old"]);
  });

  it("supprime les entrées sélectionnées par l'utilisateur", () => {
    const old = entry({ infoHash: "old", addedAt: EXPORTED_AT - 1 });

    const result = mergeLibrary(local([old]), payload([]), new Set(["old"]));

    expect(result.entries).toEqual([]);
    expect(result.missing.map((e) => e.infoHash)).toEqual(["old"]);
  });

  it("réimporter le même fichier ne change rien", () => {
    const same = entry({ updatedAt: 5000 });

    const result = mergeLibrary(local([same]), payload([same]));

    expect(result.added).toBe(0);
    expect(result.updated).toBe(0);
    expect(result.unchanged).toBe(1);
    expect(result.entries[0]).toBe(same);
  });
});

describe("fusion des catégories", () => {
  it("réunit les catégories des deux côtés", () => {
    const mine: CategoryConfig = {
      categories: [{ id: "a", name: "Animes", createdAt: 1 }],
      assign: { h1: "a" },
    };
    const theirs: CategoryConfig = {
      categories: [{ id: "b", name: "Docus", createdAt: 2 }],
      assign: { h2: "b" },
    };

    const result = mergeLibrary(
      local([entry({ infoHash: "h1" })], mine),
      payload([entry({ infoHash: "h2" })], theirs),
    );

    expect(result.categories.categories.map((c) => c.id).sort()).toEqual(["a", "b"]);
    expect(result.categories.assign).toEqual({ h1: "a", h2: "b" });
  });

  it("garde le nom le plus récent en cas de collision d'id", () => {
    const mine: CategoryConfig = {
      categories: [{ id: "a", name: "Ancien", createdAt: 1 }],
      assign: {},
    };
    const theirs: CategoryConfig = {
      categories: [{ id: "a", name: "Nouveau", createdAt: 2 }],
      assign: {},
    };

    const result = mergeLibrary(local([], mine), payload([], theirs));

    expect(result.categories.categories).toEqual([{ id: "a", name: "Nouveau", createdAt: 2 }]);
  });

  it("oublie les affectations des titres supprimés", () => {
    const old = entry({ infoHash: "old", addedAt: EXPORTED_AT - 1 });
    const mine: CategoryConfig = {
      categories: [{ id: "a", name: "Animes", createdAt: 1 }],
      assign: { old: "a" },
    };

    const result = mergeLibrary(local([old], mine), payload([]), new Set(["old"]));

    expect(result.categories.assign).toEqual({});
  });
});
