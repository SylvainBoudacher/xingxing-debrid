import { fetchWithTimeout } from "@/lib/networkError";

const BASE = "https://nyaa.si";

// Trackers par defaut des torrents nyaa.si, ajoutes au magnet pour qu'AllDebrid
// resolve plus vite (l'infoHash seul suffit, mais les trackers accelerent).
const TRACKERS = [
  "http://nyaa.tracker.wf:7777/announce",
  "udp://open.stealth.si:80/announce",
  "udp://tracker.opentrackr.org:1337/announce",
  "udp://exodus.desync.com:6969/announce",
  "udp://tracker.torrent.eu.org:451/announce",
];

export interface NyaaResult {
  title: string;
  infoHash: string;
  magnet: string;
  size: string;
  seeders: number;
  leechers: number;
  downloads: number;
  category: string;
  viewUrl: string;
  pubDate: string;
}

export interface NyaaSearchParams {
  query: string;
}

export const nyaaKeys = {
  search: (p: NyaaSearchParams) => ["nyaa", "search", p.query] as const,
};

function buildMagnet(infoHash: string, title: string): string {
  const tr = TRACKERS.map((t) => `&tr=${encodeURIComponent(t)}`).join("");
  return `magnet:?xt=urn:btih:${infoHash}&dn=${encodeURIComponent(title)}${tr}`;
}

function text(item: Element, tag: string): string {
  return item.getElementsByTagName(tag)[0]?.textContent?.trim() ?? "";
}

export function nyaaSearchUrl(p: NyaaSearchParams): string {
  return `${BASE}/?q=${encodeURIComponent(p.query)}&page=rss`;
}

export async function searchNyaa(p: NyaaSearchParams): Promise<NyaaResult[]> {
  const url = nyaaSearchUrl(p);
  const res = await fetchWithTimeout("nyaa.si", url);

  const xml = await res.text();
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  const items = Array.from(doc.getElementsByTagName("item"));

  return items.map((item) => {
    const title = text(item, "title");
    const infoHash = text(item, "nyaa:infoHash");
    return {
      title,
      infoHash,
      magnet: buildMagnet(infoHash, title),
      size: text(item, "nyaa:size"),
      seeders: Number(text(item, "nyaa:seeders")) || 0,
      leechers: Number(text(item, "nyaa:leechers")) || 0,
      downloads: Number(text(item, "nyaa:downloads")) || 0,
      category: text(item, "nyaa:categoryId"),
      viewUrl: text(item, "guid"),
      pubDate: text(item, "pubDate"),
    };
  });
}
