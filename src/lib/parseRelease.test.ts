import { describe, it, expect } from "vitest";
import { parseRelease } from "./parseRelease";

describe("parseRelease", () => {
  describe("title extraction", () => {
    it("cuts before year when year appears in release name", () => {
      // CUT_RE matches years (19xx/20xx) so the title stops before the year
      const r = parseRelease("Inception.2010.1080p.BluRay.x264.mkv");
      expect(r.title).toBe("Inception");
    });

    it("cuts before year with dots as separators", () => {
      const r = parseRelease("The.Dark.Knight.2008.720p.BluRay.x264.mkv");
      expect(r.title).toBe("The Dark Knight");
    });

    it("cuts before year with underscores", () => {
      const r = parseRelease("Dune_Part_Two_2024_2160p_WEB-DL.mkv");
      expect(r.title).toBe("Dune Part Two");
    });

    it("returns full cleaned name when no cut marker found", () => {
      const r = parseRelease("My Movie Title.mkv");
      expect(r.title).toBe("My Movie Title");
    });
  });

  describe("episode detection", () => {
    it("formats SxxExx episode marker", () => {
      const r = parseRelease("Breaking.Bad.S05E14.1080p.mkv");
      expect(r.title).toBe("Breaking Bad - S5 E14");
    });

    it("handles single-digit season", () => {
      const r = parseRelease("House.Of.The.Dragon.S1E08.HDTV.mkv");
      expect(r.title).toBe("House Of The Dragon - S1 E08");
    });

    it("handles dot-separated SxxExx", () => {
      const r = parseRelease("Severance.S02.E07.720p.mkv");
      expect(r.title).toBe("Severance - S2 E07");
    });
  });

  describe("quality detection", () => {
    it("detects 1080p", () => {
      expect(parseRelease("Movie.1080p.mkv").quality).toBe("1080p");
    });

    it("detects 720p", () => {
      expect(parseRelease("Movie.720p.mkv").quality).toBe("720p");
    });

    it("detects 2160p", () => {
      expect(parseRelease("Movie.2160p.mkv").quality).toBe("2160p");
    });

    it("normalizes 4k to 4K", () => {
      expect(parseRelease("Movie.4k.mkv").quality).toBe("4K");
    });

    it("normalizes UHD to 4K", () => {
      expect(parseRelease("Movie.UHD.mkv").quality).toBe("4K");
    });

    it("returns null when no quality marker", () => {
      expect(parseRelease("Movie.BluRay.mkv").quality).toBeNull();
    });
  });

  describe("codec detection", () => {
    it("detects x264", () => {
      expect(parseRelease("Movie.1080p.x264.mkv").codec).toBe("X264");
    });

    it("detects x265", () => {
      expect(parseRelease("Movie.1080p.x265.mkv").codec).toBe("X265");
    });

    it("detects HEVC", () => {
      expect(parseRelease("Movie.1080p.HEVC.mkv").codec).toBe("HEVC");
    });

    it("detects H264", () => {
      expect(parseRelease("Movie.720p.H264.mkv").codec).toBe("H264");
    });

    it("detects AV1", () => {
      expect(parseRelease("Movie.4k.AV1.mkv").codec).toBe("AV1");
    });

    it("returns null when no codec marker", () => {
      expect(parseRelease("Movie.1080p.BluRay.mkv").codec).toBeNull();
    });
  });

  describe("extension stripping", () => {
    it("strips .mkv", () => {
      const r = parseRelease("Movie.mkv");
      expect(r.title).not.toContain(".mkv");
    });

    it("strips .mp4", () => {
      const r = parseRelease("Movie.mp4");
      expect(r.title).not.toContain(".mp4");
    });

    it("strips .avi", () => {
      const r = parseRelease("Movie.avi");
      expect(r.title).not.toContain(".avi");
    });
  });

  describe("team extraction", () => {
    it("extracts the leading bracket team", () => {
      const r = parseRelease(
        "[Xspitfire911] Shingeki No Kyojin Intégrale + OAV BDRIP 1080p X265 10bit VOSTFR",
      );
      expect(r.team).toBe("Xspitfire911");
    });

    it("skips brackets that are only quality/codec/lang markers", () => {
      expect(parseRelease("[1080p] Some Anime [SubsPlease]").team).toBe("SubsPlease");
    });

    it("returns null when there is no bracket", () => {
      expect(parseRelease("Inception.2010.1080p.x264.mkv").team).toBeNull();
    });

    it("strips the team bracket from the title", () => {
      const r = parseRelease(
        "[Xspitfire911] Shingeki No Kyojin Intégrale + OAV BDRIP 1080p X265 10bit VOSTFR",
      );
      expect(r.title).toBe("Shingeki No Kyojin Intégrale + OAV");
    });
  });

  describe("language detection", () => {
    it("detects VOSTFR", () => {
      expect(parseRelease("[Team] Anime 1080p VOSTFR.mkv").language).toBe("VOSTFR");
    });

    it("detects MULTI", () => {
      expect(parseRelease("Movie.2020.MULTI.1080p.mkv").language).toBe("MULTI");
    });

    it("detects VOST without FR suffix", () => {
      expect(parseRelease("[Team] Anime 720p VOST.mkv").language).toBe("VOST");
    });

    it("returns null when no language tag", () => {
      expect(parseRelease("Movie.1080p.x264.mkv").language).toBeNull();
    });
  });

  describe("full nyaa example", () => {
    it("parses team, quality, codec and language together", () => {
      const r = parseRelease(
        "[Xspitfire911] Shingeki No Kyojin Intégrale + OAV BDRIP 1080p X265 10bit VOSTFR",
      );
      expect(r).toEqual({
        title: "Shingeki No Kyojin Intégrale + OAV",
        quality: "1080p",
        codec: "X265",
        team: "Xspitfire911",
        language: "VOSTFR",
      });
    });
  });

  describe("french release tags", () => {
    it("cuts at VOSTFR (year also triggers cut first)", () => {
      const r = parseRelease("Interstellar.2014.VOSTFR.1080p.mkv");
      expect(r.title).toBe("Interstellar");
    });

    it("cuts at TRUEFRENCH (year also triggers cut first)", () => {
      const r = parseRelease("Oppenheimer.2023.TRUEFRENCH.720p.mkv");
      expect(r.title).toBe("Oppenheimer");
    });

    it("cuts at FRENCH without year", () => {
      const r = parseRelease("Tenet.FRENCH.1080p.BluRay.mkv");
      expect(r.title).toBe("Tenet");
    });
  });
});
