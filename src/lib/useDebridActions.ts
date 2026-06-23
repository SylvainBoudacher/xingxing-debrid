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

  return {
    downloadingLink,
    copiedLink,
    vlcLink,
    copyLink,
    openVlc,
    downloadFile,
  };
}
