import { open } from "@tauri-apps/plugin-dialog";
import { openUrl } from "@tauri-apps/plugin-opener";
import { AlertTriangle, Check, FolderOpen, MonitorPlay } from "lucide-react";
import { useEffect, useState } from "react";
import { SettingsPanel } from "../SettingsPanel";
import { FieldTitle } from "../controls";
import { settingsStore as store } from "../store";
import { detectVlc } from "@/lib/player";

export function PlaybackPanel() {
  const [vlcPath, setVlcPath] = useState("");
  const [detected, setDetected] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    store.get<string>("vlc_path").then((v) => setVlcPath(v ?? ""));
    detectVlc().then((found) => {
      setDetected(found);
      setChecking(false);
    });
  }, []);

  async function savePath(path: string) {
    setVlcPath(path);
    setChecking(true);
    await store.set("vlc_path", path);
    await store.save();
    setDetected(await detectVlc());
    setChecking(false);
  }

  async function pickVlc() {
    const picked = await open({
      multiple: false,
      filters: [{ name: "Exécutable", extensions: ["exe"] }],
    });
    if (typeof picked === "string") await savePath(picked);
  }

  return (
    <SettingsPanel
      icon={MonitorPlay}
      title="Lecture"
      subtitle="Le lecteur utilisé pour ouvrir les vidéos."
    >
      <FieldTitle
        title="Emplacement de VLC"
        hint="L'application retrouve normalement VLC toute seule, y compris s'il est installé sur un autre disque. Indiquez son emplacement uniquement si la détection échoue."
      />

      <div className="flex items-center justify-between gap-4 rounded-xl bg-white dark:bg-zinc-900/80 ring-1 ring-black/8 dark:ring-white/8 px-4 py-3">
        <div className="min-w-0">
          {checking ? (
            <p className="text-sm text-zinc-500">Recherche de VLC...</p>
          ) : detected ? (
            <p className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-white">
              <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
              <span className="truncate">{detected}</span>
            </p>
          ) : (
            <p className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              VLC introuvable
            </p>
          )}
          <p className="mt-0.5 text-xs text-zinc-500">
            {vlcPath ? "Chemin défini manuellement." : "Détection automatique."}
          </p>
          {vlcPath && (
            <button
              onClick={() => savePath("")}
              className="mt-0.5 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
            >
              Réinitialiser
            </button>
          )}
          {!detected && !checking && (
            <button
              onClick={() => openUrl("https://www.videolan.org/vlc/")}
              className="mt-0.5 block text-xs text-indigo-500 hover:text-indigo-400 transition-colors"
            >
              Télécharger VLC
            </button>
          )}
        </div>
        <button
          onClick={pickVlc}
          className="flex shrink-0 items-center gap-2 rounded-full bg-white/90 dark:bg-zinc-800/80 ring-1 ring-black/10 dark:ring-white/10 px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          <FolderOpen className="h-3.5 w-3.5" />
          Choisir
        </button>
      </div>
    </SettingsPanel>
  );
}
