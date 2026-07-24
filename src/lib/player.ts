import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { settingsStore } from "@/components/settings/store";
import { toastNetworkError } from "@/lib/networkError";
import { openSettingsPanel } from "@/lib/settingsNavigation";

// Erreurs renvoyees par les commandes lecteur Rust (voir src-tauri/src/player.rs).
export type PlayerError =
  | { kind: "notFound" }
  | { kind: "configuredPathMissing"; path: string }
  | { kind: "launchFailed"; message: string };

const PLAYER_ERROR_KINDS = ["notFound", "configuredPathMissing", "launchFailed"];

export function isPlayerError(err: unknown): err is PlayerError {
  return (
    typeof err === "object" &&
    err !== null &&
    "kind" in err &&
    typeof (err as { kind: unknown }).kind === "string" &&
    PLAYER_ERROR_KINDS.includes((err as { kind: string }).kind)
  );
}

export function playerErrorMessage(err: PlayerError): string {
  switch (err.kind) {
    case "notFound":
      return "VLC introuvable. Installez VLC, ou indiquez son emplacement dans les Réglages.";
    case "configuredPathMissing":
      return `Le VLC configuré est introuvable : ${err.path}.`;
    case "launchFailed":
      return `Impossible de lancer VLC : ${err.message}.`;
  }
}

async function configuredVlcPath(): Promise<string | null> {
  return (await settingsStore.get<string>("vlc_path")) ?? null;
}

export async function openInVlc(urls: string[]): Promise<void> {
  const vlcPath = await configuredVlcPath();
  if (urls.length === 1) {
    await invoke("open_with_vlc", { url: urls[0], vlcPath });
    return;
  }
  await invoke("open_many_with_vlc", { urls, vlcPath });
}

// Chemin VLC resolu, ou null si aucun n'est trouve. Diagnostic du panneau Lecture.
export async function detectVlc(): Promise<string | null> {
  try {
    return await invoke<string>("detect_vlc", { vlcPath: await configuredVlcPath() });
  } catch {
    return null;
  }
}

// Les erreurs lecteur ne se retentent pas : on renvoie vers les Reglages au lieu
// du bouton Reessayer des erreurs reseau.
export function toastVlcOrNetworkError(err: unknown, retry?: () => void) {
  if (isPlayerError(err)) {
    toast.error(playerErrorMessage(err), {
      action: { label: "Réglages", onClick: () => openSettingsPanel("playback") },
    });
    return;
  }
  toastNetworkError(err, retry);
}
