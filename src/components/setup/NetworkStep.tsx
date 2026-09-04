import { useRef, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Loader2 } from "lucide-react";
import { NetworkCheck } from "./NetworkCheck";
import { NetworkExplainer } from "./NetworkExplainer";
import { NetworkGuideSection } from "./NetworkGuideSection";
import { StepKindBadge } from "./StepKindBadge";
import { item, stagger } from "./motionVariants";

export type DnsStatus = "idle" | "checking" | "ok" | "fail";

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
  const [explainerOpen, setExplainerOpen] = useState(dnsStatus !== "ok");
  const [guideOpen, setGuideOpen] = useState(dnsStatus !== "ok");
  const testRef = useRef<HTMLElement>(null);

  // Le tutoriel est loin du resultat : on ramene l'utilisateur au test qu'il
  // vient de relancer, sinon rien ne bouge visiblement a l'ecran.
  const retestFromGuide = () => {
    onCheck();
    testRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // Le resultat du test decide de l'explicatif : replie quand tout va bien,
  // deplie quand l'utilisateur doit agir. Un clic manuel reste prioritaire
  // jusqu'au prochain changement de statut.
  const [prevStatus, setPrevStatus] = useState(dnsStatus);
  if (prevStatus !== dnsStatus) {
    setPrevStatus(dnsStatus);
    if (dnsStatus === "ok") {
      setExplainerOpen(false);
      setGuideOpen(false);
    }
    if (dnsStatus === "fail") {
      setExplainerOpen(true);
      setGuideOpen(true);
    }
  }

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
            operateurs, cet acces est bloque au niveau du DNS. On verifie ca tout de suite.
          </p>
        </div>
      </motion.div>

      <motion.div variants={item}>
        <NetworkCheck
          sectionRef={testRef}
          dnsStatus={dnsStatus}
          dnsError={dnsError}
          onCheck={onCheck}
        />
      </motion.div>

      <motion.div variants={item}>
        <NetworkExplainer open={explainerOpen} onToggle={() => setExplainerOpen((open) => !open)} />
      </motion.div>

      <motion.div variants={item}>
        <NetworkGuideSection
          open={guideOpen}
          onToggle={() => setGuideOpen((open) => !open)}
          onRetest={retestFromGuide}
          retesting={dnsStatus === "checking"}
        />
      </motion.div>

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
            c411.org doit etre joignable pour continuer : sans cela l'application ne peut rien
            chercher.
          </p>
        )}
        {dnsStatus === "idle" && (
          <p className="mt-2 text-center text-[11px] text-zinc-400 dark:text-zinc-600">
            Lancez le test d'acces a c411.org pour continuer.
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}
