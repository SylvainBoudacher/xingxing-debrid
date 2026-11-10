import { describe, expect, test } from "vitest";
import type { ExpectedLanguage, ExpectedResolution, RadarExpectation } from "./types";
import {
  languageGroupOf,
  matchesExpectation,
  sameVersion,
  toKnownVersion,
  versionLabel,
} from "./versions";

const exp = (language: ExpectedLanguage, resolution: ExpectedResolution): RadarExpectation => ({
  language,
  resolution,
  mode: "strict",
});

describe("languageGroupOf", () => {
  test("MULTI et TRUEFRENCH comptent comme VF, VF prime sur VOSTFR", () => {
    expect(languageGroupOf(["MULTI"])).toBe("vf");
    expect(languageGroupOf(["TRUEFRENCH"])).toBe("vf");
    expect(languageGroupOf(["VOSTFR", "VFF"])).toBe("vf");
    expect(languageGroupOf(["VOSTFR"])).toBe("vostfr");
    expect(languageGroupOf(["VO"])).toBe("vo");
    expect(languageGroupOf([])).toBe("unknown");
  });
});

describe("matchesExpectation", () => {
  test("la résolution attendue est un minimum", () => {
    const e = exp("vf", "1080p");
    expect(matchesExpectation({ language: "vf", resolution: "2160p" }, e)).toBe(true);
    expect(matchesExpectation({ language: "vf", resolution: "4K" }, e)).toBe(true);
    expect(matchesExpectation({ language: "vf", resolution: "720p" }, e)).toBe(false);
  });

  test("une version illisible ne correspond jamais à un critère réglé", () => {
    expect(
      matchesExpectation({ language: "unknown", resolution: "1080p" }, exp("vf", "1080p")),
    ).toBe(false);
    expect(matchesExpectation({ language: "vf", resolution: null }, exp("vf", "1080p"))).toBe(
      false,
    );
  });

  test("Peu importe accepte tout, même illisible", () => {
    expect(matchesExpectation({ language: "unknown", resolution: null }, exp("any", "any"))).toBe(
      true,
    );
  });

  test("la langue doit correspondre", () => {
    expect(matchesExpectation({ language: "vostfr", resolution: "1080p" }, exp("vf", "any"))).toBe(
      false,
    );
  });
});

test("toKnownVersion lit la langue et la résolution", () => {
  expect(toKnownVersion({ languages: ["VOSTFR"], resolution: "720p", scope: null })).toEqual({
    language: "vostfr",
    resolution: "720p",
  });
});

test("sameVersion compare langue et résolution", () => {
  const a = { language: "vf", resolution: "1080p" } as const;
  expect(sameVersion(a, { language: "vf", resolution: "1080p" })).toBe(true);
  expect(sameVersion(a, { language: "vf", resolution: "720p" })).toBe(false);
});

test("libellés", () => {
  expect(versionLabel({ language: "vostfr", resolution: "720p" })).toBe("VOSTFR 720p");
  expect(versionLabel({ language: "vf", resolution: null })).toBe("VF");
  expect(versionLabel({ language: "unknown", resolution: null })).toBe("version non identifiée");
});
