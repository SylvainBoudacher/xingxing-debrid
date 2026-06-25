import { useEffect, useRef, useState } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getApiKey, setApiKey, type ApiKeyName } from "@/lib/apiKeys";

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

const TMDB_STEPS = [
  "Creez un compte gratuit sur themoviedb.org.",
  'Allez dans "Parametres" puis "API".',
  "Demandez une cle API (usage personnel).",
  'Copiez la "Cle d\'API" (v3) et collez-la ci-dessous.',
  "Cette cle est optionnelle : elle sert uniquement a la page Decouverte.",
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
  onBlur,
}: {
  number: number;
  title: string;
  url: string;
  steps: string[];
  inputId: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  onBlur: () => void;
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
            onBlur={onBlur}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export interface ApiKeys {
  c411Key: string;
  allDebridKey: string;
  tmdbKey: string;
}

const KEY_STORE_NAMES: Record<keyof ApiKeys, ApiKeyName> = {
  c411Key: "c411_api_key",
  allDebridKey: "alldebrid_api_key",
  tmdbKey: "tmdb_api_key",
};

export function ApiKeysForm({ onSaved }: { onSaved?: (keys: ApiKeys) => void }) {
  const [c411Key, setC411Key] = useState("");
  const [allDebridKey, setAllDebridKey] = useState("");
  const [tmdbKey, setTmdbKey] = useState("");
  // Dernières valeurs persistées : évite de réécrire le keyring (et de
  // re-notifier) quand le champ perd le focus sans avoir changé.
  const savedRef = useRef<ApiKeys>({ c411Key: "", allDebridKey: "", tmdbKey: "" });

  useEffect(() => {
    getApiKey("c411_api_key").then((v) => {
      if (v) {
        setC411Key(v);
        savedRef.current.c411Key = v;
      }
    });
    getApiKey("alldebrid_api_key").then((v) => {
      if (v) {
        setAllDebridKey(v);
        savedRef.current.allDebridKey = v;
      }
    });
    getApiKey("tmdb_api_key").then((v) => {
      if (v) {
        setTmdbKey(v);
        savedRef.current.tmdbKey = v;
      }
    });
  }, []);

  async function saveField(field: keyof ApiKeys, raw: string) {
    const value = raw.trim();
    if (value === savedRef.current[field]) return;
    try {
      await setApiKey(KEY_STORE_NAMES[field], value);
      savedRef.current = { ...savedRef.current, [field]: value };
      onSaved?.(savedRef.current);
      toast.success("Cle sauvegardee.");
    } catch (err) {
      toast.error(String(err));
    }
  }

  return (
    <div className="w-full max-w-lg space-y-4">
      <TutorialBlock
        number={1}
        title="Cle API C411"
        url="https://c411.org"
        steps={C411_STEPS}
        inputId="c411-key"
        value={c411Key}
        placeholder="Collez votre cle C411"
        onChange={setC411Key}
        onBlur={() => saveField("c411Key", c411Key)}
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
        onBlur={() => saveField("allDebridKey", allDebridKey)}
      />
      <TutorialBlock
        number={3}
        title="Cle API TMDB (optionnelle)"
        url="https://www.themoviedb.org/settings/api"
        steps={TMDB_STEPS}
        inputId="tmdb-key"
        value={tmdbKey}
        placeholder="Collez votre cle TMDB"
        onChange={setTmdbKey}
        onBlur={() => saveField("tmdbKey", tmdbKey)}
      />
    </div>
  );
}
