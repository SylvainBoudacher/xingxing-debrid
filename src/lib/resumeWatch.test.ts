import { describe, expect, it, vi } from "vitest";

vi.mock("@tauri-apps/plugin-store", () => ({
  LazyStore: class {
    async get() {
      return undefined;
    }
    async set() {}
    async save() {}
  },
}));

import type { DebridFile } from "./debrid";
import type { LibraryEntry, TmdbMeta } from "./library";
import { MAX_RESUMED, RESUME_HISTORY, pushResume, resumeRefOf, resumeTargets } from "./resumeWatch";

function file(name: string): DebridFile {
  return { name, link: `link:${name}`, size: 100 };
}

function tv(id: number): TmdbMeta {
  return {
    id,
    mediaType: "tv",
    title: "Show",
    posterPath: null,
    year: "2020",
    voteAverage: 0,
    overview: "",
  };
}

function movie(id: number): TmdbMeta {
  return { ...tv(id), mediaType: "movie", title: "Film" };
}

function entry(over: Partial<LibraryEntry> = {}): LibraryEntry {
  return {
    infoHash: "h1",
    title: "Show",
    provider: "c411",
    category: 0,
    size: 0,
    addedAt: 0,
    files: [],
    enriched: true,
    watched: {},
    ...over,
  };
}

const series = entry({
  infoHash: "h1",
  tmdb: tv(10),
  files: [file("Show.S01E01.mkv"), file("Show.S01E02.mkv"), file("Show.S01E03.mkv")],
});

describe("resumeTargets", () => {
  it("renvoie le premier épisode non vu", () => {
    const targets = resumeTargets([series], [{ tmdbId: 10, infoHash: null, at: 1 }], {});
    expect(targets).toHaveLength(1);
    expect(targets[0].next.file.name).toBe("Show.S01E01.mkv");
  });

  it("saute les épisodes déjà vus", () => {
    const seen = { ...series, watched: { "Show.S01E01.mkv": true, "Show.S01E02.mkv": true } };
    const targets = resumeTargets([seen], [{ tmdbId: 10, infoHash: null, at: 1 }], {});
    expect(targets[0].next.file.name).toBe("Show.S01E03.mkv");
  });

  it("écarte une série dont le dernier épisode est vu", () => {
    const done = {
      ...series,
      watched: {
        "Show.S01E01.mkv": true,
        "Show.S01E02.mkv": true,
        "Show.S01E03.mkv": true,
      },
    };
    expect(resumeTargets([done], [{ tmdbId: 10, infoHash: null, at: 1 }], {})).toEqual([]);
  });

  it("écarte une série qui a quitté la bibliothèque", () => {
    expect(resumeTargets([], [{ tmdbId: 10, infoHash: null, at: 1 }], {})).toEqual([]);
  });

  it("ne renvoie rien sans référence enregistrée", () => {
    expect(resumeTargets([series], [], {})).toEqual([]);
  });

  it("retrouve un pack sans métadonnées TMDB par son infoHash", () => {
    const pack = entry({
      infoHash: "h2",
      files: [file("Pack.S01E01.mkv"), file("Pack.S01E02.mkv")],
      watched: { "Pack.S01E01.mkv": true },
    });
    const targets = resumeTargets([pack], [{ tmdbId: null, infoHash: "h2", at: 1 }], {});
    expect(targets[0].next.file.name).toBe("Pack.S01E02.mkv");
  });

  it("garde l'ordre des références et écarte les séries finies", () => {
    const other = entry({
      infoHash: "h2",
      tmdb: tv(20),
      files: [file("Other.S01E01.mkv")],
      watched: { "Other.S01E01.mkv": true },
    });
    const third = entry({
      infoHash: "h3",
      tmdb: tv(30),
      files: [file("Third.S01E01.mkv"), file("Third.S01E02.mkv")],
    });
    const refs = [
      { tmdbId: 30, infoHash: null, at: 3 },
      { tmdbId: 20, infoHash: null, at: 2 },
      { tmdbId: 10, infoHash: null, at: 1 },
    ];
    const targets = resumeTargets([series, other, third], refs, {});
    expect(targets.map((t) => t.next.file.name)).toEqual(["Third.S01E01.mkv", "Show.S01E01.mkv"]);
  });
});

