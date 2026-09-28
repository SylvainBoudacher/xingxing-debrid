import {
  cancelDownload,
  dismissDownload,
  openDownload,
  revealDownload,
  type DownloadItem,
} from "@/lib/downloads";
import { formatBytes } from "@/lib/formatBytes";
import { Check, CircleAlert, Film, FolderOpen, LoaderCircle, Play, X } from "lucide-react";
import { motion } from "motion/react";

const ICON_BUTTON =
  "text-muted-foreground hover:bg-muted hover:text-foreground flex cursor-pointer h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors";

function statusLine(item: DownloadItem) {
  switch (item.status) {
    case "done":
      return {
        icon: <Check className="h-3 w-3 text-emerald-500" />,
        label: "Téléchargement terminé",
      };
    case "error":
      return {
        icon: <CircleAlert className="h-3 w-3 text-red-500" />,
        label: "Échec du téléchargement",
      };
    case "cancelled":
      return { icon: <X className="h-3 w-3" />, label: "Téléchargement annulé" };
    default:
      return {
        icon: <LoaderCircle className="h-3 w-3 animate-spin" />,
        label: "Téléchargement en cours",
      };
  }
}

export function DownloadCard({ item }: { item: DownloadItem }) {
  const { meta } = item;
  const isActive = item.status === "active";
  const isDone = item.status === "done";
  const pct = item.total ? Math.min(100, (item.downloaded / item.total) * 100) : 0;
  // Un type de fichier a risque (executable, script...) ne propose que le dossier.
  const canOpen = !!item.onOpen || !!item.openable;
  const status = statusLine(item);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ type: "spring", stiffness: 400, damping: 34 }}
      className="bg-background border-border flex items-center gap-3 rounded-2xl border p-3 shadow-lg"
    >
      <div className="bg-muted h-[84px] w-14 shrink-0 overflow-hidden rounded-lg">
        {meta.posterSrc ? (
          <img src={meta.posterSrc} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="text-muted-foreground flex h-full w-full items-center justify-center">
            <Film className="h-5 w-5" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-medium">
          {status.icon}
          {status.label}
        </div>
        <div className="text-foreground truncate text-sm font-semibold" title={item.filename}>
          {meta.title}
          {meta.year ? (
            <span className="text-muted-foreground font-normal"> ({meta.year})</span>
          ) : null}
        </div>
        {meta.badges.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {meta.badges.map((b) => (
              <span
                key={b}
                className="bg-muted text-muted-foreground rounded-md px-1.5 py-0.5 text-[10px] font-medium"
              >
                {b}
              </span>
            ))}
          </div>
        )}
        {isActive && (
          <>
            <div className="bg-muted mt-2 h-1 overflow-hidden rounded-full">
              <motion.div
                className="bg-primary h-full rounded-full"
                initial={false}
                animate={{ width: `${pct}%` }}
                transition={{ ease: "easeOut", duration: 0.2 }}
              />
            </div>
            <p className="text-muted-foreground mt-1 truncate text-[10px] tabular-nums">
              {item.total
                ? `${formatBytes(item.downloaded)} / ${formatBytes(item.total)}`
                : formatBytes(item.downloaded)}
              {item.speed ? ` · ${formatBytes(item.speed)}/s` : ""}
            </p>
          </>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <button
          type="button"
          onClick={() => (isActive ? cancelDownload(item.id) : dismissDownload(item.id))}
          className={ICON_BUTTON}
          aria-label={isActive ? "Annuler" : "Fermer"}
          title={isActive ? "Annuler" : "Fermer"}
        >
          <X className="h-3.5 w-3.5" />
        </button>
        {isDone && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => revealDownload(item.id)}
              className={ICON_BUTTON}
              aria-label="Ouvrir le dossier"
              title="Ouvrir le dossier"
            >
              <FolderOpen className="h-3.5 w-3.5" />
            </button>
            {canOpen && (
              <button
                type="button"
                onClick={() => openDownload(item.id)}
                title={item.onOpen ? "Lire dans l'application" : "Ouvrir le fichier"}
                className="bg-primary text-primary-foreground hover:bg-primary/90 flex cursor-pointer items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors"
              >
                <Play className="h-3.5 w-3.5" />
                {item.onOpen ? "Lire" : "Ouvrir"}
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
