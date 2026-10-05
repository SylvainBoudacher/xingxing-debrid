import type { LibraryEntry } from "@/lib/library";
import { seriesSubdir, seriesTitleFromFilename } from "@/lib/seriesDownloadPath";
import { describe, expect, it } from "vitest";

function entry(partial: Partial<LibraryEntry>): LibraryEntry {
  return {
    infoHash: "h",
    title: "",
    provider: "c411",
    category: 0,
    size: 0,
    addedAt: 0,
    files: [],
    enriched: true,
    watched: {},
    ...partial,
  } as LibraryEntry;
}

const tmdb = (mediaType: "tv" | "movie", title: string) => ({
  id: 1,
  mediaType,
  title,
  posterPath: null,
  year: "2008",
  voteAverage: 0,
  overview: "",
});

describe("seriesTitleFromFilename", () => {
  it("coupe au marqueur SxxEyy", () => {
    expect(seriesTitleFromFilename("Breaking.Bad.S01E02.1080p.WEB.mkv")).toBe("Breaking Bad");
  });

  it("retire la team en tête et l'année", () => {
    expect(seriesTitleFromFilename("[Team] The Office 2005 S02E01 MULTI.mkv")).toBe("The Office");
  });

  it("coupe à la numérotation absolue", () => {
    expect(seriesTitleFromFilename("[SubsPlease] One Piece - 1057 (1080p).mkv")).toBe("One Piece");
  });

  it("coupe à un marqueur d'épisode seul", () => {
    expect(seriesTitleFromFilename("Rick and Morty - E06.mkv")).toBe("Rick and Morty");
  });
});

describe("seriesSubdir", () => {
  it("range un épisode dans Nom/Saison n", () => {
    expect(seriesSubdir("Breaking.Bad.S01E02.1080p.mkv")).toBe("Breaking Bad/Saison 1");
  });

  it("répartit un pack multi-saisons fichier par fichier", () => {
    expect(seriesSubdir("Show.S03E10.mkv")).toBe("Show/Saison 3");
  });

  it("sans saison, range dans le dossier série seul", () => {
    expect(seriesSubdir("One Piece - 1057.mkv")).toBe("One Piece");
  });

  it("laisse un film à la racine", () => {
    expect(seriesSubdir("Dune.Part.Two.2024.1080p.mkv")).toBeUndefined();
    expect(seriesSubdir("Dune - 2021 - 1080p.mkv")).toBeUndefined();
  });

  it("préfère le titre TMDB de la bibliothèque", () => {
    const e = entry({ tmdb: tmdb("tv", "The Office (US)") });
    expect(seriesSubdir("The.Office.US.S02E01.mkv", e)).toBe("The Office (US)/Saison 2");
  });

  it("nettoie les caractères interdits du titre", () => {
    const e = entry({ tmdb: tmdb("tv", "Re:Zero") });
    expect(seriesSubdir("ReZero.S01E01.mkv", e)).toBe("Re-Zero/Saison 1");
  });

  it("reprend la saison du torrent quand le fichier n'en a pas", () => {
    const e = entry({
      title: "Rick.and.Morty.S05.1080p",
      files: [{ name: "Rick and Morty - E06.mkv", size: 1, link: "l" }],
    });
    expect(seriesSubdir("Rick and Morty - E06.mkv", e)).toBe("Rick and Morty/Saison 5");
  });

  it("laisse à la racine une entrée TMDB film", () => {
    const e = entry({ tmdb: tmdb("movie", "Movie") });
    expect(seriesSubdir("Movie.S01E01.mkv", e)).toBeUndefined();
  });
});
