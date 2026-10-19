import type { HelpPanelId } from "@/components/help/helpNav";

// Meme pattern que settingsNavigation.ts. Le panneau demande est aussi garde
// en attente : la page Aide, montee apres l'evenement, le lit a l'ouverture.
const HELP_PANEL_EVENT = "help-panel-request";
let pending: HelpPanelId | null = null;

export function openHelpPanel(panel: HelpPanelId) {
  pending = panel;
  window.dispatchEvent(new CustomEvent<HelpPanelId>(HELP_PANEL_EVENT, { detail: panel }));
}

export function takePendingHelpPanel(): HelpPanelId | null {
  const p = pending;
  pending = null;
  return p;
}

export function onHelpPanelRequest(handler: (panel: HelpPanelId) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<HelpPanelId>).detail);
  window.addEventListener(HELP_PANEL_EVENT, listener);
  return () => window.removeEventListener(HELP_PANEL_EVENT, listener);
}
