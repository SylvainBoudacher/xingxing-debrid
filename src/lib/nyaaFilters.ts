export const ANY = "";
export const QUALITIES = ["2160p", "1080p", "720p", "480p"];
export const CODECS = ["x265", "x264", "hevc", "av1"];
export const LANGUAGES = ["vostfr", "vost", "multi", "truefrench", "french", "vf"];

// Assemble la requete nyaa : terme + filtres (team/qualite/codec/langue),
// en ignorant les champs vides.
export function buildNyaaQuery(
  term: string,
  team: string,
  quality: string,
  codec: string,
  language: string,
): string {
  return [term, team, quality, codec, language]
    .map((t) => t.trim())
    .filter(Boolean)
    .join(" ");
}
