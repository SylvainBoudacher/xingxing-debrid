import { describe, expect, it } from "vitest";
import {
  compareVolumes,
  mangaProgress,
  mergeVolumes,
  nextVolume,
  volumesFromFiles,
  type MangaEntry,
  type MangaVolume,
} from "@/lib/mangaLibrary";

function volume(over: Partial<MangaVolume> = {}): MangaVolume {
  return {
    number: 1,
    infoHash: "hash-a",
    fileName: "T01.cbz",
    fileSize: 100,
    link: "https://debrid/T01.cbz",
    ...over,
  };
}

describe("volumesFromFiles", () => {
  it("ne garde que les CBZ, numerote et trie", () => {
    const volumes = volumesFromFiles(
      [
        { name: "One Piece - Tome 10.cbz", size: 10, link: "l10" },
        { name: "One Piece - Tome 02.cbz", size: 2, link: "l2" },
        { name: "ComicInfo.xml", size: 1, link: "lx" },
        { name: "One Piece - Tome 01.pdf", size: 1, link: "lp" },
      ],
      "hash-a",
      7,
    );
    expect(volumes.map((v) => v.number)).toEqual([2, 10]);
    expect(volumes[0]).toMatchObject({ infoHash: "hash-a", magnetId: 7, fileSize: 2 });
  });

  it("place les fichiers non numerotes en fin de liste", () => {
    const volumes = volumesFromFiles(
      [
        { name: "bonus.cbz", size: 1, link: "l1" },
        { name: "T03.cbz", size: 1, link: "l3" },
      ],
      "hash-a",
    );
    expect(volumes.map((v) => v.number)).toEqual([3, null]);
  });
});

describe("mergeVolumes", () => {
  it("complete une entree avec les tomes d'un autre torrent", () => {
    const merged = mergeVolumes(
      [volume({ number: 1 }), volume({ number: 2, fileName: "T02.cbz" })],
      [volume({ number: 3, infoHash: "hash-b", fileName: "T03.cbz" })],
    );
    expect(merged.map((v) => v.number)).toEqual([1, 2, 3]);
  });

  it("prefere le tome deja telecharge en cas de doublon", () => {
    const merged = mergeVolumes(
      [volume({ number: 5, localPath: "/dl/T05.cbz", fileSize: 10 })],
      [volume({ number: 5, infoHash: "hash-b", fileName: "autre-T05.cbz", fileSize: 999 })],
    );
    expect(merged).toHaveLength(1);
    expect(merged[0].localPath).toBe("/dl/T05.cbz");
  });

  it("prefere le plus gros fichier quand aucun n'est telecharge", () => {
    const merged = mergeVolumes(
      [volume({ number: 5, fileSize: 10 })],
      [volume({ number: 5, infoHash: "hash-b", fileName: "autre-T05.cbz", fileSize: 999 })],
    );
    expect(merged).toHaveLength(1);
    expect(merged[0].fileSize).toBe(999);
  });

  it("conserve la progression de lecture d'un tome reimporte", () => {
    const merged = mergeVolumes(
      [volume({ lastPage: 12, read: true, localPath: "/dl/T01.cbz", pageCount: 190 })],
      [volume({ fileSize: 200 })],
    );
    expect(merged[0]).toMatchObject({
      lastPage: 12,
      read: true,
      localPath: "/dl/T01.cbz",
      pageCount: 190,
      fileSize: 200,
    });
  });

  it("ne deduplique pas entre eux les tomes non numerotes", () => {
    const merged = mergeVolumes(
      [volume({ number: null, fileName: "bonus-a.cbz" })],
      [volume({ number: null, fileName: "bonus-b.cbz" })],
    );
    expect(merged).toHaveLength(2);
  });
});

describe("compareVolumes", () => {
  it("trie par numero, les inconnus en dernier", () => {
    const sorted = [
      volume({ number: null, fileName: "z.cbz" }),
      volume({ number: 10 }),
      volume({ number: 2 }),
    ].sort(compareVolumes);
    expect(sorted.map((v) => v.number)).toEqual([2, 10, null]);
  });
});

describe("progression", () => {
  const entry: MangaEntry = {
    mangaId: "m1",
    meta: {
      title: "Berserk",
      coverFileName: null,
      year: "1989",
      status: "ongoing",
      lastVolume: 43,
      description: "",
      tags: [],
    },
    volumes: [
      volume({ number: 1, read: true, localPath: "/dl/T01.cbz" }),
      volume({ number: 2, fileName: "T02.cbz", localPath: "/dl/T02.cbz" }),
      volume({ number: 3, fileName: "T03.cbz" }),
    ],
    addedAt: 0,
  };

  it("compte les tomes telecharges et lus", () => {
    expect(mangaProgress(entry)).toEqual({ total: 3, downloaded: 2, read: 1 });
  });

  it("propose le premier tome non lu", () => {
    expect(nextVolume(entry)?.number).toBe(2);
  });

  it("propose le dernier tome quand tout est lu", () => {
    const allRead = { ...entry, volumes: entry.volumes.map((v) => ({ ...v, read: true })) };
    expect(nextVolume(allRead)?.number).toBe(3);
  });

  it("rend null sur une entree vide", () => {
    expect(nextVolume({ ...entry, volumes: [] })).toBeNull();
  });
});
