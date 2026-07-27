import { localVolume, planImports } from "@/lib/mangaImport";
import { mergeVolumes, type MangaVolume } from "@/lib/mangaLibrary";
import { describe, expect, it } from "vitest";

describe("planImports", () => {
  it("devine le numero de tome depuis le nom de fichier", () => {
    const planned = planImports([
      "/Users/moi/Downloads/One Piece T05.cbz",
      "C:\\scans\\Berserk - 12.cbz",
      "/tmp/hors-serie.cbz",
    ]);
    expect(planned.map((p) => [p.fileName, p.number])).toEqual([
      ["One Piece T05.cbz", 5],
      ["Berserk - 12.cbz", 12],
      ["hors-serie.cbz", null],
    ]);
  });
});

describe("localVolume", () => {
  it("construit un tome local lisible immediatement", () => {
    const volume = localVolume(
      {
        source: "/tmp/T3.cbz",
        path: "/manga/Berserk/T3.cbz",
        fileName: "T3.cbz",
        size: 42,
        error: null,
      },
      3,
    );
    expect(volume).toMatchObject({
      number: 3,
      infoHash: "local",
      fileName: "T3.cbz",
      fileSize: 42,
      link: "",
      localPath: "/manga/Berserk/T3.cbz",
      source: "local",
    });
  });
});

describe("fusion avec les tomes de torrent", () => {
  const torrentVolume: MangaVolume = {
    number: 3,
    infoHash: "abc",
    fileName: "Berserk T03.cbz",
    fileSize: 999_999,
    link: "https://alldebrid/x",
  };

  it("l'import local l'emporte sur le tome torrent du meme numero", () => {
    const imported = localVolume(
      {
        source: "/tmp/T3.cbz",
        path: "/manga/Berserk/T3.cbz",
        fileName: "T3.cbz",
        size: 10,
        error: null,
      },
      3,
    );
    const merged = mergeVolumes([torrentVolume], [imported]);
    expect(merged).toHaveLength(1);
    expect(merged[0].source).toBe("local");
  });

  it("un tome local d'un autre numero s'ajoute sans ecraser", () => {
    const imported = localVolume(
      {
        source: "/tmp/T4.cbz",
        path: "/manga/Berserk/T4.cbz",
        fileName: "T4.cbz",
        size: 10,
        error: null,
      },
      4,
    );
    const merged = mergeVolumes([torrentVolume], [imported]);
    expect(merged.map((v) => v.number)).toEqual([3, 4]);
  });
});
