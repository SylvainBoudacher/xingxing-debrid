import { Download } from "lucide-react";
import { SettingsPanel } from "../SettingsPanel";
import { UpdateCheckSection } from "@/components/UpdateCheckSection";
import type { UpdateInfo } from "@/lib/updater";

type Props = {
  availableUpdate: UpdateInfo | null;
  onCheck: () => Promise<UpdateInfo | null>;
  onShowUpdate: () => void;
};

export function UpdatesPanel(props: Props) {
  return (
    <SettingsPanel
      icon={Download}
      title="Mises à jour"
      subtitle="Vérifier et installer la dernière version de l'application."
    >
      <UpdateCheckSection {...props} />
    </SettingsPanel>
  );
}
