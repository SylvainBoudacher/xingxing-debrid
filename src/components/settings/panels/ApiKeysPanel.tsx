import { useEffect, useState } from "react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { getApiKey, setApiKey, type ApiKeys } from "@/lib/apiKeys";
import { KEY_SERVICES, type KeyService } from "@/lib/keyServices";
import { KeyScreen, type ScreenStatus } from "@/components/setup/keys/KeyScreen";
import { KeyServiceTabs } from "@/components/setup/keys/KeyServiceTabs";
import { SettingsPanel } from "../SettingsPanel";

const FIELDS: Record<KeyService["id"], keyof ApiKeys> = {
  c411: "c411Key",
  alldebrid: "allDebridKey",
  tmdb: "tmdbKey",
};

export function ApiKeysPanel({ onSaved }: { onSaved: (keys: Partial<ApiKeys>) => void }) {
  const [index, setIndex] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<Record<string, ScreenStatus>>({});

  useEffect(() => {
    for (const s of KEY_SERVICES) {
      getApiKey(s.keyName).then((v) => {
        if (v) setValues((prev) => ({ ...prev, [s.id]: v }));
      });
    }
  }, []);

  const service = KEY_SERVICES[index];
  const status = statuses[service.id] ?? "idle";

  async function save(value: string) {
    try {
      await setApiKey(service.keyName, value);
      onSaved({ [FIELDS[service.id]]: value });
      toast.success(`Clé ${service.name} enregistrée.`);
    } catch (err) {
      toast.error(String(err));
    }
  }

  async function verify() {
    const value = (values[service.id] ?? "").trim();
    // Apres un echec, le bouton enregistre la cle telle quelle.
    if (status === "invalid" || status === "unreachable") {
      setStatuses((prev) => ({ ...prev, [service.id]: "idle" }));
      return save(value);
    }
    setStatuses((prev) => ({ ...prev, [service.id]: "checking" }));
    const result = await service.check(value);
    setStatuses((prev) => ({ ...prev, [service.id]: result }));
    if (result === "valid") await save(value);
  }

  function change(v: string) {
    setValues((prev) => ({ ...prev, [service.id]: v }));
    if (status !== "idle") setStatuses((prev) => ({ ...prev, [service.id]: "idle" }));
  }

  return (
    <SettingsPanel
      icon={KeyRound}
      title="Comptes et clés API"
      subtitle="Les clés C411, AllDebrid et TMDB utilisées par l'application."
    >
      <div className="mx-auto w-full max-w-xl space-y-4">
        <KeyServiceTabs activeId={service.id} statuses={statuses} onSelect={setIndex} />
        <KeyScreen
          service={service}
          value={values[service.id] ?? ""}
          status={status}
          onChange={change}
          onVerify={verify}
          skipLabel="Enregistrer quand même"
        />
      </div>
    </SettingsPanel>
  );
}
