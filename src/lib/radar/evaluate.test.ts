import { describe, expect, test } from "vitest";
import {
  evaluateReleases,
  hasExpected,
  isComplete,
  nextMissingEpisode,
  releaseContents,
} from "./evaluate";
import { episodeScope as ep, movieEntry, release as rel, tvEntry as entry } from "./testFixtures";
import type { KnownVersion, RadarExpectation } from "./types";

const VF1080 = rel(["VFF"], "1080p", ep(3, 6));
const VOST720 = rel(["VOSTFR"], "720p", ep(3, 6));
const SOFT: RadarExpectation = { language: "vf", resolution: "1080p", mode: "soft" };
const NONE = new Set<string>();

describe("releaseContents", () => {
  test("épisode, autre saison, pack, plage, intégrale, film", () => {
    expect(releaseContents(ep(3, 6), 3, [1, 2])).toEqual(["e6"]);
    expect(releaseContents(ep(2, 6), 3, [1, 2])).toEqual([]);
    expect(releaseContents({ kind: "season", season: 3 }, 3, [1, 2])).toEqual(["e1", "e2"]);
    expect(releaseContents({ kind: "season", season: 2 }, 3, [1, 2])).toEqual([]);
    expect(
      releaseContents({ kind: "season", season: 3, range: { from: 4, to: 5 } }, 3, [1]),
    ).toEqual(["e4", "e5"]);
    expect(releaseContents({ kind: "complete" }, 3, [1, 2])).toEqual([]);
    expect(releaseContents(null, 3, [1])).toEqual([]);
    expect(releaseContents(null, null, [])).toEqual(["movie"]);
  });
});

describe("evaluateReleases", () => {
  test("Review Focus 5 : pack sans épisodes TMDB ne couvre rien", () => {
    const e = entry({ aired: [], episodes: [] });
    const r = evaluateReleases(e, [rel(["VFF"], "1080p", { kind: "season", season: 3 })], NONE, 1);
    expect(r.known).toEqual({});
    expect(isComplete({ ...e, known: r.known })).toBe(false);
  });

  test("Review Focus 1 : point de départ silencieux, y compris après un échec réseau", () => {
    const r = evaluateReleases(entry({ known: null }), [VOST720], NONE, 1);
    expect(r.newAlerts).toEqual([]);
    expect(r.baseline).toEqual(["e6"]);
  });

  test("hors point de départ, baseline ne change pas", () => {
    expect(evaluateReleases(entry({ baseline: ["e1"] }), [VF1080], NONE, 1).baseline).toEqual([
      "e1",
    ]);
  });

  test("strict : autre version ignorée, attendue alerte", () => {
    const a = evaluateReleases(entry(), [VOST720], NONE, 1);
    expect(a.newAlerts).toEqual([]);
    const b = evaluateReleases(entry({ known: a.known }), [VOST720, VF1080], NONE, 2);
    expect(b.newAlerts.map((x) => x.level)).toEqual(["full"]);
  });

  test("version attendue après un point de départ dans une autre version : alerte complète", () => {
    const start = evaluateReleases(entry({ known: null }), [VOST720], NONE, 1);
    const next = evaluateReleases(entry({ known: start.known }), [VOST720, VF1080], NONE, 2);
    expect(next.newAlerts).toHaveLength(1);
    expect(next.newAlerts[0]).toMatchObject({ content: "e6", level: "full" });
  });

  test("souple : mi-alerte unique, nouvelle résolution renotifie, alerte complète remplace", () => {
    const soft = entry({ expectation: SOFT });
    const a = evaluateReleases(soft, [VOST720], NONE, 1);
    expect(a.newAlerts.map((x) => x.level)).toEqual(["partial"]);

    const b = evaluateReleases(
      { ...soft, known: a.known, alerts: a.alerts },
      [VOST720, rel(["VOSTFR"], "720p", ep(3, 6))],
      NONE,
      2,
    );
    expect(b.newAlerts).toEqual([]);

    const c = evaluateReleases(
      { ...soft, known: a.known, alerts: a.alerts },
      [rel(["VOSTFR"], "1080p", ep(3, 6))],
      NONE,
      3,
    );
    expect(c.newAlerts.map((x) => x.level)).toEqual(["partial"]);

    const d = evaluateReleases({ ...soft, known: c.known, alerts: c.alerts }, [VF1080], NONE, 4);
    expect(d.alerts.map((x) => x.level)).toEqual(["full"]);
  });

  test("une fois la version attendue connue, une autre version ne mi-alerte plus", () => {
    const soft = entry({ expectation: SOFT });
    const a = evaluateReleases(soft, [VF1080], NONE, 1);
    const b = evaluateReleases({ ...soft, known: a.known }, [VF1080, VOST720], NONE, 2);
    expect(b.newAlerts).toEqual([]);
  });

  test("Review Focus 4 : mêmes releases, aucune nouvelle alerte", () => {
    const a = evaluateReleases(entry(), [VF1080], NONE, 1);
    const b = evaluateReleases(entry({ known: a.known, alerts: a.alerts }), [VF1080], NONE, 2);
    expect(b.newAlerts).toEqual([]);
    expect(b.alerts).toHaveLength(1);
  });

  test("déjà en bibliothèque : pas d'alerte mais version mémorisée", () => {
    const r = evaluateReleases(entry(), [VF1080], new Set(["e6"]), 1);
    expect(r.newAlerts).toEqual([]);
    expect(r.known.e6).toHaveLength(1);
  });

  test("un film suit la clé movie", () => {
    const r = evaluateReleases(movieEntry(), [rel(["VFF"], "1080p", null)], NONE, 1);
    expect(r.newAlerts[0]).toMatchObject({ content: "movie", level: "full" });
  });
});

