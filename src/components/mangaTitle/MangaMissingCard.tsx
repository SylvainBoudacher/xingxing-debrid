import { MangaVolumeCover } from "@/components/mangaTitle/MangaVolumeCover";
import type { ShelfContext } from "@/components/mangaTitle/volumeActions";
import { Search } from "lucide-react";

interface MangaMissingCardProps {
  ctx: ShelfContext;
  number: number;
  coverFileName: string | null;
}

// Tome paru absent de la bibliothèque : sa place reste visible sur l'étagère.
export function MangaMissingCard({ ctx, number, coverFileName }: MangaMissingCardProps) {
  return (
    <button
      onClick={ctx.onFindMore}
      disabled={ctx.selecting}
      title="Chercher ce tome"
      className="group block w-full text-left disabled:pointer-events-none disabled:opacity-40"
    >
      <div className="relative overflow-hidden rounded-lg ring-1 ring-black/15 transition-all duration-300 group-hover:-translate-y-1 dark:ring-white/15">
        <MangaVolumeCover
          mangaId={ctx.mangaId}
          coverFileName={coverFileName}
          fallbackFileName={ctx.fallbackFileName}
          number={number}
          className="opacity-35 grayscale transition-opacity duration-300 group-hover:opacity-60"
        />
        <span className="absolute inset-x-1.5 bottom-1.5 flex items-center justify-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-200">
          <Search className="h-2.5 w-2.5" />
          Manquant
        </span>
      </div>
      <p className="mt-2 truncate text-xs font-medium text-zinc-400 dark:text-zinc-500">
        Tome {number}
      </p>
      <p className="text-[11px] text-zinc-400 dark:text-zinc-600">Pas dans la bibliothèque</p>
    </button>
  );
}
