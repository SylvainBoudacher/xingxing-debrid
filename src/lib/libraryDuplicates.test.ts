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
import type { LibraryEntry } from "./library";
import {
  conflictingReleases,
  duplicateGroups,
  duplicateLinks,
  filesToDrop,
} from "./libraryDuplicates";
import type { TitleItem, TitleSection } from "./libraryTitle";

function entry(infoHash: string, over: Partial<LibraryEntry> = {}): LibraryEntry {
  return {
    infoHash,
    title: `Show ${infoHash}`,
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

// Fabrique un item : le lien porte le hash de l'entrée pour rester unique quand
// deux releases contiennent le même nom de fichier.
function item(
  e: LibraryEntry,
  name: string,
  season: number | null,
  episode: number | null,
  size = 100,
): TitleItem {
  const file: DebridFile = { name, link: `${e.infoHash}:${name}`, size };
  return { entry: e, file, season, episode };
}

function section(items: TitleItem[], key = "s1"): TitleSection {
  return { key, label: "Saison 1", season: 1, items };
}

describe("duplicateGroups", () => {
  it("groupe deux fichiers du même épisode venus de releases différentes", () => {
    const a = entry("a");
    const b = entry("b");
    const items = [item(a, "S01E01.mkv", 1, 1), item(b, "S01E01.mkv", 1, 1)];
    const groups = duplicateGroups([section(items)]);
    expect(groups).toEqual([items]);
  });

  it("ignore les épisodes présents une seule fois", () => {
    const a = entry("a");
    const b = entry("b");
    const groups = duplicateGroups([
      section([item(a, "S01E01.mkv", 1, 1), item(b, "S01E02.mkv", 1, 2)]),
    ]);
    expect(groups).toEqual([]);
  });

  it("ignore les items sans numéro d'épisode détecté", () => {
    const a = entry("a");
    const b = entry("b");
    const groups = duplicateGroups([
      section([item(a, "pack.mkv", 1, null), item(b, "pack2.mkv", 1, null)]),
    ]);
    expect(groups).toEqual([]);
  });

  it("ne confond pas le même numéro dans deux saisons", () => {
    const a = entry("a");
    const b = entry("b");
    const groups = duplicateGroups([
      section([item(a, "S01E01.mkv", 1, 1)]),
      section([item(b, "S02E01.mkv", 2, 1)], "s2"),
    ]);
    expect(groups).toEqual([]);
  });

  it("détecte un doublon réparti sur deux sections", () => {
    const a = entry("a");
    const b = entry("b");
    const x = item(a, "S01E01.mkv", 1, 1);
    const y = item(b, "S01E01.mkv", 1, 1);
    expect(duplicateGroups([section([x]), section([y], "s1bis")])).toEqual([[x, y]]);
  });

  it("ne compte pas deux fois le même fichier listé dans deux dossiers", () => {
    const a = entry("a");
    const x = item(a, "S01E01.mkv", 1, 1);
    expect(duplicateGroups([section([x]), section([x], "dossier2")])).toEqual([]);
  });
});

describe("duplicateLinks", () => {
  it("renvoie les liens de tous les fichiers en double", () => {
    const a = entry("a");
    const b = entry("b");
    const groups = duplicateGroups([
      section([item(a, "S01E01.mkv", 1, 1), item(b, "S01E01.mkv", 1, 1)]),
    ]);
    expect(duplicateLinks(groups)).toEqual(new Set(["a:S01E01.mkv", "b:S01E01.mkv"]));
  });
});

describe("conflictingReleases", () => {
  it("décrit une release par entrée impliquée, la plus fournie d'abord", () => {
    const a = entry("a", { releaseName: "Frieren.S01.VOSTFR.1080p.WEB.x264" });
    const b = entry("b", { releaseName: "Frieren.S01.MULTi.1080p.BluRay.x265" });
    const groups = duplicateGroups([
      section([
        item(a, "S01E01.mkv", 1, 1, 500),
        item(b, "S01E01.mkv", 1, 1, 1500),
        item(a, "S01E02.mkv", 1, 2, 500),
        item(b, "S01E02.mkv", 1, 2, 1500),
        item(b, "S01E03.mkv", 1, 3, 1500),
      ]),
    ]);
    const releases = conflictingReleases(groups);
    expect(releases.map((r) => r.entry.infoHash)).toEqual(["b", "a"]);
    expect(releases[0]).toMatchObject({ count: 2, size: 3000 });
    expect(releases[1]).toMatchObject({ count: 2, size: 1000 });
    expect(releases[0].label).toBe("Frieren.S01.MULTi.1080p.BluRay.x265");
  });

  it("retombe sur le titre quand releaseName est absent", () => {
    const a = entry("a", { title: "Frieren Saison 1" });
    const b = entry("b");
    const groups = duplicateGroups([
      section([item(a, "S01E01.mkv", 1, 1), item(b, "S01E01.mkv", 1, 1)]),
    ]);
    expect(conflictingReleases(groups).find((r) => r.entry.infoHash === "a")!.label).toBe(
      "Frieren Saison 1",
    );
  });
});

describe("filesToDrop", () => {
  it("garde les fichiers de la release choisie et jette les autres", () => {
    const a = entry("a");
    const b = entry("b");
    const groups = duplicateGroups([
      section([
        item(a, "S01E01.mkv", 1, 1),
        item(b, "S01E01.mkv", 1, 1),
        item(a, "S01E02.mkv", 1, 2),
        item(b, "S01E02.mkv", 1, 2),
      ]),
    ]);
    const { links } = filesToDrop(groups, "b");
    expect(links).toEqual(new Set(["a:S01E01.mkv", "a:S01E02.mkv"]));
  });

  it("additionne le poids des fichiers retirés", () => {
    const a = entry("a");
    const b = entry("b");
    const groups = duplicateGroups([
      section([
        item(a, "S01E01.mkv", 1, 1, 500),
        item(b, "S01E01.mkv", 1, 1, 1500),
        item(a, "S01E02.mkv", 1, 2, 500),
        item(b, "S01E02.mkv", 1, 2, 1500),
      ]),
    ]);
    expect(filesToDrop(groups, "b").size).toBe(1000);
  });

  it("laisse intact un épisode que la release choisie ne couvre pas", () => {
    const a = entry("a");
    const b = entry("b");
    const c = entry("c");
    const groups = duplicateGroups([
      section([
        item(a, "S01E01.mkv", 1, 1),
        item(b, "S01E01.mkv", 1, 1),
        item(a, "S01E09.mkv", 1, 9),
        item(c, "S01E09.mkv", 1, 9),
      ]),
    ]);
    const { links } = filesToDrop(groups, "b");
    expect(links).toEqual(new Set(["a:S01E01.mkv"]));
  });

  it("reporte la coche « vu » sur le fichier conservé", () => {
    const a = entry("a", { watched: { "S01E01.mkv": true } });
    const b = entry("b");
    const groups = duplicateGroups([
      section([item(a, "S01E01.mkv", 1, 1), item(b, "S01E01.mkv", 1, 1)]),
    ]);
    const { promoteWatched } = filesToDrop(groups, "b");
    expect(promoteWatched).toEqual([{ entry: b, name: "S01E01.mkv" }]);
  });

  it("ne reporte rien quand le fichier conservé est déjà vu", () => {
    const a = entry("a", { watched: { "S01E01.mkv": true } });
    const b = entry("b", { watched: { "S01E01.mkv": true } });
    const groups = duplicateGroups([
      section([item(a, "S01E01.mkv", 1, 1), item(b, "S01E01.mkv", 1, 1)]),
    ]);
    expect(filesToDrop(groups, "b").promoteWatched).toEqual([]);
  });

  it("ne reporte rien quand aucun doublon supprimé n'était vu", () => {
    const a = entry("a");
    const b = entry("b");
    const groups = duplicateGroups([
      section([item(a, "S01E01.mkv", 1, 1), item(b, "S01E01.mkv", 1, 1)]),
    ]);
    expect(filesToDrop(groups, "b").promoteWatched).toEqual([]);
  });
});
