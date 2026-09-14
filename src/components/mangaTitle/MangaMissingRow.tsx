import { MangaVolumeCover } from "@/components/mangaTitle/MangaVolumeCover";
import type { ShelfContext } from "@/components/mangaTitle/volumeActions";
import { Search } from "lucide-react";

interface MangaMissingRowProps {
  ctx: ShelfContext;
  number: number;
  coverFileName: string | null;
}

export function MangaMissingRow({ ctx, number, coverFileName }: MangaMissingRowProps) {
  return (
    <li
      className={`flex items-center gap-3 rounded-lg px-3 py-2 ${ctx.selecting ? "opacity-40" : ""}`}
    >
      <MangaVolumeCover
        mangaId={ctx.mangaId}
        coverFileName={coverFileName}
        fallbackFileName={ctx.fallbackFileName}
        number={number}
        compact
        className="w-9 flex-none rounded opacity-40 grayscale"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-zinc-400 dark:text-zinc-500">Tome {number}</p>
        <p className="text-[11px] text-zinc-400 dark:text-zinc-600">Manquant</p>
      </div>
      {!ctx.selecting && (
        <button
          onClick={ctx.onFindMore}
          className="flex h-7 flex-none items-center gap-1.5 rounded-lg bg-black/5 px-2.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-black/10 dark:bg-white/10 dark:text-zinc-300 dark:hover:bg-white/15"
        >
          <Search className="h-3.5 w-3.5" />
          Chercher
        </button>
      )}
    </li>
  );
}
