import type { C411Torrent } from "@/lib/c411";

export interface SearchResult {
  title: string;
  size: number;
  seeders: number;
  leechers: number;
  guid: string;
  category: number;
}

const SERIES_SLUGS = new Set(["serie-tv", "serie-documentaire", "emission-tv"]);

export function mapCategory(catId: number, subSlug: string): number {
  if (catId === 1) {
    if (subSlug === "animation") return 2060;
    if (subSlug === "animation-serie") return 5070;
    return SERIES_SLUGS.has(subSlug) ? 5000 : 2000;
  }
  if (catId === 2) {
    if (subSlug === "ebook-audio") return 3030;
    if (subSlug === "bds" || subSlug === "comics" || subSlug === "manga") return 7030;
    return 7000;
  }
  if (catId === 3) return 3000;
  if (catId === 4) return 4000;
  if (catId === 5) return 4050;
  return 0;
}

export function mapTorrents(data: C411Torrent[]): SearchResult[] {
  return data.map((t) => ({
    title: t.name,
    size: t.size,
    seeders: t.seeders,
    leechers: t.leechers ?? 0,
    guid: t.infoHash,
    category: mapCategory(t.category?.id ?? 0, t.subcategory?.slug ?? ""),
  }));
}

export function pageNumbers(current: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  if (current > 3) pages.push("...");
  for (let p = Math.max(2, current - 1); p <= Math.min(totalPages - 1, current + 1); p++)
    pages.push(p);
  if (current < totalPages - 2) pages.push("...");
  pages.push(totalPages);
  return pages;
}
