export interface ParsedRelease {
  title: string;
  quality: string | null;
  codec: string | null;
  team: string | null;
  language: string | null;
}

const EXTENSION_RE =
  /\.(mkv|mp4|avi|mov|wmv|flv|webm|m4v|mpg|mpeg|ts|m2ts|3gp|ogv|vob|srt|sub|idx)$/i;
export const QUALITY_RE = /\b(2160p|1080p|720p|480p|4k|uhd)\b/i;
export const CODEC_RE = /\b(x265|x264|h265|h264|hevc|av1|xvid)\b/i;
// Langues : les variantes longues passent avant les courtes (vostfr avant vost,
// truefrench avant french) pour que l'alternance matche le tag complet.
export const LANG_RE =
  /\b(vostfr|vosta|vostang|vost|multi|truefrench|subfrench|french|vff|vf2|vfq|vfi|vf|voq|vo)\b/i;
const EPISODE_RE = /\bS(\d{1,2})[ .-]?E(\d{1,3})\b/i;
const CUT_RE =
  /\b((19|20)\d{2}|2160p|1080p|720p|480p|4k|uhd|multi|vostfr|vff|vf2?|truefrench|french|web(-?dl|rip)?|bluray|blu-ray|brrip|bd(-?rip)?|hdtv|hdlight|dvdrip|repack|proper|integrale|complete|saison|season)\b/i;
const BRACKET_RE = /\[([^\]]+)\]/g;

// La team est le premier groupe entre crochets qui n'est pas un simple marqueur
// de qualite / codec / langue (certains releasers mettent [1080p] avant le nom).
function extractTeam(name: string): string | null {
  for (const m of name.matchAll(BRACKET_RE)) {
    const content = m[1].trim();
    if (!content) continue;
    if (QUALITY_RE.test(content) || CODEC_RE.test(content) || LANG_RE.test(content)) continue;
    return content;
  }
  return null;
}

export function parseRelease(filename: string): ParsedRelease {
  const team = extractTeam(filename);

  const cleaned = filename
    .replace(EXTENSION_RE, "")
    .replace(/[._]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const qualityMatch = cleaned.match(QUALITY_RE);
  const q = qualityMatch?.[1].toLowerCase();
  const quality = q ? (q === "4k" || q === "uhd" ? "4K" : q) : null;

  const codec = cleaned.match(CODEC_RE)?.[1].toUpperCase() ?? null;

  const language = cleaned.match(LANG_RE)?.[1].toUpperCase() ?? null;

  const ep = cleaned.match(EPISODE_RE);
  let title: string;
  if (ep && ep.index !== undefined) {
    const head = cleaned
      .slice(0, ep.index)
      .replace(/[-(]\s*$/, "")
      .trim();
    const marker = `S${parseInt(ep[1], 10)} E${ep[2].padStart(2, "0")}`;
    title = head ? `${head} - ${marker}` : marker;
  } else {
    const cut = cleaned.search(CUT_RE);
    title =
      cut > 0
        ? cleaned
            .slice(0, cut)
            .replace(/[-([]\s*$/, "")
            .trim()
        : cleaned;
  }

  // Retire le crochet de team en tete de titre (les autres appelants n'ont pas
  // de crochet en prefixe, leur titre est donc inchange).
  title = title.replace(/^\[[^\]]*\]\s*/, "").trim();

  return { title: title || cleaned, quality, codec, team, language };
}
