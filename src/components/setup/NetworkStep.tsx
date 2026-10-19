import { motion } from "motion/react";
import { ArrowRight, Loader2 } from "lucide-react";
import type { DnsStatus } from "@/lib/useDnsCheck";
import { NetworkTroubleshooter } from "./NetworkTroubleshooter";
import { StepKindBadge } from "./StepKindBadge";
import { item, stagger } from "./motionVariants";

export function NetworkStep({
  dnsStatus,
  dnsError,
  onCheck,
  onNext,
}: {
  dnsStatus: DnsStatus;
  dnsError: string;
  onCheck: () => void;
  onNext: () => void;
}) {
  return (
    <motion.div
      key="network"
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, x: -24, transition: { duration: 0.2 } }}
      variants={stagger}
      className="relative mx-auto w-full max-w-2xl px-6 pt-10 pb-12 sm:px-8 space-y-5"
    >
      <motion.div variants={item}>
        <div className="text-center mb-4">
          <div className="mb-2 flex justify-center">
            <StepKindBadge kind="check" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">
            Votre connexion internet
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            XingXing a besoin d'internet, et surtout de pouvoir joindre C411. Chez certains
            opérateurs, cet acces est bloqué au niveau du DNS. On vérifie ça tout de suite.
          </p>
        </div>
      </motion.div>

      <NetworkTroubleshooter dnsStatus={dnsStatus} dnsError={dnsError} onCheck={onCheck} />

      <motion.div variants={item} className="pt-2">
        <motion.button
          whileTap={{ scale: dnsStatus === "ok" ? 0.98 : 1 }}
          onClick={onNext}
          disabled={dnsStatus !== "ok"}
          className="flex w-full items-center justify-center gap-2 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-indigo-600 text-sm font-semibold text-white transition-colors"
        >
          {dnsStatus === "checking" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Continuer
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </motion.button>
        {dnsStatus === "fail" && (
          <p className="mt-2 text-center text-[11px] text-red-500 dark:text-red-400">
            c411.org doit être joignable pour continuer : sans cela l'application ne peut rien
            chercher.
          </p>
        )}
        {dnsStatus === "idle" && (
          <p className="mt-2 text-center text-[11px] text-zinc-400 dark:text-zinc-600">
            Lancez le test d'accès à c411.org pour continuer.
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}
