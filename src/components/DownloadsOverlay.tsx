import {
  cancelDownload,
  clearFinishedDownloads,
  dismissDownload,
  getBulkDownloadSnapshot,
  getDownloadsSnapshot,
  openDownload,
  subscribeBulkDownload,
  subscribeDownloads,
  type DownloadItem,
} from "@/lib/downloads";
import { Check, Download, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useSyncExternalStore } from "react";

function formatBytes(n: number): string {
  if (!n) return "0 o";
  const units = ["o", "Ko", "Mo", "Go", "To"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
  return `${(n / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function DownloadRow({ item }: { item: DownloadItem }) {
  const pct = item.total ? Math.min(100, (item.downloaded / item.total) * 100) : 0;
  const isActive = item.status === "active";
  const isDone = item.status === "done";

  const icon = (
    <span
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${
        isDone
          ? "bg-green-500/15 text-green-600 dark:text-green-400"
          : item.status === "error"
            ? "bg-red-500/15 text-red-600 dark:text-red-400"
            : "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"
      }`}
    >
      {isDone ? <Check className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}
    </span>
  );

  const text = (
    <div className="min-w-0 flex-1 text-left">
      <p className="truncate text-xs font-medium text-zinc-900 dark:text-white transition-colors duration-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
        {item.filename}
      </p>
      <p className="truncate text-[11px] text-zinc-500">
        {item.status === "cancelled"
          ? "Annulé"
          : item.status === "error"
            ? "Échec"
            : isDone
              ? "Cliquer pour ouvrir"
              : `${item.total ? `${formatBytes(item.downloaded)} / ${formatBytes(item.total)}` : formatBytes(item.downloaded)}${
                  item.speed ? ` · ${formatBytes(item.speed)}/s` : ""
                }`}
      </p>
    </div>
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ type: "spring", stiffness: 400, damping: 34 }}
      className="rounded-xl bg-white dark:bg-zinc-900 ring-1 ring-black/8 dark:ring-white/10 shadow-lg px-3.5 py-2.5"
    >
      <div className="flex items-center gap-2.5">
        {isDone ? (
          <button
            onClick={() => openDownload(item.id)}
            title="Ouvrir le fichier"
            className="group flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-lg text-left"
          >
            {icon}
            {text}
          </button>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            {icon}
            {text}
          </div>
        )}

        <button
          onClick={() => (isActive ? cancelDownload(item.id) : dismissDownload(item.id))}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-black/5 dark:hover:bg-white/10 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          aria-label={isActive ? "Annuler" : "Fermer"}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {isActive && (
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-black/8 dark:bg-white/10">
          <motion.div
            className="h-full rounded-full bg-indigo-500"
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={{ ease: "easeOut", duration: 0.2 }}
          />
        </div>
      )}
    </motion.div>
  );
}

// En-tête récapitulatif d'un téléchargement groupé (lot de N en parallèle),
// affiché en tête de la liste des téléchargements.
function BulkSummaryRow() {
  const progress = useSyncExternalStore(subscribeBulkDownload, getBulkDownloadSnapshot);
  if (!progress) return null;

  const pending = progress.total - progress.done - progress.active;
  const pct = progress.total ? (progress.done / progress.total) * 100 : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ type: "spring", stiffness: 400, damping: 34 }}
      className="rounded-xl bg-white dark:bg-zinc-900 ring-1 ring-black/8 dark:ring-white/10 shadow-lg px-3.5 py-2.5"
    >
      <div className="flex items-center gap-2.5">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
          <Download className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate text-xs font-semibold text-zinc-900 dark:text-white">
            Téléchargement groupé
          </p>
          <p className="truncate text-[11px] text-zinc-500">
            {progress.active} en cours{pending > 0 && ` · ${pending} en attente`}
          </p>
        </div>
        <span className="shrink-0 text-[11px] font-medium tabular-nums text-zinc-500">
          {progress.done}/{progress.total}
        </span>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-black/8 dark:bg-white/10">
        <motion.div
          className="h-full rounded-full bg-indigo-500"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ ease: "easeOut", duration: 0.3 }}
        />
      </div>
    </motion.div>
  );
}

export function DownloadsOverlay() {
  const downloads = useSyncExternalStore(subscribeDownloads, getDownloadsSnapshot);
  const bulk = useSyncExternalStore(subscribeBulkDownload, getBulkDownloadSnapshot);

  if (downloads.length === 0 && !bulk) return null;

  const hasFinished = downloads.some((d) => d.status !== "active");

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex w-72 flex-col gap-2">
      {hasFinished && (
        <button
          onClick={clearFinishedDownloads}
          className="self-end text-[11px] font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
        >
          Tout effacer
        </button>
      )}
      <AnimatePresence initial={false}>
        {bulk && <BulkSummaryRow key="bulk-summary" />}
        {downloads.map((item) => (
          <DownloadRow key={item.id} item={item} />
        ))}
      </AnimatePresence>
    </div>
  );
}
