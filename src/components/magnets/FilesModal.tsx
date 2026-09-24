import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Loader2, Download, X, Copy, Check, ListChecks } from "lucide-react";
import { parseRelease } from "@/lib/parseRelease";
import { flattenFiles, formatSize, isVideoFile } from "@/lib/debrid";
import { NetworkErrorState } from "@/components/NetworkErrorState";
import {
  fetchWithTimeout,
  networkErrorMessage,
  readJson,
  toastNetworkError,
} from "@/lib/networkError";
import { openInVlc, toastVlcOrNetworkError } from "@/lib/player";
import { toast } from "sonner";
import vlcLogo from "@/assets/vlc.png";
import { invoke } from "@tauri-apps/api/core";
import {
  startDownload,
  beginBulkDownload,
  bulkTaskStart,
  bulkTaskEnd,
  endBulkDownload,
  getDownloadBatchSize,
  isBulkCancelled,
} from "@/lib/downloads";
import { allDebridApiError } from "@/lib/services/allDebrid";
import { AD_BASE, forEachLimit, isNfoFile } from "@/components/magnets/magnetUtils";

interface FilesModalProps {
  magnetId: number;
  magnetName: string;
  apiKey: string;
  simpleView: boolean;
  hideNfo: boolean;
  skipNfoDownload: boolean;
  onClose: () => void;
}

