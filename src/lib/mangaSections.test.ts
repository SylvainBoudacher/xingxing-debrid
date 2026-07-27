import { UNCLASSIFIED } from "@/lib/libraryCategories";
import type { MangaEntry, MangaVolume } from "@/lib/mangaLibrary";
import {
  buildMangaBlocks,
  entrySize,
  isFullyRead,
  mangaCounts,
  pruneMangaCategories,
  visibleMangas,
} from "@/lib/mangaSections";
import { describe, expect, it } from "vitest";

function volume(fileSize: number, read: boolean): MangaVolume {
  return { number: 1, infoHash: "h", fileName: `${fileSize}`, fileSize, link: "", read };
}

function entry(
  mangaId: string,
  title: string,
  addedAt: number,
  volumes: MangaVolume[],
): MangaEntry {
  return {
    mangaId,
    meta: {
      title,
      coverFileName: null,
      year: "",
      status: "ongoing",
      lastVolume: null,
      description: "",
      tags: [],
    },
    volumes,
    addedAt,
  };
}

const berserk = entry("a", "Berserk", 3, [volume(100, true), volume(200, true)]);
const naruto = entry("b", "Naruto", 2, [volume(50, true), volume(50, false)]);
const empty = entry("c", "Vagabond", 1, []);

describe("isFullyRead", () => {
  it("exige que tous les tomes soient lus", () => {
    expect(isFullyRead(berserk)).toBe(true);
    expect(isFullyRead(naruto)).toBe(false);
  });

  it("laisse une oeuvre sans tome à lire", () => {
    expect(isFullyRead(empty)).toBe(false);
  });
});

describe("visibleMangas", () => {
  const all = [berserk, naruto, empty];

  it("filtre sur la lecture", () => {
    expect(visibleMangas(all, "done", "", "recent").map((e) => e.mangaId)).toEqual(["a"]);
    expect(visibleMangas(all, "todo", "", "recent").map((e) => e.mangaId)).toEqual(["b", "c"]);
  });

  it("recherche sur le titre sans tenir compte de la casse", () => {
    expect(visibleMangas(all, "all", "naru", "recent").map((e) => e.mangaId)).toEqual(["b"]);
  });

  it("trie par ajout, titre puis taille totale", () => {
    expect(visibleMangas(all, "all", "", "recent").map((e) => e.mangaId)).toEqual(["a", "b", "c"]);
    expect(visibleMangas(all, "all", "", "title").map((e) => e.mangaId)).toEqual(["a", "b", "c"]);
    expect(visibleMangas(all, "all", "", "size").map((e) => e.mangaId)).toEqual(["a", "b", "c"]);
  });
});

describe("mangaCounts", () => {
  it("compte les oeuvres lues et restantes", () => {
    expect(mangaCounts([berserk, naruto, empty])).toEqual({ all: 3, done: 1, todo: 2 });
  });
});

describe("entrySize", () => {
  it("somme les tomes, téléchargés ou non", () => {
    expect(entrySize(berserk)).toBe(300);
    expect(entrySize(empty)).toBe(0);
  });
});

describe("buildMangaBlocks", () => {
  const config = {
    categories: [{ id: "cat", name: "Shonen", createdAt: 0 }],
    assign: { a: "cat" },
  };

  it("rend un seul bloc sans regroupement", () => {
    const blocks = buildMangaBlocks([berserk, naruto], "none", config);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].label).toBeNull();
  });

  it("garde les catégories vides et termine par les non classés", () => {
    const blocks = buildMangaBlocks([berserk, naruto], "category", config);
    expect(blocks.map((b) => b.key)).toEqual(["cat", UNCLASSIFIED]);
    expect(blocks[0].items.map((e) => e.mangaId)).toEqual(["a"]);
    expect(blocks[1].items.map((e) => e.mangaId)).toEqual(["b"]);
  });
});

describe("pruneMangaCategories", () => {
  it("retire les affectations orphelines", () => {
    const config = { categories: [], assign: { a: "cat", gone: "cat" } };
    expect(pruneMangaCategories(config, new Set(["a"])).assign).toEqual({ a: "cat" });
  });

  it("renvoie la même config quand rien ne change", () => {
    const config = { categories: [], assign: { a: "cat" } };
    expect(pruneMangaCategories(config, new Set(["a"]))).toBe(config);
  });
});
