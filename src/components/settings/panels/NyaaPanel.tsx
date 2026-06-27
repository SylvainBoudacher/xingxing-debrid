import nyaaLogo from "@/assets/sources/nyaa.webp";
import { NyaaDefaultsForm } from "@/components/NyaaDefaultsForm";
import { SettingsPanel } from "../SettingsPanel";
import { FieldTitle } from "../controls";

export function NyaaPanel() {
  return (
    <SettingsPanel
      iconImg={nyaaLogo}
      title="Nyaa"
      subtitle="Préremplissage des filtres de recherche Nyaa."
    >
      <FieldTitle
        title="Filtres par défaut"
        hint="Ces valeurs préremplissent la barre de pré-request lors d'une recherche Nyaa. Pratique si vous cherchez souvent la même langue ou qualité. Vous pouvez toujours les modifier au moment de la recherche."
      />

      <NyaaDefaultsForm />
    </SettingsPanel>
  );
}
