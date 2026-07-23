import { flattenFiles, isVideoFile, type DebridModal } from "@/lib/debrid";
import type { Occupant } from "@/lib/discoverReleases";
import { recordDownload } from "@/lib/library";
import { toastNetworkError } from "@/lib/networkError";
import type { TmdbItem } from "@/lib/tmdbItem";
import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import { toast } from "sonner";

interface UseSendToDebridOptions {
  getC411Key: () => string;
  getAllDebridKey: () => string;
  /** Ouvre la page bibliothèque (action "Voir" des toasts) */
  onOpenLibrary: () => void;
  /** Un téléchargement vient d'être enregistré dans la bibliothèque */
  onLibraryChange: () => void;
}

// Envoi d'une release vers AllDebrid (téléchargement direct ou ajout à la
// bibliothèque) : upload du torrent, récupération des fichiers si prêt, et
// enregistrement dans la bibliothèque quand une vidéo est présente.
export function useSendToDebrid({
  getC411Key,
  getAllDebridKey,
  onOpenLibrary,
  onLibraryChange,
}: UseSendToDebridOptions) {
  const [sendingHash, setSendingHash] = useState<string | null>(null);
  const [libraryHash, setLibraryHash] = useState<string | null>(null);
  const [debridModal, setDebridModal] = useState<DebridModal | null>(null);

  async function sendToDebrid(occ: Occupant, item: TmdbItem, addToLibrary = false) {
    if (sendingHash !== null || libraryHash !== null) return;
    const allDebridKey = getAllDebridKey();
    if (!allDebridKey) {
      toast.error("Cle AllDebrid manquante. Configurez-la dans les parametres.");
      return;
    }
    const torrentUrl = `https://c411.org/api?t=get&id=${encodeURIComponent(occ.infoHash)}&apikey=${getC411Key()}`;

    const tmdbMeta = {
      id: item.id,
      mediaType: item.mediaType,
      title: item.title,
      posterPath: item.posterPath,
      year: item.year,
      voteAverage: item.voteAverage,
      overview: item.overview,
      genreIds: item.genreIds,
    };

    const setBusy = addToLibrary ? setLibraryHash : setSendingHash;
    setBusy(occ.infoHash);
    try {
      const json = await invoke<{
        status: string;
        data?: { files?: Array<{ id: number; name: string }> };
        error?: { message: string };
      }>("upload_torrent_to_debrid", {
        torrentUrl,
        alldebridKey: allDebridKey,
      });

      if (json.status !== "success")
        throw new Error(json.error?.message ?? "Erreur AllDebrid inconnue");

      const uploaded = json.data?.files?.[0] as
        { id: number; name: string; ready: boolean } | undefined;
      if (!uploaded) throw new Error("Reponse AllDebrid inattendue");

      if (uploaded.ready) {
        const filesJson = await invoke<{
          status: string;
          data?: { magnets?: Array<{ files?: unknown[] }> };
        }>("get_magnet_files", {
          id: uploaded.id,
          alldebridKey: allDebridKey,
        });
        const rawFiles = filesJson.data?.magnets?.[0]?.files ?? [];
        const files = flattenFiles(rawFiles);
        const hasVideo = files.some((f) => isVideoFile(f.name));
        if (addToLibrary) {
          toast.success(`Ajoute a la bibliotheque : ${uploaded.name ?? occ.torrentName}`, {
            action: { label: "Voir", onClick: onOpenLibrary },
          });
        } else {
          setDebridModal({
            torrentName: uploaded.name ?? occ.torrentName,
            files,
          });
        }
        if (hasVideo) {
          await recordDownload({
            infoHash: occ.infoHash,
            title: uploaded.name ?? occ.torrentName,
            provider: "discover",
            category: 0,
            size: occ.fileSize,
            magnetId: uploaded.id,
            files,
            enriched: true,
            tmdb: tmdbMeta,
          });
          onLibraryChange();
        }
      } else {
        toast.success(
          addToLibrary
            ? `Ajoute a la bibliotheque : ${uploaded.name ?? occ.torrentName} (en cours de debridage)`
            : `Envoye vers AllDebrid : ${uploaded.name ?? occ.torrentName} (en cours de debridage)`,
          addToLibrary ? { action: { label: "Voir", onClick: onOpenLibrary } } : undefined,
        );
        await recordDownload({
          infoHash: occ.infoHash,
          title: uploaded.name ?? occ.torrentName,
          provider: "discover",
          category: 0,
          size: occ.fileSize,
          magnetId: uploaded.id,
          files: [],
          enriched: false,
          tmdb: tmdbMeta,
        });
        onLibraryChange();
      }
    } catch (err) {
      toastNetworkError(err, () => sendToDebrid(occ, item, addToLibrary));
    } finally {
      setBusy(null);
    }
  }

  return { sendingHash, libraryHash, debridModal, setDebridModal, sendToDebrid };
}
