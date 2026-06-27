import { Compass, Download, Upload } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useRef } from "react";
import { toast } from "sonner";
import { getLikes, parseLikesJson, saveLikes } from "@/lib/likes";
import { SettingsPanel } from "../SettingsPanel";
import { FieldTitle } from "../controls";

export function DiscoverPanel() {
  const importInputRef = useRef<HTMLInputElement>(null);

  async function handleExport() {
    try {
      const likes = await getLikes();
      const path = await invoke<string>("export_json", {
        filename: "c411-likes.json",
        content: JSON.stringify(likes, null, 2),
      });
      toast.success(`Liste exportée : ${path}`);
    } catch (e) {
      toast.error(`Export impossible : ${e}`);
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const imported = parseLikesJson(await file.text());
      const existing = await getLikes();
      const keys = new Set(existing.map((l) => `${l.mediaType}-${l.id}`));
      const added = imported.filter((l) => !keys.has(`${l.mediaType}-${l.id}`));
      await saveLikes([...added, ...existing]);
      toast.success(
        added.length
          ? `${added.length} contenu${added.length > 1 ? "s" : ""} importé${added.length > 1 ? "s" : ""}`
          : "Aucun nouveau contenu à importer",
      );
    } catch {
      toast.error("Fichier invalide");
    }
  }

  return (
    <SettingsPanel
      icon={Compass}
      title="Découverte et listes"
      subtitle="Sauvegarde et restauration de votre liste."
    >
      <FieldTitle
        title="Ma liste"
        hint="Sauvegardez les contenus likés dans un fichier JSON ou restaurez une liste depuis un fichier. L'import fusionne avec la liste actuelle sans créer de doublons."
      />

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleExport}
          className="flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          Exporter ma liste
        </button>
        <button
          onClick={() => importInputRef.current?.click()}
          className="flex items-center gap-2 rounded-full bg-white/90 dark:bg-zinc-800/80 ring-1 ring-black/10 dark:ring-white/10 px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          <Upload className="h-3.5 w-3.5" />
          Importer une liste
        </button>
        <input
          ref={importInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={handleImport}
        />
      </div>
    </SettingsPanel>
  );
}
