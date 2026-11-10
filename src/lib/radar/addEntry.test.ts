import { expect, test } from "vitest";
import { latestSeason, newRadarEntry, radarEntryId } from "./addEntry";
import { tmdbItem, VF_1080 } from "./testFixtures";

test("identifiant stable par titre et saison", () => {
  expect(radarEntryId(tmdbItem(10, "tv"), 3)).toBe("tv-10-3");
  expect(radarEntryId(tmdbItem(4, "movie"), null)).toBe("movie-4-x");
});

test("une nouvelle entrée attend son point de départ", () => {
  const entry = newRadarEntry(tmdbItem(10, "tv"), 3, VF_1080, 1);
  expect(entry.known).toBeNull();
  expect(entry).toMatchObject({ id: "tv-10-3", season: 3, expectation: VF_1080, addedAt: 1 });
});

test("dernière saison hors spéciaux", () => {
  expect(latestSeason([{ season_number: 0 }, { season_number: 1 }, { season_number: 2 }])).toBe(2);
  expect(latestSeason([{ season_number: 0 }])).toBeNull();
});
