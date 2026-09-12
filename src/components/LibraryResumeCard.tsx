import { FadeImage } from "@/components/FadeImage";
import type { DebridControls } from "@/components/libraryParts";
import { episodeLabel, toggleFile, type LibraryEntry } from "@/lib/library";
import { fileDisplayName, isItemWatched, subjectTitle, subjectTmdb } from "@/lib/libraryTitle";
import { setResume, type ResumeTarget } from "@/lib/resumeWatch";
import { useTmdbDetail, useTmdbSeasons } from "@/lib/useTitleTmdb";
import { Loader2, Play } from "lucide-react";
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
    <div
      onClick={() =>
        onOpen(
          subject.kind === "entry" ? subject.entry.infoHash : null,
          subject.kind === "group" ? subject.group.tmdbId : null,
        )
      }
      className="flex cursor-pointer items-center gap-3 overflow-hidden rounded-2xl bg-white/70 p-2 ring-1 ring-black/5 transition-colors hover:bg-white dark:bg-zinc-900/60 dark:ring-white/10 dark:hover:bg-zinc-900"
    >
      <div
        className={`h-14 flex-none overflow-hidden rounded-lg bg-zinc-200 dark:bg-zinc-800 ${
          poster ? "aspect-[2/3]" : "aspect-video"
        }`}
      >
        {still && (
          <FadeImage
            src={`https://image.tmdb.org/t/p/w300${still}`}
            alt=""
            decoding="async"
            className="h-full w-full object-cover"
          />
        )}
        {poster && (
          <FadeImage
            src={`https://image.tmdb.org/t/p/w154${poster}`}
            alt=""
            decoding="async"
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-900 dark:text-white">
          {subjectTitle(subject, simple)}
        </p>
        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
          {label ? (
            <span className="font-mono tracking-tight text-indigo-500 dark:text-indigo-300">
              {label}
            </span>
          ) : null}
          {label ? " · " : null}
          {name}
        </p>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          play();
        }}
        disabled={busy}
        title="Lancer l'épisode dans VLC"
        className="mr-1 flex h-9 w-9 flex-none items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 transition-transform hover:scale-110 active:scale-95 disabled:opacity-40 dark:bg-emerald-500/15 dark:text-emerald-400"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Play className="h-4 w-4 fill-current" />
        )}
      </button>
    </div>
  );
}
