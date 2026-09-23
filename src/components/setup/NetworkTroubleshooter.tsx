import { useRef, useState } from "react";
import { motion } from "motion/react";
import type { DnsStatus } from "@/lib/useDnsCheck";
import { NetworkCheck } from "./NetworkCheck";
import { NetworkExplainer } from "./NetworkExplainer";
import { NetworkGuideSection } from "./NetworkGuideSection";
import { item } from "./motionVariants";

export function NetworkTroubleshooter({
  dnsStatus,
  dnsError,
  onCheck,
}: {
  dnsStatus: DnsStatus;
  dnsError: string;
  onCheck: () => void;
}) {
  const [explainerOpen, setExplainerOpen] = useState(dnsStatus === "fail");
  const [guideOpen, setGuideOpen] = useState(dnsStatus === "fail");
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
    <>
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
    </>
  );
}
