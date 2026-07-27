import type { TmdbFeed } from "@/lib/services/tmdb";
import { FEED_LABELS, FEEDS, type DiscoverTab } from "@/lib/useDiscoverFeed";
import { BookOpen, Clapperboard, Heart, Sparkles, Tv, Wand2 } from "lucide-react";
import { motion } from "motion/react";

interface DiscoverTabsProps {
  /** Repliés pendant la recherche générale */
  collapsed: boolean;
  mediaType: DiscoverTab;
  feed: TmdbFeed;
  mode: "top" | "search";
  onSwitchType: (t: Exclude<DiscoverTab, "all">) => void;
  onSwitchFeed: (f: TmdbFeed) => void;
}

// Onglets de navigation (Films, Séries, Animations, Mangas, Pour vous, Ma liste) et
// sources TMDB (Tendances, Populaires…) sous les onglets Films / Séries.
export function DiscoverTabs({
  collapsed,
  mediaType,
  feed,
  mode,
  onSwitchType,
  onSwitchFeed,
}: DiscoverTabsProps) {
  return (
    <motion.div
      initial={false}
      animate={
        collapsed
          ? { opacity: 0, y: -12, height: 0, marginBottom: 0 }
          : { opacity: 1, y: 0, height: "auto", marginBottom: 24 }
      }
      transition={{
        type: "spring",
        stiffness: 220,
        damping: 26,
        opacity: { duration: 0.15 },
      }}
      className={`overflow-hidden ${collapsed ? "pointer-events-none" : ""}`}
    >
      <div className="flex flex-wrap items-center justify-center gap-3">
        <div className="flex rounded-full bg-white/90 dark:bg-zinc-800/80 ring-1 ring-black/10 dark:ring-white/10 p-1">
          {(["movie", "tv", "animation", "recos", "likes"] as const).map((t) => (
            <button
              key={t}
              onClick={() => onSwitchType(t)}
              className={`flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                mediaType === t
                  ? "bg-indigo-600 text-white"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              {t === "movie" ? (
                <Clapperboard className="h-3.5 w-3.5" />
              ) : t === "tv" ? (
                <Tv className="h-3.5 w-3.5" />
              ) : t === "animation" ? (
                <Sparkles className="h-3.5 w-3.5" />
              ) : t === "recos" ? (
                <Wand2 className="h-3.5 w-3.5" />
              ) : (
                <Heart className="h-3.5 w-3.5" />
              )}
              {t === "movie"
                ? "Films"
                : t === "tv"
                  ? "Séries"
                  : t === "animation"
                    ? "Animations"
                    : t === "recos"
                      ? "Pour vous"
                      : "Ma liste"}
            </button>
          ))}
        </div>

        {/* Univers manga : détaché de la pilule, derrière un séparateur, pour
            qu'on voie tout de suite que ce n'est pas un onglet TMDB de plus. */}
        <span className="h-6 w-px bg-black/10 dark:bg-white/15" aria-hidden />

        <button
          onClick={() => onSwitchType("manga")}
          className={`flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium ring-1 transition-colors ${
            mediaType === "manga"
              ? "bg-indigo-600 text-white ring-indigo-500"
              : "bg-white/90 text-zinc-500 ring-black/10 hover:text-zinc-900 dark:bg-zinc-800/80 dark:text-zinc-400 dark:ring-white/10 dark:hover:text-white"
          }`}
        >
          <BookOpen className="h-3.5 w-3.5" />
          Mangas
        </button>
      </div>

      {(mediaType === "movie" || mediaType === "tv" || mediaType === "animation") &&
        mode === "top" && (
          <div className="mt-6 flex justify-center">
            <div className="flex flex-wrap justify-center gap-1.5">
              {FEEDS.map((f) => (
                <button
                  key={f}
                  onClick={() => onSwitchFeed(f)}
                  className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-medium ring-1 transition-colors ${
                    feed === f
                      ? "bg-indigo-600 text-white ring-indigo-500"
                      : "bg-white/90 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 ring-black/10 dark:ring-white/10 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  {FEED_LABELS[f]}
                </button>
              ))}
            </div>
          </div>
        )}
    </motion.div>
  );
}
