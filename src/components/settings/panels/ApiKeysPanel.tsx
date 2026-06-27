import { KeyRound } from "lucide-react";
import { ApiKeysForm, type ApiKeys } from "@/components/ApiKeysForm";
import { SettingsPanel } from "../SettingsPanel";

export function ApiKeysPanel({ onSaved }: { onSaved: (keys: ApiKeys) => void }) {
  return (
    <SettingsPanel
      icon={KeyRound}
      title="Comptes et clés API"
      subtitle="Les clés C411 et AllDebrid utilisées par l'application."
    >
      <ApiKeysForm onSaved={onSaved} />
    </SettingsPanel>
  );
}
