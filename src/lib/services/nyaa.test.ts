import { describe, it, expect } from "vitest";
import { nyaaSearchUrl } from "./nyaa";

describe("nyaaSearchUrl", () => {
  it("points at nyaa.si", () => {
    expect(nyaaSearchUrl({ query: "test" })).toMatch(/^https:\/\/nyaa\.si/);
  });

  it("sets page=rss", () => {
    expect(nyaaSearchUrl({ query: "test" })).toContain("page=rss");
  });

  it("encodes the query", () => {
    const url = nyaaSearchUrl({ query: "Naruto 1080p" });
    expect(url).toContain(`q=${encodeURIComponent("Naruto 1080p")}`);
  });

  it("encodes special characters", () => {
    const url = nyaaSearchUrl({ query: "attack & titan" });
    expect(url).toContain(`q=${encodeURIComponent("attack & titan")}`);
  });

  it("handles empty query", () => {
    const url = nyaaSearchUrl({ query: "" });
    expect(url).toContain("q=");
    expect(url).toContain("page=rss");
  });

  it("produces a deterministic URL for the same params", () => {
    const p = { query: "One Piece 1080p vostfr" };
    expect(nyaaSearchUrl(p)).toBe(nyaaSearchUrl(p));
  });
});
