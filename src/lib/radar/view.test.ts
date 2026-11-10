import { describe, expect, test } from "vitest";
import { alert, movieEntry, tmdbItem, tvEntry } from "./testFixtures";
import type { RadarEntry } from "./types";
import {
  baselineLabel,
  entryStatus,
  filterEntries,
  formatEpisodes,
  splitBlocks,
  summarizeAlerts,
  type RadarFilters,
} from "./view";

const ALL: RadarFilters = { query: "", type: "all", state: "all", mode: "all" };
const vf = [{ language: "vf", resolution: "1080p" } as const];
const titled = (title: string, patch: Partial<RadarEntry> = {}) =>
  tvEntry({ id: title, item: tmdbItem(1, "tv", title), ...patch });

describe("entryStatus", () => {
  test("une alerte complète prime sur une mi-alerte", () => {
    expect(entryStatus(tvEntry({ alerts: [alert("partial"), alert("full")] }))).toBe("released");
    expect(entryStatus(tvEntry({ alerts: [alert("partial")] }))).toBe("partial");
    expect(entryStatus(tvEntry())).toBe("waiting");
  });
  test("saison complète terminée, film complet sorti", () => {
    expect(entryStatus(tvEntry({ episodes: [1], known: { e1: [...vf] } }))).toBe("finished");
    expect(entryStatus(movieEntry({ known: { movie: [...vf] } }))).toBe("released");
  });
});

describe("splitBlocks", () => {
  test("sorti, mi-alerte puis terminé, triés par titre, le reste en attente", () => {
    const finished = titled("Alpha", { episodes: [1], known: { e1: [...vf] } });
    const partial = titled("Beta", { alerts: [alert("partial")] });
    const released2 = titled("Zeta", { alerts: [alert("full")] });
    const released1 = titled("Écluse", { alerts: [alert("full")] });
    const waiting = titled("Omega");
    const blocks = splitBlocks([finished, partial, released2, released1, waiting]);
    expect(blocks.released.map((e) => e.id)).toEqual(["Écluse", "Zeta", "Beta", "Alpha"]);
    expect(blocks.waiting.map((e) => e.id)).toEqual(["Omega"]);
  });
});

describe("filterEntries", () => {
  const list = [titled("Les Veilleurs"), movieEntry()];
  test("la recherche ignore accents et apostrophes", () => {
    expect(filterEntries(list, { ...ALL, query: "ecluse" }, () => false)).toEqual([list[1]]);
  });
  test("type", () => {
    expect(filterEntries(list, { ...ALL, type: "tv" }, () => false)).toEqual([list[0]]);
  });
  test("état en bibliothèque", () => {
    const inLib = (e: RadarEntry) => e.item.mediaType === "movie";
    expect(filterEntries(list, { ...ALL, state: "in-library" }, inLib)).toEqual([list[1]]);
  });
  test("état et mode", () => {
    expect(filterEntries(list, { ...ALL, state: "waiting" }, () => false)).toHaveLength(2);
    expect(filterEntries(list, { ...ALL, state: "partial" }, () => false)).toHaveLength(0);
    expect(filterEntries(list, { ...ALL, mode: "soft" }, () => false)).toHaveLength(0);
  });
});

test("libellés d'épisodes", () => {
  expect(formatEpisodes([1, 2, 3, 4, 5])).toBe("épisodes 1 à 5");
  expect(formatEpisodes([3])).toBe("épisode 3");
  expect(formatEpisodes([5, 1, 2])).toBe("épisodes 1, 2 et 5");
});

test("baselineLabel", () => {
  expect(baselineLabel(tvEntry({ baseline: ["e1", "e2"] }))).toBe("Déjà sur C411 : épisodes 1 à 2");
  expect(baselineLabel(movieEntry({ baseline: ["movie"] }))).toBe("Déjà sur C411");
  expect(baselineLabel(tvEntry())).toBeNull();
});

describe("summarizeAlerts", () => {
  const v = titled("Les Veilleurs");
  test("une sortie", () => {
    expect(summarizeAlerts([{ entry: v, alert: alert("full", "e6") }])).toEqual({
      level: "full",
      text: "Les Veilleurs : épisode 6 est sorti",
    });
  });
  test("un film", () => {
    expect(summarizeAlerts([{ entry: movieEntry(), alert: alert("full", "movie") }])?.text).toBe(
      "L'Écluse est sorti",
    );
  });
  test("une mi-alerte, comptée une fois par contenu", () => {
    expect(
      summarizeAlerts([
        { entry: v, alert: alert("partial", "e6") },
        { entry: v, alert: alert("partial", "e6") },
      ]),
    ).toEqual({
      level: "partial",
      text: "Les Veilleurs : alternative disponible pour l'épisode 6",
    });
  });
  test("groupée par contenu", () => {
    const items = [1, 2, 3].map((n) => ({ entry: v, alert: alert("full", `e${n}`) }));
    expect(summarizeAlerts(items)?.text).toBe("3 nouveautés sur Radar");
  });
  test("mélange : niveau complet", () => {
    expect(
      summarizeAlerts([
        { entry: v, alert: alert("partial", "e1") },
        { entry: v, alert: alert("full", "e2") },
      ])?.level,
    ).toBe("full");
  });
  test("rien", () => {
    expect(summarizeAlerts([])).toBeNull();
  });
});
