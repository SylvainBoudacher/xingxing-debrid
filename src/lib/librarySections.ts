import type { DisplayItem, TmdbMeta } from "@/lib/library";
import {
  categoryOf,
  UNCLASSIFIED,
  UNCLASSIFIED_LABEL,
  type CategoryConfig,
} from "@/lib/libraryCategories";
import { genreNames } from "@/lib/tmdbGenres";

export type GroupMode = "none" | "type" | "genre" | "category";

// Une rangée à l'intérieur d'un bloc. `label` nul = pas de sous-titre (modes
// "none" et "type", où le bloc porte déjà le seul titre utile).
export interface LibrarySection {
  key: string;
  label: string | null;
  items: DisplayItem[];
}

// Un bloc = un type de média (Films / Séries), une catégorie de l'utilisateur,
// ou toute la bibliothèque en mode "none". Films et séries restent séparés :
// au premier niveau dans les modes "type" et "genre", en rangées à l'intérieur
// de chaque catégorie dans le mode "category".
export interface LibraryBlock {
  key: string;
  label: string | null;
  count: number;
  sections: LibrarySection[];
  // Mode "category" : cible du glisser-déposer (id de catégorie, ou
  // UNCLASSIFIED pour le bloc des non classés).
  dropId?: string;
}

const MOVIES = "Films";
const SERIES = "Séries";
const NO_INFO = "Sans info TMDB";
const NO_GENRE = "Autres";

export function itemTmdb(item: DisplayItem): TmdbMeta | undefined {
  return item.type === "group" ? item.group.tmdb : item.entry.tmdb;
}

export function itemGenres(item: DisplayItem): string[] {
  return genreNames(itemTmdb(item)?.genreIds);
}

export interface GenreOption {
  name: string;
  count: number;
}

// Genres présents dans la bibliothèque, secondaires compris : le filtre doit
// retrouver un film d'horreur même quand l'horreur n'est pas son genre
// principal (contrairement au regroupement, cf. genreRows).
export function genreOptions(items: DisplayItem[]): GenreOption[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    for (const name of itemGenres(item)) counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "fr"));
}

// Un titre est gardé s'il porte au moins un des genres cochés.
export function filterByGenres(items: DisplayItem[], selected: Set<string>): DisplayItem[] {
  if (selected.size === 0) return items;
  return items.filter((item) => itemGenres(item).some((name) => selected.has(name)));
}

function mediaLabel(item: DisplayItem): string {
  if (item.type === "group") return SERIES;
  const tmdb = item.entry.tmdb;
  if (!tmdb) return NO_INFO;
  return tmdb.mediaType === "movie" ? MOVIES : SERIES;
}

function byMedia(items: DisplayItem[]): Array<[string, DisplayItem[]]> {
  const buckets = new Map<string, DisplayItem[]>([
    [NO_INFO, []],
    [MOVIES, []],
    [SERIES, []],
  ]);
  for (const item of items) buckets.get(mediaLabel(item))!.push(item);
  return [...buckets].filter(([, list]) => list.length > 0);
}

// Rangées de genres d'un type de média. Chaque titre n'est rangé que dans son
// genre principal (TMDB ordonne les genres par pertinence) : un titre = une
// carte, sinon un film à trois genres apparaît trois fois. Les genres
// secondaires restent lisibles sur la fiche. Sans genre connu : "Autres", en
// dernier.
function genreRows(label: string, items: DisplayItem[]): LibrarySection[] {
  const buckets = new Map<string, DisplayItem[]>();
  for (const item of items) {
    const name = genreNames(itemTmdb(item)?.genreIds)[0] ?? NO_GENRE;
    const list = buckets.get(name);
    if (list) list.push(item);
    else buckets.set(name, [item]);
  }
  return [...buckets]
    .sort((a, b) => {
      if (a[0] === NO_GENRE) return 1;
      if (b[0] === NO_GENRE) return -1;
      return b[1].length - a[1].length || a[0].localeCompare(b[0], "fr");
    })
    .map(([name, list]) => ({ key: `${label}-${name}`, label: name, items: list }));
}

// Un bloc par catégorie, dans l'ordre choisi par l'utilisateur, puis les non
// classés. Les catégories vides restent affichées : ce sont des cibles de
// dépôt, les masquer rendrait le rangement impossible.
function categoryBlocks(items: DisplayItem[], config: CategoryConfig): LibraryBlock[] {
  const buckets = new Map<string, DisplayItem[]>(config.categories.map((c) => [c.id, []]));
  buckets.set(UNCLASSIFIED, []);
  for (const item of items) {
    const id = categoryOf(config, item) ?? UNCLASSIFIED;
    (buckets.get(id) ?? buckets.get(UNCLASSIFIED)!).push(item);
  }

  const blocks = config.categories.map((c) => toBlock(c.id, c.name, buckets.get(c.id) ?? []));
  // Toujours affiché, même vide : c'est la cible pour sortir un titre d'une
  // catégorie.
  blocks.push(toBlock(UNCLASSIFIED, UNCLASSIFIED_LABEL, buckets.get(UNCLASSIFIED)!));
  return blocks;
}

function toBlock(id: string, label: string, items: DisplayItem[]): LibraryBlock {
  return {
    key: id,
    label,
    count: items.length,
    dropId: id,
    sections: byMedia(items).map(([media, list]) => ({
      key: `${id}-${media}`,
      label: media,
      items: list,
    })),
  };
}

export function buildLibraryBlocks(
  items: DisplayItem[],
  mode: GroupMode,
  categories?: CategoryConfig,
): LibraryBlock[] {
  if (mode === "category")
    return categoryBlocks(items, categories ?? { categories: [], assign: {} });

  if (mode === "none")
    return [
      {
        key: "all",
        label: null,
        count: items.length,
        sections: [{ key: "all", label: null, items }],
      },
    ];

  return byMedia(items).map(([label, list]) => ({
    key: label,
    label,
    count: list.length,
    sections:
      mode === "genre" && label !== NO_INFO
        ? genreRows(label, list)
        : [{ key: `${label}-all`, label: null, items: list }],
  }));
}
