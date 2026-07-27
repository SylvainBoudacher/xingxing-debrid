import type { MangaItem } from "@/lib/mangaItem";
import type { MangaEntry, MangaVolume } from "@/lib/mangaLibrary";
import { retagEntry } from "@/lib/mangaRetag";
import { describe, expect, it } from "vitest";

function volume(number: number, extra: Partial<MangaVolume> = {}): MangaVolume {
  return {
    number,
    infoHash: "abc",
    fileName: `T${number}.cbz`,
    fileSize: 100,
    link: "l",
    ...extra,
  };
}

function entry(mangaId: string, volumes: MangaVolume[], title = mangaId): MangaEntry {
  return {
    mangaId,
    meta: {
      title,
      coverFileName: null,
      year: "2020",
      status: "ongoing",
      lastVolume: null,
      description: "",
      tags: [],
    },
    volumes,
    addedAt: 1,
  };
}

const item: MangaItem = {
  id: "new-id",
  title: "Vrai Titre",
  titleFr: null,
  titleEn: null,
  titleRomaji: null,
  coverFileName: "cover.jpg",
  year: "2024",
  status: "completed",
  lastVolume: 12,
  description: "resume",
  tags: ["action"],
};

describe("retagEntry", () => {
  it("change l'identite et la fiche en gardant les tomes", () => {
    const next = retagEntry([entry("old-id", [volume(1), volume(2)])], "old-id", item);
    expect(next).toHaveLength(1);
    expect(next[0].mangaId).toBe("new-id");
    expect(next[0].meta.title).toBe("Vrai Titre");
    expect(next[0].volumes.map((v) => v.number)).toEqual([1, 2]);
  });

  it("conserve la progression de lecture", () => {
    const read = volume(1, { read: true, lastPage: 12, localPath: "/a/T1.cbz" });
    const next = retagEntry([entry("old-id", [read])], "old-id", item);
    expect(next[0].volumes[0]).toMatchObject({ read: true, lastPage: 12, localPath: "/a/T1.cbz" });
  });

  it("fusionne dans l'oeuvre cible quand elle est deja en bibliotheque", () => {
    const entries = [entry("old-id", [volume(1)]), entry("new-id", [volume(2)])];
    const next = retagEntry(entries, "old-id", item);
    expect(next).toHaveLength(1);
    expect(next[0].mangaId).toBe("new-id");
    expect(next[0].volumes.map((v) => v.number)).toEqual([1, 2]);
  });

  it("met seulement la fiche a jour quand l'oeuvre ne change pas", () => {
    const same = { ...item, id: "old-id" };
    const next = retagEntry([entry("old-id", [volume(1)])], "old-id", same);
    expect(next).toHaveLength(1);
    expect(next[0].meta.year).toBe("2024");
    expect(next[0].volumes).toHaveLength(1);
  });

  it("laisse la bibliotheque intacte si l'oeuvre est introuvable", () => {
    const entries = [entry("old-id", [volume(1)])];
    expect(retagEntry(entries, "absent", item)).toBe(entries);
  });
});
