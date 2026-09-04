import { formatSize } from "@/lib/debrid";
import type { MangaEntry, MangaVolume } from "@/lib/mangaLibrary";
import { BookOpen, Check, Download, Loader2, Trash2 } from "lucide-react";

interface MangaVolumeListProps {
  entry: MangaEntry;
  /** Cles `${infoHash}:${fileName}` des tomes en cours de telechargement. */
  downloading: Set<string>;
  onRead: (volume: MangaVolume) => void;
  onDownload: (volume: MangaVolume) => void;
  onToggleRead: (volume: MangaVolume) => void;
  /** Retire un tome importe dont le fichier a disparu du disque. */
  onRemoveVolume: (volume: MangaVolume) => void;
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
  onRemoveVolume,
}: MangaVolumeListProps) {
  return (
    <ul className="flex flex-col gap-1">
      {entry.volumes.map((volume) => {
        const busy = downloading.has(volumeKey(volume));
        const local = volume.source === "local";
        // Un tome importe sans fichier local est perdu : il n'a aucun lien
        // AllDebrid derriere lui, seul un nouvel import le ramene.
        const lost = local && !volume.localPath;
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
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ring-1 transition-colors ${
                volume.read
                  ? "bg-emerald-500 text-white ring-emerald-500"
                  : "bg-zinc-200 text-transparent ring-black/10 hover:bg-zinc-300 dark:bg-zinc-800 dark:ring-white/10 dark:hover:bg-zinc-700"
              }`}
            >
              <Check className="h-3 w-3" strokeWidth={3} />
            </button>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-zinc-800 dark:text-zinc-200">
                {volume.number !== null ? `Tome ${volume.number}` : volume.fileName}
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {formatSize(volume.fileSize)}
                {local && " · import local"}
                {progress !== null && !volume.read && ` · lu à ${progress} %`}
                {lost
                  ? " · fichier introuvable"
                  : !volume.localPath && !local && " · non téléchargé"}
              </p>
            </div>

            {lost ? (
              <button
                onClick={() => onRemoveVolume(volume)}
                title="Retirer ce tome de l'œuvre"
                className="flex h-7 flex-none items-center gap-1.5 rounded-lg bg-red-500/10 px-2.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-500/20 dark:bg-red-500/15 dark:text-red-400 dark:hover:bg-red-500/25"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Retirer
              </button>
            ) : volume.localPath ? (
              <button
                onClick={() => onRead(volume)}
                className="flex h-7 flex-none items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-400 dark:hover:bg-emerald-500/25"
              >
                <BookOpen className="h-3.5 w-3.5" />
                Lire
              </button>
            ) : (
              <button
                disabled={busy}
                onClick={() => onDownload(volume)}
                className="flex h-7 flex-none items-center gap-1.5 rounded-lg bg-indigo-600 px-2.5 text-xs font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                Télécharger
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