describe("packs de saison", () => {
  const PACK = rel(["MULTI"], "1080p", { kind: "season", season: 3 }, { infoHash: "pack" });

  test("C1 : un pack vu en cours de saison ne couvre pas les épisodes diffusés ensuite", () => {
    const start = evaluateReleases(entry({ known: null, aired: [1, 2, 3, 4, 5] }), [PACK], NONE, 1);
    expect(start.packs).toEqual({ pack: [1, 2, 3, 4, 5] });

    const later = entry({
      known: start.known,
      packs: start.packs,
      aired: [1, 2, 3, 4, 5, 6],
    });
    const r = evaluateReleases(later, [PACK], NONE, 2);
    expect(r.newAlerts).toEqual([]);
    expect(r.known.e6).toBeUndefined();

    const real = rel(["VFF"], "1080p", ep(3, 6));
    const s = evaluateReleases({ ...later, known: r.known }, [PACK, real], NONE, 3);
    expect(s.newAlerts.map((a) => a.content)).toEqual(["e6"]);
  });

  test("C1 : une saison couverte seulement jusqu'au pack n'est pas terminée", () => {
    const start = evaluateReleases(entry({ known: null, aired: [1, 2] }), [PACK], NONE, 1);
    expect(isComplete(entry({ known: start.known, episodes: [1, 2, 3], aired: [1, 2, 3] }))).toBe(
      false,
    );
  });
});

test("I5 : une version jamais vue hors des dernières publications reste silencieuse", () => {
  const old = rel(["VFF"], "1080p", ep(3, 2), { recent: false });
  const r = evaluateReleases(entry(), [old], NONE, 1);
  expect(r.newAlerts).toEqual([]);
  expect(r.known.e2).toHaveLength(1);
});

test("I5 : en souple, une ancienne alternative ne mi-alerte pas", () => {
  const old = rel(["VOSTFR"], "720p", ep(3, 2), { recent: false });
  expect(evaluateReleases(entry({ expectation: SOFT }), [old], NONE, 1).newAlerts).toEqual([]);
});

test("les contenus dont l'alerte est remplacée sont listés", () => {
  const soft = entry({ expectation: SOFT });
  const a = evaluateReleases(soft, [VOST720], NONE, 1);
  const b = evaluateReleases({ ...soft, known: a.known, alerts: a.alerts }, [VF1080], NONE, 2);
  expect(b.replaced).toEqual(["e6"]);
});

describe("état d'une ligne", () => {
  const vf: KnownVersion[] = [{ language: "vf", resolution: "1080p" }];
  const vostfr: KnownVersion[] = [{ language: "vostfr", resolution: "1080p" }];

  test("une saison est terminée quand tous ses épisodes ont la version attendue", () => {
    expect(isComplete(entry({ episodes: [1, 2], known: { e1: vf, e2: vf } }))).toBe(true);
    expect(isComplete(entry({ episodes: [1, 2], known: { e1: vf, e2: vostfr } }))).toBe(false);
    expect(nextMissingEpisode(entry({ episodes: [1, 2], known: { e1: vf } }))).toBe(2);
    expect(nextMissingEpisode(entry({ episodes: [1], known: { e1: vf } }))).toBeNull();
  });

  test("point de départ absent : rien n'est attendu comme présent", () => {
    expect(hasExpected(entry({ known: null }), "e1")).toBe(false);
    expect(isComplete(entry({ known: null }))).toBe(false);
  });

  test("un film est complet avec la version attendue", () => {
    expect(isComplete(movieEntry({ known: { movie: vf } }))).toBe(true);
    expect(isComplete(movieEntry({ known: { movie: vostfr } }))).toBe(false);
  });
});
