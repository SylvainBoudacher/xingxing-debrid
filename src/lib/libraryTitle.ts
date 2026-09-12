import {
  dominantSeason,
  episodeLabel,
  episodeOf,
  groupLibraryEntries,
  seasonOf,
  seasonsOf,
  type LibraryEntry,
  type SeasonItem,
  type SeriesGroup,
  type TmdbMeta,
} from "@/lib/library";
import { parseRelease } from "@/lib/parseRelease";
import type { TmdbDetail, TmdbEpisode } from "@/lib/services/tmdb";
import { groupFolderSections, type SeriesFolderConfig } from "@/lib/seriesFolders";

// Titre ouvert en fiche plein écran : une série TMDB regroupée, ou une entrée
// seule (film, pack C411 / Nyaa sans métadonnées).
export type TitleSubject =
  { kind: "group"; group: SeriesGroup } | { kind: "entry"; entry: LibraryEntry };

export interface TitleItem extends SeasonItem {
  // Saison et épisode déduits du fichier : clés de l'épisode TMDB correspondant.
  season: number | null;
  episode: number | null;
}

export interface TitleSection {
  key: string;
  label: string;
  // Saison TMDB de la section. Null pour un dossier manuel ou sans saison.
  season: number | null;
  items: TitleItem[];
}

export interface EpisodeRange {
  start: number;
  end: number;
}

// Au-delà de RANGE_THRESHOLD épisodes, une section s'affiche par plages de
// RANGE_SIZE, façon Netflix : la liste ne rend jamais des centaines de lignes.
const RANGE_THRESHOLD = 100;
export const RANGE_SIZE = 50;

export function subjectEntries(subject: TitleSubject): LibraryEntry[] {
  return subject.kind === "group" ? subject.group.entries : [subject.entry];
}

export function subjectTmdb(subject: TitleSubject): TmdbMeta | undefined {
  return subject.kind === "group" ? subject.group.tmdb : subject.entry.tmdb;
}

// Clé de la carte d'un titre dans la bibliothèque (attribut data-title-key) :
// hash d'une entrée seule, g<id TMDB> d'une série regroupée.
export function cardKey(hash: string | null, groupId: number | null): string {
  return hash ?? `g${groupId}`;
}

export function parseCardKey(key: string): { hash: string | null; groupId: number | null } {
  const group = /^g(\d+)$/.exec(key);
  return group ? { hash: null, groupId: Number(group[1]) } : { hash: key, groupId: null };
}

// Clé des actions AllDebrid groupées (spinners), reprise des anciennes modales.
export function subjectKey(subject: TitleSubject): string {
  return subject.kind === "group" ? `series-${subject.group.tmdbId}` : subject.entry.infoHash;
}

export function subjectTitle(subject: TitleSubject, simple: boolean): string {
  if (subject.kind === "group") return subject.group.tmdb.title;
  const { entry } = subject;
  return entry.tmdb?.title ?? (simple ? parseRelease(entry.title).title : entry.title);
}

export function isItemWatched(item: SeasonItem): boolean {
  return item.entry.watched[item.file.name] ?? false;
}

// dominantSeason regroupe tous les fichiers de l'entrée : calculé une fois par
// entrée, pas une fois par fichier.
function toItems(items: SeasonItem[]): TitleItem[] {
  const fallback = new Map<LibraryEntry, number | null>();
  return items.map((it) => {
    if (!fallback.has(it.entry)) fallback.set(it.entry, dominantSeason(it.entry));
    return {
      ...it,
      season: seasonOf(it.file.name) ?? fallback.get(it.entry) ?? null,
      episode: episodeOf(it.file.name),
    };
  });
}

// Sections affichées : les dossiers configurés d'une série s'il y en a, sinon
// les saisons détectées.
export function titleSections(
  subject: TitleSubject,
  folders: SeriesFolderConfig | null,
): TitleSection[] {
  if (subject.kind === "group" && folders) {
    return groupFolderSections(subject.group, folders)
      .filter((s) => s.items.length > 0)
      .map((s) => ({
        key: s.folder?.id ?? "orphans",
        label: s.folder?.name ?? "Non classés",
        season: s.folder?.season ?? null,
        items: toItems(s.items),
      }));
  }
  const seasons = seasonsOf(subjectEntries(subject));
  return seasons.map((s) => ({
    key: `s${s.season ?? "x"}`,
    label: s.season !== null ? `Saison ${s.season}` : seasons.length > 1 ? "Autres" : "Épisodes",
    season: s.season,
    items: toItems(s.items),
  }));
}

export function nextTitleItem(sections: TitleSection[]): TitleItem | null {
  for (const s of sections) {
    const item = s.items.find((it) => !isItemWatched(it));
    if (item) return item;
  }
  return null;
}

// Section affichée à l'ouverture : celle du prochain épisode à voir.
export function initialSection(sections: TitleSection[]): TitleSection | undefined {
  const next = nextTitleItem(sections);
  return sections.find((s) => next !== null && s.items.includes(next)) ?? sections[0];
}

// Plage affichée à l'ouverture d'une section : celle du premier épisode non vu.
export function initialRangeIndex(items: TitleItem[]): number {
  const i = items.findIndex((it) => !isItemWatched(it));
  return i < 0 ? 0 : Math.floor(i / RANGE_SIZE);
}

