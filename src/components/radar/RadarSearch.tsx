import { Input } from "@/components/ui/input";
import { networkErrorMessage } from "@/lib/networkError";
import { searchMulti } from "@/lib/services/tmdb";
import { mapTmdb, type TmdbItem } from "@/lib/tmdbItem";
import { useState, type FormEvent } from "react";

interface RadarSearchProps {
  tmdbKey: string;
  onPick: (item: TmdbItem) => void;
}

export function RadarSearch({ tmdbKey, onPick }: RadarSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TmdbItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function search(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const response = await searchMulti(query.trim(), 1, tmdbKey);
      setResults(
        response.results.flatMap((r) =>
          r.media_type === "person" ? [] : [mapTmdb(r, r.media_type)],
        ),
      );
    } catch (err) {
      setError(networkErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={(e) => void search(e)}>
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un film ou une série, puis Entrée"
        />
      </form>
      {loading && <p className="text-sm text-zinc-500">Recherche en cours...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {results?.length === 0 && <p className="text-sm text-zinc-500">Aucun résultat.</p>}
      <div className="space-y-1">
        {results?.map((item) => (
          <button
            key={`${item.mediaType}-${item.id}`}
            onClick={() => onPick(item)}
            className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg p-2 text-left text-sm text-zinc-800 transition-colors hover:bg-black/5 dark:text-zinc-100 dark:hover:bg-white/10"
          >
            <span className="truncate">{item.title}</span>
            <span className="shrink-0 text-xs text-zinc-500">
              {item.mediaType === "movie" ? "Film" : "Série"}
              {item.year && `, ${item.year}`}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
