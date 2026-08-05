/**
 * Régénère le snapshot src/lib/data/senscritiqueTop.ts à partir du classement
 * "Les meilleurs mangas" de SensCritique, en résolvant chaque titre vers son
 * oeuvre MangaDex (la grille Découverte ne sait afficher que des MangaItem).
 *
 *   bun run scripts/fetchSensCritiqueTop.ts
 *
 * Les correspondances douteuses sont listées en fin de run : les corriger via
 * OVERRIDES (id produit SensCritique -> uuid MangaDex, ou null pour exclure).
 * À relancer à la main avant une release : l'app ne scrape jamais SensCritique.
 */
import { writeFileSync } from "node:fs";

const LIST_URL = "https://www.senscritique.com/top/resultats/les_meilleurs_mangas/192836";
const OUT = "src/lib/data/senscritiqueTop.ts";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)";
const MANGADEX = "https://api.mangadex.org";
const DOUJINSHI_TAG = "b13b2a48-c720-44a9-9c77-39c9979373fb";

// Seuil de similarité en dessous duquel la correspondance part en revue
// manuelle plutôt que dans le snapshot.
const MATCH_MIN = 0.82;

// Corrections manuelles, appliquées après revue du rapport du script.
// null = titre volontairement exclu (absent de MangaDex, ou entrée SensCritique
// qui ne correspond à aucune oeuvre unique).
const OVERRIDES: Record<number, string | null> = {
  267858: "801513ba-a712-498c-8f57-cae55b38cc92", // Berserk
  48797: "227e3f72-863f-46f9-bafe-c43104ca29ee", // Fairy Tail (pas la suite "100 Years Quest")
  419646: "07823fcd-f2c9-458c-9824-3eae62b2a006", // Parasite -> Parasyte / Kiseijuu
  375547: "02860cdf-1020-40f1-a23f-2025d80f6290", // GTO
  490: "5a547d1d-576b-477f-8cb3-70a3b4187f8a", // JoJo -> Part 1, entrée de la série
  406228: "754a46fa-62fa-457a-bc3b-4f31bf1373d4", // Kenshin le vagabond
  125931: "3be16cf9-fe5c-431e-b528-98551d3d3bb0", // Planetes
  172622: "16dc43f3-d6ba-4154-b445-a9d2e674c0eb", // L'Histoire des 3 Adolf
  272351: "c4994dc6-f2ee-4eb7-a00c-ebca63b35268", // Ghost in the Shell
  8325069: "e52d9403-3356-403b-b7bb-d7d6a420dd50", // Seven Deadly Sins
  24564: "44a5cbe1-0204-4cc7-a1ff-0fda2ac004b6", // YuYu Hakusho
  12494: "3a3cfc32-357e-4b50-a660-5ce4b58dfcbc", // Dragon Quest : La Quête de Daï
  421838: "3ee952f1-45c7-4c39-aea2-7df7676606d4", // Blue Exorcist (pas l'édition colorisée)
  11981102: "3dd0b814-23f4-4342-b75b-f206598534f6", // Sword Art Online -> Aincrad
  8355308: "5f20891f-0136-4fa8-afb7-d72f2af23c65", // Food Wars
  17470006: "8f8b7cb0-7109-46e8-b12c-0448a6453dfa", // Haikyu !!
  40421: "8a3e22a6-949a-4540-bfbf-559b8cae30f9", // Übel Blatt (pas la suite)
};

interface Listed {
  rank: number;
  productId: number;
  title: string;
  originalTitle: string | null;
  authors: string[];
}

interface MangaRelationship {
  id: string;
  type: string;
  attributes?: { fileName?: string; name?: string };
}

interface MangaRaw {
  id: string;
  attributes: {
    title: Record<string, string>;
    altTitles: Record<string, string>[];
    description: Record<string, string>;
    year: number | null;
    status: string;
    lastVolume: string | null;
    originalLanguage: string;
    tags: Array<{ id: string; attributes: { name: Record<string, string> } }>;
  };
  relationships: MangaRelationship[];
}

interface Entry {
  rank: number;
  scTitle: string;
  manga: MangaRaw;
  score: number;
}

// --- SensCritique -----------------------------------------------------------

