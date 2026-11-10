import { describe, expect, test } from "vitest";
import { isExactMovieRelease, isExactSeriesRelease } from "./releases";

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

describe("I1 : le titre commence le nom", () => {
  test("mot devant le titre écarté", () => {
    expect(isExactSeriesRelease("Into.the.Dark.S01E01.MULTI.1080p", ["dark"])).toBe(false);
  });
  test("titre français suivi du titre original accepté", () => {
    expect(isExactSeriesRelease("Le.Spectacle.The.Show.S02E03", ["le spectacle", "the show"])).toBe(
      true,
    );
  });
});

describe("I2 : isExactMovieRelease", () => {
  test("suite au titre plus long écartée", () => {
    expect(isExactMovieRelease("Wicked.For.Good.2025.MULTI.1080p", ["wicked"], "2024")).toBe(false);
  });
  test("titre suivi de l'année, ou de l'année suivante", () => {
    expect(isExactMovieRelease("Wicked.2024.MULTI.1080p", ["wicked"], "2024")).toBe(true);
    expect(isExactMovieRelease("Wicked.2025.MULTI.1080p", ["wicked"], "2024")).toBe(true);
  });
  test("mot devant le titre écarté", () => {
    expect(isExactMovieRelease("Not.Wicked.2024.1080p", ["wicked"], "2024")).toBe(false);
  });
  test("préfixe d'équipe toléré", () => {
    expect(isExactMovieRelease("[Team] Wicked 2024 1080p", ["wicked"], "2024")).toBe(true);
  });
  test("sans année connue, le titre doit commencer le nom", () => {
    expect(isExactMovieRelease("Wicked.1080p", ["wicked"], "")).toBe(true);
    expect(isExactMovieRelease("Not.Wicked.1080p", ["wicked"], "")).toBe(false);
  });
});
