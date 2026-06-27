import { open } from "@tauri-apps/plugin-dialog";
import { FolderOpen, Magnet } from "lucide-react";
import { useEffect, useState } from "react";
import { SettingsPanel } from "../SettingsPanel";
import { FieldTitle, PanelDivider, SettingRow, Toggle } from "../controls";
import { settingsStore as store } from "../store";

export function MagnetsPanel() {
  const [hideNfo, setHideNfo] = useState(true);
  const [skipNfoDownload, setSkipNfoDownload] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(true);
  const [downloadDir, setDownloadDir] = useState("");

  useEffect(() => {
    store.get<boolean>("hide_nfo_files").then((v) => setHideNfo(v ?? true));
    store.get<boolean>("skip_nfo_download").then((v) => setSkipNfoDownload(v ?? true));
    store.get<boolean>("confirm_delete").then((v) => setConfirmDelete(v ?? true));
    store.get<string>("download_dir").then((v) => setDownloadDir(v ?? ""));
  }, []);

  async function saveDownloadDir(dir: string) {
    setDownloadDir(dir);
    await store.set("download_dir", dir);
    await store.save();
  }

  async function pickDownloadDir() {
    const picked = await open({ directory: true, multiple: false });
    if (typeof picked === "string") await saveDownloadDir(picked);
  }

  async function handleHideNfo(v: boolean) {
    setHideNfo(v);
    await store.set("hide_nfo_files", v);
    await store.save();
  }

  async function handleSkipNfoDownload(v: boolean) {
    setSkipNfoDownload(v);
    await store.set("skip_nfo_download", v);
    await store.save();
  }

  async function handleConfirmDelete(v: boolean) {
    setConfirmDelete(v);
    await store.set("confirm_delete", v);
    await store.save();
  }

  return (
    <SettingsPanel
      icon={Magnet}
      title="Magnets et fichiers"
      subtitle="Téléchargements et fichiers .nfo."
    >
      <FieldTitle
        title="Fichiers .nfo"
        hint="Un fichier .nfo est un petit fichier texte ajouté par les teams de release pour décrire le contenu (qualité, langue, source). Il n'est pas nécessaire pour regarder vos films et séries."
      />

      <div className="space-y-3">
        <SettingRow
          title="Ne pas afficher les fichiers .nfo"
          description="Les masque dans la liste des fichiers d'un magnet."
        >
          <Toggle checked={hideNfo} onChange={handleHideNfo} />
        </SettingRow>

        <SettingRow
          title="Ne pas télécharger les fichiers .nfo"
          description={'Les exclut des téléchargements groupés ("Tout télécharger").'}
        >
          <Toggle checked={skipNfoDownload} onChange={handleSkipNfoDownload} />
        </SettingRow>
      </div>

      <PanelDivider />

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
        title="Suppression"
        hint="Une fenêtre de confirmation s'affiche avant de retirer un magnet de votre compte AllDebrid."
      />

      <SettingRow
        title="Confirmer avant suppression"
        description="Désactivez pour supprimer immédiatement, sans fenêtre de confirmation."
      >
        <Toggle checked={confirmDelete} onChange={handleConfirmDelete} />
      </SettingRow>
    </SettingsPanel>
  );
}
