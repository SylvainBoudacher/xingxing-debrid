import { describe, it, expect } from "vitest";
import { flattenFiles, formatSize } from "./debrid";

describe("flattenFiles", () => {
  it("returns empty array for empty input", () => {
    expect(flattenFiles([])).toEqual([]);
  });

  it("extracts a single flat file", () => {
    const entries = [{ n: "movie.mkv", s: 1073741824, l: "https://cdn/movie.mkv" }];
    expect(flattenFiles(entries)).toEqual([
      { name: "movie.mkv", size: 1073741824, link: "https://cdn/movie.mkv" },
    ]);
  });

  it("recurses into folders (entries with e array)", () => {
    const entries = [
      {
        n: "ShowS01",
        e: [
          { n: "E01.mkv", s: 500000000, l: "https://cdn/E01.mkv" },
          { n: "E02.mkv", s: 600000000, l: "https://cdn/E02.mkv" },
        ],
      },
    ];
    expect(flattenFiles(entries)).toEqual([
      { name: "ShowS01/E01.mkv", size: 500000000, link: "https://cdn/E01.mkv" },
      { name: "ShowS01/E02.mkv", size: 600000000, link: "https://cdn/E02.mkv" },
    ]);
  });

  it("handles nested folders", () => {
    const entries = [
      {
        n: "root",
        e: [
          {
            n: "sub",
            e: [{ n: "file.mkv", s: 100, l: "https://cdn/file.mkv" }],
          },
        ],
      },
    ];
    expect(flattenFiles(entries)).toEqual([
      { name: "root/sub/file.mkv", size: 100, link: "https://cdn/file.mkv" },
    ]);
  });

  it("skips entries without l or e", () => {
    const entries = [{ n: "info.nfo", s: 500 }];
    expect(flattenFiles(entries)).toEqual([]);
  });

  it("defaults size to 0 when s is missing", () => {
    const entries = [{ n: "file.mkv", l: "https://cdn/file.mkv" }];
    expect(flattenFiles(entries)[0].size).toBe(0);
  });

  it("builds prefix correctly for flat files with provided prefix", () => {
    const entries = [{ n: "file.mkv", s: 100, l: "https://cdn/file.mkv" }];
    expect(flattenFiles(entries, "parent")[0].name).toBe("parent/file.mkv");
  });
});

describe("formatSize", () => {
  it("returns - for 0", () => {
    expect(formatSize(0)).toBe("-");
  });

  it("returns - for falsy values", () => {
    expect(formatSize(NaN)).toBe("-");
  });

  it("formats bytes as Mo below 1 GB", () => {
    expect(formatSize(1_048_576)).toBe("1 Mo");
  });

  it("formats bytes as Go at 1 GB", () => {
    expect(formatSize(1_073_741_824)).toBe("1.0 Go");
  });

  it("formats larger GB values with one decimal", () => {
    expect(formatSize(2_147_483_648)).toBe("2.0 Go");
  });

  it("rounds Mo to nearest integer", () => {
    expect(formatSize(500 * 1_048_576)).toBe("500 Mo");
  });
});
