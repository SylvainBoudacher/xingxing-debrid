import { Download, Sun, Upload } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useRef } from "react";
import { toast } from "sonner";
import { getSavedDucks, importSavedDucks, parseDucksJson } from "@/lib/savedDucks";
import { SettingsPanel } from "../SettingsPanel";
import { Segmented, SettingRow, Toggle } from "../controls";

export interface SummerPanelProps {
  summerEnabled: boolean;
  onToggleSummer: (v: boolean) => void;
  summerFps: 30 | 60;
  onSetSummerFps: (v: 30 | 60) => void;
  summerMaxDucks: number;
  onSetSummerMaxDucks: (v: number) => void;
}

export function SummerPanel({
  summerEnabled,
  onToggleSummer,
  summerFps,
  onSetSummerFps,
  summerMaxDucks,
  onSetSummerMaxDucks,
}: SummerPanelProps) {
  const importDucksInputRef = useRef<HTMLInputElement>(null);

  async function handleExportDucks() {
    try {
      const ducks = await getSavedDucks();
      const path = await invoke<string>("export_json", {
        filename: "c411-ducks.json",
        content: JSON.stringify(ducks, null, 2),
      });
      toast.success(`Canards exportés : ${path}`);
    } catch (e) {
      toast.error(`Export impossible : ${e}`);
    }
  }

  async function handleImportDucks(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const { added } = await importSavedDucks(parseDucksJson(await file.text()));
      toast.success(
        added
          ? `${added} canard${added > 1 ? "s" : ""} importé${added > 1 ? "s" : ""} (visible${added > 1 ? "s" : ""} au prochain lancement)`
          : "Aucun nouveau canard à importer",
      );
    } catch {
      toast.error("Fichier invalide");
    }
  }

  return (
    <SettingsPanel
      icon={Sun}
      accent="amber"
      title="Summer et canards"
      subtitle="Petits plaisirs estivaux dans l'application."
    >
      <SettingRow
        title="Une piscine ?"
        description="Pour se rafraîchir pendant les longues sessions de téléchargement."
      >
        <Toggle checked={summerEnabled} onChange={onToggleSummer} />
      </SettingRow>

      {summerEnabled && (
        <div className="mt-3">
          <SettingRow
            title="Fluidité de l'animation"
            description="60 fps est plus fluide mais consomme davantage."
          >
            <Segmented
              value={String(summerFps) as "30" | "60"}
              options={[
                { value: "30", label: "30 fps" },
                { value: "60", label: "60 fps" },
              ]}
              onChange={(v) => onSetSummerFps(Number(v) as 30 | 60)}
            />
          </SettingRow>
        </div>
      )}

      {summerEnabled && (
        <div className="mt-3">
          <SettingRow title="Nombre de canards" description="Jusqu'à 100 canards dans la piscine.">
            <input
              type="number"
              min={1}
              max={100}
              value={summerMaxDucks}
              onChange={(e) => {
                const v = Math.min(100, Math.max(1, Number(e.target.value)));
                if (!isNaN(v)) onSetSummerMaxDucks(v);
              }}
              className="w-16 rounded-lg bg-black/6 dark:bg-white/6 px-2 py-1 text-center text-sm font-semibold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
            />
          </SettingRow>
        </div>
      )}

      {summerEnabled && (
        <div className="mt-3 rounded-xl bg-white dark:bg-zinc-900/80 ring-1 ring-black/8 dark:ring-white/8 px-4 py-3">
          <p className="text-sm font-medium text-zinc-900 dark:text-white">
            Ma collection de canards
          </p>
          <p className="text-xs text-zinc-500 mt-0.5 mb-3 leading-relaxed">
            Sauvegardez vos canards nommés dans un fichier JSON ou restaurez-les depuis un fichier.
            L'import fusionne avec votre collection sans créer de doublons.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleExportDucks}
              className="flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-xs font-medium text-white hover:bg-amber-400 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Exporter mes canards
            </button>
            <button
              onClick={() => importDucksInputRef.current?.click()}
              className="flex items-center gap-2 rounded-full bg-white/90 dark:bg-zinc-800/80 ring-1 ring-black/10 dark:ring-white/10 px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              <Upload className="h-3.5 w-3.5" />
              Importer des canards
            </button>
            <input
              ref={importDucksInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={handleImportDucks}
            />
          </div>
        </div>
      )}
    </SettingsPanel>
  );
}
