import { parseSave } from "@/garden/core/save";
import { loadGarden, saveGarden } from "@/garden/storage/gardenStore";
import { onGardenOpenChange, openGardenWindow } from "@/garden/ui/gardenWindow";
import type { Backdrop } from "@/lib/backdropPref";
import { getSavedDucks, importSavedDucks, parseDucksJson } from "@/lib/savedDucks";
import { invoke } from "@tauri-apps/api/core";
import { Download, Sprout, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { SettingsPanel } from "../SettingsPanel";
import { Segmented, SettingRow, Toggle } from "../controls";

export interface BackdropPanelProps {
  backdrop: Backdrop;
  onSetBackdrop: (v: Backdrop) => void;
  summerFps: 30 | 60;
  onSetSummerFps: (v: 30 | 60) => void;
  summerMaxDucks: number;
  onSetSummerMaxDucks: (v: number) => void;
  idleAutoHide: boolean;
  onSetIdleAutoHide: (v: boolean) => void;
}

export function BackdropPanel({
  backdrop,
  onSetBackdrop,
  summerFps,
  onSetSummerFps,
  summerMaxDucks,
  onSetSummerMaxDucks,
  idleAutoHide,
  onSetIdleAutoHide,
}: BackdropPanelProps) {
  const importDucksInputRef = useRef<HTMLInputElement>(null);
  const importGardenInputRef = useRef<HTMLInputElement>(null);
  const [gardenOpen, setGardenOpen] = useState(false);
  useEffect(() => onGardenOpenChange(setGardenOpen), []);
  const [draftMaxDucks, setDraftMaxDucks] = useState(String(summerMaxDucks));
  const [prevMaxDucks, setPrevMaxDucks] = useState(summerMaxDucks);
  if (prevMaxDucks !== summerMaxDucks) {
    setPrevMaxDucks(summerMaxDucks);
    setDraftMaxDucks(String(summerMaxDucks));
  }

  function commitMaxDucks() {
    const v = Math.min(100, Math.max(1, Number(draftMaxDucks)));
    if (!isNaN(v) && v !== summerMaxDucks) onSetSummerMaxDucks(v);
    setDraftMaxDucks(String(isNaN(v) ? summerMaxDucks : v));
  }

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

  async function handleExportGarden() {
    try {
      const { save } = await loadGarden();
      const path = await invoke<string>("export_json", {
        filename: "c411-potager.json",
        content: JSON.stringify(save, null, 2),
      });
      toast.success(`Potager exporté : ${path}`);
    } catch (e) {
      toast.error(`Export impossible : ${e}`);
    }
  }

  async function handleImportGarden(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (gardenOpen) {
      toast.error("Ferme la fenêtre Potager avant d'importer.");
      return;
    }
    const save = await file
      .text()
      .then((text) => parseSave(JSON.parse(text)))
      .catch(() => null);
    if (!save) {
      toast.error("Fichier invalide");
      return;
    }
    await saveGarden(save);
    toast.success("Potager importé (visible au prochain affichage du fond)");
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
      icon={Sprout}
      accent="amber"
      title="Fonds animés"
      subtitle="Le décor vivant derrière l'application."
    >
      <SettingRow title="Fond animé" description="Un seul fond tourne à la fois.">
        <Segmented
          value={backdrop}
          options={[
            { value: "potager", label: "Potager" },
            { value: "mare", label: "Mare" },
            { value: "aucun", label: "Aucun" },
          ]}
          onChange={onSetBackdrop}
        />
      </SettingRow>

      {backdrop === "potager" && (
        <div className="mt-3 rounded-xl bg-white dark:bg-zinc-900/80 ring-1 ring-black/8 dark:ring-white/8 px-4 py-3">
          <p className="text-sm font-medium text-zinc-900 dark:text-white">Mon potager</p>
          <p className="text-xs text-zinc-500 mt-0.5 mb-3 leading-relaxed">
            Le champ se gère dans sa propre fenêtre. La sauvegarde peut être exportée ou restaurée ;
            l'import remplace le potager actuel.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => void openGardenWindow()}
              className="flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-xs font-medium text-white hover:bg-amber-400 transition-colors"
            >
              <Sprout className="h-3.5 w-3.5" />
              Ouvrir le Potager
            </button>
            <button
              onClick={handleExportGarden}
              className="flex items-center gap-2 rounded-full bg-white/90 dark:bg-zinc-800/80 ring-1 ring-black/10 dark:ring-white/10 px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Exporter mon potager
            </button>
            <button
              onClick={() => importGardenInputRef.current?.click()}
              className="flex items-center gap-2 rounded-full bg-white/90 dark:bg-zinc-800/80 ring-1 ring-black/10 dark:ring-white/10 px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              <Upload className="h-3.5 w-3.5" />
              Importer un potager
            </button>
            <input
              ref={importGardenInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={handleImportGarden}
            />
          </div>
        </div>
      )}

      {backdrop !== "aucun" && (
        <div className="mt-3">
          <SettingRow
            title="Masquage automatique"
            description="Cache l'interface après 30 s d'inactivité. Un mouvement de souris la restaure."
          >
            <Toggle checked={idleAutoHide} onChange={onSetIdleAutoHide} />
          </SettingRow>
        </div>
      )}

      {backdrop === "mare" && (
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

      {backdrop === "mare" && (
        <div className="mt-3">
          <SettingRow title="Nombre de canards" description="Jusqu'à 100 canards dans la piscine.">
            <input
              type="number"
              min={1}
              max={100}
              value={draftMaxDucks}
              onChange={(e) => setDraftMaxDucks(e.target.value)}
              onBlur={commitMaxDucks}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              className="w-16 rounded-lg bg-black/6 dark:bg-white/6 px-2 py-1 text-center text-sm font-semibold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
            />
          </SettingRow>
        </div>
      )}

      {backdrop === "mare" && (
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
