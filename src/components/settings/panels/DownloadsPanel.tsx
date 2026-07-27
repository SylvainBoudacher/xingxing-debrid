import { open } from "@tauri-apps/plugin-dialog";
import { BookOpen, Download, FolderOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { AnimatePresence } from "motion/react";
import { SettingsPanel } from "../SettingsPanel";
import { FieldTitle, PanelDivider, Segmented, SettingRow } from "../controls";
import { settingsStore as store } from "../store";
import { MangaMoveDialog } from "../MangaMoveDialog";
import { loadMangaLibrary } from "@/lib/mangaLibrary";
import { planMangaMoves, type PlannedMove } from "@/lib/mangaMove";

const BATCH_OPTIONS = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
];

export function DownloadsPanel() {
  const [downloadDir, setDownloadDir] = useState("");
  const [batchSize, setBatchSize] = useState("1");
  const [mangaDir, setMangaDir] = useState("");
  const [pendingMoves, setPendingMoves] = useState<PlannedMove[] | null>(null);

  useEffect(() => {
    store.get<string>("download_dir").then((v) => setDownloadDir(v ?? ""));
    store.get<number>("download_batch_size").then((v) => setBatchSize(String(v ?? 1)));
    store.get<string>("manga_dir").then((v) => setMangaDir(v ?? ""));
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

  async function saveMangaDir(dir: string) {
    setMangaDir(dir);
    await store.set("manga_dir", dir);
    await store.save();
  }

  // Le reglage est enregistre d'abord : meme si le deplacement echoue ou est
  // refuse, les prochains telechargements vont dans le nouveau dossier.
  async function pickMangaDir() {
    const picked = await open({ directory: true, multiple: false });
    if (typeof picked !== "string") return;
    await saveMangaDir(picked);
    const moves = planMangaMoves(await loadMangaLibrary(), picked);
    if (moves.length > 0) setPendingMoves(moves);
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
        title="Dossier des mangas"
        hint="Où les tomes téléchargés sont rangés, un sous-dossier par série. Par défaut, un dossier « manga » dans le dossier de téléchargement."
      />

      <div className="flex items-center justify-between gap-4 rounded-xl bg-white dark:bg-zinc-900/80 ring-1 ring-black/8 dark:ring-white/8 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-zinc-900 dark:text-white">
            {mangaDir || "Dossier de téléchargement / manga (par défaut)"}
          </p>
          {mangaDir && (
            <button
              onClick={() => saveMangaDir("")}
              className="mt-0.5 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
            >
              Réinitialiser
            </button>
          )}
        </div>
        <button
          onClick={pickMangaDir}
          className="flex shrink-0 items-center gap-2 rounded-full bg-white/90 dark:bg-zinc-800/80 ring-1 ring-black/10 dark:ring-white/10 px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          <BookOpen className="h-3.5 w-3.5" />
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

      <AnimatePresence>
        {pendingMoves && (
          <MangaMoveDialog
            moves={pendingMoves}
            targetDir={mangaDir}
            onClose={() => setPendingMoves(null)}
          />
        )}
      </AnimatePresence>
    </SettingsPanel>
  );
}
