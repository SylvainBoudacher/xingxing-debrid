import { motion } from "motion/react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { ArrowRight, Download } from "lucide-react";
import vlcLogo from "@/assets/vlc.png";
import { useVlcDetection, VLC_DOWNLOAD_URL, type VlcSim } from "@/lib/useVlcDetection";
import { VlcStatus } from "./VlcStatus";
import { StepKindBadge } from "./StepKindBadge";
import { item, stagger } from "./motionVariants";

export type { VlcSim };

export function PlayerStep({ onNext, sim = "none" }: { onNext: () => void; sim?: VlcSim }) {
  const { detected, checking, check, pick } = useVlcDetection(sim);

  return (
    <motion.div
      key="player"
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, x: -24, transition: { duration: 0.2 } }}
      variants={stagger}
      className="relative mx-auto w-full max-w-xl px-6 pt-12 pb-14 sm:px-8 space-y-8"
    >
      <motion.div variants={item} className="text-center">
        <div className="mb-6 flex justify-center">
          <StepKindBadge kind="check" />
        </div>
        <div className="relative mx-auto mb-6 h-20 w-20">
          <div className="absolute inset-0 rounded-3xl bg-orange-500/30 blur-2xl" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-500/10 ring-1 ring-orange-500/30">
            <img src={vlcLogo} alt="VLC" className="h-11 w-11 object-contain" />
          </div>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-3">
          Lecteur vidéo : VLC
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
          Avec XingXing, vous pouvez télécharger vos vidéos ou les regarder directement en streaming
          grâce à VLC. On l'utilise car il lit tous les formats existants, sans codec à installer.
        </p>
      </motion.div>

      <motion.div variants={item}>
        <VlcStatus
          checking={checking}
          detected={detected}
          onCheck={check}
          onPick={pick}
          onDownload={() => openUrl(VLC_DOWNLOAD_URL)}
        />
      </motion.div>

      <motion.div variants={item} className="pt-4">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onNext}
          className="flex w-full items-center justify-center gap-2 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white transition-colors"
        >
          Continuer
          <ArrowRight className="h-4 w-4" />
        </motion.button>
        {!detected && !checking && (
          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-zinc-400 dark:text-zinc-600">
            <Download className="h-3 w-3 shrink-0" />
            Sans VLC, vous pouvez continuer : seul le téléchargement des fichiers restera
            disponible.
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}
