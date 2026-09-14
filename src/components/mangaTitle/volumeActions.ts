import type { MangaVolume } from "@/lib/mangaLibrary";

export function volumeKey(volume: MangaVolume): string {
  return `${volume.infoHash}:${volume.fileName}`;
}

// Actions sur un tome, transmises telles quelles de la section à la grille ou
// à la liste.
export interface VolumeActions {
  /** Cles `volumeKey` des tomes en cours de telechargement. */
  downloading: Set<string>;
  onRead: (volume: MangaVolume) => void;
  onDownload: (volume: MangaVolume) => void;
  onToggleRead: (volume: MangaVolume) => void;
  /** Retire un tome importe dont le fichier a disparu du disque. */
  onRemoveVolume: (volume: MangaVolume) => void;
}

export interface ShelfContext {
  mangaId: string;
  // Cover de l'oeuvre, pour les tomes que MangaDex n'illustre pas.
  fallbackFileName: string | null;
  actions: VolumeActions;
  // Mode sélection : un clic coche le tome au lieu de l'ouvrir.
  selecting: boolean;
  selected: Set<string>;
  onToggleSelected: (volume: MangaVolume) => void;
  onFindMore: () => void;
}

/** Clic principal hors sélection : lire un tome téléchargé, sinon le télécharger. */
export function openVolume(ctx: ShelfContext, volume: MangaVolume) {
  if (ctx.selecting) return ctx.onToggleSelected(volume);
  if (volume.localPath) return ctx.actions.onRead(volume);
  if (volume.source !== "local") ctx.actions.onDownload(volume);
}
