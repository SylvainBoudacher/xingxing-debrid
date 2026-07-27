import { describe, expect, it } from "vitest";
import type { C411Torrent } from "@/lib/c411";
import type { MangaItem } from "@/lib/mangaItem";
import {
  candidateTitles,
  filterMangaReleases,
  sortMangaReleases,
  type TitleCandidate,
} from "@/lib/mangaReleases";
import { normalize } from "@/lib/normalizeTitle";

/** Titres complets, forme la plus courante dans ces tests. */
function full(...titles: string[]): TitleCandidate[] {
  return titles.map((title) => ({ title, root: false }));
}

function torrent(name: string, over: Partial<C411Torrent> = {}): C411Torrent {
  return {
    infoHash: name,
    name,
    size: 1_000_000,
    seeders: 10,
    category: { id: 2 },
    subcategory: { slug: "manga" },
    ...over,
  };
}

const attackOnTitan: MangaItem = {
  id: "529d7d4e",
  title: "L'attaque des titans",
  titleFr: "L'attaque des titans",
  titleEn: "Attack on Titan",
  titleRomaji: "Shingeki no Kyojin",
  coverFileName: null,
  year: "2009",
  status: "completed",
  lastVolume: 34,
  description: "",
  tags: [],
};

describe("candidateTitles", () => {
  it("place le titre francais en premier", () => {
    expect(candidateTitles(attackOnTitan)).toEqual(
      full("L'attaque des titans", "Attack on Titan", "Shingeki no Kyojin"),
    );
  });

  it("ajoute les alias et ignore les doublons normalises", () => {
    const titles = candidateTitles(attackOnTitan, ["L'Attaque Des Titans", "SNK"]);
    expect(titles.map((c) => c.title)).toContain("SNK");
    expect(titles.filter((c) => normalize(c.title) === "l attaque des titans")).toHaveLength(1);
  });

  it("ignore les titres absents", () => {
    const item = { ...attackOnTitan, titleFr: null, titleRomaji: null };
    expect(candidateTitles(item)).toEqual(full("Attack on Titan"));
  });

  it("ajoute la racine des titres a sous-titre, apres les titres complets", () => {
    const item = {
      ...attackOnTitan,
      titleFr: "Mushoku Tensei : Nouvelle vie, nouvelle chance",
      titleEn: "Mushoku Tensei: Jobless Reincarnation",
      titleRomaji: null,
    };
    expect(candidateTitles(item)).toEqual([
      { title: "Mushoku Tensei : Nouvelle vie, nouvelle chance", root: false },
      { title: "Mushoku Tensei: Jobless Reincarnation", root: false },
      { title: "Mushoku Tensei", root: true },
    ]);
  });

  it("ne remplace pas un titre complet par une racine identique", () => {
    const item = {
      ...attackOnTitan,
      titleFr: "Naruto",
      titleEn: "Naruto - Shonen",
      titleRomaji: null,
    };
    expect(candidateTitles(item)).toEqual(full("Naruto", "Naruto - Shonen"));
  });
});

