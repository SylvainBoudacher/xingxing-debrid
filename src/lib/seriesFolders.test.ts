import { describe, expect, it, vi } from "vitest";

vi.mock("@tauri-apps/plugin-store", () => ({
  LazyStore: class {
    async get() {
      return undefined;
    }
    async set() {}
    async save() {}
  },
}));

import type { DebridFile } from "./debrid";
import type { LibraryEntry, TmdbMeta } from "./library";
import {
  assignFiles,
  fileKey,
  groupFolderSections,
  materializeFolders,
  pruneAssignments,
  removeFolder,
  renameFolder,
  type SeriesFolderConfig,
} from "./seriesFolders";

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

const tmdb: TmdbMeta = {
  id: 1,
  mediaType: "tv",
  title: "Show",
  posterPath: null,
  year: "2023",
  voteAverage: 8,
  overview: "",
};

const s1e1 = file("Show.S01E01.mkv");
const s1e2 = file("Show.S01E02.mkv");
const s2e1 = file("Show.S02E01.mkv");

function group(entries: LibraryEntry[]) {
  return { tmdbId: 1, tmdb, entries };
}

describe("materializeFolders", () => {
  it("crée un dossier par saison détectée et affecte chaque fichier", () => {
    const e = entry({ files: [s1e1, s1e2, s2e1] });
    const config = materializeFolders(group([e]));
    expect(config.folders.map((f) => f.name)).toEqual(["Saison 1", "Saison 2"]);
    expect(config.folders.map((f) => f.season)).toEqual([1, 2]);
    expect(config.assignments[fileKey(e, s1e2.name)]).toBe(config.folders[0].id);
    expect(config.assignments[fileKey(e, s2e1.name)]).toBe(config.folders[1].id);
  });
});

describe("groupFolderSections", () => {
  it("respecte les affectations explicites plutôt que la saison détectée", () => {
    const e = entry({ files: [s1e1, s2e1] });
    let config = materializeFolders(group([e]));
    config = assignFiles(config, [fileKey(e, s2e1.name)], config.folders[0].id);
    const sections = groupFolderSections(group([e]), config);
    expect(sections[0].items.map((it) => it.file.name)).toEqual([s1e1.name, s2e1.name]);
    expect(sections[1].items).toEqual([]);
  });

  it("route un fichier ajouté après coup vers le dossier de sa saison", () => {
    const e = entry({ files: [s1e1] });
    const config = materializeFolders(group([e]));
    const later = entry({ infoHash: "hash2", files: [s1e2] });
    const sections = groupFolderSections(group([e, later]), config);
    expect(sections).toHaveLength(1);
    expect(sections[0].items.map((it) => it.file.name)).toEqual([s1e1.name, s1e2.name]);
  });

  it("met les fichiers sans dossier dans une section implicite en fin de liste", () => {
    const e = entry({ files: [s1e1, s2e1] });
    const config: SeriesFolderConfig = materializeFolders(group([entry({ files: [s1e1] })]));
    const sections = groupFolderSections(group([e]), config);
    expect(sections).toHaveLength(2);
    expect(sections[1].folder).toBeNull();
    expect(sections[1].items[0].file.name).toBe(s2e1.name);
  });

  it("un fichier explicitement non classé n'est pas re-routé par sa saison", () => {
    const e = entry({ files: [s1e1, s1e2] });
    let config = materializeFolders(group([e]));
    config = assignFiles(config, [fileKey(e, s1e2.name)], "");
    const sections = groupFolderSections(group([e]), config);
    expect(sections[0].items.map((it) => it.file.name)).toEqual([s1e1.name]);
    expect(sections[1].folder).toBeNull();
    expect(sections[1].items[0].file.name).toBe(s1e2.name);
  });
});

describe("removeFolder", () => {
  it("supprime le dossier et déclasse ses fichiers", () => {
    const e = entry({ files: [s1e1, s2e1] });
    const config = materializeFolders(group([e]));
    const next = removeFolder(config, config.folders[0].id);
    expect(next.folders).toHaveLength(1);
    expect(next.assignments[fileKey(e, s1e1.name)]).toBe("");
    const sections = groupFolderSections(group([e]), next);
    expect(sections[1].folder).toBeNull();
    expect(sections[1].items[0].file.name).toBe(s1e1.name);
  });
});

describe("renameFolder / pruneAssignments", () => {
  it("renomme sans toucher aux affectations", () => {
    const e = entry({ files: [s1e1] });
    const config = materializeFolders(group([e]));
    const next = renameFolder(config, config.folders[0].id, "Partie 1");
    expect(next.folders[0].name).toBe("Partie 1");
    expect(next.assignments).toEqual(config.assignments);
  });

  it("purge les affectations des fichiers supprimés", () => {
    const e = entry({ files: [s1e1, s1e2] });
    const config = materializeFolders(group([e]));
    const next = pruneAssignments(config, new Set([fileKey(e, s1e1.name)]));
    expect(next.assignments[fileKey(e, s1e1.name)]).toBeUndefined();
    expect(next.assignments[fileKey(e, s1e2.name)]).toBeDefined();
  });
});
