import { MangaVolumeCover } from "@/components/mangaTitle/MangaVolumeCover";
import { MangaVolumeMenu } from "@/components/mangaTitle/MangaVolumeMenu";
import { openVolume, volumeKey, type ShelfContext } from "@/components/mangaTitle/volumeActions";
import { formatSize } from "@/lib/debrid";
import type { MangaVolume } from "@/lib/mangaLibrary";
import { isLostVolume, volumeLabel, volumeProgress } from "@/lib/mangaShelf";
import { Check, CloudDownload, Loader2, TriangleAlert } from "lucide-react";

interface MangaVolumeCardProps {
  ctx: ShelfContext;
  volume: MangaVolume;
  coverFileName: string | null;
}

export function MangaVolumeCard({ ctx, volume, coverFileName }: MangaVolumeCardProps) {
  const key = volumeKey(volume);
  const busy = ctx.actions.downloading.has(key);
  const selected = ctx.selected.has(key);
  const lost = isLostVolume(volume);
  const progress = volume.read ? null : volumeProgress(volume);
  const remote = !volume.localPath && !lost;

  return (
    <div className="group relative">
      <button
        onClick={() => openVolume(ctx, volume)}
        title={
          ctx.selecting ? undefined : volume.localPath ? "Lire" : lost ? undefined : "Télécharger"
        }
        className="block w-full text-left"
      >
        <div
          className={`relative overflow-hidden rounded-lg shadow-sm ring-1 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_16px_32px_-12px_rgba(0,0,0,0.35)] ${
            selected ? "ring-2 ring-indigo-500" : "ring-black/10 dark:ring-white/10"
          }`}
        >
          <MangaVolumeCover
            mangaId={ctx.mangaId}
            coverFileName={coverFileName}
            fallbackFileName={ctx.fallbackFileName}
            number={volume.number}
            className={remote ? "opacity-75 saturate-50" : ""}
          />

          {ctx.selecting ? (
            <span
              className={`absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 shadow backdrop-blur-sm ${
                selected
                  ? "border-indigo-500 bg-indigo-500 text-white"
                  : "border-white/80 bg-black/40"
              }`}
            >
              {selected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
            </span>
          ) : (
            <span className="absolute left-1.5 top-1.5 flex gap-1">
              {volume.read && (
                <span className="flex items-center gap-0.5 rounded-md bg-emerald-600/90 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  Lu
                </span>
              )}
              {remote && (
                <span
                  title="Non téléchargé"
                  className="flex h-5 w-5 items-center justify-center rounded-md bg-black/60 text-white"
                >
                  <CloudDownload className="h-3 w-3" />
                </span>
              )}
            </span>
          )}

          {lost && (
            <span className="absolute inset-x-1.5 bottom-1.5 flex items-center justify-center gap-1 rounded-md bg-red-600/90 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              <TriangleAlert className="h-2.5 w-2.5" />
              Fichier introuvable
            </span>
          )}

          {progress !== null && (
            <div className="absolute inset-x-0 bottom-0 h-1 bg-black/40">
              <div className="h-full bg-emerald-400" style={{ width: `${progress}%` }} />
            </div>
          )}

          {busy && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          )}
        </div>

        <p className="mt-2 truncate text-xs font-medium text-zinc-900 dark:text-white">
          {volumeLabel(volume)}
        </p>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
          {formatSize(volume.fileSize)}
          {progress !== null && ` · ${progress} %`}
        </p>
      </button>

      {!ctx.selecting && (
        <MangaVolumeMenu
          volume={volume}
          busy={busy}
          onRead={() => ctx.actions.onRead(volume)}
          onDownload={() => ctx.actions.onDownload(volume)}
          onToggleRead={() => ctx.actions.onToggleRead(volume)}
          onRemove={() => ctx.actions.onRemoveVolume(volume)}
          className="absolute right-1.5 top-1.5 bg-black/55 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/75 focus:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100"
        />
      )}
    </div>
  );
}
