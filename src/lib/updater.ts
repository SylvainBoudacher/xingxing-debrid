import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export type UpdateInfo = {
  version: string;
  body: string | null | undefined;
  download: () => Promise<void>;
};

export async function checkForUpdate(): Promise<UpdateInfo | null> {
  const update = await check();
  if (!update) return null;

  return {
    version: update.version,
    body: update.body,
    download: async () => {
      await update.downloadAndInstall();
      await relaunch();
    },
  };
}
