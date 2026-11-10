import { describe, expect, test } from "vitest";
import { alert, movieEntry, tmdbItem, tvEntry } from "./testFixtures";
import type { RadarEntry } from "./types";
import {
  baselineLabel,
  entryStatus,
  filterEntries,
  formatEpisodes,
  radarToastContent,
  splitBlocks,
  statusCounts,
  type RadarFilters,
} from "./view";

const ALL: RadarFilters = { query: "", type: "all", state: "all", mode: "all", inLibrary: false };
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
  test("en bibliothèque, cumulable avec l'état", () => {
    const inLib = (e: RadarEntry) => e.item.mediaType === "movie";
    expect(filterEntries(list, { ...ALL, inLibrary: true }, inLib)).toEqual([list[1]]);
    expect(filterEntries(list, { ...ALL, inLibrary: true, state: "partial" }, inLib)).toEqual([]);
  });
  test("les compteurs d'état ignorent l'état choisi mais suivent les autres filtres", () => {
    const filters: RadarFilters = { ...ALL, state: "partial", type: "tv" };
    expect(statusCounts(list, filters, () => false)).toEqual({
      all: 1,
      released: 0,
      partial: 0,
      waiting: 1,
      finished: 0,
    });
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

describe("radarToastContent", () => {
  const v = titled("Les Veilleurs", {
    item: { ...tmdbItem(1, "tv", "Les Veilleurs"), posterPath: "/v.jpg" },
  });

  test("un épisode sorti", () => {
    expect(radarToastContent([{ entry: v, alert: alert("full", "e6") }])).toEqual({
      level: "full",
      label: "Nouvel épisode",
      title: "Les Veilleurs",
      detail: "Saison 3, épisode 6",
      version: "VF 1080p",
      posters: ["/v.jpg"],
    });
  });

  test("un film sorti", () => {
    expect(
      radarToastContent([{ entry: movieEntry(), alert: alert("full", "movie") }]),
    ).toMatchObject({
      label: "Film disponible",
      title: "L'Écluse",
      detail: "2026",
    });
  });

  test("une mi-alerte, comptée une fois par contenu", () => {
    const items = [
      { entry: v, alert: alert("partial", "e6") },
      { entry: v, alert: alert("partial", "e6") },
    ];
    expect(radarToastContent(items)).toMatchObject({
      level: "partial",
      label: "Alternative disponible",
      detail: "Saison 3, épisode 6",
    });
  });

  test("plusieurs contenus : compte et titres sans doublon", () => {
    const other = titled("Port-Cendre");
    const items = [
      { entry: v, alert: alert("full", "e1") },
      { entry: v, alert: alert("full", "e2") },
      { entry: other, alert: alert("full", "e1") },
    ];
    expect(radarToastContent(items)).toEqual({
      level: "full",
      label: "Radar",
      title: "3 nouveautés",
      detail: "Les Veilleurs, Port-Cendre",
      version: null,
      posters: ["/v.jpg", null],
    });
  });

  test("plusieurs mi-alertes", () => {
    const items = [1, 2].map((n) => ({ entry: v, alert: alert("partial", `e${n}`) }));
    expect(radarToastContent(items)).toMatchObject({ level: "partial", title: "2 alternatives" });
  });

  test("mélange : niveau complet", () => {
    const items = [
      { entry: v, alert: alert("partial", "e1") },
      { entry: v, alert: alert("full", "e2") },
    ];
    expect(radarToastContent(items)?.level).toBe("full");
  });

  test("au plus trois affiches", () => {
    const items = ["a", "b", "c", "d"].map((t) => ({
      entry: titled(t),
      alert: alert("full", "e1"),
    }));
    expect(radarToastContent(items)?.posters).toHaveLength(3);
  });

  test("rien", () => {
    expect(radarToastContent([])).toBeNull();
  });
});
