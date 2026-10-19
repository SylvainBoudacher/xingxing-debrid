import type { BulkDownloadProgress, DownloadItem } from "@/lib/downloads";

export interface DownloadsSummary {
  active: number;
  /** Progression globale, de 0 à 1 (lot entier si un lot est en cours). */
  progress: number;
  /** Vitesse cumulée des téléchargements en cours, en octets/seconde. */
  speed: number;
  /** Téléchargements d'un lot pas encore démarrés. */
  pending: number;
  state: "active" | "done" | "error";
}

// Résumé affiché par la pilule repliée : nombre en cours, progression globale
// et état final une fois tout terminé. Hors lot, la progression suit les octets
// cumulés ; pendant un lot, la taille des fichiers en attente est inconnue, on
// compte donc en fichiers (terminés + fraction de ceux en cours) sur le total.
export function summarizeDownloads(
  items: DownloadItem[],
  bulk: BulkDownloadProgress | null = null,
): DownloadsSummary {
  const active = items.filter((d) => d.status === "active");
  const pending = bulk ? Math.max(0, bulk.total - bulk.done - bulk.active) : 0;
  if (active.length === 0 && pending === 0) {
    return {
      active: 0,
      progress: 1,
      speed: 0,
      pending: 0,
      state: items.some((d) => d.status === "error") ? "error" : "done",
    };
  }
  const fraction = (d: DownloadItem) => (d.total > 0 ? Math.min(1, d.downloaded / d.total) : 0);
  let progress: number;
  if (bulk && bulk.total > 1) {
    const started = active.reduce((sum, d) => sum + fraction(d), 0);
    progress = Math.min(1, (bulk.done + started) / bulk.total);
  } else {
    const sized = active.filter((d) => d.total > 0);
    const total = sized.reduce((sum, d) => sum + d.total, 0);
    const downloaded = sized.reduce((sum, d) => sum + Math.min(d.downloaded, d.total), 0);
    progress = total ? downloaded / total : 0;
  }
  return {
    active: active.length,
    progress,
    speed: active.reduce((sum, d) => sum + (d.speed ?? 0), 0),
    pending,
    state: "active",
  };
}
