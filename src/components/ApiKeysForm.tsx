import { useEffect, useState } from "react";
import { LazyStore } from "@tauri-apps/plugin-store";
import { openUrl } from "@tauri-apps/plugin-opener";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const store = new LazyStore("settings.json", { defaults: {}, autoSave: false });

const C411_STEPS = [
  "Connectez-vous a votre compte C411.",
  "Cliquez sur votre profil en haut a droite.",
  'Allez dans "Integration API".',
  'Cliquez sur "Creer une cle".',
  "Copiez la cle generee et collez-la ci-dessous.",
];

const ALLDEBRID_STEPS = [
  "Connectez-vous a votre compte sur alldebrid.fr.",
  'Allez dans "Mon compte".',
  'Cliquez sur "Apikey Manager".',
  'Cliquez sur "Nouvelle cle".',
  "Copiez la cle generee et collez-la ci-dessous.",
];

function TutorialBlock({
  number,
  title,
  url,
  steps,
  inputId,
  value,
  placeholder,
  onChange,
}: {
  number: number;
  title: string;
  url: string;
  steps: string[];
  inputId: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            {number}
          </span>
          <button
            type="button"
            onClick={() => openUrl(url)}
            className="text-blue-800 underline decoration-dotted underline-offset-4 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            {title}
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ol className="space-y-1.5 text-sm text-muted-foreground">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-2">
              <span className="shrink-0 font-medium text-foreground">{i + 1}.</span>
              {step}
            </li>
          ))}
        </ol>
        <div className="space-y-2">
          <Label htmlFor={inputId}>Cle API</Label>
          <Input
            id={inputId}
            type="password"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function ApiKeysForm() {
  const [c411Key, setC411Key] = useState("");
  const [allDebridKey, setAllDebridKey] = useState("");

  useEffect(() => {
    store.get<string>("c411_api_key").then((v) => { if (v) setC411Key(v); });
    store.get<string>("alldebrid_api_key").then((v) => { if (v) setAllDebridKey(v); });
  }, []);

  const bothFilled = c411Key.trim() !== "" && allDebridKey.trim() !== "";

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      await store.set("c411_api_key", c411Key.trim());
      await store.set("alldebrid_api_key", allDebridKey.trim());
      await store.save();
      toast.success("Cles sauvegardees avec succes.");
    } catch (err) {
      toast.error(String(err));
    }
  }

  return (
    <form onSubmit={handleSave} className="w-full max-w-lg space-y-4">
      <TutorialBlock
        number={1}
        title="Cle API C411"
        url="https://c411.org"
        steps={C411_STEPS}
        inputId="c411-key"
        value={c411Key}
        placeholder="Collez votre cle C411"
        onChange={setC411Key}
      />
      <TutorialBlock
        number={2}
        title="Cle API AllDebrid"
        url="https://alldebrid.fr"
        steps={ALLDEBRID_STEPS}
        inputId="alldebrid-key"
        value={allDebridKey}
        placeholder="Collez votre cle AllDebrid"
        onChange={setAllDebridKey}
      />
      <Button type="submit" className="w-full" disabled={!bothFilled}>
        Sauvegarder
      </Button>
    </form>
  );
}
