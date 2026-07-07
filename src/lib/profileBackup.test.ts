import { beforeEach, describe, expect, it, vi } from "vitest";

const invokeSpy = vi.fn(async () => undefined);
const saveSpy = vi.fn<(opts: unknown) => Promise<string | null>>();
const openSpy = vi.fn<(opts: unknown) => Promise<string | string[] | null>>();

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invokeSpy(...(args as [])),
}));

vi.mock("@tauri-apps/plugin-dialog", () => ({
  save: (opts: unknown) => saveSpy(opts),
  open: (opts: unknown) => openSpy(opts),
}));

import { BACKUP_EXTENSION, exportProfile, importProfile, pickBackupFile } from "./profileBackup";

beforeEach(() => {
  invokeSpy.mockClear();
  saveSpy.mockReset();
  openSpy.mockReset();
});

describe("exportProfile", () => {
  it("invoque export_profile avec le chemin choisi et le retourne", async () => {
    saveSpy.mockResolvedValue("/tmp/profil.c411backup");

    const path = await exportProfile("phrase-secrete");

    expect(path).toBe("/tmp/profil.c411backup");
    expect(invokeSpy).toHaveBeenCalledWith("export_profile", {
      passphrase: "phrase-secrete",
      path: "/tmp/profil.c411backup",
    });
  });

  it("propose l'extension de sauvegarde dans la boite d'enregistrement", async () => {
    saveSpy.mockResolvedValue(null);

    await exportProfile("phrase-secrete");

    expect(saveSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultPath: `profil-c411.${BACKUP_EXTENSION}`,
        filters: [{ name: "Sauvegarde C411", extensions: [BACKUP_EXTENSION] }],
      }),
    );
  });

  it("retourne null sans rien invoquer si l'utilisateur annule", async () => {
    saveSpy.mockResolvedValue(null);

    const path = await exportProfile("phrase-secrete");

    expect(path).toBeNull();
    expect(invokeSpy).not.toHaveBeenCalled();
  });
});

describe("pickBackupFile", () => {
  it("retourne le chemin choisi", async () => {
    openSpy.mockResolvedValue("/tmp/profil.c411backup");

    expect(await pickBackupFile()).toBe("/tmp/profil.c411backup");
    expect(openSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        multiple: false,
        filters: [{ name: "Sauvegarde C411", extensions: [BACKUP_EXTENSION] }],
      }),
    );
  });

  it("retourne null si l'utilisateur annule", async () => {
    openSpy.mockResolvedValue(null);

    expect(await pickBackupFile()).toBeNull();
  });
});

describe("importProfile", () => {
  it("invoque import_profile avec la passphrase et le chemin", async () => {
    await importProfile("phrase-secrete", "/tmp/profil.c411backup");

    expect(invokeSpy).toHaveBeenCalledWith("import_profile", {
      passphrase: "phrase-secrete",
      path: "/tmp/profil.c411backup",
    });
  });

  it("propage l'erreur du backend", async () => {
    invokeSpy.mockRejectedValueOnce("Phrase secrete incorrecte ou fichier corrompu.");

    await expect(importProfile("mauvaise", "/tmp/profil.c411backup")).rejects.toBe(
      "Phrase secrete incorrecte ou fichier corrompu.",
    );
  });
});
