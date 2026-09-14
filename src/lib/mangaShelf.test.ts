import { describe, expect, it } from "vitest";
import type { MangaEntry, MangaVolume } from "@/lib/mangaLibrary";
import { buildShelf, filterShelf, shelfCounts, volumeCovers } from "@/lib/mangaShelf";
import type { MangaCoverRaw } from "@/lib/services/mangadex";

function volume(over: Partial<MangaVolume> = {}): MangaVolume {
  return {
    number: 1,
    infoHash: "hash-a",
    fileName: "T01.cbz",
    fileSize: 100,
    link: "https://link",
    ...over,
  };
}

function entry(volumes: MangaVolume[], lastVolume: number | null = null): MangaEntry {
  return {
    mangaId: "m1",
    meta: {
      title: "Titre",
      coverFileName: "main.jpg",
      year: "1998",
      status: "ongoing",
      lastVolume,
      description: "",
      tags: [],
    },
    volumes,
    addedAt: 0,
  };
}

function cover(
  volume: string | null,
  fileName: string,
  locale: string | null = "ja",
): MangaCoverRaw {
  return { id: fileName, attributes: { volume, fileName, locale } };
}

describe("volumeCovers", () => {
  it("indexe les covers par numéro de tome", () => {
    const map = volumeCovers([cover("1", "a.jpg"), cover("2", "b.jpg")]);
    expect(map.get(1)).toBe("a.jpg");
    expect(map.get(2)).toBe("b.jpg");
  });

  it("préfère l'édition française, puis la japonaise", () => {
    const map = volumeCovers([
      cover("1", "it.jpg", "it"),
      cover("1", "ja.jpg", "ja"),
      cover("1", "fr.jpg", "fr"),
      cover("2", "it2.jpg", "it"),
      cover("2", "ja2.jpg", "ja"),
    ]);
    expect(map.get(1)).toBe("fr.jpg");
    expect(map.get(2)).toBe("ja2.jpg");
  });

  it("ignore les covers sans numéro ou non entier", () => {
    const map = volumeCovers([cover(null, "a.jpg"), cover("10.5", "b.jpg"), cover("0", "c.jpg")]);
    expect(map.size).toBe(0);
  });
});

describe("buildShelf", () => {
  it("intercale les tomes manquants jusqu'au dernier tome paru", () => {
    const shelf = buildShelf(entry([volume({ number: 1 }), volume({ number: 3 })], 4), new Map());
    expect(shelf.map((s) => [s.kind, s.number])).toEqual([
      ["owned", 1],
      ["missing", 2],
      ["owned", 3],
      ["missing", 4],
    ]);
  });

  it("déduit le nombre de tomes parus des covers quand lastVolume est absent", () => {
    const shelf = buildShelf(entry([volume({ number: 1 })]), new Map([[3, "c.jpg"]]));
    expect(shelf).toHaveLength(3);
    expect(shelf[2]).toMatchObject({ kind: "missing", number: 3, coverFileName: "c.jpg" });
  });

  it("garde un tome possédé au-delà du nombre annoncé", () => {
    const shelf = buildShelf(entry([volume({ number: 5 })], 2), new Map());
    expect(shelf.map((s) => s.number)).toEqual([1, 2, 5]);
    expect(shelf.map((s) => s.kind)).toEqual(["missing", "missing", "owned"]);
  });

  it("place les tomes non numérotés à la fin", () => {
    const shelf = buildShelf(
      entry([volume({ number: null, fileName: "bonus.cbz" }), volume({ number: 1 })], 1),
      new Map(),
    );
    expect(shelf.map((s) => s.kind === "owned" && s.volume.fileName)).toEqual([
      "T01.cbz",
      "bonus.cbz",
    ]);
    expect(shelf[1].number).toBeNull();
  });

  it("associe la cover MangaDex du tome, null sinon", () => {
    const shelf = buildShelf(
      entry([volume({ number: 1 }), volume({ number: 2 })]),
      new Map([[1, "a.jpg"]]),
    );
    expect(shelf[0].coverFileName).toBe("a.jpg");
    expect(shelf[1].coverFileName).toBeNull();
  });
});

describe("shelfCounts / filterShelf", () => {
  const shelf = buildShelf(
    entry(
      [
        volume({ number: 1, read: true, localPath: "/a" }),
        volume({ number: 2 }),
        volume({ number: 4, localPath: "/b" }),
        volume({ number: null, fileName: "bonus.cbz" }),
      ],
      4,
    ),
    new Map(),
  );

  it("compte la collection hors tomes non numérotés", () => {
    expect(shelfCounts(shelf)).toEqual({
      owned: 4,
      read: 1,
      unread: 3,
      missing: 1,
      total: 5,
      collected: 3,
      published: 4,
    });
  });

  it("filtre les emplacements", () => {
    expect(filterShelf(shelf, "all")).toHaveLength(5);
    expect(filterShelf(shelf, "owned").map((s) => s.number)).toEqual([1, 2, 4, null]);
    expect(filterShelf(shelf, "unread").map((s) => s.number)).toEqual([2, 4, null]);
    expect(filterShelf(shelf, "missing").map((s) => s.number)).toEqual([3]);
  });
});
