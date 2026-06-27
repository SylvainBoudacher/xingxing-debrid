import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  beginBulkDownload,
  bulkTaskEnd,
  bulkTaskStart,
  endBulkDownload,
  getDownloadBatchSize,
  isBulkCancelled,
  startDownload,
} from "@/lib/downloads";
import { toast } from "sonner";

// Actions AllDebrid sur un lien debride (copie presse-papier, VLC, telechargement).
// Partage entre MainPage et DiscoverPage. `getKey` fournit la cle AllDebrid au
// moment de l'appel (les pages la gardent dans un ref rempli au montage).
export function useDebridActions(getKey: () => string) {
  const [downloadingLink, setDownloadingLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [vlcLink, setVlcLink] = useState<string | null>(null);
  // État des actions groupées, identifie par une clé arbitraire (ex. infoHash).
  const [bulkDownloading, setBulkDownloading] = useState<string | null>(null);
  const [bulkCopying, setBulkCopying] = useState<string | null>(null);
  const [bulkVlc, setBulkVlc] = useState<string | null>(null);

  // `getKey` est une closure recréée à chaque render par l'appelant : on la
  // garde dans un ref pour que les callbacks ci-dessous restent stables et que
  // les cartes mémoïsées ne re-render pas à chaque rendu de la page.
  const getKeyRef = useRef(getKey);
  useEffect(() => {
    getKeyRef.current = getKey;
  });

  const unlockAll = useCallback(async (links: string[]): Promise<string[]> => {
    const urls: string[] = [];
    for (const link of links) {
      urls.push(await invoke<string>("unlock_link", { link, alldebridKey: getKeyRef.current() }));
    }
    return urls;
  }, []);

  const copyLink = useCallback(async (link: string) => {
    setCopiedLink(link);
    try {
      const url = await invoke<string>("unlock_link", {
        link,
        alldebridKey: getKeyRef.current(),
      });
      await navigator.clipboard.writeText(url);
      toast.success("Lien copié");
    } catch (err) {
      toast.error(String(err));
    } finally {
      setTimeout(() => setCopiedLink(null), 2000);
    }
  }, []);

  const openVlc = useCallback(async (link: string) => {
    setVlcLink(link);
    try {
      const url = await invoke<string>("unlock_link", {
        link,
        alldebridKey: getKeyRef.current(),
      });
      await invoke("open_with_vlc", { url });
      toast.success("Ouvert dans VLC");
    } catch (err) {
      toast.error(String(err));
    } finally {
      setVlcLink(null);
    }
  }, []);

  const downloadFile = useCallback(async (link: string) => {
    setDownloadingLink(link);
    try {
      const url = await invoke<string>("unlock_link", {
        link,
        alldebridKey: getKeyRef.current(),
      });
      await startDownload(url);
    } catch (err) {
      toast.error(String(err));
    } finally {
      setDownloadingLink(null);
    }
  }, []);

  // Débride et télécharge les liens par lots de N en parallèle (réglage
  // `download_batch_size`). Chaque worker débride puis télécharge un lien à la
  // fois ; jusqu'à N workers tournent de front. La progression agrégée alimente
  // la modal globale via le store des téléchargements.
  const downloadMany = useCallback(async (links: string[], groupKey: string) => {
    if (links.length === 0) return;
    setBulkDownloading(groupKey);
    const batchSize = await getDownloadBatchSize();
    beginBulkDownload(links.length);
    let next = 0;
    let firstError: unknown = null;
    const worker = async () => {
      while (next < links.length) {
        if (isBulkCancelled()) break;
        const link = links[next++];
        bulkTaskStart();
        try {
          const url = await invoke<string>("unlock_link", {
            link,
            alldebridKey: getKeyRef.current(),
          });
          await startDownload(url);
        } catch (err) {
          if (firstError === null) firstError = err;
        } finally {
          bulkTaskEnd();
        }
      }
    };
    try {
      await Promise.all(Array.from({ length: Math.min(batchSize, links.length) }, worker));
      if (firstError !== null) throw firstError;
    } catch (err) {
      toast.error(String(err));
    } finally {
      endBulkDownload();
      setBulkDownloading(null);
    }
  }, []);

  const copyMany = useCallback(
    async (links: string[], groupKey: string) => {
      if (links.length === 0) return;
      setBulkCopying(groupKey);
      try {
        const urls = await unlockAll(links);
        await navigator.clipboard.writeText(urls.join("\n"));
        toast.success(`${urls.length} liens copiés`);
      } catch (err) {
        toast.error(String(err));
      } finally {
        setTimeout(() => setBulkCopying(null), 2000);
      }
    },
    [unlockAll],
  );

  const openVlcMany = useCallback(
    async (links: string[], groupKey: string) => {
      if (links.length === 0) return;
      setBulkVlc(groupKey);
      try {
        const urls = await unlockAll(links);
        await invoke("open_many_with_vlc", { urls });
        toast.success("Playlist ouverte dans VLC");
      } catch (err) {
        toast.error(String(err));
      } finally {
        setBulkVlc(null);
      }
    },
    [unlockAll],
  );

  return useMemo(
    () => ({
      downloadingLink,
      copiedLink,
      vlcLink,
      copyLink,
      openVlc,
      downloadFile,
      bulkDownloading,
      bulkCopying,
      bulkVlc,
      downloadMany,
      copyMany,
      openVlcMany,
    }),
    [
      downloadingLink,
      copiedLink,
      vlcLink,
      copyLink,
      openVlc,
      downloadFile,
      bulkDownloading,
      bulkCopying,
      bulkVlc,
      downloadMany,
      copyMany,
      openVlcMany,
    ],
  );
}
