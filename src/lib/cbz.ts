import { invoke } from "@tauri-apps/api/core";

// Erreurs renvoyees par les commandes CBZ (voir src-tauri/src/cbz.rs).
export type CbzError =
  | { kind: "fileMissing"; path: string }
  | { kind: "notAnArchive"; message: string }
  | { kind: "noPages" }
  | { kind: "pageOutOfRange"; index: number; count: number }
  | { kind: "readFailed"; message: string };

const CBZ_ERROR_KINDS = ["fileMissing", "notAnArchive", "noPages", "pageOutOfRange", "readFailed"];

export function isCbzError(err: unknown): err is CbzError {
  return (
    typeof err === "object" &&
    err !== null &&
    "kind" in err &&
    typeof (err as { kind: unknown }).kind === "string" &&
    CBZ_ERROR_KINDS.includes((err as { kind: string }).kind)
  );
}

export function cbzErrorMessage(err: CbzError): string {
  switch (err.kind) {
    case "fileMissing":
      return "Le fichier a été déplacé ou supprimé.";
    case "notAnArchive":
      return "Ce fichier n'est pas une archive CBZ valide.";
    case "noPages":
      return "Cette archive ne contient aucune image.";
    case "pageOutOfRange":
      return `Page ${err.index + 1} inexistante (${err.count} pages).`;
    case "readFailed":
      return `Lecture impossible : ${err.message}`;
  }
}

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
  // Uniquement produit par les pages de démonstration du shim navigateur.
  svg: "image/svg+xml",
};

function mimeOf(name: string): string {
  return MIME[name.split(".").pop()?.toLowerCase() ?? ""] ?? "image/jpeg";
}

/** Noms des pages, dans l'ordre de lecture. L'index sert a `loadCbzPage`. */
export function listCbzPages(path: string): Promise<string[]> {
  return invoke<string[]>("cbz_list_pages", { path });
}

/** Charge une page et la transforme en URL blob, a revoquer par l'appelant. */
export async function loadCbzPage(path: string, index: number, name: string): Promise<string> {
  const bytes = await invoke<ArrayBuffer>("cbz_page", { path, index });
  return URL.createObjectURL(new Blob([bytes], { type: mimeOf(name) }));
}
