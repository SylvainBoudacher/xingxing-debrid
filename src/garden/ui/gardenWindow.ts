import { emit, listen } from "@tauri-apps/api/event";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { isBrowserPreview } from "@/lib/devTauriShim";

export const GARDEN_LABEL = "garden";
export const GARDEN_QUERY = "window=garden";
const OPENED = "garden:opened";
const CLOSED = "garden:closed";

export const isGardenWindow = () => new URLSearchParams(location.search).get("window") === "garden";

// Aperçu navigateur : la fenêtre Potager est un onglet, suivi par sa référence.
let previewTab: Window | null = null;

export async function openGardenWindow(): Promise<void> {
  if (isBrowserPreview) {
    if (previewTab && !previewTab.closed) previewTab.focus();
    else previewTab = window.open(`/?${GARDEN_QUERY}`, GARDEN_LABEL);
    return;
  }
  const existing = await WebviewWindow.getByLabel(GARDEN_LABEL);
  if (existing) {
    await existing.unminimize();
    await existing.setFocus();
    return;
  }
  new WebviewWindow(GARDEN_LABEL, {
    url: `index.html?${GARDEN_QUERY}`,
    title: "Potager",
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    dragDropEnabled: false,
  });
}

export function onGardenOpenChange(cb: (open: boolean) => void): () => void {
  if (isBrowserPreview) {
    // jamais d'appel synchrone : les composants passent un setState depuis un effet
    queueMicrotask(() => cb(false));
    let last = false;
    const id = setInterval(() => {
      const open = !!previewTab && !previewTab.closed;
      if (open !== last) cb((last = open));
    }, 500);
    return () => clearInterval(id);
  }
  let disposed = false;
  const unlisteners: (() => void)[] = [];
  WebviewWindow.getByLabel(GARDEN_LABEL).then((w) => !disposed && cb(!!w));
  listen(OPENED, () => cb(true)).then((u) => (disposed ? u() : unlisteners.push(u)));
  listen(CLOSED, () => cb(false)).then((u) => (disposed ? u() : unlisteners.push(u)));
  return () => {
    disposed = true;
    unlisteners.forEach((u) => u());
  };
}

export async function announceGardenOpened(): Promise<void> {
  if (!isBrowserPreview) await emit(OPENED);
}

export async function announceGardenClosed(): Promise<void> {
  if (!isBrowserPreview) await emit(CLOSED);
}
