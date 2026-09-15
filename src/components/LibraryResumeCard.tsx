import vlcLogo from "@/assets/vlc.png";
import { FadeImage } from "@/components/FadeImage";
import type { DebridControls } from "@/components/libraryParts";
import { episodeLabel, toggleFile, type LibraryEntry } from "@/lib/library";
import { fileDisplayName, isItemWatched, subjectTitle, subjectTmdb } from "@/lib/libraryTitle";
import { setResume, type ResumeTarget } from "@/lib/resumeWatch";
import { useTmdbDetail, useTmdbSeasons } from "@/lib/useTitleTmdb";
import { Info, Loader2, Play } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";

const VLC_LAUNCH_DELAY_MS = 1500;

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

// Une série du bandeau « Reprendre » : grande vignette de l'épisode avec titre
// et épisode incrustés ; un clic l'envoie dans VLC.
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
  // sinon l'affiche (recadrée en 16:9).
  const still = episode?.still_path ?? detail?.backdrop_path ?? null;
  const poster = still ? null : tmdb?.posterPath;
  const label = episodeLabel(next.file.name);
  const name = episode?.name || fileDisplayName(next.file.name, simple);
  // Clé VLC propre à la carte : deux séries lancées coup sur coup gardent
  // chacune leur indicateur de chargement.
  const vlcKey = `resume-${next.entry.infoHash}-${next.file.name}`;
  const busy = debrid.bulkVlc === vlcKey;
  const [hover, setHover] = useState<{ zone: "play" | "open"; x: number; y: number } | null>(null);
  // Enfoncement tant que le clic est maintenu (hors pastille « i » et titre),
  // puis une onde part du bouton play au lancement.
  const [pressed, setPressed] = useState(false);
  const [pulse, setPulse] = useState(0);

  function play() {
    setPulse((n) => n + 1);
    debrid.openVlcMany([next.file.link], vlcKey);
    setResume(subject);
    // Laisse VLC s'ouvrir avant que la carte ne passe à l'épisode suivant.
    if (autoWatchOnPlay && !isItemWatched(next))
      setTimeout(() => onChange(toggleFile(next.entry, next.file.name)), VLC_LAUNCH_DELAY_MS);
  }

  function openDetail(e: React.MouseEvent) {
    e.stopPropagation();
    onOpen(
      subject.kind === "entry" ? subject.entry.infoHash : null,
      subject.kind === "group" ? subject.group.tmdbId : null,
    );
  }

  return (
    // Toute la carte lance l'épisode : c'est l'action attendue d'un bandeau
    // « Reprendre ». La fiche passe par la pastille « i » ou par le titre.
    <>
      <div
        onPointerMove={(e) =>
          setHover({
            zone: (e.target as HTMLElement).closest("[data-detail]") ? "open" : "play",
            x: e.clientX,
            y: e.clientY,
          })
        }
        onPointerLeave={() => {
          setHover(null);
          setPressed(false);
        }}
        onPointerDown={(e) =>
          setPressed(e.button === 0 && !(e.target as HTMLElement).closest("[data-detail]"))
        }
        onPointerUp={() => setPressed(false)}
        role="button"
        tabIndex={0}
        aria-label={`Lancer ${subjectTitle(subject, simple)} ${label ?? ""} avec VLC`}
        aria-busy={busy}
        onClick={() => !busy && play()}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget || (e.key !== "Enter" && e.key !== " ")) return;
          e.preventDefault();
          if (!busy) play();
        }}
        // Le bandeau réserve une marge autour de la grille pour que l'élévation et
        // l'ombre du survol ne soient pas rognées par son overflow-hidden.
        className={`group relative aspect-video cursor-pointer overflow-hidden rounded-2xl border border-black/5 bg-zinc-200 shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-[translate,scale,box-shadow,border-color] ease-out outline-none hover:border-black/10 focus-visible:border-indigo-400 dark:border-white/10 dark:bg-zinc-900 dark:hover:border-white/20 ${
          pressed
            ? "translate-y-0 scale-[0.98] duration-100"
            : "duration-300 hover:-translate-y-0.5 hover:shadow-[0_1px_2px_rgba(0,0,0,0.06),0_12px_28px_-14px_rgba(0,0,0,0.35)] dark:hover:shadow-[0_12px_28px_-14px_rgba(0,0,0,0.8)]"
        }`}
      >
        {/* Fondu enchaîné entre l'ancienne et la nouvelle image au changement d'épisode. */}
        <AnimatePresence initial={false}>
          <motion.div
            key={still ?? poster ?? next.file.name}
            initial={{ opacity: 0, scale: 1.12, filter: "blur(6px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            {(still || poster) && (
              <FadeImage
                src={
                  still
                    ? `https://image.tmdb.org/t/p/w780${still}`
                    : `https://image.tmdb.org/t/p/w500${poster}`
                }
                alt=""
                decoding="async"
                className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                  poster ? "object-[center_20%]" : ""
                }`}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Dégradé bas pour la lisibilité du texte incrusté. */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
        {/* Liseré lumineux intérieur, allumé au survol. */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.35),inset_0_0_24px_0_rgba(255,255,255,0.08)] transition-opacity duration-300 group-hover:opacity-100" />

        <div className="pointer-events-none absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2">
          <AnimatePresence>
            {pulse > 0 && (
              <motion.span
                key={pulse}
                initial={{ scale: 1, opacity: 0.7 }}
                animate={{ scale: 2.6, opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="absolute h-12 w-12 rounded-full border-2 border-white"
              />
            )}
          </AnimatePresence>
          <span
            className={`flex h-12 w-12 items-center justify-center rounded-full ring-1 backdrop-blur-md transition-all ${
              busy
                ? "bg-black/50 text-white ring-white/30 duration-200"
                : pressed
                  ? "scale-90 bg-white text-zinc-900 ring-white duration-100"
                  : "bg-black/40 text-white ring-white/30 duration-200 group-hover:scale-110 group-hover:bg-white group-hover:text-zinc-900 group-hover:ring-white"
            }`}
          >
            {busy ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Play className="ml-0.5 h-5 w-5 fill-current" />
            )}
          </span>
        </div>

        <button
          type="button"
          onClick={openDetail}
          data-detail
          aria-label="Voir la fiche"
          className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/45 text-white opacity-0 ring-1 ring-white/25 backdrop-blur-md transition-all duration-200 group-hover:opacity-100 hover:scale-110 hover:bg-white hover:text-zinc-900 focus-visible:opacity-100 active:scale-90"
        >
          <Info className="h-3.5 w-3.5" />
        </button>

        <div className="absolute inset-x-0 bottom-0 p-3">
          <button
            type="button"
            onClick={openDetail}
            data-detail
            className="block max-w-full truncate text-left text-sm leading-tight font-semibold text-white underline-offset-4 drop-shadow transition-opacity hover:underline active:opacity-70"
          >
            {subjectTitle(subject, simple)}
          </button>
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={next.file.name}
              initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-none mt-1.5 flex min-w-0 items-center gap-1.5"
            >
              {label ? (
                <span className="flex-none rounded-md bg-white/20 px-1.5 py-0.5 font-mono text-[10px] leading-none font-semibold tracking-tight text-white backdrop-blur-sm">
                  {label}
                </span>
              ) : null}
              <span className="truncate text-[11px] text-white/75">{name}</span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      {/* Portail : le bandeau est overflow-hidden et rognerait l'étiquette. */}
      {hover &&
        createPortal(
          <div
            style={{ left: hover.x + 14, top: hover.y + 18 }}
            className="pointer-events-none fixed z-50 flex items-center gap-1.5 rounded-md border bg-popover px-2 py-1 text-xs whitespace-nowrap text-popover-foreground shadow-md"
          >
            {hover.zone === "play" ? (
              <>
                <img src={vlcLogo} alt="" className="h-3.5 w-3.5 object-contain" />
                {busy ? "Ouverture de VLC..." : "Lancer avec VLC"}
              </>
            ) : (
              <>
                <Info className="h-3.5 w-3.5" />
                Voir la fiche
              </>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
