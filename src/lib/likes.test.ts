import { describe, it, expect } from "vitest";
import { parseLikesJson } from "./likes";

const validItem = {
  id: 1,
  mediaType: "movie" as const,
  title: "Inception",
  originalTitle: "Inception",
  posterPath: "/poster.jpg",
  year: "2010",
  voteAverage: 8.8,
  overview: "A thief...",
  likedAt: 1700000000000,
};

describe("parseLikesJson", () => {
  it("parses a valid array", () => {
    const result = parseLikesJson(JSON.stringify([validItem]));
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
    expect(result[0].title).toBe("Inception");
  });

  it("throws on non-array JSON", () => {
    expect(() => parseLikesJson(JSON.stringify({ id: 1 }))).toThrow("Format invalide");
  });

  it("throws on invalid JSON", () => {
    expect(() => parseLikesJson("not json")).toThrow();
  });

  it("filters items missing required fields", () => {
    const items = [validItem, { id: "bad", mediaType: "movie", title: "X" }];
    const result = parseLikesJson(JSON.stringify(items));
    expect(result).toHaveLength(1);
  });

  it("filters items with invalid mediaType", () => {
    const items = [{ ...validItem, mediaType: "podcast" }];
    const result = parseLikesJson(JSON.stringify(items));
    expect(result).toHaveLength(0);
  });

  it("accepts tv mediaType", () => {
    const tvItem = { ...validItem, id: 2, mediaType: "tv" };
    const result = parseLikesJson(JSON.stringify([tvItem]));
    expect(result[0].mediaType).toBe("tv");
  });

  it("defaults originalTitle to empty string when missing", () => {
    const item = { ...validItem, originalTitle: undefined };
    const result = parseLikesJson(JSON.stringify([item]));
    expect(result[0].originalTitle).toBe("");
  });

  it("defaults posterPath to null when not a string", () => {
    const item = { ...validItem, posterPath: 42 };
    const result = parseLikesJson(JSON.stringify([item]));
    expect(result[0].posterPath).toBeNull();
  });

  it("defaults voteAverage to 0 when missing", () => {
    const item = { ...validItem, voteAverage: undefined };
    const result = parseLikesJson(JSON.stringify([item]));
    expect(result[0].voteAverage).toBe(0);
  });

  it("preserves all valid fields", () => {
    const result = parseLikesJson(JSON.stringify([validItem]));
    const item = result[0];
    expect(item.posterPath).toBe("/poster.jpg");
    expect(item.year).toBe("2010");
    expect(item.overview).toBe("A thief...");
    expect(item.likedAt).toBe(1700000000000);
  });

  it("handles empty array", () => {
    expect(parseLikesJson("[]")).toEqual([]);
  });
});
