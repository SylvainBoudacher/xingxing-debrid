import { nextMissingEpisode } from "./evaluate";
import type { ContentKey, RadarEntry, RadarExpectation } from "./types";
import { entryStatus, formatEpisodes } from "./view";
import { versionLabel } from "./versions";

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const numbersOf = (contents: Iterable<ContentKey>) => [...contents].map((c) => Number(c.slice(1)));

export function formatLastCheck(at: number | null, now: Date = new Date()): string {
  if (at === null) return "aucune pour l'instant";
  const date = new Date(at);
  const time = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (date.toDateString() === now.toDateString()) return `aujourd'hui à ${time}`;
  return `le ${date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} à ${time}`;
}

export function rowSummary(entry: RadarEntry): string {
  const status = entryStatus(entry);
  if (status === "partial") {
    return `Alternative disponible : ${versionLabel(entry.alerts[entry.alerts.length - 1].version)}`;
  }
  if (status === "finished") return "Saison terminée";
  if (status === "released") {
    if (entry.season === null) return "Film disponible";
    const numbers = numbersOf(entry.alerts.filter((a) => a.level === "full").map((a) => a.content));
    return `${capitalize(formatEpisodes(numbers))} ${numbers.length > 1 ? "disponibles" : "disponible"}`;
  }
  const next = nextMissingEpisode(entry);
  return next === null ? "En attente" : `Prochain : ${formatEpisodes([next])}`;
}

const LANGUAGE_LABELS = { vf: "VF", vostfr: "VOSTFR" } as const;
const MODE_LABELS = { strict: "strict", soft: "souple" } as const;

export function expectationLabel(e: RadarExpectation): string {
  const parts = [
    e.language === "any" ? "" : LANGUAGE_LABELS[e.language],
    e.resolution === "any" ? "" : e.resolution,
  ].filter(Boolean);
  return `${parts.join(" ") || "Toutes versions"}, ${MODE_LABELS[e.mode]}`;
}

export function libraryLabel(
  entry: RadarEntry,
  owned: { certain: Set<ContentKey>; uncertain: Set<ContentKey> },
): string | null {
  if (owned.certain.size > 0) {
    if (entry.season === null) return "En bibliothèque";
    return `${capitalize(formatEpisodes(numbersOf(owned.certain)))} en bibliothèque`;
  }
  return owned.uncertain.size > 0 ? "Peut-être en bibliothèque" : null;
}
