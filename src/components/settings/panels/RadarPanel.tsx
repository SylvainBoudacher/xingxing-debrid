import { RadarExpectationFields } from "@/components/radar/RadarExpectationFields";
import { loadRadar, setRadarDefaults } from "@/lib/radar/radarStore";
import { useRadar } from "@/lib/radar/useRadar";
import { Radar } from "lucide-react";
import { useEffect } from "react";
import { SettingsPanel } from "../SettingsPanel";

export function RadarPanel() {
  const { defaults } = useRadar();

  useEffect(() => {
    void loadRadar();
  }, []);

  return (
    <SettingsPanel
      icon={Radar}
      title="Radar"
      subtitle="Version attendue par défaut pour les alertes."
    >
      <RadarExpectationFields value={defaults} onChange={setRadarDefaults} />
    </SettingsPanel>
  );
}
