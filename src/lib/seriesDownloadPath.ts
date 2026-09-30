import { dominantSeason, episodeOf, seasonOf, type LibraryEntry } from "@/lib/library";
import { sanitizeFolderName } from "@/lib/mangaPaths";
import { CUT_RE } from "@/lib/parseRelease";

// Premier marqueur d'épisode : S01, S01E02, E06, Episode 6, " - 1057".
const MARKER_RE =
  /\bS\d{1,2}(?:[ -]?E\d{1,4})?\b|\b(?:E|Ep|Episode) ?\d{1,4}\b| - \d{1,4}(?=[ (]|$)/i;

// Nom de la série tiré d'un nom de fichier d'épisode : tout ce qui précède le
// premier marqueur d'épisode ou tag technique (année, qualité, langue...).
export function seriesTitleFromFilename(filename: string): string {
  const cleaned = filename
    .replace(/\.[a-z0-9]{2,4}$/i, "")
    .replace(/[._]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^(\[[^\]]*\]\s*)+/, "")
    .trim();
  const cuts = [cleaned.search(MARKER_RE), cleaned.search(CUT_RE)].filter((i) => i >= 0);
  const head = cuts.length > 0 ? cleaned.slice(0, Math.min(...cuts)) : cleaned;
  return head.replace(/[\s\-([]+$/, "").trim();
}

// Sous-dossier d'un épisode téléchargé : "Nom/Saison n", ou "Nom" quand la
// saison est inconnue. Undefined pour tout ce qui n'est pas un épisode (films).
// `entry` est l'entrée de bibliothèque du fichier, si elle existe : son titre
// TMDB prime sur le nom de fichier pour que toutes les releases d'une même
// série tombent dans le même dossier.
export function seriesSubdir(filename: string, entry?: LibraryEntry): string | undefined {
  if (entry?.tmdb?.mediaType === "movie") return undefined;
  const fileSeason = seasonOf(filename);
  if (fileSeason === null && episodeOf(filename) === null) return undefined;

  const title =
    entry?.tmdb?.mediaType === "tv" ? entry.tmdb.title : seriesTitleFromFilename(filename);
  const folder = sanitizeFolderName(title, "Série");
  const season = fileSeason ?? (entry ? dominantSeason(entry) : null);
  return season !== null ? `${folder}/Saison ${season}` : folder;
}