export function FilesModal({
  magnetId,
  magnetName,
  apiKey,
  simpleView,
  hideNfo,
  skipNfoDownload,
  onClose,
}: FilesModalProps) {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [copying, setCopying] = useState<string | null>(null);
  const [vlcing, setVlcing] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState<{ done: number; total: number } | null>(
    null,
  );
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [downloadingSelected, setDownloadingSelected] = useState<{
    done: number;
    total: number;
  } | null>(null);

  const busy =
    downloading !== null ||
    copying !== null ||
    vlcing !== null ||
    downloadingAll !== null ||
    downloadingSelected !== null;

  // Fetch mis en cache par TanStack Query — rouvrir le même magnet est instantané.
  const {
    data: allFiles,
    isLoading: loading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["magnet-files", magnetId],
    queryFn: async () => {
      const res = await fetchWithTimeout(
        "AllDebrid",
        `${AD_BASE}/magnet/files?agent=c411&id[]=${magnetId}`,
        { headers: { Authorization: `Bearer ${apiKey}` } },
      );
      const json = await readJson<{
        status: string;
        error?: { code?: string };
        data?: { magnets?: Array<{ files?: unknown[] }> };
      }>("AllDebrid", res);
      // Sans ce test, une erreur AllDebrid s'affiche comme une liste vide.
      if (json.status !== "success") throw allDebridApiError(json);
      const rawFiles = json.data?.magnets?.[0]?.files ?? [];
      return flattenFiles(rawFiles);
    },
    staleTime: 5 * 60 * 1000, // 5 min — les fichiers d'un magnet ne changent pas
    retry: 1,
  });

  // hideNfo est appliqué côté client, sans déclencher un nouveau fetch
  const files = useMemo(
    () => (hideNfo ? (allFiles ?? []).filter((f) => !isNfoFile(f.name)) : (allFiles ?? [])),
    [allFiles, hideNfo],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleOpenVlc(link: string) {
    setVlcing(link);
    try {
      const url = await invoke<string>("unlock_link", { link, alldebridKey: apiKey });
      await openInVlc([url]);
      toast.success("Ouvert dans VLC");
    } catch (err) {
      toastVlcOrNetworkError(err, () => handleOpenVlc(link));
    } finally {
      setVlcing(null);
    }
  }

  async function handleDownloadAll() {
    if (!files) return;
    const toDownload = skipNfoDownload ? files.filter((f) => !isNfoFile(f.name)) : files;
    setDownloadingAll({ done: 0, total: toDownload.length });
    beginBulkDownload(toDownload.length);
    try {
      const batchSize = await getDownloadBatchSize();
      let done = 0;
      let firstError: unknown = null;
      await forEachLimit(toDownload, batchSize, async (file) => {
        if (isBulkCancelled()) return;
        bulkTaskStart();
        try {
          const url = await invoke<string>("unlock_link", {
            link: file.link,
            alldebridKey: apiKey,
          });
          await startDownload(url);
        } catch (err) {
          firstError ??= err;
        } finally {
          bulkTaskEnd();
          setDownloadingAll({ done: ++done, total: toDownload.length });
        }
      });
      if (firstError) toastNetworkError(firstError, handleDownloadAll);
    } catch (err) {
      toastNetworkError(err, handleDownloadAll);
    } finally {
      endBulkDownload();
      setDownloadingAll(null);
    }
  }

  function toggleSelect(link: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(link)) next.delete(link);
      else next.add(link);
      return next;
    });
  }

  const allSelected = !!files && files.length > 0 && selected.size === files.length;

  function toggleSelectAll() {
    setSelected(allSelected ? new Set() : new Set((files ?? []).map((f) => f.link)));
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelected(new Set());
  }

  async function handleDownloadSelected() {
    if (!files) return;
    const toDownload = files.filter((f) => selected.has(f.link));
    if (toDownload.length === 0) return;
    setDownloadingSelected({ done: 0, total: toDownload.length });
    beginBulkDownload(toDownload.length);
    try {
      const batchSize = await getDownloadBatchSize();
      let done = 0;
      let firstError: unknown = null;
      await forEachLimit(toDownload, batchSize, async (file) => {
        if (isBulkCancelled()) return;
        bulkTaskStart();
        try {
          const url = await invoke<string>("unlock_link", {
            link: file.link,
            alldebridKey: apiKey,
          });
          await startDownload(url);
        } catch (err) {
          firstError ??= err;
        } finally {
          bulkTaskEnd();
          setDownloadingSelected({ done: ++done, total: toDownload.length });
        }
      });
      if (firstError) toastNetworkError(firstError, handleDownloadSelected);
      exitSelectMode();
    } catch (err) {
      toastNetworkError(err, handleDownloadSelected);
    } finally {
      endBulkDownload();
      setDownloadingSelected(null);
    }
  }

  async function handleDownload(link: string) {
    setDownloading(link);
    try {
      const url = await invoke<string>("unlock_link", { link, alldebridKey: apiKey });
      await startDownload(url);
    } catch (err) {
      toastNetworkError(err, () => handleDownload(link));
    } finally {
      setDownloading(null);
    }
  }

  async function handleCopy(link: string) {
    setCopying(link);
    try {
      const url = await invoke<string>("unlock_link", { link, alldebridKey: apiKey });
      await navigator.clipboard.writeText(url);
      toast.success("Lien copié");
    } catch (err) {
      toastNetworkError(err, () => handleCopy(link));
    } finally {
      setTimeout(() => setCopying(null), 2000);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white/95 shadow-2xl ring-1 ring-black/10 backdrop-blur-xl dark:bg-zinc-900/95 dark:ring-white/10"
      >
        {/* En-tête */}
        <div className="flex items-start justify-between gap-4 px-5 pb-4 pt-5">
          <div className="min-w-0">
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
              Fichiers disponibles
            </p>
            <p className="text-base font-semibold leading-snug text-zinc-900 dark:text-white">
              {simpleView ? parseRelease(magnetName).title : magnetName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-md bg-zinc-200 transition-colors hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700"
          >
            <X className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
          </button>
        </div>

        {/* Barre d'actions globales : sélection / tout télécharger */}
        {!loading && files && files.length > 1 && (
          <div className="flex items-center gap-2 border-y border-black/5 bg-black/[0.02] px-5 py-2.5 dark:border-white/10 dark:bg-white/[0.03]">
            {selectMode ? (
              <>
                <button
                  onClick={toggleSelectAll}
                  disabled={busy}
                  className="flex items-center gap-2 text-xs font-medium text-zinc-600 transition-colors hover:text-zinc-900 disabled:opacity-40 dark:text-zinc-300 dark:hover:text-white"
                >
                  <span
                    className={`flex h-4 w-4 flex-none items-center justify-center rounded ring-1 transition-colors ${
                      allSelected
                        ? "bg-indigo-600 ring-indigo-500"
                        : "bg-zinc-200 ring-black/10 dark:bg-zinc-800 dark:ring-white/10"
                    }`}
                  >
                    {allSelected && <Check className="h-3 w-3 text-white" />}
                  </span>
                  Tout sélectionner
                </button>
                <span className="flex-1 text-right text-xs font-medium text-zinc-600 dark:text-zinc-300">
                  {selected.size} sélectionné{selected.size > 1 ? "s" : ""}
                </span>
                <button
                  onClick={exitSelectMode}
                  disabled={busy}
                  className="flex h-7 flex-none items-center rounded-lg px-3 text-xs font-medium text-zinc-500 transition-colors hover:bg-black/5 disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-white/10"
                >
                  Annuler
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleDownloadSelected}
                  disabled={busy || selected.size === 0}
                  className="flex h-7 flex-none items-center gap-2 rounded-lg bg-indigo-600 px-3 transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {downloadingSelected ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                      <span className="text-xs font-medium text-white">
                        {downloadingSelected.done}/{downloadingSelected.total}...
                      </span>
                    </>
                  ) : (
                    <>
                      <Download className="h-3.5 w-3.5 text-white" />
                      <span className="text-xs font-medium text-white">Télécharger</span>
                    </>
                  )}
                </motion.button>
              </>
            ) : (
              <>
                <span className="flex-1 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                  {files.length} fichiers
                </span>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectMode(true)}
                  disabled={busy}
                  className="flex h-7 flex-none items-center gap-2 rounded-lg bg-black/5 px-3 text-zinc-500 ring-1 ring-black/10 transition-colors hover:bg-black/10 hover:text-zinc-900 disabled:opacity-40 dark:bg-white/5 dark:text-zinc-400 dark:ring-white/10 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <ListChecks className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Sélection</span>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleDownloadAll}
                  disabled={busy}
                  className="flex h-7 flex-none items-center gap-2 rounded-lg bg-indigo-600 px-3 transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {downloadingAll ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                      <span className="text-xs font-medium text-white">
                        {downloadingAll.done}/{downloadingAll.total}...
                      </span>
                    </>
                  ) : (
                    <>
                      <Download className="h-3.5 w-3.5 text-white" />
                      <span className="text-xs font-medium text-white">Tout télécharger</span>
                    </>
                  )}
                </motion.button>
              </>
            )}
          </div>
        )}

        {/* Liste des fichiers */}
        <div
          className={`min-h-0 flex-1 overflow-y-auto ${
            !loading && files && files.length > 1
              ? ""
              : "border-t border-black/5 dark:border-white/10"
          }`}
        >
          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-zinc-500 dark:text-zinc-400" />
            </div>
          )}
          {!loading && isError && (
            <div className="py-12">
              <NetworkErrorState message={networkErrorMessage(error)} onRetry={() => refetch()} />
            </div>
          )}
          {!loading && !isError && (
            <ul className="divide-y divide-black/5 dark:divide-white/5">
              {files?.map((file, i) => {
                const fileName = file.name.split("/").pop() ?? file.name;
                const showName = fileName !== magnetName;
                const parsed = simpleView ? parseRelease(fileName) : null;
                const meta = [formatSize(file.size), parsed?.quality, parsed?.codec]
                  .filter(Boolean)
                  .join(" · ");
                const isSelected = selected.has(file.link);
                return (
                  <li
                    key={i}
                    onClick={selectMode ? () => toggleSelect(file.link) : undefined}
                    className={`flex items-center gap-3 px-5 py-2.5 transition-colors ${
                      selectMode
                        ? `cursor-pointer ${
                            isSelected
                              ? "bg-indigo-500/10"
                              : "hover:bg-black/[0.025] dark:hover:bg-white/[0.04]"
                          }`
                        : "hover:bg-black/[0.025] dark:hover:bg-white/[0.04]"
                    }`}
                  >
                    {selectMode && (
                      <span
                        className={`flex h-5 w-5 flex-none items-center justify-center rounded-md ring-1 transition-colors ${
                          isSelected
                            ? "bg-indigo-600 ring-indigo-500"
                            : "bg-zinc-200 ring-black/10 dark:bg-zinc-800 dark:ring-white/10"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      {showName && (
                        <span className="block truncate text-xs text-zinc-700 dark:text-zinc-300">
                          {parsed ? parsed.title : fileName}
                        </span>
                      )}
                      <span className="text-[11px] text-zinc-400">{meta}</span>
                    </div>
                    <div
                      className={`flex flex-none items-center gap-1 ${selectMode ? "hidden" : ""}`}
                    >
                      {isVideoFile(file.name) && (
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          title="Lire avec VLC"
                          onClick={() => handleOpenVlc(file.link)}
                          disabled={busy}
                          className="flex h-7 w-7 flex-none items-center justify-center rounded-lg transition-colors hover:bg-black/5 disabled:opacity-40 dark:hover:bg-white/10"
                        >
                          {vlcing === file.link ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-500" />
                          ) : (
                            <img src={vlcLogo} className="h-4 w-4" alt="VLC" />
                          )}
                        </motion.button>
                      )}
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        title="Copier le lien"
                        onClick={() => handleCopy(file.link)}
                        disabled={busy}
                        className="flex h-7 w-7 flex-none items-center justify-center rounded-lg transition-colors hover:bg-black/5 disabled:opacity-40 dark:hover:bg-white/10"
                      >
                        {copying === file.link ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-300" />
                        )}
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        title="Télécharger"
                        onClick={() => handleDownload(file.link)}
                        disabled={busy}
                        className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-indigo-600 transition-colors hover:bg-indigo-500 disabled:opacity-40"
                      >
                        {downloading === file.link ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                        ) : (
                          <Download className="h-3.5 w-3.5 text-white" />
                        )}
                      </motion.button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
