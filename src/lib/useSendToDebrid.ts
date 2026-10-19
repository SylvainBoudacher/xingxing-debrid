import { toastLibraryAdded } from "@/components/LibraryAddedToast";
import { type DebridModal } from "@/lib/debrid";
import type { Occupant } from "@/lib/discoverReleases";
import { toastNetworkError } from "@/lib/networkError";
import { sendReleaseToDebrid } from "@/lib/sendRelease";
import type { TmdbItem } from "@/lib/tmdbItem";
import { useState } from "react";
import { toast } from "sonner";

interface UseSendToDebridOptions {
  getC411Key: () => string;
  getAllDebridKey: () => string;
  /** Ouvre la fiche bibliothèque du titre ajouté (action "Voir" des toasts) */
  onOpenLibrary: (item: TmdbItem, infoHash: string) => void;
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
      toast.error("Clé AllDebrid manquante. Configurez-la dans les paramètres.");
      return;
    }
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
      const sent = await sendReleaseToDebrid(
        {
          infoHash: occ.infoHash,
          title: occ.torrentName,
          provider: "discover",
          category: 0,
          size: occ.fileSize,
          tmdb: tmdbMeta,
        },
        allDebridKey,
        getC411Key(),
      );

      if (addToLibrary) {
        toastLibraryAdded({
          item,
          releaseName: sent.name,
          pending: !sent.ready,
          onOpen: () => onOpenLibrary(item, occ.infoHash),
        });
      } else if (sent.ready) {
        setDebridModal({ torrentName: sent.name, files: sent.files });
      } else {
        toast.success(`Envoyé vers AllDebrid : ${sent.name} (en cours de débridage)`);
      }
      if (sent.recorded) onLibraryChange();
    } catch (err) {
      toastNetworkError(err, () => sendToDebrid(occ, item, addToLibrary));
    } finally {
      setBusy(null);
    }
  }

  return { sendingHash, libraryHash, debridModal, setDebridModal, sendToDebrid };
}