describe("filterMangaReleases", () => {
  const candidates = candidateTitles(attackOnTitan);

  it("retient les releases dont le nom commence par un titre candidat", () => {
    const releases = filterMangaReleases(
      [
        torrent("L'Attaque.des.Titans.T05.Isayama.FR.[CBZ]-NOTAG"),
        torrent("Shingeki.no.Kyojin.T06.FR.[CBZ]-NOTAG"),
        torrent("Berserk.T42.FR.[CBZ]-NOTAG"),
      ],
      candidates,
    );
    expect(releases.map((r) => r.span)).toEqual([
      { kind: "single", number: 5 },
      { kind: "single", number: 6 },
    ]);
  });

  it("ne retient pas un titre qui n'est qu'un prefixe partiel de mot", () => {
    const releases = filterMangaReleases(
      [torrent("Berserker.T01.FR.[CBZ]-NOTAG")],
      full("Berserk"),
    );
    expect(releases).toHaveLength(0);
  });

  it("marque comme non exact un derive dont le titre est suivi d'autre chose", () => {
    const releases = filterMangaReleases(
      [
        torrent("Naruto.T05.FR.[CBZ]-NOTAG"),
        torrent("Naruto.Gaiden.T01.FR.[CBZ]-NOTAG"),
        torrent("Naruto.[INTEGRALE].FR.[CBZ]-NOTAG"),
      ],
      full("Naruto"),
    );
    expect(releases.map((r) => r.exact)).toEqual([true, false, true]);
  });

  it("remonte le format et les metadonnees du torrent", () => {
    const [release] = filterMangaReleases(
      [torrent("Naruto.[INTEGRALE].FR.[PDF]-NOTAG", { size: 42, seeders: 7 })],
      full("Naruto"),
    );
    expect(release).toMatchObject({ format: "PDF", size: 42, seeders: 7 });
  });

  it("rattache un nom au prefixe le plus long, pas au premier trouve", () => {
    const mushoku = candidateTitles({
      ...attackOnTitan,
      titleFr: "Mushoku Tensei : Nouvelle vie, nouvelle chance",
      titleEn: null,
      titleRomaji: null,
    });
    const releases = filterMangaReleases(
      [
        torrent("Mushoku.Tensei.Nouvelle.vie.nouvelle.chance.T05.FR.[CBZ]-NOTAG"),
        torrent("Mushoku.Tensei.T06.FR.[CBZ]-NOTAG"),
      ],
      mushoku,
    );
    expect(releases).toMatchObject([
      { exact: true, root: false },
      { exact: true, root: true },
    ]);
  });
});

describe("sortMangaReleases", () => {
  it("classe les releases exactes, puis les lots les plus complets, puis les seeders", () => {
    const releases = filterMangaReleases(
      [
        torrent("Naruto.Gaiden.T01.FR.[CBZ]-NOTAG", { seeders: 99 }),
        torrent("Naruto.T05.FR.[CBZ]-NOTAG", { seeders: 1 }),
        torrent("Naruto.T05.FR.[CBZ]-AUTRE", { seeders: 50 }),
        torrent("Naruto.[T01.T72].FR.[CBZ]-NOTAG", { seeders: 2 }),
      ],
      full("Naruto"),
    );
    expect(sortMangaReleases(releases).map((r) => r.torrentName)).toEqual([
      "Naruto.[T01.T72].FR.[CBZ]-NOTAG",
      "Naruto.T05.FR.[CBZ]-AUTRE",
      "Naruto.T05.FR.[CBZ]-NOTAG",
      "Naruto.Gaiden.T01.FR.[CBZ]-NOTAG",
    ]);
  });

  it("place un tome trouve par la racine sous le meme tome trouve par le titre complet", () => {
    const releases = filterMangaReleases(
      [
        torrent("Mushoku.Tensei.T06.FR.[CBZ]-NOTAG", { seeders: 99 }),
        torrent("Mushoku.Tensei.Roxy.Gaiden.T01.FR.[CBZ]-NOTAG", { seeders: 80 }),
        torrent("Mushoku.Tensei.Nouvelle.vie.T05.FR.[CBZ]-NOTAG", { seeders: 1 }),
      ],
      [
        { title: "Mushoku Tensei Nouvelle vie", root: false },
        { title: "Mushoku Tensei", root: true },
      ],
    );
    expect(sortMangaReleases(releases).map((r) => r.torrentName)).toEqual([
      "Mushoku.Tensei.Nouvelle.vie.T05.FR.[CBZ]-NOTAG",
      "Mushoku.Tensei.T06.FR.[CBZ]-NOTAG",
      "Mushoku.Tensei.Roxy.Gaiden.T01.FR.[CBZ]-NOTAG",
    ]);
  });
});
