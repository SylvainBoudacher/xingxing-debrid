import { describe, expect, test } from "vitest";
import { isExactSeriesRelease } from "./releases";

describe("isExactSeriesRelease", () => {
  test("Review Focus 3 : titre proche écarté", () => {
    expect(isExactSeriesRelease("Dark.Matter.S01E01.1080p", ["dark"])).toBe(false);
  });
  test("titre exact, avec année ou mot Saison", () => {
    expect(isExactSeriesRelease("Dark.S01E01.1080p", ["dark"])).toBe(true);
    expect(isExactSeriesRelease("Dark.2017.Saison.1.1080p", ["dark"])).toBe(true);
  });
  test("préfixe d'équipe toléré", () => {
    expect(isExactSeriesRelease("[Team] Dark S01E01", ["dark"])).toBe(true);
  });
  test("un des titres suffit", () => {
    expect(isExactSeriesRelease("The.Show.S02E03", ["le spectacle", "the show"])).toBe(true);
  });
});
