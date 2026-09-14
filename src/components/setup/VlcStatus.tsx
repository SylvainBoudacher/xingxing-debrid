import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, Check, FolderOpen, Loader2, RefreshCw } from "lucide-react";
import vlcLogo from "@/assets/vlc.png";

type Props = {
  checking: boolean;
  detected: string | null;
  onCheck: () => void;
  onPick: () => void;
  onDownload: () => void;
};

const STATES = {
  checking: {
    ring: "ring-black/6 dark:ring-white/6",
    icon: "bg-zinc-500/10 text-zinc-500",
    title: "Recherche de VLC en cours...",
    text: "On parcourt vos applications, y compris sur les autres disques.",
  },
  ok: {
    ring: "ring-emerald-500/30",
    icon: "bg-emerald-500/15 text-emerald-500",
    title: "VLC est prêt",
    text: "Tout est en place, vos vidéos s'ouvriront directement dans VLC.",
  },
  fail: {
    ring: "ring-amber-500/30",
    icon: "bg-amber-500/15 text-amber-500",
    title: "VLC n'a pas été trouvé",
    text: "Choisissez la situation qui vous correspond ci-dessous.",
  },
} as const;

const secondaryBtn =
  "flex shrink-0 items-center justify-center gap-2 h-10 rounded-xl bg-white/90 dark:bg-zinc-800/80 ring-1 ring-black/10 dark:ring-white/10 px-4 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white disabled:opacity-40 transition-colors";

export function VlcStatus({ checking, detected, onCheck, onPick, onDownload }: Props) {
  const key = checking ? "checking" : detected ? "ok" : "fail";
  const state = STATES[key];

  return (
    <div
      className={`rounded-2xl bg-white/80 dark:bg-zinc-900/70 ring-1 px-6 py-6 transition-shadow ${state.ring}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className="flex items-start gap-4"
        >
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${state.icon}`}
          >
            {key === "checking" && <Loader2 className="h-5 w-5 animate-spin" />}
            {key === "ok" && <Check className="h-5 w-5" strokeWidth={3} />}
            {key === "fail" && <AlertTriangle className="h-5 w-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold text-zinc-900 dark:text-white">{state.title}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              {state.text}
            </p>
            {key === "ok" && detected && (
              <p className="mt-2 truncate font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
                {detected}
              </p>
            )}
          </div>
          {key === "ok" && (
            <button onClick={onCheck} className={secondaryBtn} title="Revérifier">
              <RefreshCw className="h-3.5 w-3.5" />
              Revérifier
            </button>
          )}
        </motion.div>
      </AnimatePresence>

      {key === "fail" && (
        <div className="mt-6 space-y-3">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4 rounded-xl bg-zinc-100 dark:bg-zinc-950/60 ring-1 ring-black/6 dark:ring-white/6 px-4 py-3">
              <div>
                <p className="text-xs font-semibold text-zinc-900 dark:text-white">
                  Pas encore installé ?
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
                  Téléchargez VLC gratuitement et installez-le.
                </p>
              </div>
              <button
                onClick={onDownload}
                className="flex shrink-0 items-center justify-center gap-2 h-10 px-4 rounded-xl bg-[#ff8800]/12 ring-1 ring-[#ff8800]/25 text-sm font-semibold text-[#c96a00] dark:text-[#ffa63d] hover:bg-[#ff8800]/20 transition-colors"
              >
                <img src={vlcLogo} alt="" className="h-4 w-4" />
                Télécharger VLC
              </button>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-xl bg-zinc-100 dark:bg-zinc-950/60 ring-1 ring-black/6 dark:ring-white/6 px-4 py-3">
              <div>
                <p className="text-xs font-semibold text-zinc-900 dark:text-white">
                  Déjà installé ?
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
                  Indiquez où se trouve VLC sur votre machine.
                </p>
              </div>
              <button onClick={onPick} className={secondaryBtn}>
                <FolderOpen className="h-3.5 w-3.5" />
                Localiser VLC
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl ring-1 ring-dashed ring-black/10 dark:ring-white/10 px-4 py-3">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Une fois VLC installé ou localisé, relancez la détection.
            </p>
            <button onClick={onCheck} className={secondaryBtn}>
              <RefreshCw className="h-3.5 w-3.5" />
              Revérifier
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
