import { networkErrorMessage } from "@/lib/networkError";
import {
  LETTERBOXD_POOL_SIZE,
  genresApply,
  letterboxdPool,
  type RouletteSource,
} from "@/lib/rouletteSource";
import { buildStrip, IDLE_LEN } from "@/lib/rouletteStrip";
import { loadPreview, loadVivier } from "@/lib/rouletteVivier";
import type { TmdbItem } from "@/lib/tmdbItem";
import { useEffect, useMemo, useState } from "react";

export type RouletteStatus = "idle" | "loading" | "spinning" | "revealed";

export const EMPTY_POOL_MESSAGE =
  "Aucun film ne porte tous ces genres à la fois. Décochez-en un pour élargir le tirage.";
export const ALL_OWNED_MESSAGE =
  "Tous les films de ce tirage sont déjà dans votre bibliothèque. Décochez le filtre ou changez de genre.";

function sample(items: TmdbItem[], n: number): TmdbItem[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out.slice(0, n);
}

// Apercu d'un vivier TMDB, estampille de la sélection qui l'a produit.
interface PoolInfo {
  key: string;
  count: number;
  preview: TmdbItem[];
}

// idle -> loading -> spinning -> revealed. Relancer repart de loading.
export function useMovieRoulette(tmdbKey: string, ownedKeys: Set<string>) {
  const [source, setSource] = useState<RouletteSource>("tmdb");
  const [genreIds, setGenreIds] = useState<number[]>([]);
  const [excludeOwned, setExcludeOwned] = useState(false);
  const [status, setStatus] = useState<RouletteStatus>("idle");
  const [strip, setStrip] = useState<TmdbItem[]>([]);
  const [winner, setWinner] = useState<TmdbItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Incremente a chaque tirage : remonte le ruban pour repartir de x = 0.
  const [spin, setSpin] = useState(0);
  // Alimente le ruban d'attente et le compteur, pour qu'on voie ce qu'on va
  // tirer avant de lancer.
  const [fetched, setFetched] = useState<PoolInfo | null>(null);
  const poolKey = `${source}:${genresApply(source) ? genreIds.join(",") : ""}`;

  const busy = status === "loading" || status === "spinning";

  // Le resultat est estampille de sa selection, ce qui suffit a ignorer une
  // reponse arrivee apres un changement de vivier.
  useEffect(() => {
    if (source === "letterboxd") return;
    let cancelled = false;
    loadPreview(source, genreIds, tmdbKey)
      .then(({ count, preview }) => {
        if (!cancelled) setFetched({ key: poolKey, count, preview: sample(preview, IDLE_LEN) });
      })
      // Silencieux : l'erreur reelle sera remontee par le tirage.
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [source, poolKey, genreIds, tmdbKey]);

  // Le vivier Letterboxd est dans le bundle : rien a aller chercher.
  const letterboxd = useMemo(
    () => (source === "letterboxd" ? sample(letterboxdPool(), IDLE_LEN) : null),
    [source],
  );
  const current = fetched?.key === poolKey ? fetched : null;
  const poolCount = letterboxd ? LETTERBOXD_POOL_SIZE : (current?.count ?? null);
  const preview = letterboxd ?? current?.preview ?? [];

  function selectSource(next: RouletteSource) {
    if (busy || next === source) return;
    setError(null);
    // Les classements sont deja des selections : les genres n'y ont plus cours.
    if (!genresApply(next)) setGenreIds([]);
    setSource(next);
  }

  function toggleGenre(id: number) {
    if (busy || !genresApply(source)) return;
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
      const fetchedPool = await loadVivier(source, genreIds, tmdbKey);
      // Le filtre s'applique après coup : TMDB ne sait pas ce qu'on possede.
      const pool = excludeOwned
        ? fetchedPool.filter((m) => !ownedKeys.has(`movie-${m.id}`))
        : fetchedPool;
      if (pool.length === 0) {
        setError(fetchedPool.length === 0 ? EMPTY_POOL_MESSAGE : ALL_OWNED_MESSAGE);
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
    source,
    selectSource,
    genreIds,
    excludeOwned,
    toggleExcludeOwned,
    status,
    strip,
    preview,
    poolCount,
    winner,
    error,
    spin,
    toggleGenre,
    clearGenres,
    roll: () => void roll(),
    finishSpin,
  };
}
