import { describe, it, expect } from "vitest";
import { isPlayerError, playerErrorMessage } from "./player";

describe("isPlayerError", () => {
  it("reconnait une erreur lecteur serialisee par Rust", () => {
    expect(isPlayerError({ kind: "notFound" })).toBe(true);
    expect(isPlayerError({ kind: "configuredPathMissing", path: "D:\\vlc.exe" })).toBe(true);
  });

  it("rejette une erreur reseau ou une chaine", () => {
    expect(isPlayerError(new Error("timeout"))).toBe(false);
    expect(isPlayerError("VLC introuvable")).toBe(false);
    expect(isPlayerError(null)).toBe(false);
    expect(isPlayerError({ kind: "autre" })).toBe(false);
  });
});

describe("playerErrorMessage", () => {
  it("invite a installer VLC ou a le localiser", () => {
    expect(playerErrorMessage({ kind: "notFound" })).toBe(
      "VLC introuvable. Installez VLC, ou indiquez son emplacement dans les Réglages.",
    );
  });

  it("cite le chemin configure devenu invalide", () => {
    expect(playerErrorMessage({ kind: "configuredPathMissing", path: "D:\\vlc.exe" })).toBe(
      "Le VLC configuré est introuvable : D:\\vlc.exe.",
    );
  });

  it("cite la cause d'un lancement echoue", () => {
    expect(playerErrorMessage({ kind: "launchFailed", message: "Accès refusé" })).toBe(
      "Impossible de lancer VLC : Accès refusé.",
    );
  });
});
