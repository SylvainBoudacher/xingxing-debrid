import { MonitorPlay } from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { VlcStatus } from "@/components/setup/VlcStatus";
import { VLC_DOWNLOAD_URL } from "@/lib/useVlcDetection";

export function VlcHelpTab({
  detected,
  checking,
  onCheck,
  onPick,
}: {
  detected: string | null;
  checking: boolean;
  onCheck: () => void;
  onPick: () => void;
}) {
  return (
    <SettingsPanel
      icon={MonitorPlay}
      title="Lecteur VLC"
      subtitle="Vérifier que VLC est installé et trouvé par l'application."
    >
      <p className="mb-5 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
        XingXing ouvre les vidéos dans VLC, qui lit tous les formats sans codec à installer. Sans
        lui, le bouton "Lire avec VLC" ne fonctionne pas, mais le téléchargement reste possible.
      </p>
      <VlcStatus
        checking={checking}
        detected={detected}
        onCheck={onCheck}
        onPick={onPick}
        onDownload={() => openUrl(VLC_DOWNLOAD_URL)}
      />
    </SettingsPanel>
  );
}
