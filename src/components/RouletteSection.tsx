import { NetworkErrorState } from "@/components/NetworkErrorState";
import { RouletteFilters } from "@/components/RouletteFilters";
import { RouletteLegend } from "@/components/RouletteLegend";
import { RouletteResult } from "@/components/RouletteResult";
import { RouletteStrip } from "@/components/RouletteStrip";
import { scaleOf } from "@/lib/rouletteSource";
import type { TmdbItem } from "@/lib/tmdbItem";
import { ALL_OWNED_MESSAGE, EMPTY_POOL_MESSAGE, useMovieRoulette } from "@/lib/useMovieRoulette";
import { Dices, Loader2 } from "lucide-react";
import { AnimatePresence, useReducedMotion } from "motion/react";
import { useEffect } from "react";

interface RouletteSectionProps {
  tmdbKey: string;
  likedKeys: Set<string>;
  /** Cles `mediaType-id` de la bibliotheque : cible du filtre d'exclusion. */
  ownedKeys: Set<string>;
  onOpen: (item: TmdbItem) => void;
  onToggleLike: (item: TmdbItem) => void;
}

export function RouletteSection({
  tmdbKey,
  likedKeys,
  ownedKeys,
  onOpen,
  onToggleLike,
}: RouletteSectionProps) {
  const r = useMovieRoulette(tmdbKey, ownedKeys);
  const prefersReducedMotion = useReducedMotion();
  const busy = r.status === "loading" || r.status === "spinning";
  const emptyPool = r.source === "tmdb" && r.poolCount === 0;
  const scale = scaleOf(r.source);

  // Mouvement reduit : le ruban se pose sans defiler, onAnimationComplete ne
  // suffit pas a garantir le passage en revealed sur une transition nulle.
  useEffect(() => {
    if (prefersReducedMotion && r.status === "spinning") r.finishSpin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefersReducedMotion, r.status]);

  return (
    <div>
      <header className="mb-5">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Roulette</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Choisissez un vivier, lancez, laissez le ruban décider. La couleur de chaque case suit la
          note TMDB du film.
        </p>
      </header>

      <RouletteFilters
        source={r.source}
        genreIds={r.genreIds}
        excludeOwned={r.excludeOwned}
        poolCount={r.poolCount}
        disabled={busy}
        onSelectSource={r.selectSource}
        onToggleGenre={r.toggleGenre}
        onClearGenres={r.clearGenres}
        onToggleExcludeOwned={r.toggleExcludeOwned}
      />

      {/* Meme surface que la carte des filtres : sans elle la legende se perd
          sur le fond anime de la page. */}
      <div className="mt-6 rounded-2xl bg-white/60 p-1 ring-1 ring-black/5 backdrop-blur-xl dark:bg-zinc-900/50 dark:ring-white/5">
        <RouletteStrip
          strip={r.strip}
          preview={r.preview}
          scale={scale}
          spin={r.spin}
          spinning={r.status === "spinning"}
          revealed={r.status === "revealed"}
          instant={!!prefersReducedMotion}
          onSpinEnd={r.finishSpin}
        />
        <div className="px-3 pb-3">
          <RouletteLegend scale={scale} />
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <button
          onClick={r.roll}
          disabled={busy || emptyPool}
          className="flex cursor-pointer items-center gap-2.5 rounded-full bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/30 active:translate-y-px disabled:cursor-default disabled:opacity-50 disabled:shadow-none"
        >
          {r.status === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Dices className="h-4 w-4" />
          )}
          {r.status === "revealed" ? "Relancer" : "Lancer la roulette"}
        </button>
      </div>

      {/* Vivier vide : ce n'est pas une panne, relancer à l'identique ne
          donnerait rien. Le bouton Reessayer est reserve aux erreurs reseau. */}
      {(r.error === EMPTY_POOL_MESSAGE || r.error === ALL_OWNED_MESSAGE) && (
        <p className="mx-auto mt-4 max-w-md text-center text-sm text-zinc-500">{r.error}</p>
      )}
      {r.error && r.error !== EMPTY_POOL_MESSAGE && r.error !== ALL_OWNED_MESSAGE && (
        <NetworkErrorState message={r.error} onRetry={r.roll} className="mt-4" />
      )}

      <AnimatePresence mode="wait">
        {r.status === "revealed" && r.winner && (
          <RouletteResult
            key={r.winner.id}
            item={r.winner}
            scale={scale}
            liked={likedKeys.has(`movie-${r.winner.id}`)}
            tmdbKey={tmdbKey}
            onOpen={onOpen}
            onToggleLike={onToggleLike}
            onReroll={r.roll}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
