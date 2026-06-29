import type { LikedItem } from "@/lib/likes";
import type { LibraryEntry } from "@/lib/library";
import type { TmdbMediaType, TmdbRawResult } from "@/lib/services/tmdb";

// Nombre de graines interrogees : borne le cout API (1 appel /recommendations
// par graine) tout en laissant assez de signal pour le scoring croise.
export const MAX_SEEDS = 5;

// Poids des graines : un like est un signal explicite, il pese plus qu'une
// simple presence en bibliotheque.
const LIKE_WEIGHT = 2;
const LIBRARY_WEIGHT = 1;

export interface Seed {
  id: number;
  mediaType: TmdbMediaType;
  title: string;
  weight: number;
}

export interface SeedList {
  seed: Seed;
  results: TmdbRawResult[];
}

export interface ScoredReco {
  result: TmdbRawResult;
  mediaType: TmdbMediaType;
  score: number;
  // Titre de la graine qui a le plus contribue : sert au libelle "Car vous
  // avez aime ...".
  becauseOf: string;
}

function key(mediaType: TmdbMediaType, id: number): string {
  return `${mediaType}-${id}`;
}

// Choisit les graines : likes en premier (les plus recents), puis entrees de
// bibliotheque ayant des metadonnees TMDB. Deduplique, cape a MAX_SEEDS.
export function pickSeeds(likes: LikedItem[], library: LibraryEntry[]): Seed[] {
  const seen = new Set<string>();
  const seeds: Seed[] = [];
  const push = (id: number, mediaType: TmdbMediaType, title: string, weight: number) => {
    const k = key(mediaType, id);
    if (seen.has(k)) return;
    seen.add(k);
    seeds.push({ id, mediaType, title, weight });
  };
  for (const l of [...likes].sort((a, b) => b.likedAt - a.likedAt)) {
    push(l.id, l.mediaType, l.title, LIKE_WEIGHT);
  }
  for (const e of library) {
    if (e.tmdb) push(e.tmdb.id, e.tmdb.mediaType, e.tmdb.title, LIBRARY_WEIGHT);
  }
  return seeds.slice(0, MAX_SEEDS);
}

// Agrege les listes de recommandations : un titre ressorti de plusieurs graines
// monte (somme des contributions). Chaque contribution est ponderee par le
// poids de la graine et par la note TMDB du titre, pour departager. Exclut les
// titres deja possedes (ownedIds) et les graines elles-memes.
export function scoreRecommendations(lists: SeedList[], ownedIds: Set<string>): ScoredReco[] {
  const seedIds = new Set(lists.map((l) => key(l.seed.mediaType, l.seed.id)));
  const acc = new Map<string, ScoredReco & { topContribution: number }>();
  for (const { seed, results } of lists) {
    for (const r of results) {
      const k = key(seed.mediaType, r.id);
      if (ownedIds.has(k) || seedIds.has(k)) continue;
      const contribution = seed.weight * (1 + r.vote_average / 10);
      const prev = acc.get(k);
      if (prev) {
        prev.score += contribution;
        if (contribution > prev.topContribution) {
          prev.topContribution = contribution;
          prev.becauseOf = seed.title;
        }
      } else {
        acc.set(k, {
          result: r,
          mediaType: seed.mediaType,
          score: contribution,
          becauseOf: seed.title,
          topContribution: contribution,
        });
      }
    }
  }
  return [...acc.values()]
    .sort((a, b) => b.score - a.score)
    .map(({ topContribution: _drop, ...reco }) => reco);
}

// Ensemble des cles TMDB deja possedees (bibliotheque), pour exclusion.
export function ownedTmdbKeys(library: LibraryEntry[]): Set<string> {
  return new Set(library.filter((e) => e.tmdb).map((e) => key(e.tmdb!.mediaType, e.tmdb!.id)));
}
