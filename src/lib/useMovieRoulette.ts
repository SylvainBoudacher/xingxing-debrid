import { networkErrorMessage } from "@/lib/networkError";
import { pickPoolPage, usablePool, POOL_MIN } from "@/lib/roulettePool";
import { buildStrip } from "@/lib/rouletteStrip";
import { discoverByGenres, tmdbKeys } from "@/lib/services/tmdb";
import { cachedTmdb } from "@/lib/tmdbCache";
import type { TmdbItem } from "@/lib/tmdbItem";
import { useState } from "react";

export type RouletteStatus = "idle" | "loading" | "spinning" | "revealed";

export const EMPTY_POOL_MESSAGE = "Pas assez de films pour ce genre, essayez d'en cocher un autre.";
export const ALL_OWNED_MESSAGE =
  "Tous les films de ce tirage sont déjà dans votre bibliothèque. Décochez le filtre ou changez de genre.";

// Deux pages consecutives, soit ~40 films apres filtrage : assez pour que le
// ruban ne tourne pas sur les memes jaquettes. Trop court (genre de niche), on
// retombe sur la page 1, la plus fournie.
async function loadPool(genreIds: number[], apiKey: string): Promise<TmdbItem[]> {
  const fetchPage = (page: number) =>
    cachedTmdb(tmdbKeys.roulette(genreIds, page), () => discoverByGenres(genreIds, page, apiKey));

  const first = await fetchPage(1);
  const page = pickPoolPage(first.total_pages);
  const [a, b] =
    page === 1
      ? [first, await fetchPage(2)]
      : await Promise.all([fetchPage(page), fetchPage(page + 1)]);

  const pool = usablePool([...a.results, ...b.results]);
  return pool.length >= POOL_MIN ? pool : usablePool(first.results);
}

// idle -> loading -> spinning -> revealed. Relancer repart de loading.
export function useMovieRoulette(tmdbKey: string, ownedKeys: Set<string>) {
  const [genreIds, setGenreIds] = useState<number[]>([]);
  const [excludeOwned, setExcludeOwned] = useState(false);
  const [status, setStatus] = useState<RouletteStatus>("idle");
  const [strip, setStrip] = useState<TmdbItem[]>([]);
  const [winner, setWinner] = useState<TmdbItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Incremente a chaque tirage : remonte le ruban pour repartir de x = 0.
  const [spin, setSpin] = useState(0);

  const busy = status === "loading" || status === "spinning";

  function toggleGenre(id: number) {
    if (busy) return;
    setError(null);
    setGenreIds((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
  }

  function clearGenres() {
    if (busy) return;
    setError(null);
    setGenreIds([]);
  }

  function toggleExcludeOwned() {
    if (busy) return;
    setError(null);
    setExcludeOwned((v) => !v);
  }

  async function roll() {
    if (busy) return;
    setStatus("loading");
    setError(null);
    setWinner(null);
    try {
      const fetched = await loadPool(genreIds, tmdbKey);
      // Le filtre s'applique apres coup : TMDB ne sait pas ce qu'on possede.
      const pool = excludeOwned ? fetched.filter((m) => !ownedKeys.has(`movie-${m.id}`)) : fetched;
      if (pool.length === 0) {
        setError(fetched.length === 0 ? EMPTY_POOL_MESSAGE : ALL_OWNED_MESSAGE);
        setStatus("idle");
        return;
      }
      const picked = pool[Math.floor(Math.random() * pool.length)];
      setWinner(picked);
      setStrip(buildStrip(pool, picked));
      setSpin((s) => s + 1);
      setStatus("spinning");
    } catch (err) {
      setError(networkErrorMessage(err));
      setStatus("idle");
    }
  }

  function finishSpin() {
    setStatus((s) => (s === "spinning" ? "revealed" : s));
  }

  return {
    genreIds,
    excludeOwned,
    toggleExcludeOwned,
    status,
    strip,
    winner,
    error,
    spin,
    toggleGenre,
    clearGenres,
    roll: () => void roll(),
    finishSpin,
  };
}
