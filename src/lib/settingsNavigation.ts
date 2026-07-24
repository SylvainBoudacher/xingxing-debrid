import type { PanelId } from "@/components/settings/settingsNav";

// Meme pattern que src/lib/shortcuts.ts : un CustomEvent evite de faire
// descendre un callback de navigation jusqu'aux toasts.
const SETTINGS_PANEL_EVENT = "settings-panel-request";

export function openSettingsPanel(panel: PanelId) {
  window.dispatchEvent(new CustomEvent<PanelId>(SETTINGS_PANEL_EVENT, { detail: panel }));
}

export function onSettingsPanelRequest(handler: (panel: PanelId) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<PanelId>).detail);
  window.addEventListener(SETTINGS_PANEL_EVENT, listener);
  return () => window.removeEventListener(SETTINGS_PANEL_EVENT, listener);
}
