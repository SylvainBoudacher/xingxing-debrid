import type { LibraryPosterSize } from "@/lib/libraryPrefs";

export const POSTER_SIZES: { id: LibraryPosterSize; label: string }[] = [
  { id: "compact", label: "Compacte" },
  { id: "normal", label: "Normale" },
  { id: "large", label: "Large" },
];

// Classes écrites en entier : Tailwind ne détecte pas les noms construits.
export const POSTER_GRID: Record<LibraryPosterSize, string> = {
  compact: "grid-cols-4 sm:grid-cols-5 lg:grid-cols-6",
  normal: "grid-cols-3 sm:grid-cols-4 lg:grid-cols-5",
  large: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
};
