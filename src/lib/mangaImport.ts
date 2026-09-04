import type { MangaItem } from "@/lib/mangaItem";
import {
  LOCAL_INFO_HASH,
  upsertMangaRelease,
  type MangaEntry,
  type MangaVolume,
} from "@/lib/mangaLibrary";
import { resolveMangaTarget } from "@/lib/mangaPaths";
import { volumeFromFileName } from "@/lib/parseVolume";
import { invoke } from "@tauri-apps/api/core";

/** Un fichier choisi par l'utilisateur, avant confirmation de son numero. */
export interface PlannedImport {
  /** Chemin d'origine, cle de la ligne dans le formulaire. */
  path: string;
  fileName: string;
  /** Numero de tome, devine puis corrigeable. null = tome non identifie. */
  number: number | null;
}

interface ImportResult {
  source: string;
  path: string;
  fileName: string;
  size: number;
  error: string | null;
}

export function basename(path: string): string {
  const cut = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
  return cut === -1 ? path : path.slice(cut + 1);
}

/** Prepare le formulaire d'import : un numero devine par fichier choisi. */
export function planImports(paths: string[]): PlannedImport[] {
  return paths.map((path) => {
    const fileName = basename(path);
    return { path, fileName, number: volumeFromFileName(fileName) };
  });
}

export function localVolume(result: ImportResult, number: number | null): MangaVolume {
  return {
    number,
    infoHash: LOCAL_INFO_HASH,
    // Le nom retenu est celui du fichier copie : il peut porter un suffixe
    // " (2)" si le dossier contenait deja ce nom, et sert de cle d'identite.
    fileName: result.fileName,
    fileSize: result.size,
    link: "",
    localPath: result.path,
    source: "local",
  };
}

export interface ImportOutcome {
  entry: MangaEntry | null;
  imported: number;
  failed: number;
}

/**
 * Copie les .cbz choisis dans le dossier de la serie, puis rattache les tomes
 * a l'œuvre (créée si elle n'est pas encore dans la bibliotheque). Un fichier
 * en echec de copie n'est pas ajoute, les autres passent quand meme.
 */
export async function importLocalVolumes(
  item: MangaItem,
  planned: PlannedImport[],
): Promise<ImportOutcome> {
  const { dir, subdir } = await resolveMangaTarget(item.title);
  const results = await invoke<ImportResult[]>("import_cbz", {
    sources: planned.map((p) => p.path),
    dir,
    subdir,
  });

  const volumes = results
    .map((result, i) => (result.error ? null : localVolume(result, planned[i].number)))
    .filter((v): v is MangaVolume => v !== null);

  const entry = volumes.length > 0 ? await upsertMangaRelease(item, { volumes }) : null;
  return { entry, imported: volumes.length, failed: results.length - volumes.length };
}
