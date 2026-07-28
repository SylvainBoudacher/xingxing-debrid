import { describe, expect, it } from "vitest";
import { cbzReleaseFromResult } from "@/lib/mangaSearchResult";
import type { SearchResult } from "@/lib/search";

function result(over: Partial<SearchResult> = {}): SearchResult {
  return {
    title: "One.Piece.[T01.T105].1997.2025.FR.[CBZ]-CHROMATIQUE",
    size: 100,
    seeders: 5,
    leechers: 1,
    guid: "hash",
    category: 7030,
    ...over,
  };
}

describe("cbzReleaseFromResult", () => {
  it("reconnait une release CBZ C411", () => {
    const release = cbzReleaseFromResult(result());
    expect(release).toMatchObject({
      infoHash: "hash",
      format: "CBZ",
      span: { kind: "range", from: 1, to: 105 },
    });
  });

  it("ecarte les autres formats", () => {
    expect(cbzReleaseFromResult(result({ title: "Berserk.T01.FR.[CBR]-NOTAG" }))).toBeNull();
    expect(cbzReleaseFromResult(result({ title: "Le.Grand.Bleu.1988.1080p" }))).toBeNull();
  });

  it("ecarte les resultats Nyaa", () => {
    expect(cbzReleaseFromResult(result({ magnet: "magnet:?xt=x" }))).toBeNull();
  });
});
