import { startDownload } from "@/lib/downloads";
import { updateVolume, type MangaVolume } from "@/lib/mangaLibrary";
import { resolveMangaTarget } from "@/lib/mangaPaths";
import { invoke } from "@tauri-apps/api/core";

/**
 * Debloque le lien AllDebrid du tome, le telecharge dans le dossier de la
 * serie, et memorise son chemin local. Retourne le chemin ecrit, ou null si le
 * telechargement a echoue ou a ete annule.
 */
export async function downloadVolume(
  mangaId: string,
  volume: MangaVolume,
  allDebridKey: string,
  seriesTitle: string,
): Promise<string | null> {
  const url = await invoke<string>("unlock_link", {
    link: volume.link,
    alldebridKey: allDebridKey,
  });
  const { dir, subdir } = await resolveMangaTarget(seriesTitle);
  const path = await startDownload(url, subdir, dir);
  if (path) {
    await updateVolume(mangaId, volume.fileName, volume.infoHash, { localPath: path });
  }
  return path;
}

/** Le fichier local a disparu : le tome redevient telechargeable. */
export function forgetLocalFile(mangaId: string, volume: MangaVolume): Promise<void> {
  return updateVolume(mangaId, volume.fileName, volume.infoHash, { localPath: undefined });
}
