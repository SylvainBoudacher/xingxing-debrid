import { useEffect, useRef, useState } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getApiKey, setApiKey, type ApiKeyName } from "@/lib/apiKeys";
import { KEY_SERVICES } from "@/lib/keyServices";
import { validateKey as validateTmdbKey } from "@/lib/services/tmdb";

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
          <Label htmlFor={inputId}>Clé API</Label>
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

export function ApiKeysForm({ onSaved }: { onSaved?: (keys: Partial<ApiKeys>) => void }) {
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
      // Ne propage que le champ modifié : les autres clés de savedRef peuvent
      // ne pas être encore chargées (keyring lent) et écraseraient l'état app.
      onSaved?.({ [field]: value });
    } catch (err) {
      toast.error(String(err));
      return;
    }
    if (field === "tmdbKey" && value) {
      // Hors-ligne / TMDB injoignable : impossible de verifier, on ne bloque pas.
      const valid = await validateTmdbKey(value).catch(() => true);
      if (!valid) {
        toast.error("Clé TMDB invalide : vérifiez-la sur themoviedb.org.");
        return;
      }
    }
    toast.success("Clé sauvegardee.");
  }

  const fields: Record<string, { field: keyof ApiKeys; value: string; set: (v: string) => void }> =
    {
      c411: { field: "c411Key", value: c411Key, set: setC411Key },
      alldebrid: { field: "allDebridKey", value: allDebridKey, set: setAllDebridKey },
      tmdb: { field: "tmdbKey", value: tmdbKey, set: setTmdbKey },
    };

  return (
    <div className="w-full max-w-lg space-y-4">
      {KEY_SERVICES.map((service, i) => {
        const f = fields[service.id];
        return (
          <TutorialBlock
            key={service.id}
            number={i + 1}
            title={`Clé API ${service.name}`}
            url={service.url}
            steps={service.steps}
            inputId={`${service.id}-key`}
            value={f.value}
            placeholder={service.placeholder}
            onChange={f.set}
            onBlur={() => saveField(f.field, f.value)}
          />
        );
      })}
    </div>
  );
}