// Le classement complet (100 entrées, dans l'ordre) est déjà dans le cache
// Apollo sérialisé de la page : pas besoin de pagination ni de rendu JS.
async function fetchList(): Promise<Listed[]> {
  const res = await fetch(LIST_URL, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${res.status} ${LIST_URL}`);
  const html = await res.text();
  const m = /<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s.exec(html);
  if (!m) throw new Error("__NEXT_DATA__ introuvable : la page a changé de structure.");

  const state = JSON.parse(m[1]).props.pageProps.__APOLLO_STATE__ as Record<
    string,
    Record<string, unknown>
  >;
  const pollRef = Object.entries(state.ROOT_QUERY).find(([k]) => k.startsWith("poll("))?.[1] as
    { __ref: string } | undefined;
  if (!pollRef) throw new Error("Classement introuvable dans le cache Apollo.");
  const refs = state[pollRef.__ref].minimalProducts as Array<{ __ref: string }>;

  return refs.map((ref, i) => {
    const p = state[ref.__ref] as {
      id: number;
      title: string;
      originalTitle: string | null;
      authors: Array<{ name: string }> | null;
    };
    return {
      rank: i + 1,
      productId: p.id,
      title: p.title,
      originalTitle: p.originalTitle,
      authors: (p.authors ?? []).map((a) => a.name),
    };
  });
}

// --- Correspondance MangaDex ------------------------------------------------

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// SensCritique indexe parfois un tome isolé ("Le Sommet des dieux, tome 1") :
// c'est bien l'oeuvre qui est classée, le suffixe fausse la recherche.
function stripVolume(title: string): string {
  return title.replace(/,?\s*(tome|vol\.?|volume)\s*\d+\s*$/i, "").trim();
}

// Distance de Levenshtein normalisée : tolère les variantes de translittération
// ("Hunter x Hunter" / "HUNTERxHUNTER") sans accepter deux titres différents.
function similarity(a: string, b: string): number {
  if (a === b) return 1;
  if (!a || !b) return 0;
  // Les titres MangaDex complètent souvent le titre courant par son sous-titre
  // ("Demon Slayer" / "Demon Slayer: Kimetsu no Yaiba"). Le préfixe compte
  // comme une quasi-égalité ; le départage par suiveurs écarte ensuite les
  // spin-offs qui commencent eux aussi par le titre de l'oeuvre.
  if (b.startsWith(`${a} `) || a.startsWith(`${b} `)) return 0.9;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = row;
  }
  return 1 - prev[b.length] / Math.max(a.length, b.length);
}

function mangaTitles(m: MangaRaw): string[] {
  const out = Object.values(m.attributes.title ?? {});
  for (const alt of m.attributes.altTitles ?? []) out.push(...Object.values(alt));
  return out.filter(Boolean).map(normalize);
}

function mangaAuthors(m: MangaRaw): string[] {
  return m.relationships
    .filter((r) => r.type === "author" || r.type === "artist")
    .map((r) => normalize(r.attributes?.name ?? ""))
    .filter(Boolean);
}

// Meilleur titre commun entre l'entrée SensCritique et un candidat MangaDex.
// L'auteur, quand il correspond, remonte un score juste sous le seuil (les
// titres français d'éditeur s'éloignent parfois beaucoup de l'original).
function score(listed: Listed, m: MangaRaw): number {
  const wanted = [stripVolume(listed.title), listed.originalTitle ?? ""]
    .map(normalize)
    .filter(Boolean);
  const titles = mangaTitles(m);
  let best = 0;
  for (const w of wanted) for (const t of titles) best = Math.max(best, similarity(w, t));

  const authors = mangaAuthors(m);
  const authorMatch = listed.authors.some((a) => {
    const n = normalize(a);
    // Les noms sont donnés dans un ordre variable ("Eiichiro Oda" / "Oda
    // Eiichiro") : la comparaison se fait sur l'ensemble des mots.
    const parts = n.split(" ").filter((p) => p.length > 2);
    return authors.some((b) => parts.every((p) => b.includes(p)));
  });
  return authorMatch ? Math.min(1, best + 0.12) : best;
}

async function mangadex<T>(path: string): Promise<T> {
  // MangaDex (derrière Cloudflare) répond 400 sans User-Agent, et applique un
  // rate limit à ~5 req/s : le script reste séquentiel avec une pause.
  const res = await fetch(`${MANGADEX}${path}`, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.json() as Promise<T>;
}

// Contrairement aux feeds de l'app, la recherche ne filtre pas sur le
// contentRating : plusieurs classiques du classement (Berserk, Ghost in the
// Shell, Übel Blatt) sont notés "erotica" sur MangaDex et seraient introuvables.
const COMMON = `limit=10&includes[]=cover_art&includes[]=author&includes[]=artist&excludedTags[]=${DOUJINSHI_TAG}`;

async function searchManga(query: string): Promise<MangaRaw[]> {
  const res = await mangadex<{ data: MangaRaw[] }>(
    `/manga?${COMMON}&title=${encodeURIComponent(query)}&order[relevance]=desc`,
  );
  return res.data;
}

async function byId(id: string): Promise<MangaRaw> {
  const res = await mangadex<{ data: MangaRaw }>(
    `/manga/${id}?includes[]=cover_art&includes[]=author&includes[]=artist`,
  );
  return res.data;
}

async function follows(ids: string[]): Promise<Record<string, number>> {
  const q = ids.map((id) => `manga[]=${id}`).join("&");
  const res = await mangadex<{ statistics: Record<string, { follows: number }> }>(
    `/statistics/manga?${q}`,
  );
  return Object.fromEntries(Object.entries(res.statistics).map(([k, v]) => [k, v.follows ?? 0]));
}

// Le titre seul ne suffit pas à départager : "Monster", "Parasite" ou
// "Rainbow" désignent plusieurs oeuvres sans rapport, et les rééditions
// colorisées portent le titre de l'originale. À score proche, l'oeuvre la plus
// suivie sur MangaDex est celle que le classement désigne.
const TIE_MARGIN = 0.2;

// Deux requêtes au plus par entrée : titre français puis titre original. La
// seconde n'est lancée que si la première ne donne rien de convaincant.
async function resolve(listed: Listed): Promise<{ manga: MangaRaw | null; score: number }> {
  const queries = [stripVolume(listed.title)];
  if (listed.originalTitle && normalize(listed.originalTitle) !== normalize(listed.title)) {
    queries.push(listed.originalTitle);
  }

  const scored = new Map<string, { manga: MangaRaw; score: number }>();
  for (const q of queries) {
    const candidates = await searchManga(q).catch(() => []);
    await sleep(220);
    for (const c of candidates) {
      const s = score(listed, c);
      if (s > (scored.get(c.id)?.score ?? 0)) scored.set(c.id, { manga: c, score: s });
    }
  }
  if (scored.size === 0) return { manga: null, score: 0 };

  const all = [...scored.values()].sort((a, b) => b.score - a.score);
  const top = all.filter((c) => c.score >= all[0].score - TIE_MARGIN);
  if (top.length === 1) return top[0];

  const counts = await follows(top.map((c) => c.manga.id)).catch(() => ({}));
  await sleep(220);
  const winner = top.reduce((a, b) =>
    (counts[b.manga.id] ?? 0) > (counts[a.manga.id] ?? 0) ? b : a,
  );
  // Le score rendu reste celui du meilleur titre : c'est lui qui décide de la
  // mise en revue manuelle, le nombre de suiveurs n'a fait que départager.
  return { manga: winner.manga, score: all[0].score };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// --- Rendu ------------------------------------------------------------------

function render(entries: Entry[]): string {
  const rows = entries
    .map((e) => {
      const a = e.manga.attributes;
      const cover = e.manga.relationships.find((r) => r.type === "cover_art")?.attributes?.fileName;
      // Le snapshot ne garde que les champs consommés par mapManga : le reste
      // (chapitres, liens, démographie) pèserait sans rien apporter à la grille.
      const raw = {
        id: e.manga.id,
        attributes: {
          title: a.title,
          altTitles: a.altTitles.map(pickLangs).filter((t) => Object.keys(t).length > 0),
          description: pickDescription(a.description),
          year: a.year,
          status: a.status,
          lastVolume: a.lastVolume,
          originalLanguage: a.originalLanguage,
          tags: a.tags.map((t) => ({
            id: t.id,
            attributes: { name: pickLangs(t.attributes.name) },
          })),
        },
        relationships: cover
          ? [{ id: "", type: "cover_art", attributes: { fileName: cover } }]
          : [],
      };
      return `  { rank: ${e.rank}, manga: ${JSON.stringify(raw)} },`;
    })
    .join("\n");

  return `// Généré le ${new Date().toISOString().slice(0, 10)} par scripts/fetchSensCritiqueTop.ts
// Source : ${LIST_URL} (classement "Les meilleurs mangas" des membres SensCritique).
// Ne pas éditer à la main : relancer le script pour rafraîchir le classement.
import type { MangaRaw } from "@/lib/services/mangadex";

export interface SensCritiqueEntry {
  /** Position dans le classement SensCritique, 1 = meilleur. */
  rank: number;
  /** Fiche MangaDex correspondante, figée au format brut de l'API. */
  manga: MangaRaw;
}

export const SENSCRITIQUE_TOP: SensCritiqueEntry[] = [
${rows}
];
`;
}

// MangaDex renvoie titres alternatifs et tags dans des dizaines de langues :
// mapManga n'en lit que quatre, le reste triplerait le poids du bundle.
const KEPT_LANGS = ["fr", "en", "ja-ro", "ja"];

function pickLangs(map: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    KEPT_LANGS.filter((l) => map?.[l]?.trim()).map((l) => [l, map[l].trim()]),
  );
}

// Une seule langue suffit à l'affichage (mapManga lit fr puis en) et les
// descriptions MangaDex existent dans une dizaine de langues.
function pickDescription(d: Record<string, string>): Record<string, string> {
  const fr = d?.fr?.trim();
  const en = d?.en?.trim();
  return fr ? { fr } : en ? { en } : {};
}

// --- Entrée -----------------------------------------------------------------

async function main() {
  console.log("Classement SensCritique...");
  const listed = await fetchList();
  console.log(`  ${listed.length} mangas`);

  console.log("Correspondances MangaDex...");
  const entries: Entry[] = [];
  const doubtful: string[] = [];
  const dropped: string[] = [];
  const seen = new Set<string>();

  for (const l of listed) {
    let manga: MangaRaw | null = null;
    let s = 1;

    if (l.productId in OVERRIDES) {
      const id = OVERRIDES[l.productId];
      if (id === null) {
        dropped.push(`${l.rank}. ${l.title} (exclu manuellement)`);
        continue;
      }
      manga = await byId(id);
      await sleep(220);
    } else {
      const found = await resolve(l);
      manga = found.manga;
      s = found.score;
    }

    if (!manga || s < MATCH_MIN) {
      const title = manga ? Object.values(manga.attributes.title)[0] : "aucun candidat";
      doubtful.push(`${l.rank}. ${l.title} [${l.productId}] -> ${title} (${s.toFixed(2)})`);
      continue;
    }
    // Deux entrées SensCritique peuvent viser la même oeuvre MangaDex (séries
    // et rééditions) : la mieux classée gagne.
    if (seen.has(manga.id)) {
      dropped.push(`${l.rank}. ${l.title} (doublon MangaDex)`);
      continue;
    }
    seen.add(manga.id);
    entries.push({ rank: entries.length + 1, scTitle: l.title, manga, score: s });
    console.log(`  ${l.rank}. ${l.title} -> ${Object.values(manga.attributes.title)[0]}`);
  }

  writeFileSync(OUT, render(entries));
  console.log(`\n${entries.length} entrées écrites dans ${OUT}`);

  if (doubtful.length) {
    console.log(`\n${doubtful.length} correspondances à revoir (à traiter via OVERRIDES) :`);
    for (const d of doubtful) console.log(`  ${d}`);
  }
  if (dropped.length) {
    console.log(`\n${dropped.length} entrées écartées :`);
    for (const d of dropped) console.log(`  ${d}`);
  }

  // Le classement ne contient que des mangas japonais, à une exception près
  // (Dreamland, français). Toute autre langue d'origine signale une homonymie
  // attrapée par erreur (manhwa ou manhua portant le même titre traduit).
  const foreign = entries.filter((e) => e.manga.attributes.originalLanguage !== "ja");
  if (foreign.length) {
    console.log(`\n${foreign.length} entrées non japonaises (homonymie probable) :`);
    for (const e of foreign) {
      const a = e.manga.attributes;
      console.log(`  ${e.scTitle} -> ${Object.values(a.title)[0]} (${a.originalLanguage})`);
    }
  }
}

await main();
