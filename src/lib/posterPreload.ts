// Jaquettes TMDB : URL unique (la meme chaine doit servir au preload et au
// <img>, sinon le cache HTTP ne se recycle pas) + preload en tache de fond.
export const POSTER_SIZE = "w342";

export function posterUrl(path: string, size: string = POSTER_SIZE): string {
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

// Le webview ne telecharge que ~6 images par hote en parallele : on borne la
// file nous-memes pour garder l'ordre de priorite (premiere grille d'abord).
const CONCURRENCY = 6;
const requested = new Set<string>();

function load(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  });
}

// Charge les jaquettes dans l'ordre donne. Les URLs deja demandees pendant la
// session sont ignorees. Fire-and-forget : ne rejette jamais.
export async function preloadPosters(paths: (string | null | undefined)[]): Promise<void> {
  const urls = paths
    .filter((p): p is string => !!p)
    .map((p) => posterUrl(p))
    .filter((u) => !requested.has(u));
  for (const u of urls) requested.add(u);

  let next = 0;
  const worker = async () => {
    while (next < urls.length) {
      await load(urls[next++]);
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
}
