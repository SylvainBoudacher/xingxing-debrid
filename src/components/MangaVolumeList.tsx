import { Button } from "@/components/ui/button";
import { formatSize } from "@/lib/debrid";
import type { MangaEntry, MangaVolume } from "@/lib/mangaLibrary";
import { BookOpen, Check, Download, Loader2 } from "lucide-react";

interface MangaVolumeListProps {
  entry: MangaEntry;
  /** Cle = `${infoHash}:${fileName}` du tome en cours de telechargement. */
  downloading: string | null;
  onRead: (volume: MangaVolume) => void;
  onDownload: (volume: MangaVolume) => void;
  onToggleRead: (volume: MangaVolume) => void;
}

export function volumeKey(volume: MangaVolume): string {
  return `${volume.infoHash}:${volume.fileName}`;
}

export function MangaVolumeList({
  entry,
  downloading,
  onRead,
  onDownload,
  onToggleRead,
}: MangaVolumeListProps) {
  return (
    <ul className="flex flex-col gap-1">
      {entry.volumes.map((volume) => {
        const busy = downloading === volumeKey(volume);
        const progress =
          volume.lastPage !== undefined && volume.pageCount
            ? Math.round(((volume.lastPage + 1) / volume.pageCount) * 100)
            : null;
        return (
          <li
            key={volumeKey(volume)}
            className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
          >
            <button
              onClick={() => onToggleRead(volume)}
              aria-label={volume.read ? "Marquer comme non lu" : "Marquer comme lu"}
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                volume.read
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : "border-zinc-300 text-transparent hover:border-zinc-400 dark:border-zinc-700"
              }`}
            >
              <Check className="h-3 w-3" strokeWidth={3} />
            </button>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-zinc-800 dark:text-zinc-200">
                {volume.number !== null ? `Tome ${volume.number}` : volume.fileName}
              </p>
              <p className="text-[11px] text-zinc-500">
                {formatSize(volume.fileSize)}
                {progress !== null && !volume.read && ` · lu à ${progress} %`}
                {!volume.localPath && " · non téléchargé"}
              </p>
            </div>

            {volume.localPath ? (
              <Button size="sm" variant="outline" onClick={() => onRead(volume)}>
                <BookOpen />
                Lire
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                disabled={downloading !== null}
                onClick={() => onDownload(volume)}
              >
                {busy ? <Loader2 className="animate-spin" /> : <Download />}
                Télécharger
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
