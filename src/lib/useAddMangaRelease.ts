import { toastMangaLibraryAdded } from "@/components/MangaLibraryAddedToast";
import { flattenFiles } from "@/lib/debrid";
import type { MangaItem } from "@/lib/mangaItem";
import { upsertMangaRelease, volumesFromFiles, type MangaEntry } from "@/lib/mangaLibrary";
import type { MangaRelease } from "@/lib/mangaReleases";
import { toastNetworkError } from "@/lib/networkError";
import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface UploadResponse {
  status: string;
  data?: { files?: Array<{ id: number; name: string; ready: boolean }> };
  error?: { message: string };
}

interface FilesResponse {
  status: string;
  data?: { magnets?: Array<{ files?: unknown[] }> };
}

export async function fetchMagnetFiles(magnetId: number, allDebridKey: string) {
  const json = await invoke<FilesResponse>("get_magnet_files", {
    id: magnetId,
    alldebridKey: allDebridKey,
  });
  return flattenFiles(json.data?.magnets?.[0]?.files ?? []);
}

interface UseAddMangaReleaseOptions {
  getC411Key: () => string;
  getAllDebridKey: () => string;
  onAdded: (entry: MangaEntry) => void;
  /** Action "Voir" des toasts d'ajout : ouvre la fiche de l'oeuvre. */
  onOpenLibrary?: (mangaId: string) => void;
}

/**
 * Envoie une release manga vers AllDebrid puis enregistre ses tomes dans la
 * bibliotheque manga. Meme sequence que useSendToDebrid cote video, mais
 * l'unite enregistree est l'oeuvre et non le torrent.
 */
export function useAddMangaRelease({
  getC411Key,
  getAllDebridKey,
  onAdded,
  onOpenLibrary,
}: UseAddMangaReleaseOptions) {
  const [addingHash, setAddingHash] = useState<string | null>(null);

  // Le bouton "Réessayer" du toast doit rappeler la version courante de
  // addRelease, qu'une closure ne peut pas capturer sans se referencer.
  const latest = useRef<((release: MangaRelease, item: MangaItem) => void) | null>(null);

  const addRelease = useCallback(
    async (release: MangaRelease, item: MangaItem) => {
      if (addingHash) return;
      const allDebridKey = getAllDebridKey();
      if (!allDebridKey) {
        toast.error("Cle AllDebrid manquante. Configurez-la dans les parametres.");
        return;
      }

      const seeAction = (mangaId: string) =>
        onOpenLibrary ? () => onOpenLibrary(mangaId) : undefined;

      setAddingHash(release.infoHash);
      try {
        const torrentUrl = `https://c411.org/api?t=get&id=${encodeURIComponent(release.infoHash)}&apikey=${getC411Key()}`;
        const json = await invoke<UploadResponse>("upload_torrent_to_debrid", {
          torrentUrl,
          alldebridKey: allDebridKey,
        });
        if (json.status !== "success")
          throw new Error(json.error?.message ?? "Erreur AllDebrid inconnue");

        const uploaded = json.data?.files?.[0];
        if (!uploaded) throw new Error("Reponse AllDebrid inattendue");

        if (!uploaded.ready) {
          const entry = await upsertMangaRelease(item, {
            pending: {
              infoHash: release.infoHash,
              magnetId: uploaded.id,
              torrentName: uploaded.name ?? release.torrentName,
              addedAt: Date.now(),
            },
          });
          onAdded(entry);
          toastMangaLibraryAdded({
            item,
            release,
            pending: true,
            onOpen: seeAction(entry.mangaId),
          });
          return;
        }

        const files = await fetchMagnetFiles(uploaded.id, allDebridKey);
        const volumes = volumesFromFiles(files, release.infoHash, uploaded.id);
        if (volumes.length === 0) {
          toast.error("Cette release ne contient aucun fichier CBZ lisible.");
          return;
        }

        const entry = await upsertMangaRelease(item, { volumes });
        onAdded(entry);
        toastMangaLibraryAdded({
          item,
          release,
          volumeCount: volumes.length,
          onOpen: seeAction(entry.mangaId),
        });
      } catch (err) {
        toastNetworkError(err, () => latest.current?.(release, item));
      } finally {
        setAddingHash(null);
      }
    },
    [addingHash, getAllDebridKey, getC411Key, onAdded, onOpenLibrary],
  );

  useEffect(() => {
    latest.current = addRelease;
  }, [addRelease]);

  return { addingHash, addRelease };
}
