import { Info, Search } from "lucide-react";

interface TitleMissingNoteProps {
  episodes: number[];
  onFindMore?: () => void;
}

// Épisodes diffusés de la saison absents de la bibliothèque.
export function TitleMissingNote({ episodes, onFindMore }: TitleMissingNoteProps) {
  const n = episodes.length;
  const plural = n > 1 ? "s" : "";

  return (
    <div className="flex items-center gap-3 border-t border-dashed border-black/10 px-4 py-3 dark:border-white/10">
      <Info className="h-4 w-4 flex-none text-zinc-400" />
      <span className="flex-1 text-xs text-zinc-500 dark:text-zinc-400">
        {n} épisode{plural} manquant{plural} dans cette saison
        {n <= 6 && ` (${episodes.map((e) => `E${e}`).join(", ")})`}
      </span>
      {onFindMore && (
        <button
          onClick={onFindMore}
          className="flex h-7 flex-none items-center gap-1.5 rounded-lg bg-black/5 px-2.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-black/10 dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-white/15"
        >
          <Search className="h-3.5 w-3.5" />
          Chercher
        </button>
      )}
    </div>
  );
}
