import {
  getCachedMangaLibrary,
  loadMangaLibrary,
  type MangaEntry,
  saveMangaLibrary,
} from "@/lib/mangaLibrary";
import { sanitizeFolderName } from "@/lib/mangaPaths";
import { invoke } from "@tauri-apps/api/core";

export interface PlannedMove {
  mangaId: string;
  fileName: string;
  infoHash: string;
  from: string;
  to: string;
}

interface MoveResult {
  from: string;
  to: string;
  error: string | null;
}

// Separateur du chemin : antislash si le chemin en contient un, slash sinon.
// Evite de melanger les deux styles sur Windows.
function separator(path: string): string {
  return path.includes("\\") ? "\\" : "/";
}

function basename(path: string): string {
  const cut = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
  return cut === -1 ? path : path.slice(cut + 1);
}

/**
 * Liste les deplacements a effectuer pour ranger tous les tomes telecharges
 * sous `targetDir`, un sous-dossier par serie. Les tomes sans fichier local et
 * ceux deja a leur place sont ignores.
 */
export function planMangaMoves(entries: MangaEntry[], targetDir: string): PlannedMove[] {
  const sep = separator(targetDir);
  const moves: PlannedMove[] = [];
  const usedDestinations = new Set<string>();

  for (const entry of entries) {
    const folder = sanitizeFolderName(entry.meta.title);
    for (const volume of entry.volumes) {
      const from = volume.localPath;
      if (!from) continue;
      const to = `${targetDir}${sep}${folder}${sep}${basename(from)}`;
      if (to === from) continue;
      // Deux titres peuvent s'assainir vers le meme dossier : on garde le
      // premier deplacement et on ignore les suivants qui ecraseraient sa
      // destination.
      if (usedDestinations.has(to)) continue;
      usedDestinations.add(to);
      moves.push({
        mangaId: entry.mangaId,
        fileName: volume.fileName,
        infoHash: volume.infoHash,
        from,
        to,
      });
    }
  }
  return moves;
}

/**
 * Execute les deplacements et met a jour le chemin local des tomes deplaces.
 * Les tomes en echec gardent leur ancien chemin et restent lisibles.
 */
export async function applyMangaMoves(
  moves: PlannedMove[],
): Promise<{ moved: number; failed: PlannedMove[] }> {
  const results = await invoke<MoveResult[]>("move_files", {
    moves: moves.map(({ from, to }) => ({ from, to })),
  });

  const failed: PlannedMove[] = [];
  const succeeded: PlannedMove[] = [];

  for (const [i, result] of results.entries()) {
    const move = moves[i];
    if (result.error) {
      failed.push(move);
      continue;
    }
    succeeded.push(move);
  }

  if (succeeded.length > 0) {
    const entries = getCachedMangaLibrary() ?? (await loadMangaLibrary());
    const now = Date.now();
    const updated = entries.map((entry) => {
      const forEntry = succeeded.filter((m) => m.mangaId === entry.mangaId);
      if (forEntry.length === 0) return entry;
      return {
        ...entry,
        updatedAt: now,
        volumes: entry.volumes.map((v) => {
          const move = forEntry.find((m) => m.fileName === v.fileName && m.infoHash === v.infoHash);
          return move ? { ...v, localPath: move.to } : v;
        }),
      };
    });
    await saveMangaLibrary(updated);
  }

  return { moved: succeeded.length, failed };
}
