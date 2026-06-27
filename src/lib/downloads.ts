import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { LazyStore } from "@tauri-apps/plugin-store";
import { toast } from "sonner";

export type DownloadStatus = "active" | "done" | "error" | "cancelled";

export interface DownloadItem {
  id: string;
  filename: string;
  downloaded: number;
  total: number;
  status: DownloadStatus;
  /** Vitesse instantanée lissée, en octets/seconde (téléchargement en cours). */
  speed?: number;
  /** Chemin local du fichier, disponible une fois le téléchargement terminé. */
  path?: string;
}

interface ProgressEvent {
  id: string;
  downloaded: number;
  total: number;
}

const store = new LazyStore("settings.json", { defaults: {}, autoSave: false });

const items = new Map<string, DownloadItem>();
// Dernier point de mesure (temps + octets) par téléchargement, pour la vitesse.
const timing = new Map<string, { time: number; bytes: number }>();
const listeners = new Set<() => void>();
let snapshot: DownloadItem[] = [];

function emit() {
  snapshot = [...items.values()];
  listeners.forEach((l) => l());
}

export function subscribeDownloads(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getDownloadsSnapshot(): DownloadItem[] {
  return snapshot;
}

// --- Progression d'un téléchargement groupé (lot de N en parallèle) ---------
// État agrégé exposé à une modal globale : combien d'éléments au total, combien
// terminés, combien en cours. `null` quand aucun lot n'est en cours.
export interface BulkDownloadProgress {
  total: number;
  done: number;
  active: number;
}

let bulk: BulkDownloadProgress | null = null;
let bulkSnapshot: BulkDownloadProgress | null = null;
const bulkListeners = new Set<() => void>();

function emitBulk() {
  bulkSnapshot = bulk ? { ...bulk } : null;
  bulkListeners.forEach((l) => l());
}

export function subscribeBulkDownload(cb: () => void): () => void {
  bulkListeners.add(cb);
  return () => bulkListeners.delete(cb);
}

export function getBulkDownloadSnapshot(): BulkDownloadProgress | null {
  return bulkSnapshot;
}

let bulkCancelled = false;

export function beginBulkDownload(total: number): void {
  bulk = { total, done: 0, active: 0 };
  bulkCancelled = false;
  emitBulk();
}

export function bulkTaskStart(): void {
  if (!bulk) return;
  bulk.active += 1;
  emitBulk();
}

export function bulkTaskEnd(): void {
  if (!bulk) return;
  bulk.active = Math.max(0, bulk.active - 1);
  bulk.done += 1;
  emitBulk();
}

export function endBulkDownload(): void {
  bulk = null;
  bulkCancelled = false;
  emitBulk();
}

export function isBulkCancelled(): boolean {
  return bulkCancelled;
}

// Nombre de téléchargements menés en parallèle lors d'un téléchargement groupé.
// Borné à [1, 8] ; 1 par défaut (comportement séquentiel historique).
export async function getDownloadBatchSize(): Promise<number> {
  const v = await store.get<number>("download_batch_size");
  return Math.min(8, Math.max(1, v ?? 1));
}

let progressBound = false;
function ensureProgressListener() {
  if (progressBound) return;
  progressBound = true;
  listen<ProgressEvent>("download-progress", (e) => {
    const item = items.get(e.payload.id);
    if (!item || item.status !== "active") return;

    const now = performance.now();
    const prev = timing.get(e.payload.id);
    if (prev) {
      const dt = (now - prev.time) / 1000;
      const dBytes = e.payload.downloaded - prev.bytes;
      if (dt > 0 && dBytes >= 0) {
        const inst = dBytes / dt;
        // Lissage exponentiel pour une valeur stable malgré des chunks irréguliers.
        item.speed = item.speed ? item.speed * 0.7 + inst * 0.3 : inst;
      }
    }
    timing.set(e.payload.id, { time: now, bytes: e.payload.downloaded });

    item.downloaded = e.payload.downloaded;
    item.total = e.payload.total;
    emit();
  });
}

function basename(url: string): string {
  try {
    const path = url.split("?")[0];
    const last = path.slice(path.lastIndexOf("/") + 1);
    return last ? decodeURIComponent(last) : "Téléchargement";
  } catch {
    return "Téléchargement";
  }
}

/**
 * Lance le téléchargement d'une URL débridée vers le dossier configuré (ou le
 * dossier Téléchargements de l'OS si aucun n'est défini). La promesse se résout
 * une fois le fichier écrit, ce qui permet d'enchaîner avec une limite de
 * concurrence côté appelant. La progression est suivie via l'overlay.
 */
export async function startDownload(url: string): Promise<void> {
  ensureProgressListener();
  const id = crypto.randomUUID();
  const dir = (await store.get<string>("download_dir")) ?? "";

  items.set(id, { id, filename: basename(url), downloaded: 0, total: 0, status: "active" });
  emit();

  try {
    const path = await invoke<string>("download_to_dir", { id, url, dir });
    timing.delete(id);
    const item = items.get(id);
    if (item) {
      item.status = "done";
      item.downloaded = item.total || item.downloaded;
      item.speed = undefined;
      item.path = path;
      emit();
    }
  } catch (err) {
    timing.delete(id);
    const item = items.get(id);
    if (!item) return;
    item.speed = undefined;
    if (String(err) === "cancelled") {
      item.status = "cancelled";
    } else {
      item.status = "error";
      toast.error(`Téléchargement échoué : ${item.filename}`);
    }
    emit();
  }
}

export async function cancelDownload(id: string): Promise<void> {
  await invoke("cancel_download", { id });
}

export async function cancelAllActiveDownloads(): Promise<void> {
  bulkCancelled = true;
  const active = [...items.values()].filter((i) => i.status === "active");
  await Promise.allSettled(active.map((i) => invoke("cancel_download", { id: i.id })));
}

export async function openDownload(id: string): Promise<void> {
  const item = items.get(id);
  if (!item?.path) return;
  try {
    await invoke("open_file", { path: item.path });
  } catch (err) {
    toast.error(`Ouverture impossible : ${err}`);
  }
}

export function dismissDownload(id: string): void {
  items.delete(id);
  timing.delete(id);
  emit();
}

export function clearFinishedDownloads(): void {
  for (const [id, item] of items) {
    if (item.status !== "active") {
      items.delete(id);
      timing.delete(id);
    }
  }
  emit();
}
