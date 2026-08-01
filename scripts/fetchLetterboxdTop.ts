/**
 * Régénère le snapshot src/lib/data/letterboxdTop.ts à partir de la liste
 * officielle "Letterboxd's Top 500 Films" (films narratifs classés par note
 * moyenne des membres).
 *
 *   bun run scripts/fetchLetterboxdTop.ts
 *
 * La clé TMDB est lue depuis TMDB_API_KEY ou VITE_DEV_TMDB_API_KEY (.env.local).
 * À relancer à la main avant une release : l'app ne scrape jamais Letterboxd.
 */
import { writeFileSync } from "node:fs";

const LIST_URL = "https://letterboxd.com/official/list/letterboxds-top-500-films";
const PAGES = 5; // 100 films par page
const OUT = "src/lib/data/letterboxdTop.ts";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)";
const CONCURRENCY = 8;

interface Listed {
  rank: number;
  slug: string;
  title: string;
  year: number;
}

interface Entry extends Listed {
  tmdbId: number;
  tmdbTitle: string;
  posterPath: string | null;
  releaseDate: string;
  voteAverage: number;
  overview: string;
  genreIds: number[];
}

function decode(s: string): string {
  return s
    .replace(/&#0?39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

async function html(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

// Les entrées d'une page de liste portent leur slug et leur "Titre (Année)"
// dans l'ordre du classement. Les deux attributs sont sur le même noeud.
function parseList(page: string, offset: number): Listed[] {
  const re = /data-item-slug="([^"]+)"[^>]*data-item-full-display-name="([^"]+)"/g;
  const out: Listed[] = [];
  for (const m of page.matchAll(re)) {
    const name = decode(m[2]);
    const year = /\((\d{4})\)\s*$/.exec(name);
    out.push({
      rank: offset + out.length + 1,
      slug: m[1],
      title: year ? name.slice(0, year.index).trim() : name,
      year: year ? Number(year[1]) : 0,
    });
  }
  return out;
}

async function mapLimit<T, R>(items: T[], fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
        if ((i + 1) % 50 === 0) console.log(`  ${i + 1}/${items.length}`);
      }
    }),
  );
  return out;
}

async function tmdbId(slug: string): Promise<number | null> {
  const page = await html(`https://letterboxd.com/film/${slug}/`);
  const m = /data-tmdb-id="(\d+)"/.exec(page);
  const type = /data-tmdb-type="([a-z]+)"/.exec(page);
  if (!m || (type && type[1] !== "movie")) return null;
  return Number(m[1]);
}

interface TmdbMovie {
  title: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  overview: string;
  genres: Array<{ id: number }>;
}

async function tmdbMovie(id: number, key: string): Promise<TmdbMovie | null> {
  const res = await fetch(
    `https://api.themoviedb.org/3/movie/${id}?api_key=${key}&language=fr-FR`,
    { headers: { "User-Agent": UA } },
  );
  if (!res.ok) return null;
  return res.json() as Promise<TmdbMovie>;
}

function readKey(): string {
  // Bun charge .env.local automatiquement : VITE_DEV_TMDB_API_KEY suffit.
  const env = process.env.TMDB_API_KEY ?? process.env.VITE_DEV_TMDB_API_KEY;
  if (env) return env;
  throw new Error("Clé TMDB absente : exporter TMDB_API_KEY ou renseigner .env.local.");
}

function render(entries: Entry[]): string {
  const rows = entries
    .map(
      (e) =>
        `  { rank: ${e.rank}, id: ${e.tmdbId}, title: ${JSON.stringify(e.tmdbTitle || e.title)}, ` +
        `original_title: ${JSON.stringify(e.title)}, poster_path: ${JSON.stringify(e.posterPath)}, ` +
        `release_date: ${JSON.stringify(e.releaseDate || String(e.year))}, ` +
        `vote_average: ${e.voteAverage}, overview: ${JSON.stringify(e.overview)}, ` +
        `genre_ids: [${e.genreIds.join(", ")}] },`,
    )
    .join("\n");
  return `// Généré le ${new Date().toISOString().slice(0, 10)} par scripts/fetchLetterboxdTop.ts
// Source : ${LIST_URL} (films narratifs classés par note moyenne des membres).
// Ne pas éditer à la main : relancer le script pour rafraîchir le classement.
import type { TmdbRawResult } from "@/lib/services/tmdb";

export interface LetterboxdEntry extends TmdbRawResult {
  /** Position dans le classement Letterboxd, 1 = meilleur. */
  rank: number;
}

export const LETTERBOXD_TOP: LetterboxdEntry[] = [
${rows}
];
`;
}

async function main() {
  const key = readKey();

  console.log("Liste Letterboxd...");
  const listed: Listed[] = [];
  for (let p = 1; p <= PAGES; p++) {
    const page = await html(p === 1 ? `${LIST_URL}/` : `${LIST_URL}/page/${p}/`);
    listed.push(...parseList(page, listed.length));
  }
  console.log(`  ${listed.length} films`);

  console.log("Ids TMDB (pages film Letterboxd)...");
  const ids = await mapLimit(listed, (f) => tmdbId(f.slug).catch(() => null));

  console.log("Fiches TMDB...");
  const details = await mapLimit(ids, (id) => (id ? tmdbMovie(id, key).catch(() => null) : null));

  const entries: Entry[] = [];
  listed.forEach((f, i) => {
    const id = ids[i];
    const d = details[i];
    if (!id || !d) {
      console.warn(`  ignoré : ${f.title} (${f.slug})`);
      return;
    }
    entries.push({
      ...f,
      rank: entries.length + 1,
      tmdbId: id,
      tmdbTitle: d.title,
      posterPath: d.poster_path,
      releaseDate: d.release_date,
      voteAverage: d.vote_average,
      overview: d.overview,
      genreIds: d.genres.map((g) => g.id),
    });
  });

  writeFileSync(OUT, render(entries));
  console.log(`${entries.length} entrées écrites dans ${OUT}`);
}

await main();
