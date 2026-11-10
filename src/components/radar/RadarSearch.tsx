import { SearchSuggestions } from "@/components/SearchSuggestions";
import { Input } from "@/components/ui/input";
import { getCachedLibrary } from "@/lib/library";
import { ownedTmdbKeys } from "@/lib/recommendations";
import type { TmdbItem } from "@/lib/tmdbItem";
import { useTmdbSuggestions } from "@/lib/useTmdbSuggestions";
import { Loader2, Search } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useMemo, useState, type KeyboardEvent } from "react";

interface RadarSearchProps {
  tmdbKey: string;
  onPick: (item: TmdbItem) => void;
}

// Mêmes suggestions TMDB que la barre de la page principale.
export function RadarSearch({ tmdbKey, onPick }: RadarSearchProps) {
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(-1);
  const { suggestions, loading } = useTmdbSuggestions(query, true, tmdbKey);
  const ownedKeys = useMemo(() => ownedTmdbKeys(getCachedLibrary() ?? []), []);

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => (h + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => (h <= 0 ? suggestions.length - 1 : h - 1));
    } else if (e.key === "Enter" && highlighted >= 0) {
      e.preventDefault();
      onPick(suggestions[highlighted]);
    }
  }

  const Icon = loading ? Loader2 : Search;

  return (
    <div>
      <div className="relative">
        <Icon
          className={`absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400 ${loading ? "animate-spin" : ""}`}
        />
        <Input
          autoFocus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlighted(-1);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Rechercher un film, une série..."
          className="pl-9"
        />
      </div>
      <AnimatePresence>
        {query.trim().length >= 4 && suggestions.length > 0 && (
          <SearchSuggestions
            suggestions={suggestions}
            ownedKeys={ownedKeys}
            highlightedIndex={highlighted}
            onSelect={onPick}
            onHover={setHighlighted}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
