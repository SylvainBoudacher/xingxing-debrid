import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
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

  async function unlockAll(links: string[]): Promise<string[]> {
    const urls: string[] = [];
    for (const link of links) {
      urls.push(await invoke<string>("unlock_link", { link, alldebridKey: getKey() }));
    }
    return urls;
  }

  async function copyLink(link: string) {
    setCopiedLink(link);
    try {
      const url = await invoke<string>("unlock_link", {
        link,
        alldebridKey: getKey(),
      });
      await navigator.clipboard.writeText(url);
      toast.success("Lien copié");
    } catch (err) {
      toast.error(String(err));
    } finally {
      setTimeout(() => setCopiedLink(null), 2000);
    }
  }

  async function openVlc(link: string) {
    setVlcLink(link);
    try {
      const url = await invoke<string>("unlock_link", {
        link,
        alldebridKey: getKey(),
      });
      await invoke("open_with_vlc", { url });
      toast.success("Ouvert dans VLC");
    } catch (err) {
      toast.error(String(err));
    } finally {
      setVlcLink(null);
    }
  }

  async function downloadFile(link: string) {
    setDownloadingLink(link);
    try {
      const url = await invoke<string>("unlock_link", {
        link,
        alldebridKey: getKey(),
      });
      await openUrl(url);
    } catch (err) {
      toast.error(String(err));
    } finally {
      setDownloadingLink(null);
    }
  }

  async function downloadMany(links: string[], groupKey: string) {
    if (links.length === 0) return;
    setBulkDownloading(groupKey);
    try {
      const urls = await unlockAll(links);
      for (const url of urls) await openUrl(url);
      toast.success(`${urls.length} téléchargements lancés`);
    } catch (err) {
      toast.error(String(err));
    } finally {
      setBulkDownloading(null);
    }
  }

  async function copyMany(links: string[], groupKey: string) {
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
  }

  async function openVlcMany(links: string[], groupKey: string) {
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
  }

  return {
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
  };
}
