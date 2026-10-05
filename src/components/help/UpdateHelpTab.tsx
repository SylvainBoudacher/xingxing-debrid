import { Download } from "lucide-react";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { UpdateCheckSection } from "@/components/UpdateCheckSection";
import type { UpdateInfo } from "@/lib/updater";

type Props = {
  availableUpdate: UpdateInfo | null;
  onCheck: () => Promise<UpdateInfo | null>;
  onShowUpdate: () => void;
};

export function UpdateHelpTab(props: Props) {
  return (
    <SettingsPanel
      icon={Download}
      title="Mettre à jour"
      subtitle="Vérifier et installer la dernière version de l'application."
    >
      <p className="mb-5 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
        Un bug ou un comportement étrange ? Il est peut-être déjà corrigé : commencez par vérifier
        que vous avez la dernière version.
      </p>
      <UpdateCheckSection {...props} />
    </SettingsPanel>
  );
}
