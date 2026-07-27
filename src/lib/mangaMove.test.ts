import type { MangaEntry, MangaVolume } from "@/lib/mangaLibrary";
import { planMangaMoves } from "@/lib/mangaMove";
import { describe, expect, it } from "vitest";

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

  it("ignore les deplacements qui entrent en collision sur la meme destination", () => {
    const first = entry("One Piece", [volume({ localPath: "/old/a/T01.cbz" })]);
    const second = {
      ...entry("One Piece", [volume({ localPath: "/old/b/T01.cbz" })]),
      mangaId: "dupe",
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
});
