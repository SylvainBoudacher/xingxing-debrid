import { NetworkErrorState } from "@/components/NetworkErrorState";
import { RouletteGenrePicker } from "@/components/RouletteGenrePicker";
import { RouletteOwnedFilter } from "@/components/RouletteOwnedFilter";
import { RouletteResult } from "@/components/RouletteResult";
import { RouletteStrip } from "@/components/RouletteStrip";
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

  // Mouvement reduit : le ruban se pose sans defiler, onAnimationComplete ne
  // suffit pas a garantir le passage en revealed sur une transition nulle.
  useEffect(() => {
    if (prefersReducedMotion && r.status === "spinning") r.finishSpin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefersReducedMotion, r.status]);

  return (
    <div>
      <RouletteGenrePicker
        selected={r.genreIds}
        disabled={busy}
        onToggle={r.toggleGenre}
        onClear={r.clearGenres}
      />

      <div className="mt-4 flex justify-center">
        <RouletteOwnedFilter
          checked={r.excludeOwned}
          disabled={busy}
          onToggle={r.toggleExcludeOwned}
        />
      </div>

      <div className="mt-6">
        <RouletteStrip
          strip={r.strip}
          spin={r.spin}
          spinning={r.status === "spinning"}
          revealed={r.status === "revealed"}
          instant={!!prefersReducedMotion}
          onSpinEnd={r.finishSpin}
        />
      </div>

      <div className="mt-4 flex justify-center">
        <button
          onClick={r.roll}
          disabled={busy}
          className="flex cursor-pointer items-center gap-2 rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-default disabled:opacity-50"
        >
          {r.status === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Dices className="h-4 w-4" />
          )}
          {r.status === "revealed" ? "Relancer" : "Lancer la roulette"}
        </button>
      </div>

      {/* Vivier vide : ce n'est pas une panne, relancer a l'identique ne
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
