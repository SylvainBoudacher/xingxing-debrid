import { describe, expect, test } from "vitest";
import { alert, movieEntry, tmdbItem, tvEntry } from "./testFixtures";
import type { RadarEntry } from "./types";
import {
  baselineLabel,
  entryStatuses,
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

describe("entryStatuses", () => {
  test("une saison incomplète reste ciblée, une alerte complète prime sur une mi-alerte", () => {
    expect(entryStatuses(tvEntry({ alerts: [alert("partial"), alert("full")] }))).toEqual([
      "released",
      "waiting",
    ]);
    expect(entryStatuses(tvEntry({ alerts: [alert("partial")] }))).toEqual(["partial", "waiting"]);
    expect(entryStatuses(tvEntry())).toEqual(["waiting"]);
  });
  test("saison complète terminée, film complet sorti", () => {
    expect(entryStatuses(tvEntry({ episodes: [1], known: { e1: [...vf] } }))).toEqual(["finished"]);
    expect(entryStatuses(movieEntry({ known: { movie: [...vf] } }))).toEqual(["released"]);
  });
  test("dernier épisode trouvé : la saison quitte les ciblés", () => {
    const entry = tvEntry({ episodes: [1], known: { e1: [...vf] }, alerts: [alert("full", "e1")] });
    expect(entryStatuses(entry)).toEqual(["released"]);
  });
  test("un épisode vu reste disponible tant que la saison est incomplète", () => {
    const seen = { ...alert("full", "e1"), seen: true };
    expect(entryStatuses(tvEntry({ alerts: [seen] }))).toEqual(["released", "waiting"]);
  });
  test("saison complète et tout vu : terminée", () => {
    const seen = { ...alert("full", "e1"), seen: true };
    const entry = tvEntry({ episodes: [1], known: { e1: [...vf] }, alerts: [seen] });
    expect(entryStatuses(entry)).toEqual(["finished"]);
  });
});

describe("splitBlocks", () => {
  const finished = titled("Alpha", { episodes: [1], known: { e1: [...vf] } });
  const partial = titled("Beta", { alerts: [alert("partial")] });
  const released2 = titled("Zeta", { alerts: [alert("full")] });
  const released1 = titled("Écluse", { alerts: [alert("full")] });
  const waiting = titled("Omega");
  const list = [finished, partial, released2, released1, waiting];
  const ids = (items: { entry: RadarEntry }[]) => items.map((i) => i.entry.id);

  test("sorti, mi-alerte puis terminé, et toute saison incomplète reste ciblée", () => {
    const blocks = splitBlocks(list, "all");
    expect(ids(blocks.released)).toEqual(["Écluse", "Zeta", "Beta", "Alpha"]);
    expect(ids(blocks.waiting)).toEqual(["Beta", "Écluse", "Omega", "Zeta"]);
    expect(blocks.waiting.every((i) => i.status === "waiting")).toBe(true);
  });
  test("un état choisi ne montre que sa liste", () => {
    const blocks = splitBlocks(list, "waiting");
    expect(blocks.released).toEqual([]);
    expect(blocks.waiting).toHaveLength(4);
    expect(splitBlocks(list, "released").waiting).toEqual([]);
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
