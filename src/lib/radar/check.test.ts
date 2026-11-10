import { describe, expect, test } from "vitest";
import type { DebridFile } from "@/lib/debrid";
import type { LibraryEntry } from "@/lib/library";
import type { TmdbEpisode } from "@/lib/services/tmdb";
import { checkEntries, shouldCheck, type RadarCheckDeps } from "./check";
import { episodeScope, movieEntry, release, tvEntry } from "./testFixtures";

const ep = (n: number, air_date: string | null = "2020-01-01") =>
  ({ episode_number: n, air_date }) as TmdbEpisode;
const VF_E1 = release(["VFF"], "1080p", episodeScope(3, 1));
const VF_E2 = release(["VFF"], "1080p", episodeScope(3, 2));
const tv = (id: string, patch = {}) => tvEntry({ id, ...patch });

function deps(patch: Partial<RadarCheckDeps> = {}): RadarCheckDeps {
  return {
    fetchReleases: async () => [],
    fetchEpisodes: async () => [],
    library: [],
    now: 1,
    today: "2026-11-10",
    ...patch,
  };
}

describe("checkEntries", () => {
  test("une ligne en échec garde son état et remonte dans failed", async () => {
    const r = await checkEntries(
      [tv("a")],
      deps({ fetchReleases: () => Promise.reject(new Error("down")) }),
    );
    expect(r.failed).toEqual(["a"]);
    expect(r.updates.size).toBe(0);
  });

  test("une erreur TMDB fait aussi échouer la ligne", async () => {
    const r = await checkEntries(
      [tv("a")],
      deps({ fetchEpisodes: () => Promise.reject(new Error("down")) }),
    );
    expect(r.failed).toEqual(["a"]);
  });

  test("une ligne en échec n'empêche pas les autres", async () => {
    const r = await checkEntries(
      [tv("a"), tv("b")],
      deps({
        fetchReleases: (e) => (e.id === "a" ? Promise.reject(new Error("x")) : Promise.resolve([])),
      }),
    );
    expect(r.failed).toEqual(["a"]);
    expect([...r.updates.keys()]).toEqual(["b"]);
  });

  test("Review Focus 1 : ajout échoué, passage suivant silencieux", async () => {
    const r = await checkEntries(
      [tv("a", { known: null })],
      deps({ fetchReleases: async () => [VF_E1], fetchEpisodes: async () => [ep(1)] }),
    );
    expect(r.newAlerts).toEqual([]);
    expect(r.updates.get("a")?.baseline).toEqual(["e1"]);
  });

  test("les épisodes futurs ne sont pas diffusés", async () => {
    const r = await checkEntries(
      [tv("a")],
      deps({
        today: "2026-11-10",
        fetchEpisodes: async () => [ep(1, "2026-11-03"), ep(2, "2026-11-17"), ep(3, null)],
      }),
    );
    expect(r.updates.get("a")?.aired).toEqual([1]);
    expect(r.updates.get("a")?.episodes).toEqual([1, 2, 3]);
  });

  test("seule une correspondance certaine avec la bibliothèque coupe la notification", async () => {
    const file = (name: string) => ({ name, size: 1, link: "" }) as DebridFile;
    const base = {
      infoHash: "h",
      provider: "alldebrid",
      category: 0,
      size: 1,
      addedAt: 0,
      enriched: true,
      watched: {},
    };
    const library = [
      {
        ...base,
        title: "x",
        tmdb: { id: 10, mediaType: "tv" },
        files: [file("Show.S03E01.mkv")],
      },
      { ...base, title: "Les Veilleurs", files: [file("Les.Veilleurs.S03E02.mkv")] },
    ] as unknown as LibraryEntry[];
    const r = await checkEntries(
      [tv("a")],
      deps({
        library,
        fetchReleases: async () => [VF_E1, VF_E2],
        fetchEpisodes: async () => [ep(1), ep(2)],
      }),
    );
    expect(r.newAlerts.map((x) => x.alert.content)).toEqual(["e2"]);
  });

  test("un film ne demande pas les épisodes TMDB", async () => {
    const r = await checkEntries(
      [movieEntry()],
      deps({ fetchEpisodes: () => Promise.reject(new Error("ne doit pas être appelé")) }),
    );
    expect(r.failed).toEqual([]);
  });
});

test("une ligne terminée n'est plus vérifiée", () => {
  const vf = [{ language: "vf", resolution: "1080p" } as const];
  expect(shouldCheck(tvEntry({ episodes: [1], known: { e1: [...vf] } }))).toBe(false);
  expect(shouldCheck(tvEntry())).toBe(true);
});
