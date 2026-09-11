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
import {
  cardKey,
  episodeRanges,
  fileDisplayName,
  formatRuntime,
  missingEpisodes,
  nextTitleItem,
  parseCardKey,
  rangeLabel,
  resolveTitleSubject,
  titleSections,
  type TitleSection,
} from "./libraryTitle";
import type { TmdbEpisode } from "./services/tmdb";

function file(name: string): DebridFile {
  return { name, link: `link:${name}`, size: 100 };
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

function ep(n: number, air_date: string | null = "2020-01-01"): TmdbEpisode {
  return {
    episode_number: n,
    name: `Ep ${n}`,
    overview: "",
    still_path: null,
    runtime: 40,
    air_date,
  };
}

function section(season: number | null, episodes: number[]): TitleSection {
  const e = entry();
  return {
    key: "s",
    label: "Saison",
    season,
    items: episodes.map((n) => ({
      entry: e,
      file: file(`E${n}.mkv`),
      season,
      episode: n,
    })),
  };
}

describe("titleSections", () => {
  it("ventile un pack par saison avec saison et épisode sur chaque item", () => {
    const e = entry({
      files: [file("Show.S01E02.mkv"), file("Show.S01E01.mkv"), file("Show.S02E01.mkv")],
    });
    const sections = titleSections({ kind: "entry", entry: e }, null);
    expect(sections.map((s) => s.label)).toEqual(["Saison 1", "Saison 2"]);
    expect(sections[0].items.map((it) => it.episode)).toEqual([1, 2]);
    expect(sections[1].items[0].season).toBe(2);
  });

  it("retombe sur la saison du titre du torrent", () => {
    const e = entry({ title: "Show.S03.1080p", files: [file("Show - E01.mkv")] });
    const [s] = titleSections({ kind: "entry", entry: e }, null);
    expect(s.season).toBe(3);
    expect(s.items[0]).toMatchObject({ season: 3, episode: 1 });
  });

  it("nomme Épisodes une section unique sans saison", () => {
    const e = entry({ files: [file("Show - 1085.mkv"), file("Show - 1086.mkv")] });
    expect(titleSections({ kind: "entry", entry: e }, null)[0].label).toBe("Épisodes");
  });

  it("suit les dossiers configurés d'une série", () => {
    const e = entry({ tmdb: tv(7), files: [file("Show.S01E01.mkv"), file("Show.S02E01.mkv")] });
    const group = { tmdbId: 7, tmdb: tv(7), entries: [e] };
    const sections = titleSections(
      { kind: "group", group },
      {
        folders: [{ id: "f1", name: "Arc 1", season: 1 }],
        assignments: {},
      },
    );
    expect(sections.map((s) => [s.label, s.season])).toEqual([
      ["Arc 1", 1],
      ["Non classés", null],
    ]);
  });
});

describe("nextTitleItem", () => {
  it("renvoie le premier épisode non vu dans l'ordre des sections", () => {
    const e = entry({
      files: [file("S01E01.mkv"), file("S01E02.mkv"), file("S02E01.mkv")],
      watched: { "S01E01.mkv": true },
    });
    const next = nextTitleItem(titleSections({ kind: "entry", entry: e }, null));
    expect(next?.file.name).toBe("S01E02.mkv");
  });

  it("renvoie null quand tout est vu", () => {
    const e = entry({ files: [file("S01E01.mkv")], watched: { "S01E01.mkv": true } });
    expect(nextTitleItem(titleSections({ kind: "entry", entry: e }, null))).toBeNull();
  });
});

describe("episodeRanges", () => {
  it("ne découpe pas jusqu'à 100 épisodes", () => {
    expect(episodeRanges(100)).toEqual([]);
  });

  it("découpe par 50 au-delà", () => {
    expect(episodeRanges(120)).toEqual([
      { start: 0, end: 50 },
      { start: 50, end: 100 },
      { start: 100, end: 120 },
    ]);
  });

  it("nomme la plage par numéros d'épisode", () => {
    const s = section(null, [1001, 1002, 1003]);
    expect(rangeLabel(s.items, { start: 0, end: 3 })).toBe("Épisodes 1001-1003");
  });
});

describe("missingEpisodes", () => {
  const today = "2024-06-01";

  it("liste les épisodes diffusés absents", () => {
    const eps = [ep(1), ep(2), ep(3), ep(4)];
    expect(missingEpisodes(section(1, [1, 3]), eps, today)).toEqual([2, 4]);
  });

  it("ignore les épisodes pas encore diffusés", () => {
    const eps = [ep(1), ep(2, "2030-01-01"), ep(3, null)];
    expect(missingEpisodes(section(1, [1]), eps, today)).toEqual([]);
  });

  it("ne signale rien sans saison", () => {
    expect(missingEpisodes(section(null, [1]), [ep(1), ep(2)], today)).toEqual([]);
  });

  it("ne signale rien si la numérotation dépasse celle de TMDB", () => {
    expect(missingEpisodes(section(2, [14, 15]), [ep(1), ep(2), ep(3)], today)).toEqual([]);
  });
});

describe("fileDisplayName", () => {
  it("garde le nom brut hors mode simple", () => {
    expect(fileDisplayName("dir/Show.S01E02.1080p.mkv", false)).toBe("Show.S01E02.1080p.mkv");
  });

  it("nettoie le nom et garde l'épisode en mode simple", () => {
    const name = fileDisplayName("Show.S01E02.1080p.mkv", true);
    expect(name).not.toContain("1080p");
    expect(name).toMatch(/E0?2$/);
  });
});

describe("formatRuntime", () => {
  it("affiche les minutes puis les heures", () => {
    expect(formatRuntime(47)).toBe("47 min");
    expect(formatRuntime(112)).toBe("1 h 52");
    expect(formatRuntime(120)).toBe("2 h");
    expect(formatRuntime(65)).toBe("1 h 05");
  });
});

describe("resolveTitleSubject", () => {
  const movie = entry({ infoHash: "m" });
  const s1 = entry({ infoHash: "a", tmdb: tv(9), files: [file("S02E01.mkv")] });
  const s2 = entry({ infoHash: "b", tmdb: tv(9), files: [file("S01E01.mkv")] });

  it("ouvre une entrée hors série", () => {
    expect(resolveTitleSubject([movie], "m", null)).toEqual({ kind: "entry", entry: movie });
  });

  it("ouvre la série d'une entrée rattachée à TMDB", () => {
    const subject = resolveTitleSubject([movie, s1, s2], "a", null);
    expect(subject?.kind).toBe("group");
    if (subject?.kind === "group")
      expect(subject.group.entries.map((e) => e.infoHash)).toEqual(["b", "a"]);
  });

  it("ouvre une série par id", () => {
    expect(resolveTitleSubject([s1], null, 9)?.kind).toBe("group");
  });

  it("renvoie null pour un titre disparu", () => {
    expect(resolveTitleSubject([movie], "zz", null)).toBeNull();
    expect(resolveTitleSubject([movie], null, 42)).toBeNull();
  });
});

describe("cardKey", () => {
  it("distingue une entrée seule d'une série regroupée", () => {
    expect(cardKey("a1b2", null)).toBe("a1b2");
    expect(cardKey(null, 42)).toBe("g42");
    expect(parseCardKey("a1b2")).toEqual({ hash: "a1b2", groupId: null });
    expect(parseCardKey("g42")).toEqual({ hash: null, groupId: 42 });
  });
});
