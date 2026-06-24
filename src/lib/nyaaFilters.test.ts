import { describe, it, expect } from "vitest";
import { buildNyaaQuery, QUALITIES, CODECS, LANGUAGES } from "./nyaaFilters";

describe("buildNyaaQuery", () => {
  it("returns empty string when all fields are empty", () => {
    expect(buildNyaaQuery("", "", "", "", "")).toBe("");
  });

  it("returns term only when filters are empty", () => {
    expect(buildNyaaQuery("Naruto", "", "", "", "")).toBe("Naruto");
  });

  it("joins all non-empty fields with spaces", () => {
    expect(buildNyaaQuery("Naruto", "SubsPlease", "1080p", "x265", "vostfr")).toBe(
      "Naruto SubsPlease 1080p x265 vostfr",
    );
  });

  it("skips empty middle fields", () => {
    expect(buildNyaaQuery("Naruto", "", "1080p", "", "vostfr")).toBe("Naruto 1080p vostfr");
  });

  it("trims whitespace from each field", () => {
    expect(buildNyaaQuery("  Naruto  ", "  SubsPlease  ", "", "", "")).toBe("Naruto SubsPlease");
  });

  it("returns filter alone when term is empty", () => {
    expect(buildNyaaQuery("", "SubsPlease", "", "", "")).toBe("SubsPlease");
  });

  it("handles term with internal spaces", () => {
    expect(buildNyaaQuery("Attack on Titan", "", "1080p", "", "")).toBe("Attack on Titan 1080p");
  });

  it("returns a single field with no extra spaces", () => {
    expect(buildNyaaQuery("", "", "2160p", "", "")).toBe("2160p");
  });
});

describe("filter constants", () => {
  it("QUALITIES contains standard resolutions", () => {
    expect(QUALITIES).toContain("2160p");
    expect(QUALITIES).toContain("1080p");
    expect(QUALITIES).toContain("720p");
    expect(QUALITIES).toContain("480p");
  });

  it("CODECS contains common codecs", () => {
    expect(CODECS).toContain("x265");
    expect(CODECS).toContain("x264");
    expect(CODECS).toContain("hevc");
    expect(CODECS).toContain("av1");
  });

  it("LANGUAGES contains french variants", () => {
    expect(LANGUAGES).toContain("vostfr");
    expect(LANGUAGES).toContain("french");
    expect(LANGUAGES).toContain("vf");
    expect(LANGUAGES).toContain("multi");
  });
});
