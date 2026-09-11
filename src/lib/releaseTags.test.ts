import { describe, expect, it } from "vitest";
import { hasReleaseTags, parseReleaseTags } from "@/lib/releaseTags";

describe("parseReleaseTags", () => {
  it("extrait les tags d'une release film", () => {
    const t = parseReleaseTags("Aventures.Croisees.2026.MULTI.VFF.1080p.WEBRip.EAC3.5.1.x265-TyHD");
    expect(t.resolution).toBe("1080p");
    expect(t.videoCodec).toBe("X265");
    expect(t.languages).toEqual(["MULTI", "VFF"]);
    expect(t.source).toBe("WEBRip");
    expect(t.audioCodec).toBe("EAC3");
    // "EAC3.5.1" : les points deviennent des espaces, les canaux ne matchent
    // que sur la forme "5.1" isolée (comportement historique de la Découverte).
    expect(t.audioChannels).toBeNull();
    expect(t.scope).toBeNull();
  });

  it("détecte la portée et la version spéciale", () => {
    const t = parseReleaseTags("Serie.S02E05.EXTENDED.MULTI.2160p.BluRay.x264");
    expect(t.scope).toEqual({ kind: "episode", season: 2, episode: 5 });
    expect(t.specialVersion).toBe("EXTENDED");
    expect(t.resolution).toBe("2160p");
  });

  it("ne renvoie aucun tag pour un nom nettoyé", () => {
    expect(hasReleaseTags(parseReleaseTags("Swapped"))).toBe(false);
  });
});
