import { FadeImage } from "@/components/FadeImage";
import type { DebridControls } from "@/components/libraryParts";
import { episodeLabel, toggleFile, type LibraryEntry } from "@/lib/library";
import { fileDisplayName, isItemWatched, subjectTitle, subjectTmdb } from "@/lib/libraryTitle";
import { setResume, type ResumeTarget } from "@/lib/resumeWatch";
import { useTmdbDetail, useTmdbSeasons } from "@/lib/useTitleTmdb";
import { ChevronRight, Loader2, Play } from "lucide-react";
import { useMemo } from "react";

interface LibraryResumeCardProps {
  target: ResumeTarget;
  // Ouvre la fiche du titre (elle s'ouvre déjà sur la saison à reprendre).
  onOpen: (hash: string | null, groupId: number | null) => void;
  onChange: (entry: LibraryEntry) => void;
  debrid: DebridControls;
  autoWatchOnPlay: boolean;
  simple: boolean;
  tmdbKey?: string;
}

// Une série du bandeau « Reprendre » : vignette de l'épisode, titre, épisode,
// et le bouton qui l'envoie dans VLC.
export function LibraryResumeCard({
  target: { subject, next },
  onOpen,
  onChange,
  debrid,
  autoWatchOnPlay,
  simple,
  tmdbKey,
}: LibraryResumeCardProps) {
  const tmdb = subjectTmdb(subject);
  const detail = useTmdbDetail(tmdb, tmdbKey);
  const tvId = tmdb?.mediaType === "tv" ? tmdb.id : null;
  const season = next.season;
  const seasons = useMemo(() => (season !== null ? [season] : []), [season]);
  const tmdbSeasons = useTmdbSeasons(tvId, seasons, tmdbKey);

  const episode =
    season !== null && next.episode !== null
      ? tmdbSeasons.get(season)?.get(next.episode)
      : undefined;
  // Vignette de l'épisode si TMDB en a une, sinon l'image large de la série,
  // sinon l'affiche (au format vertical, d'où le ratio distinct).
  const still = episode?.still_path ?? detail?.backdrop_path ?? null;
  const poster = still ? null : tmdb?.posterPath;
  const label = episodeLabel(next.file.name);
  const name = episode?.name || fileDisplayName(next.file.name, simple);
  // Clé VLC propre à la carte : deux séries lancées coup sur coup gardent
  // chacune leur indicateur de chargement.
  const vlcKey = `resume-${next.entry.infoHash}-${next.file.name}`;
  const busy = debrid.bulkVlc === vlcKey;

  function play() {
    debrid.openVlcMany([next.file.link], vlcKey);
    setResume(subject);
    if (autoWatchOnPlay && !isItemWatched(next)) onChange(toggleFile(next.entry, next.file.name));
  }

  return (
    // Bordure « in-box » plutôt qu'un ring : le bandeau anime sa hauteur dans un
    // conteneur overflow-hidden, qui rognerait un contour dessiné hors de la box.
    <div
      onClick={() =>
        onOpen(
          subject.kind === "entry" ? subject.entry.infoHash : null,
          subject.kind === "group" ? subject.group.tmdbId : null,
        )
      }
      className="group relative flex cursor-pointer items-center gap-3 rounded-2xl border border-black/5 bg-gradient-to-br from-white/80 to-white/50 p-2 transition-colors hover:border-black/10 hover:from-white hover:to-white dark:border-white/10 dark:from-zinc-900/80 dark:to-zinc-900/40 dark:hover:border-white/20 dark:hover:from-zinc-800/80 dark:hover:to-zinc-800/50"
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          play();
        }}
        disabled={busy}
        title="Lancer l'épisode dans VLC"
        // rounded-lg = rayon concentrique avec le rounded-2xl de la carte moins son p-2.
        className={`group/play relative h-16 flex-none overflow-hidden rounded-lg bg-zinc-200 dark:bg-zinc-800 ${
          poster ? "aspect-[2/3]" : "aspect-video"
        }`}
      >
        {still && (
          <FadeImage
            src={`https://image.tmdb.org/t/p/w300${still}`}
            alt=""
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        {poster && (
          <FadeImage
            src={`https://image.tmdb.org/t/p/w154${poster}`}
            alt=""
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        {/* Deux affordances distinctes : la pastille permanente dit que la
        vignette lance l'épisode, le voile ne s'allume qu'au survol de la
        vignette elle-même (survoler la carte ouvre la fiche, pas VLC). */}
        <span
          className={`absolute inset-0 flex items-center justify-center transition-colors duration-200 ${
            busy ? "bg-black/50" : "bg-black/0 group-hover/play:bg-black/50"
          }`}
        >
          <span
            className={`flex items-center justify-center rounded-full text-white backdrop-blur-sm transition-all duration-200 ${
              busy
                ? "h-8 w-8 bg-white/0"
                : "h-6 w-6 bg-black/45 ring-1 ring-white/25 group-hover/play:h-8 group-hover/play:w-8 group-hover/play:bg-white/0 group-hover/play:ring-0"
            }`}
          >
            {busy ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Play className="ml-0.5 h-3 w-3 fill-current transition-all duration-200 group-hover/play:h-5 group-hover/play:w-5" />
            )}
          </span>
        </span>
      </button>

      <div className="min-w-0 flex-1 pr-1">
        <p className="truncate text-[13px] leading-tight font-semibold text-zinc-900 dark:text-white">
          {subjectTitle(subject, simple)}
        </p>
        <div className="mt-1.5 flex min-w-0 items-center gap-1.5">
          {label ? (
            <span className="flex-none rounded-md bg-indigo-500/10 px-1.5 py-0.5 font-mono text-[10px] leading-none font-semibold tracking-tight text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-300">
              {label}
            </span>
          ) : null}
          <span className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">{name}</span>
        </div>
      </div>

      {/* Signal « ceci ouvre la fiche », réservé au survol de la carte. */}
      <ChevronRight className="mr-1 h-4 w-4 flex-none text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-zinc-600" />
    </div>
  );
}