// Items d'une plage (toute la section si elle n'est pas découpée).
export function rangeItems(items: TitleItem[], ranges: EpisodeRange[], index: number): TitleItem[] {
  const range = ranges[Math.min(index, ranges.length - 1)];
  return range ? items.slice(range.start, range.end) : items;
}

// Saisons TMDB utiles : celle de la section et celles des épisodes affichés
// (un dossier personnalisé peut mêler plusieurs saisons).
export function displayedSeasons(section: TitleSection, visible: TitleItem[]): number[] {
  const set = new Set<number>();
  if (section.season !== null) set.add(section.season);
  for (const it of visible) if (it.season !== null) set.add(it.season);
  return [...set].sort((a, b) => a - b);
}

export function episodeRanges(count: number): EpisodeRange[] {
  if (count <= RANGE_THRESHOLD) return [];
  const ranges: EpisodeRange[] = [];
  for (let start = 0; start < count; start += RANGE_SIZE) {
    ranges.push({ start, end: Math.min(start + RANGE_SIZE, count) });
  }
  return ranges;
}

// Libellé d'une plage par numéros d'épisode (numérotation absolue comprise),
// à défaut par position.
export function rangeLabel(items: TitleItem[], range: EpisodeRange): string {
  const first = items[range.start].episode ?? range.start + 1;
  const last = items[range.end - 1].episode ?? range.end;
  return `Épisodes ${first}-${last}`;
}

// Épisodes déjà diffusés de la saison TMDB absents des fichiers. Rien si la
// numérotation des fichiers ne suit pas celle de TMDB (anime en numérotation
// absolue, pack sans numéros) : mieux vaut aucun signalement que de faux
// manquants.
export function missingEpisodes(
  section: TitleSection,
  episodes: TmdbEpisode[],
  today: string,
): number[] {
  if (section.season === null || episodes.length === 0) return [];
  const owned = new Set<number>();
  for (const it of section.items) {
    if (it.season === section.season && it.episode !== null) owned.add(it.episode);
  }
  const last = Math.max(...episodes.map((e) => e.episode_number));
  if (owned.size === 0 || [...owned].some((n) => n > last)) return [];
  return episodes
    .filter((e) => !!e.air_date && e.air_date <= today && !owned.has(e.episode_number))
    .map((e) => e.episode_number);
}

// Tête d'affiche montrée sous le résumé : au-delà de quatre noms la ligne
// déborde et ne dit plus rien de plus.
const CAST_SHOWN = 4;

export interface TitleCredits {
  // Réalisateur d'un film, créateur d'une série. Null si TMDB ne le donne pas.
  // L'id ouvre sa filmographie (rangée « Du même réalisateur »).
  director: { id: number; name: string } | null;
  cast: string[];
}

// Réalisateur et tête d'affiche d'une fiche TMDB. Null quand les deux manquent :
// la ligne ne s'affiche pas.
export function titleCredits(detail: TmdbDetail | undefined): TitleCredits | null {
  if (!detail) return null;
  const crewDirector = detail.credits?.crew?.find((c) => c.job === "Director");
  const creator = detail.created_by?.[0];
  const source = crewDirector ?? creator;
  const director = source ? { id: source.id, name: source.name } : null;
  const cast = (detail.credits?.cast ?? []).slice(0, CAST_SHOWN).map((c) => c.name);
  if (!director && cast.length === 0) return null;
  return { director, cast };
}

// Durée TMDB en minutes : « 47 min », « 1 h 52 ».
export function formatRuntime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const rest = minutes % 60;
  return `${Math.floor(minutes / 60)} h${rest ? ` ${String(rest).padStart(2, "0")}` : ""}`;
}

// Nom d'un fichier à l'écran : titre nettoyé + épisode en mode simple (la
// saison est portée par la section), nom brut sinon.
export function fileDisplayName(fileName: string, simple: boolean): string {
  const baseName = fileName.split("/").pop() ?? fileName;
  if (!simple) return baseName;
  const ep = episodeLabel(fileName)?.replace(/^S\d+(?=E)/i, "") ?? null;
  const name = parseRelease(baseName).title.replace(/ - S\d+ E(\d+)$/i, " - E$1");
  return ep && !/E\d+$/i.test(name) ? `${name} - ${ep}` : name;
}

// La fiche se résout sur toute la bibliothèque, pas sur la liste filtrée :
// marquer le dernier épisode vu sous le filtre « À voir » ne la ferme pas.
// Une entrée rattachée entre-temps à une série TMDB ouvre la série.
export function resolveTitleSubject(
  entries: LibraryEntry[],
  hash: string | null,
  groupId: number | null,
): TitleSubject | null {
  let tvId = groupId;
  if (hash !== null) {
    const entry = entries.find((e) => e.infoHash === hash);
    if (!entry) return null;
    if (entry.tmdb?.mediaType !== "tv") return { kind: "entry", entry };
    tvId = entry.tmdb.id;
  }
  if (tvId === null) return null;
  const [item] = groupLibraryEntries(
    entries.filter((e) => e.tmdb?.mediaType === "tv" && e.tmdb.id === tvId),
  );
  return item?.type === "group" ? { kind: "group", group: item.group } : null;
}
