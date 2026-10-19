import { useState } from "react";
import { motion } from "motion/react";
import { Loader2, Wifi } from "lucide-react";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { NetworkTroubleshooter } from "@/components/setup/NetworkTroubleshooter";
import { stagger } from "@/components/setup/motionVariants";
import type { DnsStatus } from "@/lib/useDnsCheck";

export function DnsTab({
  dnsStatus,
  dnsError,
  onCheck,
}: {
  dnsStatus: DnsStatus;
  dnsError: string;
  onCheck: () => void;
}) {
  // Le test est lance des l'arrivee sur la page Aide : le plus souvent le
  // resultat est deja la, sinon on attend avant d'afficher le schema.
  const [ready, setReady] = useState(dnsStatus === "ok" || dnsStatus === "fail");
  if (!ready && (dnsStatus === "ok" || dnsStatus === "fail")) setReady(true);

  return (
    <SettingsPanel
      icon={Wifi}
      title="Configurer le DNS"
      subtitle="Vérifier l'accès à C411 et changer de DNS si besoin."
    >
      <p className="mb-5 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
        Chez certains opérateurs, l'accès à C411 est bloqué au niveau du DNS. Le test ci-dessous
        vérifie votre connexion ; s'il échoue, suivez le guide puis relancez-le.
      </p>
      {ready ? (
        <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-5">
          <NetworkTroubleshooter dnsStatus={dnsStatus} dnsError={dnsError} onCheck={onCheck} />
        </motion.div>
      ) : (
        <div className="flex items-center justify-center gap-2 py-16 text-xs text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Vérification de l'accès à c411.org...
        </div>
      )}
    </SettingsPanel>
  );
}
