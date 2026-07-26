import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { LazyStore } from "@tauri-apps/plugin-store";
import { loadLibrary, saveLibrary, type LibraryEntry } from "@/lib/library";
import { loadCategories, saveCategories, type CategoryConfig } from "@/lib/libraryCategories";
import { buildPayload, LIBRARY_FILE_EXTENSION, parsePayload, type LibraryPayload } from "./format";

const store = new LazyStore("settings.json", { defaults: {}, autoSave: false });
const PATH_KEY = "library_export_path";

const FILTERS = [{ name: "Bibliothèque XingXing", extensions: [LIBRARY_FILE_EXTENSION] }];

export function getExportPath(): Promise<string | undefined> {
  return store.get<string>(PATH_KEY);
}

async function setExportPath(path: string): Promise<void> {
  await store.set(PATH_KEY, path);
  await store.save();
}

// Ouvre la boite d'enregistrement et memorise le chemin choisi. Rend null si
// l'utilisateur annule.
export async function pickExportPath(): Promise<string | null> {
  const path = await save({
    defaultPath: `bibliotheque.${LIBRARY_FILE_EXTENSION}`,
    filters: FILTERS,
  });
  if (!path) return null;
  await setExportPath(path);
  return path;
}

// Ecrit la bibliotheque chiffree a l'emplacement memorise, ou demande un
// emplacement s'il n'y en a pas encore. Rend le chemin ecrit, null si annule.
export async function exportLibrary(passphrase: string): Promise<string | null> {
  const path = (await getExportPath()) ?? (await pickExportPath());
  if (!path) return null;

  const payload = buildPayload(await loadLibrary(), await loadCategories());

  try {
    await invoke("export_library", { passphrase, path, payload });
    return path;
  } catch (e) {
    // Dossier deplace ou disque absent : on redemande plutot que d'echouer.
    const retry = await pickExportPath();
    if (!retry) throw e;
    await invoke("export_library", { passphrase, path: retry, payload });
    return retry;
  }
}

export async function pickImportFile(): Promise<string | null> {
  const picked = await open({ multiple: false, filters: FILTERS });
  return typeof picked === "string" ? picked : null;
}

export async function readLibraryFile(passphrase: string, path: string): Promise<LibraryPayload> {
  return parsePayload(await invoke("import_library", { passphrase, path }));
}

export async function applyImport(
  entries: LibraryEntry[],
  categories: CategoryConfig,
): Promise<void> {
  await saveLibrary(entries);
  await saveCategories(categories);
}
