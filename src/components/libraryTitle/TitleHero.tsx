import { ExpandableText } from "@/components/ExpandableText";
import { FadeImage } from "@/components/FadeImage";
import { MagnetProgress } from "@/components/MagnetProgress";
import { ReleaseTagBadges } from "@/components/ReleaseTagBadges";
import { TmdbGenres } from "@/components/TmdbGenres";
import { formatSize } from "@/lib/debrid";
import type { TmdbMeta } from "@/lib/library";
import { formatRuntime } from "@/lib/libraryTitle";
import { hasReleaseTags, parseReleaseTags } from "@/lib/releaseTags";
import type { MagnetEntry } from "@/lib/services/allDebrid";
import { Clapperboard, Star } from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";

interface TitleHeroProps {
  title: string;
  tmdb?: TmdbMeta;
  tmdbKey?: string;
  backdropPath: string | null;
  // Durée d'un film, en minutes.
  runtime: number | null;
  size: number;
  sectionCount: number;
  sectionNoun: "saison" | "dossier";
  watched: number;
  total: number;
  // Nom brut de la release d'une entrée seule, pour ses tags (qualité, langues).
  releaseName?: string;
  showScope: boolean;
  magnet?: MagnetEntry;
  onCancelDebrid?: () => void;
  cancellingDebrid?: boolean;
  // Entrée C411 / Nyaa sans métadonnées : propose de la compléter.
  onCompleteTmdb?: () => void;
  // Fiche prête : texte et actions apparaissent autour de la jaquette.
  revealed: boolean;
  // Boutons d'action sous la présentation.
  children: ReactNode;
}

export function TitleHero({
  title,
  tmdb,
  tmdbKey,
  backdropPath,
  runtime,
  size,
  sectionCount,
  sectionNoun,
  watched,
  total,
  releaseName,
  showScope,
  magnet,
  onCancelDebrid,
  cancellingDebrid,
  onCompleteTmdb,
  revealed,
  children,
}: TitleHeroProps) {
  const tags = releaseName ? parseReleaseTags(releaseName) : null;

  return (
    <div className="relative">
      {/* Remonte sous la barre du haut, transparente tant qu'on n'a pas défilé. */}
      {/* Hauteur fixée par la présence de TMDB, pas par le bandeau : s'il arrive
          après le délai de préchargement, rien ne se décale. */}
      <div
        className={`relative -mt-14 w-full overflow-hidden ${tmdb ? "h-80" : "h-44"} ${
          backdropPath
            ? ""
            : "bg-gradient-to-br from-indigo-500/25 via-zinc-200 to-zinc-300 dark:from-indigo-500/20 dark:via-zinc-800 dark:to-zinc-900"
        }`}
      >
        {backdropPath && (
          <FadeImage
            src={`https://image.tmdb.org/t/p/w1280${backdropPath}`}
            alt=""
            decoding="async"
            className="h-full w-full object-cover object-[center_25%]"
          />
        )}
        {/* Plus opaque sur le tiers bas : le titre y est posé. */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#f4f6fc] via-[#f4f6fc]/60 via-30% to-transparent dark:from-black dark:via-black/60" />
      </div>

      {/* Jaquette et texte alignés en haut, remontés ensemble sur le bandeau. */}
      <div className="relative mx-auto -mt-24 flex max-w-4xl items-start gap-6 px-6">
        {/* Point d'arrivée du vol de la jaquette depuis la grille. */}
        <div
          data-hero-poster
          className="aspect-[2/3] w-36 flex-none overflow-hidden rounded-xl bg-zinc-200 shadow-2xl ring-1 ring-black/10 dark:bg-zinc-800 dark:ring-white/10"
        >
          {tmdb?.posterPath ? (
            <FadeImage
              src={`https://image.tmdb.org/t/p/w342${tmdb.posterPath}`}
              alt={title}
              decoding="async"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center px-3 text-center text-xs text-zinc-500 dark:text-zinc-400">
              {title}
            </div>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="min-w-0 flex-1"
        >
          <h1 className="text-2xl font-bold leading-tight tracking-tight text-zinc-900 dark:text-white">
            {title}
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-600 dark:text-zinc-300">
            {tmdb?.year && <span>{tmdb.year}</span>}
            {tmdb && tmdb.voteAverage > 0 && (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <Star className="h-3 w-3 fill-amber-400" />
                {tmdb.voteAverage.toFixed(1)}
              </span>
            )}
            {runtime ? <span>{formatRuntime(runtime)}</span> : null}
            {sectionCount > 1 && (
              <span>
                {sectionCount} {sectionNoun}s
              </span>
            )}
            {size > 0 && <span>{formatSize(size)}</span>}
            {total > 1 && (
              <span>
                {watched}/{total} vus
              </span>
            )}
          </div>
          {tags && hasReleaseTags(tags) && (
            <ReleaseTagBadges tags={tags} showScope={showScope} className="mt-2" />
          )}
          {tmdb && (
            <TmdbGenres
              mediaType={tmdb.mediaType}
              id={tmdb.id}
              genreIds={tmdb.genreIds}
              tmdbKey={tmdbKey}
              className="mt-2"
            />
          )}
          {tmdb?.overview && <ExpandableText text={tmdb.overview} lines={3} className="mt-3" />}
          {onCompleteTmdb && (
            <button
              onClick={onCompleteTmdb}
              className="mt-3 flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-2.5 py-1 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-500/20 dark:text-indigo-300"
            >
              <Clapperboard className="h-3.5 w-3.5" />
              Compléter via TMDB
            </button>
          )}
          {magnet && (
            <MagnetProgress
              magnet={magnet}
              className="mt-3"
              onCancel={onCancelDebrid}
              cancelling={cancellingDebrid}
            />
          )}
          {total > 1 && (
            <div className="mt-3 h-1.5 w-full max-w-md overflow-hidden rounded-full bg-black/[0.07] dark:bg-white/[0.08]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all"
                style={{ width: `${Math.round((watched / total) * 100)}%` }}
              />
            </div>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2">{children}</div>
        </motion.div>
      </div>
    </div>
  );
}
