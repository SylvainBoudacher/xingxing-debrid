import { RESOLUTION_RANK, type Occupant } from "@/lib/discoverReleases";

export type Availability = "fast" | "ok" | "slow";

export interface QuickPick {
  label: string;
  occ: Occupant;
}

const FRENCH_TOKENS = ["MULTI", "VFF", "TRUEFRENCH", "VFQ", "VF2", "FRENCH", "VF"];

const RANK_LABELS: Record<number, string> = { 5: "8K", 4: "4K" };

export function availability(seeders: number): Availability {
  if (seeders >= 50) return "fast";
  if (seeders >= 10) return "ok";
  return "slow";
}

export function languageLabel(languages: string[]): string | null {
  if (languages.includes("MULTI")) return "Français + VO";
  if (languages.includes("VFQ") && !languages.some((l) => l === "VFF" || l === "TRUEFRENCH"))
    return "Français (Québec)";
  if (languages.some((l) => FRENCH_TOKENS.includes(l))) return "Français";
  if (languages.includes("VOSTFR")) return "VO sous-titrée";
  if (languages.includes("VO")) return "VO";
  return null;
}

function isFrench(occ: Occupant): boolean {
  return occ.languages.some((l) => FRENCH_TOKENS.includes(l));
}

function isBetter(a: Occupant, b: Occupant): boolean {
  const fr = Number(isFrench(a)) - Number(isFrench(b));
  if (fr !== 0) return fr > 0;
  if (a.seeders !== b.seeders) return a.seeders > b.seeders;
  return a.fileSize < b.fileSize;
}

function bestByResolution(releases: Occupant[]): QuickPick[] {
  const best = new Map<number, Occupant>();
  for (const occ of releases) {
    const rank = RESOLUTION_RANK[occ.resolution ?? ""];
    if (!rank) continue;
    const current = best.get(rank);
    if (!current || isBetter(occ, current)) best.set(rank, occ);
  }
  return [...best.entries()]
    .sort(([a], [b]) => b - a)
    .map(([rank, occ]) => ({ label: RANK_LABELS[rank] ?? occ.resolution!, occ }));
}

// Une carte par resolution connue (4K et 2160p fusionnes), de la plus haute a
// la plus basse. Pour les series, seuls les packs (saison / integrale) comptent.
export function quickPicks(releases: Occupant[], isTv: boolean): QuickPick[] {
  return bestByResolution(isTv ? releases.filter((o) => o.scope?.kind !== "episode") : releases);
}

export interface EpisodePicks {
  episode: number;
  picks: QuickPick[];
}

// Saison sans pack : les memes choix par resolution, mais pour chaque episode.
export function episodePicks(releases: Occupant[]): EpisodePicks[] {
  const byEpisode = new Map<number, Occupant[]>();
  for (const occ of releases) {
    if (occ.scope?.kind !== "episode") continue;
    byEpisode.set(occ.scope.episode, [...(byEpisode.get(occ.scope.episode) ?? []), occ]);
  }
  return [...byEpisode.entries()]
    .sort(([a], [b]) => a - b)
    .map(([episode, occs]) => ({ episode, picks: bestByResolution(occs) }))
    .filter((e) => e.picks.length > 0);
}
