import { flattenFiles, isVideoFile, type DebridFile } from "@/lib/debrid";
import { recordDownload, type LibraryProvider, type TmdbMeta } from "@/lib/library";
import { invoke } from "@tauri-apps/api/core";

export interface DebridRelease {
  infoHash: string;
  /** Nom de la release, affiché tant qu'AllDebrid n'a pas renvoyé le sien */
  title: string;
  /** Magnet direct (nyaa) ; sinon le .torrent est récupéré sur C411 via infoHash */
  magnet?: string;
  provider: LibraryProvider;
  category: number;
  size: number;
  tmdb?: TmdbMeta;
}

export interface SentRelease {
  name: string;
  ready: boolean;
  files: DebridFile[];
  /** true si une entrée a été écrite dans la bibliothèque */
  recorded: boolean;
}

interface UploadedItem {
  id: number;
  name?: string;
  ready: boolean;
}

// Envoie une release vers AllDebrid, récupère ses fichiers si elle est déjà
// prête, et l'enregistre dans la bibliothèque (toujours si en cours de
// débridage, seulement si elle contient une vidéo sinon).
export async function sendReleaseToDebrid(
  release: DebridRelease,
  allDebridKey: string,
  c411Key: string,
): Promise<SentRelease> {
  const json = await invoke<{
    data?: { files?: UploadedItem[]; magnets?: UploadedItem[] };
  }>(
    release.magnet ? "upload_magnet_to_debrid" : "upload_torrent_to_debrid",
    release.magnet
      ? { magnet: release.magnet, alldebridKey: allDebridKey }
      : {
          torrentUrl: `https://c411.org/api?t=get&id=${encodeURIComponent(release.infoHash)}&apikey=${c411Key}`,
          alldebridKey: allDebridKey,
        },
  );

  const uploaded = json.data?.files?.[0] ?? json.data?.magnets?.[0];
  if (!uploaded) throw new Error("Réponse AllDebrid inattendue");
  const name = uploaded.name ?? release.title;

  let files: DebridFile[] = [];
  if (uploaded.ready) {
    const filesJson = await invoke<{ data?: { magnets?: Array<{ files?: unknown[] }> } }>(
      "get_magnet_files",
      { id: uploaded.id, alldebridKey: allDebridKey },
    );
    files = flattenFiles(filesJson.data?.magnets?.[0]?.files ?? []);
  }

  const recorded = !uploaded.ready || files.some((f) => isVideoFile(f.name));
  if (recorded) {
    await recordDownload({
      infoHash: release.infoHash,
      title: name,
      provider: release.provider,
      category: release.category,
      size: release.size,
      magnetId: uploaded.id,
      files,
      enriched: uploaded.ready,
      tmdb: release.tmdb,
      releaseName: release.title,
    });
  }

  return { name, ready: uploaded.ready, files, recorded };
}
