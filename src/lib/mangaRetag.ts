import { transferAliases } from "@/lib/mangaAliases";
import {
  assignMangas,
  loadMangaCategories,
  mangaCategoryOf,
  saveMangaCategories,
} from "@/lib/mangaCategories";
import type { MangaItem } from "@/lib/mangaItem";
import {
  loadMangaLibrary,
  mergeVolumes,
  metaFromItem,
  saveMangaLibrary,
  type MangaEntry,
} from "@/lib/mangaLibrary";
import { applyMangaMoves, planMangaMoves } from "@/lib/mangaMove";
import { resolveMangaRoot } from "@/lib/mangaPaths";

/**
 * Fusionne une entree dans la fiche d'une autre oeuvre. Les tomes des deux
 * entrees sont reunis, la progression de lecture est conservee, et la fiche
 * retenue est celle de l'oeuvre choisie.
 */
export function retagEntry(entries: MangaEntry[], mangaId: string, item: MangaItem): MangaEntry[] {
  const source = entries.find((e) => e.mangaId === mangaId);
  if (!source) return entries;
  const target = entries.find((e) => e.mangaId === item.id && e.mangaId !== mangaId);

  const merged: MangaEntry = {
    mangaId: item.id,
    meta: metaFromItem(item),
    volumes: mergeVolumes(target?.volumes ?? [], source.volumes),
    pending: [...(target?.pending ?? []), ...(source.pending ?? [])],
    readingDirection: source.readingDirection ?? target?.readingDirection,
    addedAt: Math.min(source.addedAt, target?.addedAt ?? source.addedAt),
    updatedAt: Date.now(),
  };
  if (merged.pending?.length === 0) delete merged.pending;

  const kept = entries.filter((e) => e.mangaId !== mangaId && e.mangaId !== item.id);
  const at = entries.indexOf(source);
  return [...kept.slice(0, at), merged, ...kept.slice(at)];
}

/**
 * Corrige la fiche MangaDex d'une oeuvre : l'entree change d'identite, garde
 * ses tomes, et ses fichiers locaux suivent dans le dossier du nouveau titre.
 * La categorie personnalisee et les alias C411 suivent aussi.
 */
export async function retagManga(mangaId: string, item: MangaItem): Promise<MangaEntry | null> {
  const entries = await loadMangaLibrary();
  const next = retagEntry(entries, mangaId, item);
  if (next === entries) return null;
  await saveMangaLibrary(next);

  if (mangaId !== item.id) {
    const config = await loadMangaCategories();
    const category = mangaCategoryOf(config, mangaId);
    const cleared = assignMangas(config, [mangaId], null);
    await saveMangaCategories(category ? assignMangas(cleared, [item.id], category) : cleared);
    await transferAliases(mangaId, item.id);
  }

  const entry = next.find((e) => e.mangaId === item.id) ?? null;
  if (entry) {
    const moves = planMangaMoves([entry], await resolveMangaRoot());
    if (moves.length > 0) await applyMangaMoves(moves);
  }
  return entry;
}
