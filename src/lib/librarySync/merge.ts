import type { LibraryEntry } from "@/lib/library";
import type { CategoryConfig, LibraryCategory } from "@/lib/libraryCategories";
import { entryTimestamp, type LibraryPayload } from "./format";

export interface MergeResult {
  entries: LibraryEntry[];
  categories: CategoryConfig;
  added: number;
  updated: number;
  unchanged: number;
  // Présentes en local, absentes du fichier, et antérieures à l'export : elles
  // ont donc été supprimées sur l'autre machine. L'utilisateur tranche.
  missing: LibraryEntry[];
}

export interface LocalState {
  entries: LibraryEntry[];
  categories: CategoryConfig;
}

// Fusion pure : aucun accès disque, aucune dépendance Tauri.
//
// `toRemove` contient les infoHash que l'utilisateur a accepté de supprimer
// parmi ceux listés dans `missing`. L'aperçu affiché avant confirmation est un
// premier appel avec un ensemble vide ; l'application est un second appel avec
// la sélection. Une seule fonction, donc aucun risque que l'aperçu et le
// résultat divergent.
export function mergeLibrary(
  local: LocalState,
  imported: LibraryPayload,
  toRemove: ReadonlySet<string> = new Set(),
): MergeResult {
  const byHash = new Map(local.entries.map((e) => [e.infoHash, e]));
  const importedHashes = new Set(imported.entries.map((e) => e.infoHash));

  const result: LibraryEntry[] = [];
  const missing: LibraryEntry[] = [];
  let added = 0;
  let updated = 0;
  let unchanged = 0;

  for (const incoming of imported.entries) {
    const current = byHash.get(incoming.infoHash);
    if (!current) {
      result.push(incoming);
      added++;
      continue;
    }
    const merged = mergeEntry(current, incoming);
    result.push(merged);
    if (merged === current) unchanged++;
    else updated++;
  }

  for (const entry of local.entries) {
    if (importedHashes.has(entry.infoHash)) continue;
    // Ajoutée après la création du fichier : elle ne pouvait pas y figurer.
    if (entry.addedAt > imported.exportedAt) {
      result.push(entry);
      unchanged++;
      continue;
    }
    missing.push(entry);
    if (!toRemove.has(entry.infoHash)) result.push(entry);
  }

  return {
    entries: result,
    categories: mergeCategories(local.categories, imported.categories, result),
    added,
    updated,
    unchanged,
    missing,
  };
}

// Le plus récent l'emporte sur l'ensemble des champs, sauf `watched` qui est
// toujours l'union des deux : une progression de visionnage ne doit jamais
// disparaître dans une fusion. Rend l'entrée locale telle quelle si la fusion
// ne change rien, pour que le compteur « inchangés » dise la vérité.
function mergeEntry(current: LibraryEntry, incoming: LibraryEntry): LibraryEntry {
  const watched = { ...current.watched };
  for (const [name, seen] of Object.entries(incoming.watched)) {
    if (seen) watched[name] = true;
    else if (!(name in watched)) watched[name] = false;
  }

  const winner = entryTimestamp(incoming) > entryTimestamp(current) ? incoming : current;
  const merged: LibraryEntry = { ...winner, watched };

  return stable(merged) === stable(current) ? current : merged;
}

// Sérialisation insensible à l'ordre des clés : `{...winner, watched}` déplace
// `watched` en fin d'objet, ce qu'une comparaison JSON naïve verrait comme un
// changement.
function stable(value: unknown): string {
  return JSON.stringify(value, (_key, val) =>
    val && typeof val === "object" && !Array.isArray(val)
      ? Object.fromEntries(Object.entries(val).sort(([a], [b]) => a.localeCompare(b)))
      : val,
  );
}

// Union par id. Le nom le plus récemment créé l'emporte en cas de collision.
// `assign` ne conserve que les titres réellement présents après fusion.
function mergeCategories(
  local: CategoryConfig,
  imported: CategoryConfig,
  entries: LibraryEntry[],
): CategoryConfig {
  const byId = new Map<string, LibraryCategory>();
  for (const category of [...local.categories, ...imported.categories]) {
    const existing = byId.get(category.id);
    if (!existing || category.createdAt > existing.createdAt) byId.set(category.id, category);
  }

  const kept = new Set(entries.map((e) => e.infoHash));
  const assign: Record<string, string> = {};
  for (const [hash, id] of Object.entries({ ...imported.assign, ...local.assign })) {
    if (kept.has(hash) && byId.has(id)) assign[hash] = id;
  }

  return { categories: [...byId.values()], assign };
}
