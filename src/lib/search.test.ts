import { describe, it, expect } from "vitest";
import { mapCategory, mapNyaaResults, mapTorrents, pageNumbers } from "./search";
import type { NyaaResult } from "./services/nyaa";

function nyaaResult(overrides: Partial<NyaaResult> = {}): NyaaResult {
  return {
    title: "My Anime S01E01 [SubsPlease] 1080p",
    infoHash: "abc123def456",
    magnet: "magnet:?xt=urn:btih:abc123def456",
    size: "1.4 GiB",
    seeders: 100,
    leechers: 5,
    downloads: 1000,
    category: "1_2",
    viewUrl: "https://nyaa.si/view/1234567",
    pubDate: "Mon, 01 Jan 2024 00:00:00 +0000",
    ...overrides,
  };
}

describe("mapNyaaResults", () => {
  it("returns empty array for empty input", () => {
    expect(mapNyaaResults([])).toEqual([]);
  });

  it("maps title, seeders, leechers, infoHash", () => {
    const r = mapNyaaResults([
      nyaaResult({ title: "Bleach S01E01", infoHash: "ff00aa", seeders: 42, leechers: 3 }),
    ]);
    expect(r[0]).toMatchObject({
      title: "Bleach S01E01",
      guid: "ff00aa",
      seeders: 42,
      leechers: 3,
    });
  });

  it("passes through the magnet link", () => {
    const magnet = "magnet:?xt=urn:btih:deadbeef";
    const r = mapNyaaResults([nyaaResult({ magnet })]);
    expect(r[0].magnet).toBe(magnet);
  });

  it("maps Anime category to 2060", () => {
    const r = mapNyaaResults([nyaaResult({ category: "1_2" })]);
    expect(r[0].category).toBe(2060);
  });

  it("maps Live Action category to 2000", () => {
    const r = mapNyaaResults([nyaaResult({ category: "4_4" })]);
    expect(r[0].category).toBe(2000);
  });

  it("maps unknown category to 0", () => {
    const r = mapNyaaResults([nyaaResult({ category: "6_1" })]);
    expect(r[0].category).toBe(0);
  });

  it("converts GiB to bytes", () => {
    const r = mapNyaaResults([nyaaResult({ size: "1.4 GiB" })]);
    expect(r[0].size).toBe(Math.round(1.4 * 1024 ** 3));
  });

  it("converts MiB to bytes", () => {
    const r = mapNyaaResults([nyaaResult({ size: "512.0 MiB" })]);
    expect(r[0].size).toBe(512 * 1024 ** 2);
  });

  it("converts KiB to bytes", () => {
    const r = mapNyaaResults([nyaaResult({ size: "100 KiB" })]);
    expect(r[0].size).toBe(100 * 1024);
  });

  it("converts GB (decimal) to bytes", () => {
    const r = mapNyaaResults([nyaaResult({ size: "2.5 GB" })]);
    expect(r[0].size).toBe(Math.round(2.5 * 1000 ** 3));
  });

  it("returns 0 for unparseable size", () => {
    const r = mapNyaaResults([nyaaResult({ size: "???" })]);
    expect(r[0].size).toBe(0);
  });

  it("returns 0 for empty size string", () => {
    const r = mapNyaaResults([nyaaResult({ size: "" })]);
    expect(r[0].size).toBe(0);
  });

  it("maps multiple results preserving order", () => {
    const r = mapNyaaResults([
      nyaaResult({ title: "A", seeders: 10 }),
      nyaaResult({ title: "B", seeders: 20 }),
    ]);
    expect(r).toHaveLength(2);
    expect(r[0].title).toBe("A");
    expect(r[1].title).toBe("B");
  });
});

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
