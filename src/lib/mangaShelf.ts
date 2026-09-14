import type { MangaEntry, MangaVolume } from "@/lib/mangaLibrary";
import type { MangaCoverRaw } from "@/lib/services/mangadex";

// Etagere d'une oeuvre : tomes possedes et emplacements des tomes parus mais
// absents de la bibliotheque, chacun avec sa cover MangaDex.

export type ShelfSlot =
  | { kind: "owned"; number: number | null; volume: MangaVolume; coverFileName: string | null }
  | { kind: "missing"; number: number; coverFileName: string | null };

export type ShelfFilter = "all" | "owned" | "unread" | "missing";

export interface ShelfCounts {
  owned: number;
  read: number;
  unread: number;
  missing: number;
  total: number;
  // Collection : tomes numérotés possédés sur tomes parus, hors bonus.
  collected: number;
  published: number;
}

// MangaDex n'a quasiment jamais d'edition francaise, mais la prend si elle
// existe ; a defaut la japonaise, qui est l'originale.
const LOCALE_RANK: Record<string, number> = { fr: 0, ja: 1 };

function rank(locale: string | null): number {
  return LOCALE_RANK[locale ?? ""] ?? 2;
}

/** Nom de fichier de la cover retenue pour chaque numero de tome. */
export function volumeCovers(covers: MangaCoverRaw[]): Map<number, string> {
  const best = new Map<number, MangaCoverRaw>();
  for (const cover of covers) {
    const number = Number(cover.attributes.volume);
    if (!cover.attributes.volume || !Number.isInteger(number) || number < 1) continue;
    const current = best.get(number);
    if (!current || rank(cover.attributes.locale) < rank(current.attributes.locale)) {
      best.set(number, cover);
    }
  }
  return new Map([...best].map(([n, c]) => [n, c.attributes.fileName]));
}

export function buildShelf(entry: MangaEntry, covers: Map<number, string>): ShelfSlot[] {
  const owned = new Map<number, MangaVolume>();
  const unnumbered: MangaVolume[] = [];
  for (const v of entry.volumes) {
    if (v.number === null) unnumbered.push(v);
    else owned.set(v.number, v);
  }

  const published = Math.max(entry.meta.lastVolume ?? 0, ...covers.keys());
  const numbers = new Set([...owned.keys()]);
  for (let n = 1; n <= published; n++) numbers.add(n);

  const slots: ShelfSlot[] = [...numbers]
    .sort((a, b) => a - b)
    .map((number) => {
      const coverFileName = covers.get(number) ?? null;
      const volume = owned.get(number);
      return volume
        ? { kind: "owned", number, volume, coverFileName }
        : { kind: "missing", number, coverFileName };
    });
  for (const volume of unnumbered) {
    slots.push({ kind: "owned", number: null, volume, coverFileName: null });
  }
  return slots;
}

/** Pourcentage lu d'un tome entamé, null s'il n'a jamais été ouvert. */
export function volumeProgress(volume: MangaVolume): number | null {
  return volume.lastPage !== undefined && volume.pageCount
    ? Math.round(((volume.lastPage + 1) / volume.pageCount) * 100)
    : null;
}

// Un tome importe sans fichier local est perdu : il n'a aucun lien AllDebrid
// derriere lui, seul un nouvel import le ramene.
export function isLostVolume(volume: MangaVolume): boolean {
  return volume.source === "local" && !volume.localPath;
}

export function volumeLabel(volume: MangaVolume): string {
  return volume.number !== null ? `Tome ${volume.number}` : volume.fileName;
}

export function shelfCounts(slots: ShelfSlot[]): ShelfCounts {
  const owned = slots.filter((s) => s.kind === "owned");
  const read = owned.filter((s) => s.volume.read).length;
  const missing = slots.length - owned.length;
  const collected = owned.filter((s) => s.number !== null).length;
  return {
    owned: owned.length,
    read,
    unread: owned.length - read,
    missing,
    total: slots.length,
    collected,
    published: collected + missing,
  };
}

export function filterShelf(slots: ShelfSlot[], filter: ShelfFilter): ShelfSlot[] {
  switch (filter) {
    case "all":
      return slots;
    case "owned":
      return slots.filter((s) => s.kind === "owned");
    case "unread":
      return slots.filter((s) => s.kind === "owned" && !s.volume.read);
    case "missing":
      return slots.filter((s) => s.kind === "missing");
  }
}
