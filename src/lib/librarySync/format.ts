import type { LibraryEntry } from "@/lib/library";
import type { CategoryConfig } from "@/lib/libraryCategories";

export const LIBRARY_FILE_EXTENSION = "c411lib";

// Incrémenter à chaque changement incompatible du payload. Le refus d'une
// version inconnue se fait côté Rust, à l'ouverture de l'enveloppe.
export const LIBRARY_FORMAT_VERSION = 1;

export interface LibraryPayload {
  version: number;
  exportedAt: number;
  entries: LibraryEntry[];
  categories: CategoryConfig;
}

export function buildPayload(entries: LibraryEntry[], categories: CategoryConfig): LibraryPayload {
  return {
    version: LIBRARY_FORMAT_VERSION,
    exportedAt: Date.now(),
    entries,
    categories,
  };
}

// Le backend garantit déjà l'authenticité (chiffrement authentifié) et le type
// de fichier ; il reste à vérifier que la forme est celle attendue avant de
// laisser la fusion travailler dessus.
export function parsePayload(value: unknown): LibraryPayload {
  if (typeof value !== "object" || value === null) {
    throw new Error("Fichier de bibliothèque illisible.");
  }
  const raw = value as Partial<LibraryPayload>;

  if (raw.version !== LIBRARY_FORMAT_VERSION) {
    throw new Error(
      `Fichier de bibliothèque en version ${raw.version} : mettez l'application à jour.`,
    );
  }
  if (!Array.isArray(raw.entries) || typeof raw.exportedAt !== "number") {
    throw new Error("Fichier de bibliothèque malformé.");
  }

  return {
    version: raw.version,
    exportedAt: raw.exportedAt,
    entries: raw.entries,
    categories: raw.categories ?? { categories: [], assign: {} },
  };
}

// Une entrée écrite avant l'introduction d'updatedAt retombe sur sa date
// d'ajout : c'est la meilleure borne inférieure connue.
export function entryTimestamp(entry: LibraryEntry): number {
  return entry.updatedAt ?? entry.addedAt;
}
