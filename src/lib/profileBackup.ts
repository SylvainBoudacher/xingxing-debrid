import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";

export const PASSPHRASE_MIN_LENGTH = 8;

export const BACKUP_EXTENSION = "c411backup";

// Ouvre la boite d'enregistrement puis delegue la collecte (stores + keyring),
// le chiffrement et l'écriture au backend. Retourne null si l'utilisateur annule.
export async function exportProfile(passphrase: string): Promise<string | null> {
  const path = await save({
    defaultPath: `profil-c411.${BACKUP_EXTENSION}`,
    filters: [{ name: "Sauvegarde C411", extensions: [BACKUP_EXTENSION] }],
  });
  if (!path) return null;
  await invoke("export_profile", { passphrase, path });
  return path;
}

// Retourne le chemin du fichier de sauvegarde choisi, ou null si annulé.
export async function pickBackupFile(): Promise<string | null> {
  const picked = await open({
    multiple: false,
    filters: [{ name: "Sauvegarde C411", extensions: [BACKUP_EXTENSION] }],
  });
  return typeof picked === "string" ? picked : null;
}

// Déchiffre la sauvegarde et remplace clés API et stores. L'appelant doit
// recharger l'application ensuite pour repartir sur l'état importé.
export function importProfile(passphrase: string, path: string): Promise<void> {
  return invoke("import_profile", { passphrase, path });
}
