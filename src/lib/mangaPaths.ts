import { LazyStore } from "@tauri-apps/plugin-store";

const store = new LazyStore("settings.json", { defaults: {}, autoSave: false });

/** Sous-dossier des tomes quand aucun dossier manga dedie n'est configure. */
export const MANGA_SUBDIR = "manga";

// eslint-disable-next-line no-control-regex
const FORBIDDEN = /[/\\:*?"<>|\x00-\x1f]/g;

/**
 * Transforme un titre de serie en nom de dossier utilisable sur tous les OS.
 * Les caracteres interdits deviennent des tirets, les espaces et points de
 * bordure sont retires (Windows les refuse en fin de nom).
 */
export function sanitizeFolderName(title: string): string {
  const cleaned = title
    .replace(FORBIDDEN, "-")
    .replace(/^[\s.]+/, "")
    .replace(/[\s.]+$/, "")
    .slice(0, 100)
    .replace(/[\s.]+$/, "");
  return cleaned === "" ? "Manga" : cleaned;
}

/**
 * Dossier de destination d'un tome : le dossier manga dedie s'il est
 * configure, sinon le sous-dossier "manga" du dossier de telechargement.
 * Le nom de la serie forme toujours le dernier segment.
 */
export async function resolveMangaTarget(
  seriesTitle: string,
): Promise<{ dir: string; subdir: string }> {
  const folder = sanitizeFolderName(seriesTitle);
  const mangaDir = (await store.get<string>("manga_dir")) ?? "";
  if (mangaDir.trim() !== "") return { dir: mangaDir, subdir: folder };
  const downloadDir = (await store.get<string>("download_dir")) ?? "";
  return { dir: downloadDir, subdir: `${MANGA_SUBDIR}/${folder}` };
}

/**
 * Dossier parent des dossiers de series, chemin complet. Sert a replanifier
 * les deplacements quand le titre d'une oeuvre change.
 */
export async function resolveMangaRoot(): Promise<string> {
  const mangaDir = (await store.get<string>("manga_dir")) ?? "";
  if (mangaDir.trim() !== "") return mangaDir;
  const downloadDir = (await store.get<string>("download_dir")) ?? "";
  const sep = downloadDir.includes("\\") ? "\\" : "/";
  return `${downloadDir}${sep}${MANGA_SUBDIR}`;
}
