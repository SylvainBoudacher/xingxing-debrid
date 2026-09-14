import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { MangaVolume } from "@/lib/mangaLibrary";
import { isLostVolume } from "@/lib/mangaShelf";
import { BookOpen, Check, Download, MoreHorizontal, Trash2 } from "lucide-react";

interface MangaVolumeMenuProps {
  volume: MangaVolume;
  busy: boolean;
  onRead: () => void;
  onDownload: () => void;
  onToggleRead: () => void;
  onRemove: () => void;
  className?: string;
}

// Actions d'un tome, partagées par la carte et la ligne.
export function MangaVolumeMenu({
  volume,
  busy,
  onRead,
  onDownload,
  onToggleRead,
  onRemove,
  className = "",
}: MangaVolumeMenuProps) {
  const lost = isLostVolume(volume);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          aria-label="Actions du tome"
          className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${className}`}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        {!lost && (
          <DropdownMenuItem onClick={onRead}>
            <BookOpen className="h-4 w-4" />
            Lire
          </DropdownMenuItem>
        )}
        {!lost && !volume.localPath && (
          <DropdownMenuItem onClick={onDownload} disabled={busy}>
            <Download className="h-4 w-4" />
            Télécharger
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={onToggleRead}>
          <Check className="h-4 w-4" strokeWidth={volume.read ? 3 : 2} />
          {volume.read ? "Marquer comme non lu" : "Marquer comme lu"}
        </DropdownMenuItem>
        {lost && (
          <DropdownMenuItem
            onClick={onRemove}
            className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
            Retirer ce tome
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
