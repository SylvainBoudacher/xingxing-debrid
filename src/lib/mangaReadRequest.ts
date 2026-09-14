// Demande d'ouverture d'un tome dans le lecteur, émise hors de la bibliothèque
// (notification de téléchargement). Elle reste en attente jusqu'à ce que la
// section Mangas soit montée et la consomme.

export interface MangaReadRequest {
  mangaId: string;
  fileName: string;
  infoHash: string;
}

let pending: MangaReadRequest | null = null;
const listeners = new Set<(request: MangaReadRequest) => void>();

export function requestMangaRead(request: MangaReadRequest): void {
  pending = request;
  listeners.forEach((l) => l(request));
}

/** Retire la demande en attente : un seul consommateur l'ouvre. */
export function takeMangaReadRequest(): MangaReadRequest | null {
  const request = pending;
  pending = null;
  return request;
}

export function hasMangaReadRequest(): boolean {
  return pending !== null;
}

export function subscribeMangaRead(cb: (request: MangaReadRequest) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
