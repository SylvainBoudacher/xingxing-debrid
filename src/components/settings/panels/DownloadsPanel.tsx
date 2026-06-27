import { open } from "@tauri-apps/plugin-dialog";
import { Download, FolderOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { SettingsPanel } from "../SettingsPanel";
import { FieldTitle, PanelDivider, Segmented, SettingRow } from "../controls";
import { settingsStore as store } from "../store";

const BATCH_OPTIONS = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
];

export function DownloadsPanel() {
  const [downloadDir, setDownloadDir] = useState("");
  const [batchSize, setBatchSize] = useState("1");

  useEffect(() => {
    store.get<string>("download_dir").then((v) => setDownloadDir(v ?? ""));
    store.get<number>("download_batch_size").then((v) => setBatchSize(String(v ?? 1)));
  }, []);

  async function handleBatchSize(v: string) {
    setBatchSize(v);
    await store.set("download_batch_size", Number(v));
    await store.save();
  }

  async function saveDownloadDir(dir: string) {
    setDownloadDir(dir);
    await store.set("download_dir", dir);
    await store.save();
  }

  async function pickDownloadDir() {
    const picked = await open({ directory: true, multiple: false });
    if (typeof picked === "string") await saveDownloadDir(picked);
  }

  return (
    <SettingsPanel
      icon={Download}
      title="Téléchargement"
      subtitle="Dossier de destination et fichiers simultanés."
    >
      <FieldTitle
        title="Dossier de téléchargement"
        hint="Où les fichiers débridés sont enregistrés. Par défaut, le dossier Téléchargements de votre système."
      />

      <div className="flex items-center justify-between gap-4 rounded-xl bg-white dark:bg-zinc-900/80 ring-1 ring-black/8 dark:ring-white/8 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-zinc-900 dark:text-white">
            {downloadDir || "Dossier Téléchargements (par défaut)"}
          </p>
          {downloadDir && (
            <button
              onClick={() => saveDownloadDir("")}
              className="mt-0.5 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
            >
              Réinitialiser
            </button>
          )}
        </div>
        <button
          onClick={pickDownloadDir}
          className="flex shrink-0 items-center gap-2 rounded-full bg-white/90 dark:bg-zinc-800/80 ring-1 ring-black/10 dark:ring-white/10 px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          <FolderOpen className="h-3.5 w-3.5" />
          Choisir
        </button>
      </div>

      <PanelDivider />

      <FieldTitle
        title="Téléchargements simultanés"
        hint="Lors d'un téléchargement groupé (plusieurs épisodes), nombre de fichiers téléchargés en même temps. Une valeur plus élevée peut mieux saturer votre connexion."
      />

      <SettingRow
        title="Fichiers en parallèle"
        description="Taille des lots téléchargés simultanément."
      >
        <Segmented value={batchSize} options={BATCH_OPTIONS} onChange={handleBatchSize} />
      </SettingRow>
    </SettingsPanel>
  );
}
