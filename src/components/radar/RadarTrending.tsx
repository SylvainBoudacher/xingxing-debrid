import { SearchSuggestions } from "@/components/SearchSuggestions";
import { queryClient } from "@/lib/queryClient";
import { feed, tmdbKeys } from "@/lib/services/tmdb";
import { mapTmdb, type TmdbItem } from "@/lib/tmdbItem";
import { Flame } from "lucide-react";
import { useEffect, useState } from "react";

const PER_TYPE = 4;

async function fetchTrending(tmdbKey: string): Promise<TmdbItem[]> {
  const [movies, shows] = await Promise.all(
    (["movie", "tv"] as const).map((mt) =>
      queryClient.fetchQuery({
        queryKey: tmdbKeys.feed("trending", mt, 1),
        queryFn: () => feed("trending", mt, 1, tmdbKey),
        staleTime: 10 * 60_000,
      }),
    ),
  );
  const a = movies.results.slice(0, PER_TYPE).map((r) => mapTmdb(r, "movie"));
  const b = shows.results.slice(0, PER_TYPE).map((r) => mapTmdb(r, "tv"));
  return a.flatMap((m, i) => (b[i] ? [m, b[i]] : [m]));
}

interface RadarTrendingProps {
  tmdbKey: string;
  ownedKeys: Set<string>;
  onPick: (item: TmdbItem) => void;
}

export function RadarTrending({ tmdbKey, ownedKeys, onPick }: RadarTrendingProps) {
  const [items, setItems] = useState<TmdbItem[]>([]);
  const [highlighted, setHighlighted] = useState(-1);

  useEffect(() => {
    let stale = false;
    fetchTrending(tmdbKey)
      .then((list) => {
        if (!stale) setItems(list);
      })
      .catch(() => {});
    return () => {
      stale = true;
    };
  }, [tmdbKey]);

  if (items.length === 0) return null;

  return (
    <div className="-mx-3">
      <p className="flex items-center gap-1.5 px-3 pt-3 pb-1 text-xs font-medium text-zinc-500">
        <Flame className="h-3.5 w-3.5 text-orange-500" />
        Tendances de la semaine
      </p>
      <SearchSuggestions
        suggestions={items}
        ownedKeys={ownedKeys}
        highlightedIndex={highlighted}
        onSelect={onPick}
        onHover={setHighlighted}
      />
    </div>
  );
}