describe("resumeTargets (emplacements)", () => {
  function show(id: number, hash: string) {
    return entry({
      infoHash: hash,
      tmdb: tv(id),
      files: [file(`${hash}.S01E01.mkv`), file(`${hash}.S01E02.mkv`)],
    });
  }

  it("ne laisse pas une série absente de la bibliothèque occuper un emplacement", () => {
    const shows = [show(11, "a"), show(12, "b"), show(13, "c")];
    const refs = [
      { tmdbId: 99, infoHash: null, at: 4 },
      { tmdbId: 11, infoHash: null, at: 3 },
      { tmdbId: 12, infoHash: null, at: 2 },
      { tmdbId: 13, infoHash: null, at: 1 },
    ];
    expect(resumeTargets(shows, refs, {})).toHaveLength(MAX_RESUMED);
  });

  it("n'affiche jamais plus que le nombre d'emplacements", () => {
    const shows = [show(11, "a"), show(12, "b"), show(13, "c"), show(14, "d")];
    const refs = [11, 12, 13, 14].map((tmdbId, i) => ({ tmdbId, infoHash: null, at: i }));
    expect(resumeTargets(shows, refs, {})).toHaveLength(MAX_RESUMED);
  });
});

describe("pushResume", () => {
  const a = { tmdbId: 10, infoHash: null, at: 1 };
  const b = { tmdbId: 20, infoHash: null, at: 2 };
  const c = { tmdbId: 30, infoHash: null, at: 3 };

  it("met la dernière série en tête", () => {
    expect(pushResume([a], b)).toEqual([b, a]);
  });

  it("ne garde qu'une entrée par série", () => {
    const again = { tmdbId: 10, infoHash: null, at: 9 };
    expect(pushResume([b, a], again)).toEqual([again, b]);
  });

  it("garde un historique plus profond que les emplacements affichés", () => {
    const many = Array.from({ length: RESUME_HISTORY }, (_, i) => ({
      tmdbId: 100 + i,
      infoHash: null,
      at: i,
    }));
    const kept = pushResume(many, c);
    expect(kept).toHaveLength(RESUME_HISTORY);
    expect(kept[0]).toEqual(c);
    // La plus ancienne sort, les autres restent disponibles si une série
    // affichée disparaît.
    expect(kept).not.toContainEqual(many[RESUME_HISTORY - 1]);
  });

  it("garde plus d'entrées qu'il n'y a d'emplacements", () => {
    expect(pushResume([c, b], a)).toHaveLength(3);
    expect(RESUME_HISTORY).toBeGreaterThan(MAX_RESUMED);
  });

  it("distingue les packs par leur infoHash", () => {
    const p1 = { tmdbId: null, infoHash: "h1", at: 1 };
    const p2 = { tmdbId: null, infoHash: "h2", at: 2 };
    expect(pushResume([p1], p2)).toEqual([p2, p1]);
  });
});

describe("resumeRefOf", () => {
  it("retient l'id TMDB d'une série regroupée", () => {
    expect(
      resumeRefOf({ kind: "group", group: { tmdbId: 10, tmdb: tv(10), entries: [series] } }),
    ).toMatchObject({ tmdbId: 10, infoHash: null });
  });

  it("retient l'infoHash d'un pack multi-épisodes", () => {
    const pack = entry({ infoHash: "h2", files: [file("a.S01E01.mkv"), file("a.S01E02.mkv")] });
    expect(resumeRefOf({ kind: "entry", entry: pack })).toMatchObject({
      tmdbId: null,
      infoHash: "h2",
    });
  });

  it("ignore un film", () => {
    const film = entry({ infoHash: "h3", tmdb: movie(5), files: [file("Film.mkv")] });
    expect(resumeRefOf({ kind: "entry", entry: film })).toBeNull();
  });
});
