import type { MangaEntry, MangaVolume } from "@/lib/mangaLibrary";
import { beforeEach, describe, expect, it, vi } from "vitest";

const invokeSpy = vi.fn();
const getCachedMangaLibrarySpy = vi.fn();
const loadMangaLibrarySpy = vi.fn();
const saveMangaLibrarySpy = vi.fn(async (_entries: MangaEntry[]) => {});

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invokeSpy(...(args as [])),
}));

vi.mock("@/lib/mangaLibrary", () => ({
  getCachedMangaLibrary: () => getCachedMangaLibrarySpy(),
  loadMangaLibrary: () => loadMangaLibrarySpy(),
  saveMangaLibrary: (entries: MangaEntry[]) => saveMangaLibrarySpy(entries),
}));

import { applyMangaMoves, planMangaMoves } from "@/lib/mangaMove";

function volume(v: Partial<MangaVolume> = {}): MangaVolume {
  return {
    number: 1,
    infoHash: "hash",
    fileName: "T01.cbz",
    fileSize: 1,
    link: "link",
    ...v,
  };
}

function entry(title: string, volumes: MangaVolume[]): MangaEntry {
  return {
    mangaId: title,
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
    addedAt: 0,
  };
}

describe("planMangaMoves", () => {
  it("cible un sous-dossier par serie", () => {
    const entries = [entry("One Piece", [volume({ localPath: "/old/manga/T01.cbz" })])];
    expect(planMangaMoves(entries, "/new")).toEqual([
      {
        mangaId: "One Piece",
        fileName: "T01.cbz",
        infoHash: "hash",
        from: "/old/manga/T01.cbz",
        to: "/new/One Piece/T01.cbz",
      },
    ]);
  });

  it("ignore les tomes sans fichier local", () => {
    const entries = [entry("Bleach", [volume(), volume({ fileName: "T02.cbz" })])];
    expect(planMangaMoves(entries, "/new")).toEqual([]);
  });

  it("ignore les tomes deja au bon endroit", () => {
    const entries = [entry("Bleach", [volume({ localPath: "/new/Bleach/T01.cbz" })])];
    expect(planMangaMoves(entries, "/new")).toEqual([]);
  });

  it("assainit le titre de la serie", () => {
    const entries = [entry("Re:Zero", [volume({ localPath: "/old/T01.cbz" })])];
    expect(planMangaMoves(entries, "/new")[0].to).toBe("/new/Re-Zero/T01.cbz");
  });

  it("gere les chemins Windows", () => {
    const entries = [entry("Bleach", [volume({ localPath: "C:\\dl\\manga\\T01.cbz" })])];
    expect(planMangaMoves(entries, "D:\\Mangas")[0]).toMatchObject({
      from: "C:\\dl\\manga\\T01.cbz",
      to: "D:\\Mangas\\Bleach\\T01.cbz",
    });
  });

  it("ne planifie qu'un seul tome quand deux series distinctes s'assainissent pareil et partagent un nom de fichier", () => {
    const first = entry("One Piece", [volume({ localPath: "/old/a/T01.cbz" })]);
    const second = {
      ...entry("One Piece", [volume({ localPath: "/old/b/T01.cbz" })]),
      mangaId: "dup123",
    };
    expect(planMangaMoves([first, second], "/new")).toEqual([
      {
        mangaId: "One Piece",
        fileName: "T01.cbz",
        infoHash: "hash",
        from: "/old/a/T01.cbz",
        to: "/new/One Piece/T01.cbz",
      },
    ]);
  });

  it("ne planifie qu'un tome quand la meme entree a deux volumes de meme nom de fichier mais infoHash different", () => {
    const entries = [
      entry("One Piece", [
        volume({ infoHash: "hash-a", localPath: "/old/a/T01.cbz" }),
        volume({ infoHash: "hash-b", localPath: "/old/b/T01.cbz" }),
      ]),
    ];
    expect(planMangaMoves(entries, "/new")).toEqual([
      {
        mangaId: "One Piece",
        fileName: "T01.cbz",
        infoHash: "hash-a",
        from: "/old/a/T01.cbz",
        to: "/new/One Piece/T01.cbz",
      },
    ]);
  });
});

describe("applyMangaMoves", () => {
  beforeEach(() => {
    invokeSpy.mockReset();
    getCachedMangaLibrarySpy.mockReset();
    loadMangaLibrarySpy.mockReset();
    saveMangaLibrarySpy.mockClear();
  });

  it("persiste la bibliotheque une seule fois pour plusieurs deplacements reussis", async () => {
    const entries = [
      entry("One Piece", [
        volume({ fileName: "T01.cbz", localPath: "/old/One Piece/T01.cbz" }),
        volume({ fileName: "T02.cbz", localPath: "/old/One Piece/T02.cbz" }),
      ]),
    ];
    getCachedMangaLibrarySpy.mockReturnValue(entries);
    const moves = planMangaMoves(entries, "/new");
    invokeSpy.mockResolvedValue(moves.map((m) => ({ from: m.from, to: m.to, error: null })));

    const result = await applyMangaMoves(moves);

    expect(saveMangaLibrarySpy).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ moved: 2, failed: [] });
  });

  it("ne patche que les tomes sans erreur, garde l'ancien chemin pour les echecs", async () => {
    const entries = [
      entry("One Piece", [
        volume({ fileName: "T01.cbz", localPath: "/old/One Piece/T01.cbz" }),
        volume({ fileName: "T02.cbz", localPath: "/old/One Piece/T02.cbz" }),
      ]),
    ];
    getCachedMangaLibrarySpy.mockReturnValue(entries);
    const moves = planMangaMoves(entries, "/new");
    invokeSpy.mockResolvedValue([
      { from: moves[0].from, to: moves[0].to, error: null },
      { from: moves[1].from, to: moves[1].to, error: "echec" },
    ]);

    const result = await applyMangaMoves(moves);

    expect(result.moved).toBe(1);
    expect(result.failed).toEqual([moves[1]]);
    const saved = saveMangaLibrarySpy.mock.calls[0][0] as MangaEntry[];
    const volumes = saved[0].volumes;
    expect(volumes.find((v) => v.fileName === "T01.cbz")?.localPath).toBe(moves[0].to);
    expect(volumes.find((v) => v.fileName === "T02.cbz")?.localPath).toBe("/old/One Piece/T02.cbz");
  });

  it("ne patche pas un tome portant le meme nom de fichier mais un infoHash different", async () => {
    const entries = [
      entry("One Piece", [
        volume({ fileName: "T01.cbz", infoHash: "hash-a", localPath: "/old/a/T01.cbz" }),
        volume({ fileName: "T01.cbz", infoHash: "hash-b", localPath: "/old/b/T01.cbz" }),
      ]),
    ];
    getCachedMangaLibrarySpy.mockReturnValue(entries);
    const move = {
      mangaId: "One Piece",
      fileName: "T01.cbz",
      infoHash: "hash-a",
      from: "/old/a/T01.cbz",
      to: "/new/One Piece/T01.cbz",
    };
    invokeSpy.mockResolvedValue([{ from: move.from, to: move.to, error: null }]);

    await applyMangaMoves([move]);

    const saved = saveMangaLibrarySpy.mock.calls[0][0] as MangaEntry[];
    const volumes = saved[0].volumes;
    expect(volumes.find((v) => v.infoHash === "hash-a")?.localPath).toBe(move.to);
    expect(volumes.find((v) => v.infoHash === "hash-b")?.localPath).toBe("/old/b/T01.cbz");
  });
});
