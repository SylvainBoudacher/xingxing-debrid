import { coverUrl, type MangaRaw } from "@/lib/services/mangadex";

export type MangaStatus = "ongoing" | "completed" | "hiatus" | "cancelled";

export const MANGA_STATUS_LABELS: Record<MangaStatus, string> = {
  ongoing: "En cours",
  completed: "Terminé",
  hiatus: "En pause",
  cancelled: "Abandonné",
};

export interface MangaItem {
  id: string;
  /** Titre d'affichage : francais si connu, sinon anglais, sinon romaji. */
  title: string;
  titleFr: string | null;
  titleEn: string | null;
  titleRomaji: string | null;
  coverFileName: string | null;
  year: string;
  status: MangaStatus;
  /** Dernier tome paru d'apres MangaDex, quand le champ est exploitable. */
  lastVolume: number | null;
  description: string;
  tags: string[];
}

function pickLang(map: Record<string, string> | undefined, langs: string[]): string | null {
  if (!map) return null;
  for (const lang of langs) {
    const value = map[lang]?.trim();
    if (value) return value;
  }
  return null;
}

// altTitles est un tableau d'objets a une seule cle : on cherche la premiere
// entree de la langue voulue.
function pickAlt(alts: Record<string, string>[], lang: string): string | null {
  for (const alt of alts ?? []) {
    const value = alt[lang]?.trim();
    if (value) return value;
  }
  return null;
}

// Les descriptions MangaDex sont en markdown et se terminent souvent par un
// pave de liens vers les editions etrangeres. On garde le texte, sans le
// balisage ni la section de liens.
export function cleanDescription(raw: string): string {
  return raw
    .split(/\n-{3,}\n/)[0]
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[*_>`#]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

export function mapManga(raw: MangaRaw): MangaItem {
  const a = raw.attributes;
  const alts = a.altTitles ?? [];
  const titleFr = pickLang(a.title, ["fr"]) ?? pickAlt(alts, "fr");
  const titleEn = pickLang(a.title, ["en"]) ?? pickAlt(alts, "en");
  // Le romaji est parfois etiquete "ja-ro", parfois "ja" sur les entrees
  // anciennes ; les deux servent de repli.
  const titleRomaji =
    pickLang(a.title, ["ja-ro", "ja"]) ?? pickAlt(alts, "ja-ro") ?? pickAlt(alts, "ja");
  const anyTitle = Object.values(a.title ?? {}).find((t) => t?.trim()) ?? "";
  const lastVolume = Number(a.lastVolume);

  return {
    id: raw.id,
    title: titleFr ?? titleEn ?? titleRomaji ?? anyTitle,
    titleFr,
    titleEn,
    titleRomaji,
    coverFileName:
      raw.relationships?.find((r) => r.type === "cover_art")?.attributes?.fileName ?? null,
    year: a.year ? String(a.year) : "",
    status: (["ongoing", "completed", "hiatus", "cancelled"] as MangaStatus[]).includes(
      a.status as MangaStatus,
    )
      ? (a.status as MangaStatus)
      : "ongoing",
    lastVolume: Number.isFinite(lastVolume) && lastVolume > 0 ? lastVolume : null,
    description: cleanDescription(pickLang(a.description, ["fr", "en"]) ?? ""),
    tags: (a.tags ?? [])
      .map((t) => pickLang(t.attributes.name, ["fr", "en"]) ?? "")
      .filter(Boolean),
  };
}

export function mangaCoverUrl(item: MangaItem, size: 256 | 512 | null = 512): string | null {
  return item.coverFileName ? coverUrl(item.id, item.coverFileName, size) : null;
}
