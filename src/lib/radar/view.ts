import { normalize } from "@/lib/normalizeTitle";
import type { MediaType } from "@/lib/tmdbItem";
import { isComplete } from "./evaluate";
import type { ContentKey, RadarAlert, RadarEntry, RadarMode } from "./types";

export type RadarStatus = "released" | "partial" | "waiting" | "finished";

export interface RadarFilters {
  query: string;
  type: "all" | MediaType;
  state: "all" | RadarStatus | "in-library";
  mode: "all" | RadarMode;
}

export function entryStatus(entry: RadarEntry): RadarStatus {
  if (entry.alerts.some((a) => a.level === "full")) return "released";
  if (entry.alerts.length > 0) return "partial";
  if (!isComplete(entry)) return "waiting";
  return entry.season === null ? "released" : "finished";
}

export function filterEntries(
  entries: RadarEntry[],
  filters: RadarFilters,
  inLibrary: (entry: RadarEntry) => boolean,
): RadarEntry[] {
  const query = normalize(filters.query);
  return entries.filter((entry) => {
    if (query && !normalize(entry.item.title).includes(query)) return false;
    if (filters.type !== "all" && entry.item.mediaType !== filters.type) return false;
    if (filters.mode !== "all" && entry.expectation.mode !== filters.mode) return false;
    if (filters.state === "in-library") return inLibrary(entry);
    return filters.state === "all" || entryStatus(entry) === filters.state;
  });
}

const RELEASED_ORDER: RadarStatus[] = ["released", "partial", "finished"];

export function splitBlocks(entries: RadarEntry[]): {
  released: RadarEntry[];
  waiting: RadarEntry[];
} {
  const sorted = [...entries].sort((a, b) => a.item.title.localeCompare(b.item.title, "fr"));
  return {
    released: RELEASED_ORDER.flatMap((s) => sorted.filter((e) => entryStatus(e) === s)),
    waiting: sorted.filter((e) => entryStatus(e) === "waiting"),
  };
}

const episodeNumber = (content: ContentKey) => Number(content.slice(1));

export function formatEpisodes(numbers: number[]): string {
  const sorted = [...numbers].sort((a, b) => a - b);
  if (sorted.length === 1) return `épisode ${sorted[0]}`;
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  if (last - first === sorted.length - 1) return `épisodes ${first} à ${last}`;
  return `épisodes ${sorted.slice(0, -1).join(", ")} et ${last}`;
}

export function baselineLabel(entry: RadarEntry): string | null {
  if (entry.baseline.length === 0) return null;
  if (entry.season === null) return "Déjà sur C411";
  return `Déjà sur C411 : ${formatEpisodes(entry.baseline.map(episodeNumber))}`;
}

type NotifiedAlert = { entry: RadarEntry; alert: RadarAlert };

function singleText({ entry, alert }: NotifiedAlert, level: RadarAlert["level"]): string {
  const title = entry.item.title;
  if (entry.season === null) {
    return level === "full" ? `${title} est sorti` : `${title} : alternative disponible`;
  }
  const number = episodeNumber(alert.content);
  return level === "full"
    ? `${title} : épisode ${number} est sorti`
    : `${title} : alternative disponible pour l'épisode ${number}`;
}

export function summarizeAlerts(
  items: NotifiedAlert[],
): { level: RadarAlert["level"]; text: string } | null {
  if (items.length === 0) return null;
  const level = items.some((i) => i.alert.level === "full") ? "full" : "partial";
  const contents = new Set(items.map((i) => `${i.entry.id}:${i.alert.content}`));
  if (contents.size === 1) return { level, text: singleText(items[0], level) };
  const noun = level === "full" ? "nouveautés" : "alternatives";
  return { level, text: `${contents.size} ${noun} sur Radar` };
}
