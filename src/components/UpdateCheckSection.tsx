import { useState } from "react";
import { AlertTriangle, Check, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { RELEASES_URL } from "@/lib/releases";
import { LATEST_VERSION } from "@/lib/version";
import type { UpdateInfo } from "@/lib/updater";

type Props = {
  availableUpdate: UpdateInfo | null;
  onCheck: () => Promise<UpdateInfo | null>;
  onShowUpdate: () => void;
};

type Status = "idle" | "checking" | "uptodate" | "error";

const btn =
  "flex shrink-0 items-center justify-center gap-2 h-10 rounded-xl bg-white/90 dark:bg-zinc-800/80 ring-1 ring-black/10 dark:ring-white/10 px-4 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white disabled:opacity-40 transition-colors";

export function UpdateCheckSection({ availableUpdate, onCheck, onShowUpdate }: Props) {
  const [status, setStatus] = useState<Status>("idle");

  async function handleCheck() {
    setStatus("checking");
    try {
      const update = await onCheck();
      setStatus(update ? "idle" : "uptodate");
    } catch {
      setStatus("error");
    }
  }

  const checking = status === "checking";
  const view = availableUpdate
    ? {
        ring: "ring-emerald-500/30",
        icon: "bg-emerald-500/15 text-emerald-500",
        title: `Version ${availableUpdate.version} disponible`,
        text: "Une nouvelle version de XingXing est prête à être installée.",
      }
    : status === "uptodate"
      ? {
          ring: "ring-emerald-500/30",
          icon: "bg-emerald-500/15 text-emerald-500",
          title: "Vous êtes à jour",
          text: "Vous utilisez la dernière version de XingXing.",
        }
      : status === "error"
        ? {
            ring: "ring-amber-500/30",
            icon: "bg-amber-500/15 text-amber-500",
            title: "Impossible de vérifier",
            text: "Vérifiez votre connexion, ou téléchargez la dernière version directement sur GitHub.",
          }
        : {
            ring: "ring-black/6 dark:ring-white/6",
            icon: "bg-zinc-500/10 text-zinc-500",
            title: `Version installée : ${LATEST_VERSION}`,
            text: "Vérifiez si une version plus récente est disponible.",
          };

  return (
    <div className="space-y-3">
      <div
        className={`flex items-start gap-4 rounded-2xl bg-white/80 dark:bg-zinc-900/70 ring-1 px-6 py-6 ${view.ring}`}
      >
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${view.icon}`}
        >
          {checking ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : status === "error" && !availableUpdate ? (
            <AlertTriangle className="h-5 w-5" />
          ) : availableUpdate || status === "uptodate" ? (
            <Check className="h-5 w-5" strokeWidth={3} />
          ) : (
            <RefreshCw className="h-5 w-5" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-zinc-900 dark:text-white">
            {checking ? "Vérification en cours..." : view.title}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            {view.text}
          </p>
        </div>
        {availableUpdate ? (
          <button
            onClick={onShowUpdate}
            className="flex shrink-0 items-center justify-center h-10 px-4 rounded-xl bg-emerald-500/15 ring-1 ring-emerald-500/30 text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25 transition-colors"
          >
            Installer
          </button>
        ) : (
          <button onClick={handleCheck} disabled={checking} className={btn}>
            <RefreshCw className="h-3.5 w-3.5" />
            Vérifier
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl ring-1 ring-dashed ring-black/10 dark:ring-white/10 px-4 py-3">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Un souci avec la mise à jour automatique ? Téléchargez l'installateur à la main.
        </p>
        <button onClick={() => openUrl(RELEASES_URL)} className={btn}>
          <ExternalLink className="h-3.5 w-3.5" />
          GitHub
        </button>
      </div>
    </div>
  );
}
