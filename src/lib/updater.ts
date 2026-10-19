import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { getMainHost } from "@/potager/sim/mainHost";

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
      // On Windows, the NSIS installer handles closing and relaunching the app.
      // relaunch() is only needed on macOS/Linux.
      if (!navigator.userAgent.includes("Windows")) {
        // la relance ne passe pas par la fermeture de fenêtre qui sauvegarde le Potager
        await getMainHost()
          .stop()
          .catch(() => {});
        await relaunch();
      }
    },
  };
}
