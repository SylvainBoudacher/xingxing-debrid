import { normalize } from "@/lib/normalizeTitle";
import type { MediaType } from "@/lib/tmdbItem";
import { isComplete } from "./evaluate";
import type { ContentKey, RadarAlert, RadarEntry, RadarMode } from "./types";
import { versionLabel } from "./versions";

export type RadarStatus = "released" | "partial" | "waiting" | "finished";

export interface RadarFilters {
  query: string;
  type: "all" | MediaType;
  state: "all" | RadarStatus;
  mode: "all" | RadarMode;
  inLibrary: boolean;
}

export type RadarStatusCounts = Record<RadarFilters["state"], number>;

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
    if (filters.inLibrary && !inLibrary(entry)) return false;
    return filters.state === "all" || entryStatus(entry) === filters.state;
  });
}

export function statusCounts(
  entries: RadarEntry[],
  filters: RadarFilters,
  inLibrary: (entry: RadarEntry) => boolean,
): RadarStatusCounts {
  const visible = filterEntries(entries, { ...filters, state: "all" }, inLibrary);
  const counts = { all: visible.length, released: 0, partial: 0, waiting: 0, finished: 0 };
  for (const entry of visible) counts[entryStatus(entry)]++;
  return counts;
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

export interface RadarToastContent {
  level: RadarAlert["level"];
  label: string;
  title: string;
  detail: string;
  version: string | null;
  posters: (string | null)[];
}

const MAX_TOAST_POSTERS = 3;

function singleToast(
  { entry, alert }: NotifiedAlert,
  level: RadarAlert["level"],
): Omit<RadarToastContent, "level" | "posters"> {
  const { item, season } = entry;
  const version = versionLabel(alert.version);
  const isFull = level === "full";
  if (season === null) {
    return {
      label: isFull ? "Film disponible" : "Alternative disponible",
      title: item.title,
      detail: item.year,
      version,
    };
  }
  return {
    label: isFull ? "Nouvel épisode" : "Alternative disponible",
    title: item.title,
    detail: `Saison ${season}, épisode ${episodeNumber(alert.content)}`,
    version,
  };
}

export function radarToastContent(items: NotifiedAlert[]): RadarToastContent | null {
  if (items.length === 0) return null;
  const level = items.some((i) => i.alert.level === "full") ? "full" : "partial";
  const entries = [...new Map(items.map((i) => [i.entry.id, i.entry])).values()];
  const posters = entries.slice(0, MAX_TOAST_POSTERS).map((e) => e.item.posterPath);
  const contents = new Set(items.map((i) => `${i.entry.id}:${i.alert.content}`));
  if (contents.size === 1) return { level, posters, ...singleToast(items[0], level) };
  return {
    level,
    label: "Radar",
    title: `${contents.size} ${level === "full" ? "nouveautés" : "alternatives"}`,
    detail: entries.map((e) => e.item.title).join(", "),
    version: null,
    posters,
  };
}
