import { describe, it, expect } from "vitest";
import { mapCategory, mapTorrents, pageNumbers } from "./search";

describe("mapCategory", () => {
  describe("catId 1 (video)", () => {
    it("maps animation to 2060", () => {
      expect(mapCategory(1, "animation")).toBe(2060);
    });

    it("maps animation-serie to 5070", () => {
      expect(mapCategory(1, "animation-serie")).toBe(5070);
    });

    it("maps serie-tv to 5000", () => {
      expect(mapCategory(1, "serie-tv")).toBe(5000);
    });

    it("maps serie-documentaire to 5000", () => {
      expect(mapCategory(1, "serie-documentaire")).toBe(5000);
    });

    it("maps emission-tv to 5000", () => {
      expect(mapCategory(1, "emission-tv")).toBe(5000);
    });

    it("maps other video slugs to 2000 (film)", () => {
      expect(mapCategory(1, "film-vf")).toBe(2000);
      expect(mapCategory(1, "documentaire")).toBe(2000);
      expect(mapCategory(1, "")).toBe(2000);
    });
  });

  describe("catId 2 (livres/audio)", () => {
    it("maps ebook-audio to 3030", () => {
      expect(mapCategory(2, "ebook-audio")).toBe(3030);
    });

    it("maps bds to 7030", () => {
      expect(mapCategory(2, "bds")).toBe(7030);
    });

    it("maps comics to 7030", () => {
      expect(mapCategory(2, "comics")).toBe(7030);
    });

    it("maps manga to 7030", () => {
      expect(mapCategory(2, "manga")).toBe(7030);
    });

    it("maps other book slugs to 7000", () => {
      expect(mapCategory(2, "ebook")).toBe(7000);
      expect(mapCategory(2, "")).toBe(7000);
    });
  });

  it("maps catId 3 to 3000 (musique)", () => {
    expect(mapCategory(3, "")).toBe(3000);
  });

  it("maps catId 4 to 4000 (logiciels)", () => {
    expect(mapCategory(4, "")).toBe(4000);
  });

  it("maps catId 5 to 4050 (jeux)", () => {
    expect(mapCategory(5, "")).toBe(4050);
  });

  it("maps unknown catId to 0", () => {
    expect(mapCategory(0, "")).toBe(0);
    expect(mapCategory(99, "anything")).toBe(0);
  });
});

describe("mapTorrents", () => {
  it("returns empty array for empty input", () => {
    expect(mapTorrents([])).toEqual([]);
  });

  it("maps a film torrent correctly", () => {
    const result = mapTorrents([
      {
        infoHash: "abc123",
        name: "Inception.2010.1080p.mkv",
        size: 2_000_000_000,
        seeders: 42,
        leechers: 5,
        category: { id: 1 },
        subcategory: { slug: "film-vf" },
      },
    ]);
    expect(result[0]).toEqual({
      title: "Inception.2010.1080p.mkv",
      size: 2_000_000_000,
      seeders: 42,
      leechers: 5,
      guid: "abc123",
      category: 2000,
    });
  });

  it("defaults leechers to 0 when undefined", () => {
    const result = mapTorrents([
      {
        infoHash: "x",
        name: "Movie",
        size: 1,
        seeders: 1,
        leechers: undefined,
        category: { id: 1 },
        subcategory: { slug: "film-vf" },
      },
    ]);
    expect(result[0].leechers).toBe(0);
  });

  it("handles null category and subcategory", () => {
    const result = mapTorrents([
      {
        infoHash: "x",
        name: "Unknown",
        size: 0,
        seeders: 0,
        category: null,
        subcategory: null,
      },
    ]);
    expect(result[0].category).toBe(0);
  });

  it("maps a serie torrent category", () => {
    const result = mapTorrents([
      {
        infoHash: "y",
        name: "Show S01E01",
        size: 500,
        seeders: 10,
        category: { id: 1 },
        subcategory: { slug: "serie-tv" },
      },
    ]);
    expect(result[0].category).toBe(5000);
  });
});

describe("pageNumbers", () => {
  it("returns all pages when totalPages <= 7", () => {
    expect(pageNumbers(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(pageNumbers(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("shows ellipsis on right side near start", () => {
    const pages = pageNumbers(1, 20);
    expect(pages[0]).toBe(1);
    expect(pages).toContain("...");
    expect(pages[pages.length - 1]).toBe(20);
  });

  it("shows ellipsis on left side near end", () => {
    const pages = pageNumbers(20, 20);
    expect(pages[0]).toBe(1);
    expect(pages).toContain("...");
    expect(pages[pages.length - 1]).toBe(20);
  });

  it("shows ellipsis on both sides in the middle", () => {
    const pages = pageNumbers(10, 20);
    expect(pages[0]).toBe(1);
    expect(pages[pages.length - 1]).toBe(20);
    const ellipsis = pages.filter((p) => p === "...");
    expect(ellipsis).toHaveLength(2);
  });

  it("includes current page and neighbors in middle", () => {
    const pages = pageNumbers(10, 20);
    expect(pages).toContain(9);
    expect(pages).toContain(10);
    expect(pages).toContain(11);
  });

  it("always includes first and last page", () => {
    for (const current of [1, 5, 10, 15, 20]) {
      const pages = pageNumbers(current, 20);
      expect(pages[0]).toBe(1);
      expect(pages[pages.length - 1]).toBe(20);
    }
  });

  it("no ellipsis when current is page 3 (left boundary)", () => {
    const pages = pageNumbers(3, 20);
    expect(pages[1]).not.toBe("...");
  });

  it("handles single page", () => {
    expect(pageNumbers(1, 1)).toEqual([1]);
  });
});
