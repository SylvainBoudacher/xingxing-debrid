import { describe, expect, test } from "vitest";
import {
  expectationLabel,
  expectationSummary,
  formatLastCheck,
  libraryLabel,
  mediaSubtitle,
  rowSummary,
} from "./labels";
import { alert, movieEntry, tvEntry } from "./testFixtures";

const none = new Set<string>();

describe("expectationSummary", () => {
  test("version précise, mode souple", () => {
    expect(expectationSummary({ language: "vf", resolution: "1080p", mode: "soft" })).toBe(
      "Alerte dès qu'une version VF en 1080p ou mieux sort sur C411. Les autres versions sont signalées comme alternatives.",
    );
  });
  test("2160p, mode strict", () => {
    expect(expectationSummary({ language: "any", resolution: "2160p", mode: "strict" })).toBe(
      "Alerte dès qu'une version en 2160p sort sur C411. Les autres versions sont ignorées.",
    );
  });
  test("sans exigence, le mode ne change rien", () => {
    expect(expectationSummary({ language: "any", resolution: "any", mode: "strict" })).toBe(
      "Alerte dès qu'une version sort sur C411.",
    );
  });
});

test("mediaSubtitle", () => {
  expect(mediaSubtitle({ mediaType: "movie", year: "2026" })).toBe("Film, 2026");
  expect(mediaSubtitle({ mediaType: "tv", year: "" })).toBe("Série");
});

describe("formatLastCheck", () => {
  const now = new Date(2026, 10, 10, 20, 0);
  test("aujourd'hui", () => {
    expect(formatLastCheck(new Date(2026, 10, 10, 18, 42).getTime(), now)).toBe(
      "aujourd'hui à 18:42",
    );
  });
  test("un autre jour", () => {
    expect(formatLastCheck(new Date(2026, 10, 3, 9, 5).getTime(), now)).toBe("le 3 nov. à 09:05");
  });
  test("jamais", () => {
    expect(formatLastCheck(null, now)).toBe("aucune pour l'instant");
  });
});

describe("rowSummary", () => {
  test("sortie d'épisodes", () => {
    expect(rowSummary(tvEntry({ alerts: [alert("full", "e6")] }), "released")).toBe(
      "Épisode 6 disponible",
    );
    expect(
      rowSummary(tvEntry({ alerts: [alert("full", "e1"), alert("full", "e2")] }), "released"),
    ).toBe("Épisodes 1 à 2 disponibles");
  });
  test("film disponible", () => {
    expect(rowSummary(movieEntry({ alerts: [alert("full", "movie")] }), "released")).toBe(
      "Film disponible",
    );
  });
  test("mi-alerte", () => {
    const partial = {
      ...alert("partial"),
      version: { language: "vostfr", resolution: "720p" } as const,
    };
    expect(rowSummary(tvEntry({ alerts: [partial] }), "partial")).toBe(
      "Alternative disponible : VOSTFR 720p",
    );
  });
  test("saison terminée", () => {
    const vf = [{ language: "vf", resolution: "1080p" } as const];
    expect(rowSummary(tvEntry({ episodes: [1], known: { e1: [...vf] } }), "finished")).toBe(
      "Saison terminée",
    );
  });
  test("attente", () => {
    expect(rowSummary(tvEntry({ episodes: [4, 5] }), "waiting")).toBe("Prochain : épisode 4");
    expect(rowSummary(tvEntry({ episodes: [] }), "waiting")).toBe("Ciblé");
    expect(rowSummary(movieEntry(), "waiting")).toBe("Ciblé");
  });
  test("une saison en cours se résume selon sa liste", () => {
    const vf = [{ language: "vf", resolution: "1080p" } as const];
    const entry = tvEntry({
      episodes: [9, 10, 11],
      known: { e9: [...vf] },
      alerts: [alert("full", "e9")],
    });
    expect(rowSummary(entry, "released")).toBe("Épisode 9 disponible");
    expect(rowSummary(entry, "waiting")).toBe("Prochain : épisode 10");
  });
});

test("expectationLabel", () => {
  expect(expectationLabel({ language: "vf", resolution: "1080p", mode: "soft" })).toBe(
    "VF 1080p, souple",
  );
  expect(expectationLabel({ language: "any", resolution: "any", mode: "strict" })).toBe(
    "Toutes versions, strict",
  );
  expect(expectationLabel({ language: "vostfr", resolution: "any", mode: "strict" })).toBe(
    "VOSTFR, strict",
  );
});

describe("libraryLabel", () => {
  test("film", () => {
    expect(libraryLabel(movieEntry(), { certain: new Set(["movie"]), uncertain: none })).toBe(
      "En bibliothèque",
    );
  });
  test("épisodes certains", () => {
    expect(libraryLabel(tvEntry(), { certain: new Set(["e1", "e2"]), uncertain: none })).toBe(
      "Épisodes 1 à 2 en bibliothèque",
    );
  });
  test("incertain seul", () => {
    expect(libraryLabel(tvEntry(), { certain: none, uncertain: new Set(["e1"]) })).toBe(
      "Peut-être en bibliothèque",
    );
  });
  test("rien", () => {
    expect(libraryLabel(tvEntry(), { certain: none, uncertain: none })).toBeNull();
  });
});
