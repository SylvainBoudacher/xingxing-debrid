import {
  displayedSeasons,
  episodeRanges,
  initialRangeIndex,
  initialSection,
  rangeItems,
  subjectTmdb,
  titleSections,
  type TitleSubject,
} from "@/lib/libraryTitle";
import { queryClient } from "@/lib/queryClient";
import { loadSeriesFolders } from "@/lib/seriesFolders";
import { detail, tmdbKeys, tvSeason } from "@/lib/services/tmdb";
import { TMDB_STALE_MS } from "@/lib/tmdbCache";

// Au-delà, la fiche s'ouvre quand même (réseau lent, hors ligne).
const PRELOAD_TIMEOUT_MS = 1500;

const IMG = "https://image.tmdb.org/t/p";

// Télécharge et décode l'image : la balise <img> de la fiche l'affiche aussitôt.
function preloadImage(url: string): Promise<void> {
  const img = new Image();
  img.src = url;
  return img.decode().catch(() => undefined);
}

async function preload(subject: TitleSubject, tmdbKey: string | undefined): Promise<void> {
  const tmdb = subjectTmdb(subject);
  const tasks: Promise<unknown>[] = [];
  if (tmdb?.posterPath) tasks.push(preloadImage(`${IMG}/w342${tmdb.posterPath}`));
  if (!tmdb || !tmdbKey) {
    await Promise.all(tasks);
    return;
  }

  tasks.push(
    queryClient
      .fetchQuery({
        queryKey: tmdbKeys.detail(tmdb.mediaType, tmdb.id),
        staleTime: TMDB_STALE_MS,
        queryFn: () => detail(tmdb.mediaType, tmdb.id, tmdbKey),
      })
      .then((d) => (d.backdrop_path ? preloadImage(`${IMG}/w1280${d.backdrop_path}`) : undefined)),
  );

  // Série : saison ouverte par défaut (mêmes règles que la fiche) et vignettes
  // des épisodes affichés.
  if (subject.kind === "group") {
    const tvId = subject.group.tmdbId;
    tasks.push(
      loadSeriesFolders().then(async (folders) => {
        const section = initialSection(titleSections(subject, folders[String(tvId)] ?? null));
        if (!section) return;
        const visible = rangeItems(
          section.items,
          episodeRanges(section.items.length),
          initialRangeIndex(section.items),
        );
        const seasons = await Promise.all(
          displayedSeasons(section, visible).map((season) =>
            queryClient.fetchQuery({
              queryKey: tmdbKeys.tvSeason(tvId, season),
              staleTime: TMDB_STALE_MS,
              queryFn: () => tvSeason(tvId, season, tmdbKey),
            }),
          ),
        );
        const stills = new Set<string>();
        for (const it of visible) {
          const ep = seasons
            .find((s) => s.season_number === it.season)
            ?.episodes?.find((e) => e.episode_number === it.episode);
          if (ep?.still_path) stills.add(ep.still_path);
        }
        await Promise.all([...stills].map((p) => preloadImage(`${IMG}/w300${p}`)));
      }),
    );
  }

  await Promise.all(tasks);
}

// Charge données et images de la fiche avant son ouverture. Ne rejette jamais.
export function preloadTitle(subject: TitleSubject, tmdbKey: string | undefined): Promise<void> {
  return Promise.race([
    preload(subject, tmdbKey).catch(() => undefined),
    new Promise<void>((resolve) => setTimeout(resolve, PRELOAD_TIMEOUT_MS)),
  ]);
}
