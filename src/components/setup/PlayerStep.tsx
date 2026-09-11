import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { openUrl } from "@tauri-apps/plugin-opener";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Download,
  FolderOpen,
  Loader2,
  MonitorPlay,
  RefreshCw,
} from "lucide-react";
import vlcLogo from "@/assets/vlc.png";
import { detectVlc } from "@/lib/player";
import { settingsStore } from "@/components/settings/store";
import { StepKindBadge } from "./StepKindBadge";
import { item, stagger } from "./motionVariants";

const VLC_DOWNLOAD_URL = "https://images.videolan.org/vlc/index.fr.html";

// Simulation dev : force le resultat de la detection tant qu'elle est active.
export type VlcSim = "none" | "ok" | "fail";
const SIM_PATH = "[DEV] /Applications/VLC.app";

export function PlayerStep({ onNext, sim = "none" }: { onNext: () => void; sim?: VlcSim }) {
  const [detected, setDetected] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  const detect = useCallback(async () => {
    if (import.meta.env.DEV && sim !== "none") return sim === "ok" ? SIM_PATH : null;
    return detectVlc();
  }, [sim]);

  useEffect(() => {
    detect().then((path) => {
      setDetected(path);
      setChecking(false);
    });
  }, [detect]);

  async function check() {
    setChecking(true);
    setDetected(await detect());
    setChecking(false);
  }

  async function pickVlc() {
    const isMac = navigator.userAgent.includes("Mac");
    const picked = await openDialog({
      multiple: false,
      filters: isMac
        ? [{ name: "Application", extensions: ["app"] }]
        : [{ name: "Exécutable", extensions: ["exe"] }],
    });
    if (typeof picked !== "string") return;
    await settingsStore.set("vlc_path", picked);
    await settingsStore.save();
    await check();
  }

  return (
    <motion.div
      key="player"
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, x: -24, transition: { duration: 0.2 } }}
      variants={stagger}
      className="relative mx-auto w-full max-w-xl px-6 pt-10 pb-12 sm:px-8 space-y-4"
    >
      <motion.div variants={item}>
        <div className="text-center mb-2">
          <div className="mb-2 flex justify-center">
            <StepKindBadge kind="check" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">
            Lecteur vidéo
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
            XingXing lit vos vidéos avec VLC, sans les télécharger. On vérifie qu'il est bien
            installé sur votre machine.
          </p>
        </div>
      </motion.div>

      <motion.div
        variants={item}
        className="rounded-2xl bg-white/80 dark:bg-zinc-900/70 ring-1 ring-black/6 dark:ring-white/6 px-5 py-5"
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/12 ring-1 ring-indigo-500/20">
            <MonitorPlay className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-white">Détection de VLC</p>
        </div>
        <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
          La recherche est automatique, y compris sur un autre disque. Indiquez son emplacement
          uniquement si la détection échoue.
        </p>

        <div className="flex items-center justify-between gap-4 rounded-xl bg-zinc-100 dark:bg-zinc-950/60 ring-1 ring-black/6 dark:ring-white/6 px-4 py-3">
          <div className="min-w-0">
            {checking ? (
              <p className="flex items-center gap-2 text-sm text-zinc-500">
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                Recherche de VLC...
              </p>
            ) : detected ? (
              <>
                <p className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-white">
                  <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  VLC est installé
                </p>
                <p className="mt-0.5 truncate text-xs text-zinc-500">{detected}</p>
              </>
            ) : (
              <>
                <p className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  VLC introuvable
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Installez-le, puis relancez la détection.
                </p>
              </>
            )}
          </div>
          <button
            onClick={detected ? check : pickVlc}
            disabled={checking}
            className="flex shrink-0 items-center gap-2 rounded-full bg-white/90 dark:bg-zinc-800/80 ring-1 ring-black/10 dark:ring-white/10 px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 hover:text-zinc-900 dark:hover:text-white disabled:opacity-40 transition-colors"
          >
            {detected ? (
              <>
                <RefreshCw className="h-3.5 w-3.5" />
                Revérifier
              </>
            ) : (
              <>
                <FolderOpen className="h-3.5 w-3.5" />
                Choisir
              </>
            )}
          </button>
        </div>

        {!detected && !checking && (
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => openUrl(VLC_DOWNLOAD_URL)}
              className="flex flex-1 items-center justify-center gap-2 h-10 rounded-xl bg-[#ff8800]/12 ring-1 ring-[#ff8800]/25 text-sm font-semibold text-[#c96a00] dark:text-[#ffa63d] hover:bg-[#ff8800]/20 transition-colors"
            >
              <img src={vlcLogo} alt="" className="h-4 w-4" />
              Télécharger VLC
            </button>
            <button
              onClick={check}
              className="flex shrink-0 items-center gap-2 h-10 rounded-xl bg-white/90 dark:bg-zinc-800/80 ring-1 ring-black/10 dark:ring-white/10 px-4 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Revérifier
            </button>
          </div>
        )}
      </motion.div>

      <motion.div variants={item} className="pt-2">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onNext}
          className="flex w-full items-center justify-center gap-2 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white transition-colors"
        >
          Continuer
          <ArrowRight className="h-4 w-4" />
        </motion.button>
        {!detected && !checking && (
          <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[11px] text-zinc-400 dark:text-zinc-600">
            <Download className="h-3 w-3 shrink-0" />
            Sans VLC, vous pouvez continuer : seul le téléchargement des fichiers restera
            disponible.
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}
