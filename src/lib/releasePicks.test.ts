import { describe, it, expect } from "vitest";
import type { Occupant } from "@/lib/discoverReleases";
import { availability, languageLabel, quickPicks } from "@/lib/releasePicks";

function occ(partial: Partial<Occupant>): Occupant {
  return {
    infoHash: Math.random().toString(36),
    fileSize: 1,
    seeders: 1,
    torrentName: "x",
    languages: [],
    source: null,
    videoCodec: null,
    audioCodec: null,
    audioChannels: null,
    resolution: null,
    specialVersion: null,
    scope: null,
    ...partial,
  };
}

describe("quickPicks", () => {
  it("une carte par résolution, de la plus haute à la plus basse", () => {
    const picks = quickPicks(
      [
        occ({ resolution: "1080p" }),
        occ({ resolution: "2160p" }),
        occ({ resolution: "720p" }),
        occ({ resolution: null }),
      ],
      false,
    );
    expect(picks.map((p) => p.label)).toEqual(["4K", "1080p", "720p"]);
  });

  it("fusionne 4K et 2160p", () => {
    const picks = quickPicks([occ({ resolution: "4K" }), occ({ resolution: "2160p" })], false);
    expect(picks).toHaveLength(1);
  });

  it("préfère le français aux seeders, puis les seeders, puis la plus petite taille", () => {
    const vo = occ({ resolution: "1080p", languages: ["VOSTFR"], seeders: 500 });
    const fr = occ({ resolution: "1080p", languages: ["MULTI"], seeders: 20, fileSize: 9 });
    const frSmall = occ({ resolution: "1080p", languages: ["VFF"], seeders: 20, fileSize: 5 });
    expect(quickPicks([vo, fr, frSmall], false)[0].occ).toBe(frSmall);
    expect(quickPicks([vo], false)[0].occ).toBe(vo);
  });

  it("ignore les épisodes seuls pour les séries", () => {
    const ep = occ({ resolution: "1080p", scope: { kind: "episode", season: 1, episode: 2 } });
    const pack = occ({ resolution: "720p", scope: { kind: "season", season: 1 } });
    expect(quickPicks([ep, pack], true).map((p) => p.occ)).toEqual([pack]);
    expect(quickPicks([ep], false)).toHaveLength(1);
  });
});

describe("languageLabel", () => {
  it("traduit les tags de langue", () => {
    expect(languageLabel(["MULTI", "VFF"])).toBe("Français + VO");
    expect(languageLabel(["TRUEFRENCH"])).toBe("Français");
    expect(languageLabel(["VFQ"])).toBe("Français (Québec)");
    expect(languageLabel(["VOSTFR"])).toBe("VO sous-titrée");
    expect(languageLabel([])).toBeNull();
  });
});

describe("availability", () => {
  it("classe selon les seeders", () => {
    expect(availability(50)).toBe("fast");
    expect(availability(10)).toBe("ok");
    expect(availability(9)).toBe("slow");
  });
});
