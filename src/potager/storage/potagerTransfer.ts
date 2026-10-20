import { invoke } from "@tauri-apps/api/core";
import { parseSave } from "../core/save";
import { getMainHost } from "../sim/mainHost";

// Renvoie le chemin du fichier écrit.
export async function exportPotager(): Promise<string> {
  const save = getMainHost().state();
  return invoke<string>("export_json", {
    filename: "c411-potager.json",
    content: JSON.stringify(save, null, 2),
  });
}

// Faux si le fichier n'est pas une sauvegarde valide.
export async function importPotager(text: string): Promise<boolean> {
  let save;
  try {
    save = parseSave(JSON.parse(text));
  } catch {
    return false;
  }
  if (!save) return false;
  await getMainHost().replace(save);
  return true;
}
