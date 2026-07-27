import { BookOpen, Clapperboard } from "lucide-react";

export type LibraryTab = "media" | "manga";

interface LibraryTabsProps {
  tab: LibraryTab;
  onSwitch: (tab: LibraryTab) => void;
}

// Bascule entre les deux bibliothèques (films & séries / mangas), au même
// endroit et dans le même style que les onglets de la page Découverte.
export function LibraryTabs({ tab, onSwitch }: LibraryTabsProps) {
  return (
    <div className="mb-4 flex justify-center">
      <div className="flex rounded-full bg-white/90 p-1 ring-1 ring-black/10 dark:bg-zinc-800/80 dark:ring-white/10">
        {(["media", "manga"] as const).map((t) => (
          <button
            key={t}
            onClick={() => onSwitch(t)}
            className={`flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              tab === t
                ? "bg-indigo-600 text-white"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            {t === "media" ? (
              <Clapperboard className="h-3.5 w-3.5" />
            ) : (
              <BookOpen className="h-3.5 w-3.5" />
            )}
            {t === "media" ? "Films & Séries" : "Mangas"}
          </button>
        ))}
      </div>
    </div>
  );
}
