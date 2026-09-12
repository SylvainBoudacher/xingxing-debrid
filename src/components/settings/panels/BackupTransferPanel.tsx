import { ArchiveRestore } from "lucide-react";
import { SettingsPanel } from "../SettingsPanel";
import { PanelDivider } from "../controls";
import { DiscoverListSection } from "./DiscoverListSection";
import { LibraryTransferSection } from "./LibraryTransferSection";
import { ProfileBackupSection } from "./ProfileBackupSection";

export function BackupTransferPanel() {
  return (
    <SettingsPanel
      icon={ArchiveRestore}
      title="Sauvegarde et transfert"
      subtitle="Exporter et importer votre profil, votre bibliothèque et votre liste."
    >
      <ProfileBackupSection />
      <PanelDivider />
      <LibraryTransferSection />
      <PanelDivider />
      <DiscoverListSection />
    </SettingsPanel>
  );
}
