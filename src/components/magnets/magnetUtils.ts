export const AD_BASE = "https://api.alldebrid.com/v4";
export const PAGE_SIZE = 10;

// Nombre de requetes AllDebrid menees de front (deblocage de liens, suppression).
export const CONCURRENCY = 4;

// Applique `fn` a tous les items, `limit` en parallele. Attend que TOUT soit
// termine avant de relancer la premiere erreur, pour eviter qu'un worker
// continue en arriere-plan apres le catch de l'appelant.
export async function forEachLimit<T>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<void>,
): Promise<void> {
  let next = 0;
  let firstError: unknown = null;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      try {
        await fn(items[i], i);
      } catch (err) {
        if (firstError === null) firstError = err;
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  if (firstError !== null) throw firstError;
}

export function isNfoFile(name: string): boolean {
  return name.toLowerCase().endsWith(".nfo");
}

export function formatDate(ts: number): string {
  if (!ts) return "-";
  return new Date(ts * 1000).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export type StatusFilter = "all" | "active" | "ready" | "error";

export function getStatusFilter(code: number): Exclude<StatusFilter, "all"> {
  if (code === 4) return "ready";
  if (code >= 0 && code <= 3) return "active";
  return "error";
}
