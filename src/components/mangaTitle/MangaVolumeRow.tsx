import { SelectionBox } from "@/components/libraryParts";
import { MangaVolumeCover } from "@/components/mangaTitle/MangaVolumeCover";
import { MangaVolumeMenu } from "@/components/mangaTitle/MangaVolumeMenu";
import { openVolume, volumeKey, type ShelfContext } from "@/components/mangaTitle/volumeActions";
import { formatSize } from "@/lib/debrid";
import type { MangaVolume } from "@/lib/mangaLibrary";
import { isLostVolume, volumeLabel, volumeProgress } from "@/lib/mangaShelf";
import { BookOpen, Check, Download, Loader2 } from "lucide-react";

interface MangaVolumeRowProps {
  ctx: ShelfContext;
  volume: MangaVolume;
  coverFileName: string | null;
}

export function MangaVolumeRow({ ctx, volume, coverFileName }: MangaVolumeRowProps) {
  const key = volumeKey(volume);
  const busy = ctx.actions.downloading.has(key);
  const lost = isLostVolume(volume);
  const progress = volume.read ? null : volumeProgress(volume);

  return (
    <li
      onClick={() => ctx.selecting && ctx.onToggleSelected(volume)}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.04] ${
        ctx.selecting ? "cursor-pointer" : ""
      }`}
    >
      {ctx.selecting && <SelectionBox checked={ctx.selected.has(key)} />}
      <MangaVolumeCover
        mangaId={ctx.mangaId}
        coverFileName={coverFileName}
        fallbackFileName={ctx.fallbackFileName}
        number={volume.number}
        compact
        className="w-9 flex-none rounded ring-1 ring-black/10 dark:ring-white/10"
      />

      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate text-sm text-zinc-800 dark:text-zinc-200">
          {volumeLabel(volume)}
          {volume.read && <Check className="h-3.5 w-3.5 text-emerald-500" strokeWidth={3} />}
        </p>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
          {formatSize(volume.fileSize)}
          {volume.source === "local" && " · import local"}
          {progress !== null && ` · lu à ${progress} %`}
          {lost ? " · fichier introuvable" : !volume.localPath && " · non téléchargé"}
        </p>
      </div>

      {!ctx.selecting && (
        <>
          {volume.localPath ? (
            <button
              onClick={() => openVolume(ctx, volume)}
              className="flex h-7 flex-none items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-400 dark:hover:bg-emerald-500/25"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Lire
            </button>
          ) : (
            !lost && (
              <button
                disabled={busy}
                onClick={() => openVolume(ctx, volume)}
                className="flex h-7 flex-none items-center gap-1.5 rounded-lg bg-indigo-600 px-2.5 text-xs font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                Télécharger
              </button>
            )
          )}
          <MangaVolumeMenu
            volume={volume}
            busy={busy}
            onRead={() => ctx.actions.onRead(volume)}
            onDownload={() => ctx.actions.onDownload(volume)}
            onToggleRead={() => ctx.actions.onToggleRead(volume)}
            onRemove={() => ctx.actions.onRemoveVolume(volume)}
            className="flex-none text-zinc-500 hover:bg-black/5 dark:text-zinc-400 dark:hover:bg-white/10"
          />
        </>
      )}
    </li>
  );
}
