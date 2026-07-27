import { normalize } from "@/lib/normalizeTitle";

// MangaDex porte souvent le titre complet avec son sous-titre ("Mushoku
// Tensei : Nouvelle vie, nouvelle chance") alors que les releases C411 ne
// gardent que la racine. On coupe au premier separateur de sous-titre.
const SUBTITLE_SEPARATOR = /\.{2,}|…|:|\s[-–—]\s|,|\(/;

/**
 * Racine d'un titre, ou null si la coupe ne donne rien d'exploitable : racine
 * identique au titre, ou trop courte pour rester discriminante (une requete
 * "One" remonterait n'importe quoi).
 */
export function rootTitle(title: string): string | null {
  const [head] = title.split(SUBTITLE_SEPARATOR);
  const root = head.trim().replace(/[\s\-–—:,]+$/, "");
  if (!root || root.length >= title.trim().length) return null;
  const n = normalize(root);
  if (!n) return null;
  return n.split(" ").length >= 2 || n.length >= 8 ? root : null;
}
