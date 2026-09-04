import { Input } from "@/components/ui/input";
import { mangaCoverUrl, type MangaItem } from "@/lib/mangaItem";
import { useMangaSearch } from "@/lib/useMangaSearch";
import { BookMarked, Loader2, Search } from "lucide-react";
import { useState } from "react";

interface MangaImportSearchProps {
  /** Ids deja dans la bibliotheque : les tomes iront dans l'entree existante. */
  knownIds: Set<string>;
  /** Titre de depart, recherche des l'ouverture (correction de fiche). */
  initialQuery?: string;
  onPick: (item: MangaItem) => void;
}

/**
 * Choix d'une œuvre dans la base MangaDex : étape 1 de l'import, et selection
 * de la fiche lors d'une correction. La recherche part a la frappe, amortie,
 * sans bouton a actionner.
 */
export function MangaImportSearch({ knownIds, initialQuery, onPick }: MangaImportSearchProps) {
  const [query, setQuery] = useState(initialQuery ?? "");
  const { results, loading } = useMangaSearch(query);

  return (
    <>
      <div className="relative p-4">
        <Search className="pointer-events-none absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Titre de l'œuvre"
          autoFocus
          className="pl-9 pr-9"
        />
        {loading && (
          <Loader2 className="absolute right-7 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-zinc-400" />
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        {results === null ? (
          <p className="py-8 text-center text-xs text-zinc-400">
            {loading
              ? "Recherche..."
              : "L'œuvre choisie sert de fiche : couverture, résumé et tags viennent de MangaDex."}
          </p>
        ) : results.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500">Aucun résultat.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {results.map((item) => {
              const cover = mangaCoverUrl(item, 256);
              return (
                <li key={item.id}>
                  <button
                    onClick={() => onPick(item)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                  >
                    {cover ? (
                      <img
                        src={cover}
                        alt=""
                        className="h-16 w-11 shrink-0 rounded object-cover ring-1 ring-black/10 dark:ring-white/10"
                      />
                    ) : (
                      <div className="flex h-16 w-11 shrink-0 items-center justify-center rounded bg-black/5 dark:bg-white/10">
                        <BookMarked className="h-4 w-4 text-zinc-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-zinc-800 dark:text-zinc-200">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-zinc-500">
                        {item.year || "Année inconnue"}
                        {knownIds.has(item.id) && " · déjà dans la bibliothèque"}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
