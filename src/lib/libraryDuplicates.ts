import type { LibraryEntry } from "@/lib/library";
import type { TitleItem, TitleSection } from "@/lib/libraryTitle";
import { parseReleaseTags, type ReleaseTags } from "@/lib/releaseTags";

// Une release en conflit : toutes les copies en double apportées par une même
// entrée de bibliothèque.
export interface ReleaseChoice {
  entry: LibraryEntry;
  label: string;
  tags: ReleaseTags;
  // Nombre de fichiers en double apportés par cette release, et leur poids.
  count: number;
  size: number;
}

export interface DropPlan {
  links: Set<string>;
  // Poids total des fichiers retirés : annoncé avant de confirmer.
  size: number;
  // Fichiers conservés à cocher « vu » parce qu'une copie supprimée l'était.
  promoteWatched: Array<{ entry: LibraryEntry; name: string }>;
}

// Groupes de fichiers couvrant le même (saison, épisode). Les items sans numéro
// d'épisode sont ignorés : sans numérotation fiable, deux fichiers d'un même
// pack ne sont pas comparables. Un même fichier listé dans deux dossiers ne
// compte qu'une fois (dédoublonnage par lien).
export function duplicateGroups(sections: TitleSection[]): TitleItem[][] {
  const map = new Map<string, TitleItem[]>();
  const seen = new Set<string>();
  for (const section of sections) {
    for (const item of section.items) {
      if (item.season === null || item.episode === null) continue;
      if (seen.has(item.file.link)) continue;
      seen.add(item.file.link);
      const key = `s${item.season}e${item.episode}`;
      const group = map.get(key);
      if (group) group.push(item);
      else map.set(key, [item]);
    }
  }
  return [...map.values()].filter((g) => g.length > 1);
}

export function duplicateLinks(groups: TitleItem[][]): Set<string> {
  return new Set(groups.flatMap((g) => g.map((it) => it.file.link)));
}

export function duplicateCount(groups: TitleItem[][]): number {
  return groups.length;
}

// Releases impliquées dans les doublons, la plus fournie en tête : c'est
// presque toujours celle qu'on veut garder.
export function conflictingReleases(groups: TitleItem[][]): ReleaseChoice[] {
  const map = new Map<string, ReleaseChoice>();
  for (const group of groups) {
    for (const { entry, file } of group) {
      const found = map.get(entry.infoHash);
      if (found) {
        found.count++;
        found.size += file.size;
        continue;
      }
      const label = entry.releaseName ?? entry.title;
      map.set(entry.infoHash, {
        entry,
        label,
        tags: parseReleaseTags(label),
        count: 1,
        size: file.size,
      });
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count || b.size - a.size);
}

// Fichiers à retirer si on ne garde que la release `keepHash`. Un groupe que
// cette release ne couvre pas est laissé tel quel : mieux vaut un doublon
// restant qu'un épisode perdu.
export function filesToDrop(groups: TitleItem[][], keepHash: string): DropPlan {
  const links = new Set<string>();
  const promoteWatched: DropPlan["promoteWatched"] = [];
  let size = 0;
  for (const group of groups) {
    const kept = group.find((it) => it.entry.infoHash === keepHash);
    if (!kept) continue;
    const dropped = group.filter((it) => it !== kept);
    for (const it of dropped) {
      links.add(it.file.link);
      size += it.file.size;
    }
    const keptWatched = kept.entry.watched[kept.file.name] ?? false;
    if (!keptWatched && dropped.some((it) => it.entry.watched[it.file.name])) {
      promoteWatched.push({ entry: kept.entry, name: kept.file.name });
    }
  }
  return { links, size, promoteWatched };
}
