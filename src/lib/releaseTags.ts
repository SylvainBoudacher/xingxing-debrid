import { parseRelease, parseReleaseScope, type ReleaseScope } from "@/lib/parseRelease";

// Tags derives du nom d'une release : affiches en badges dans la fiche
// Decouverte comme dans la bibliotheque. Rien n'est persiste, tout est recalcule
// depuis le nom pour qu'une amelioration du parser profite a l'existant.
export interface ReleaseTags {
  languages: string[];
  source: string | null;
  videoCodec: string | null;
  audioCodec: string | null;
  audioChannels: string | null;
  resolution: string | null;
  specialVersion: string | null;
  scope: ReleaseScope | null;
}

const LANG_TOKENS = ["MULTI", "VFF", "VFQ", "VF2", "VOSTFR", "TRUEFRENCH", "FRENCH", "VF", "VO"];

function parseLanguages(name: string): string[] {
  const up = ` ${name.toUpperCase().replace(/[._-]/g, " ")} `;
  return LANG_TOKENS.filter((t) => up.includes(` ${t} `));
}

const SOURCE_RE = /\b(remux|blu-?ray|bdrip|brrip|web-?dl|webrip|web|hdtv|dvdrip|hdlight)\b/i;
const SOURCE_LABELS: Record<string, string> = {
  remux: "REMUX",
  bluray: "BluRay",
  bdrip: "BDRip",
  brrip: "BRRip",
  webdl: "WEB-DL",
  webrip: "WEBRip",
  web: "WEB",
  hdtv: "HDTV",
  dvdrip: "DVDRip",
  hdlight: "HDLight",
};
const SPECIAL_RE = /\b(extended|remastered|unrated|imax|uncut|director'?s[ ._-]?cut)\b/i;
const AUDIO_RE = /\b(dts[ ._-]?hd[ ._-]?ma|dts|truehd|atmos|eac3|ddp|ac3|aac|flac|opus)\b/i;
const CHANNELS_RE = /\b(7\.1|5\.1|2\.0)\b/;

export function parseReleaseTags(name: string): ReleaseTags {
  const flat = name.replace(/[._]/g, " ");
  const parsed = parseRelease(name);
  const sourceMatch = flat.match(SOURCE_RE)?.[1];
  return {
    resolution: parsed.quality,
    videoCodec: parsed.codec,
    languages: parseLanguages(name),
    source: sourceMatch ? SOURCE_LABELS[sourceMatch.toLowerCase().replace(/[^a-z]/g, "")] : null,
    audioCodec: flat.match(AUDIO_RE)?.[1].toUpperCase().replace(/[._-]/g, " ") ?? null,
    audioChannels: flat.match(CHANNELS_RE)?.[1] ?? null,
    specialVersion: flat.match(SPECIAL_RE)?.[1].toUpperCase() ?? null,
    scope: parseReleaseScope(name),
  };
}

// Vrai si au moins un badge est affichable.
export function hasReleaseTags(tags: ReleaseTags): boolean {
  return Boolean(
    tags.resolution ||
    tags.videoCodec ||
    tags.specialVersion ||
    tags.scope ||
    tags.languages.length,
  );
}
