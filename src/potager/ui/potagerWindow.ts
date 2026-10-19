import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { isBrowserPreview } from "@/lib/devTauriShim";
import { createChannel } from "../sim/channel";

export const POTAGER_LABEL = "potager";
const QUERY = "window=potager";

export const isPotagerWindow = () =>
  new URLSearchParams(location.search).get("window") === "potager";

// Aperçu navigateur : la fenêtre Potager est un onglet, suivi par sa référence.
let previewTab: Window | null = null;

export async function openPotagerWindow(): Promise<void> {
  if (isBrowserPreview) {
    if (previewTab && !previewTab.closed) previewTab.focus();
    else previewTab = window.open(`/?${QUERY}`, POTAGER_LABEL);
    return;
  }
  const existing = await WebviewWindow.getByLabel(POTAGER_LABEL);
  if (existing) {
    await existing.unminimize();
    await existing.setFocus();
    return;
  }
  new WebviewWindow(POTAGER_LABEL, {
    url: `index.html?${QUERY}`,
    title: "Potager",
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    dragDropEnabled: false,
  });
}

// Ouvert = la fenêtre Potager a réclamé la simulation ; fermé = elle l'a rendue.
export function onPotagerOpenChange(cb: (open: boolean) => void): () => void {
  let disposed = false;
  const channel = createChannel();
  let owner: string | null = null;
  const off = channel.on((m) => {
    if (m.from !== "potager") return;
    if (m.type === "claim") {
      owner = m.id;
      cb(true);
    }
    if (m.type === "closed" && m.id === owner) {
      owner = null;
      cb(false);
    }
  });
  // un Potager déjà ouvert répond par une nouvelle réclamation
  channel.post({ type: "query", from: "main", id: "watch" });
  if (isBrowserPreview) queueMicrotask(() => !disposed && cb(!!previewTab && !previewTab.closed));
  else void WebviewWindow.getByLabel(POTAGER_LABEL).then((w) => !disposed && cb(!!w));
  return () => {
    disposed = true;
    off();
  };
}
