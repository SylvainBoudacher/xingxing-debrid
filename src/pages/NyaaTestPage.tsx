import { useState, type ReactNode } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { searchNyaa, nyaaSearchUrl, nyaaKeys, type NyaaResult } from "@/lib/services/nyaa";
import {
  parseRelease,
  QUALITY_RE,
  CODEC_RE,
  LANG_RE,
  type ParsedRelease,
} from "@/lib/parseRelease";

interface NyaaTestPageProps {
  onBack: () => void;
}

type Enriched = NyaaResult & { parsed: ParsedRelease };

const ANY = "";
const QUALITIES = ["2160p", "1080p", "720p", "480p"];
const CODECS = ["x265", "x264", "hevc", "av1"];
const LANGUAGES = ["vostfr", "vost", "multi", "truefrench", "french", "vf"];

// Bord blanc : sans ca les controles sont invisibles sur fond sombre.
const CTRL = { border: "1px solid #fff", borderRadius: 4, padding: "2px 6px" };

const QUALITY_COLOR = "#16a34a";
const CODEC_COLOR = "#c026d3";
const LANG_COLOR = "#2563eb";
const qualityTest = new RegExp(QUALITY_RE.source, "i");
const codecTest = new RegExp(CODEC_RE.source, "i");
const tokenRe = new RegExp(`${QUALITY_RE.source}|${CODEC_RE.source}|${LANG_RE.source}`, "gi");

// Surligne dans le nom du torrent : qualite (vert), codec (magenta), langue (bleu).
function tokenColor(tok: string): string {
  if (qualityTest.test(tok)) return QUALITY_COLOR;
  if (codecTest.test(tok)) return CODEC_COLOR;
  return LANG_COLOR;
}

function highlightTitle(title: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of title.matchAll(tokenRe)) {
    const start = m.index ?? 0;
    if (start > last) out.push(title.slice(last, start));
    out.push(
      <span key={start} style={{ color: tokenColor(m[0]), fontWeight: 700 }}>
        {m[0]}
      </span>,
    );
    last = start + m[0].length;
  }
  if (last < title.length) out.push(title.slice(last));
  return out;
}

// Les filtres sont pousses dans la requete q (nyaa fait un ET sur les tokens du
// titre, cote serveur), donc ils s'appliquent a TOUTES les pages, pas juste a
// celle affichee. Limite : matching litteral (x265 != hevc dans le titre).
function buildQuery(term: string, team: string, quality: string, codec: string, language: string) {
  return [term, team, quality, codec, language]
    .map((t) => t.trim())
    .filter(Boolean)
    .join(" ");
}

function uniq(values: (string | null)[]): string[] {
  return [...new Set(values.filter((v): v is string => !!v))].sort();
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label style={{ marginRight: 12 }}>
      {label}:{" "}
      <select value={value} onChange={(e) => onChange(e.target.value)} style={CTRL}>
        <option value={ANY}>tous</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

export function NyaaTestPage({ onBack }: NyaaTestPageProps) {
  const [term, setTerm] = useState("");
  const [team, setTeam] = useState("");
  const [quality, setQuality] = useState(ANY);
  const [codec, setCodec] = useState(ANY);
  const [language, setLanguage] = useState(ANY);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");

  // Ligne 2 : filtres appliques aux resultats deja recus (client-side).
  const [fTeam, setFTeam] = useState(ANY);
  const [fQuality, setFQuality] = useState(ANY);
  const [fCodec, setFCodec] = useState(ANY);
  const [fLanguage, setFLanguage] = useState(ANY);

  function resetResultFilters() {
    setFTeam(ANY);
    setFQuality(ANY);
    setFCodec(ANY);
    setFLanguage(ANY);
  }

  function runSearch() {
    setQuery(buildQuery(term, team, quality, codec, language));
    setPage(1);
    resetResultFilters();
  }

  const { data, isFetching, error } = useQuery({
    queryKey: nyaaKeys.search({ query, page }),
    queryFn: () => searchNyaa({ query, page }),
    enabled: query.length > 0,
    placeholderData: keepPreviousData,
  });

  const enriched: Enriched[] = data?.map((r) => ({ ...r, parsed: parseRelease(r.title) })) ?? [];
  // Une page nyaa = 75 items. Une page pleine sous-entend qu'il y en a d'autres.
  const hasNext = enriched.length >= 75;
  // Teams reperees dans les resultats affiches : suggestions pour le champ team
  // (le filtre reste libre et part dans la requete, mais l'utilisateur peut piocher).
  const teamSuggestions = uniq(enriched.map((e) => e.parsed.team));

  const resultOptions = {
    team: teamSuggestions,
    quality: uniq(enriched.map((e) => e.parsed.quality)),
    codec: uniq(enriched.map((e) => e.parsed.codec)),
    language: uniq(enriched.map((e) => e.parsed.language)),
  };

  const filtered = enriched.filter(
    (e) =>
      (fTeam === ANY || e.parsed.team === fTeam) &&
      (fQuality === ANY || e.parsed.quality === fQuality) &&
      (fCodec === ANY || e.parsed.codec === fCodec) &&
      (fLanguage === ANY || e.parsed.language === fLanguage),
  );

  return (
    <div style={{ padding: 16, fontFamily: "monospace", fontSize: 13 }}>
      <button onClick={onBack} style={CTRL}>
        ← retour
      </button>
      <h1>Test nyaa.si</h1>

      {query && (
        <p style={{ wordBreak: "break-all", opacity: 0.6 }}>
          request: <code>{nyaaSearchUrl({ query, page })}</code>
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          runSearch();
        }}
      >
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="rechercher..."
          style={{ ...CTRL, width: 300, marginRight: 8 }}
        />
        <div style={{ margin: "12px 0" }}>
          <strong style={{ marginRight: 12 }}>pré-request (URL):</strong>
          <label style={{ marginRight: 12 }}>
            team:{" "}
            <input
              list="nyaa-teams"
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              placeholder="ex. Xspitfire911"
              style={CTRL}
            />
            <datalist id="nyaa-teams">
              {teamSuggestions.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </label>
          <Select label="qualité" value={quality} options={QUALITIES} onChange={setQuality} />
          <Select label="codec" value={codec} options={CODECS} onChange={setCodec} />
          <Select label="langue" value={language} options={LANGUAGES} onChange={setLanguage} />
        </div>
        <button type="submit" style={CTRL}>
          chercher
        </button>
      </form>

      {isFetching && <p>chargement...</p>}
      {error && <p style={{ color: "red" }}>{String(error)}</p>}

      {enriched.length > 0 && (
        <div style={{ margin: "8px 0" }}>
          <hr style={{ border: "none", borderTop: "2px dashed #999", margin: "12px 0" }} />
          <strong style={{ marginRight: 12 }}>filtre résultats:</strong>
          <Select label="team" value={fTeam} options={resultOptions.team} onChange={setFTeam} />
          <Select
            label="qualité"
            value={fQuality}
            options={resultOptions.quality}
            onChange={setFQuality}
          />
          <Select label="codec" value={fCodec} options={resultOptions.codec} onChange={setFCodec} />
          <Select
            label="langue"
            value={fLanguage}
            options={resultOptions.language}
            onChange={setFLanguage}
          />
        </div>
      )}

      {data && (
        <div style={{ margin: "8px 0" }}>
          <hr style={{ border: "none", borderTop: "2px dashed #999", margin: "12px 0" }} />
          <button
            disabled={page <= 1 || isFetching}
            onClick={() => setPage((p) => p - 1)}
            style={CTRL}
          >
            ← page préc.
          </button>{" "}
          page {page}{" "}
          <button
            disabled={!hasNext || isFetching}
            onClick={() => setPage((p) => p + 1)}
            style={CTRL}
          >
            page suiv. →
          </button>{" "}
          <span style={{ opacity: 0.6 }}>
            ({filtered.length} / {enriched.length} sur cette page)
          </span>
        </div>
      )}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {filtered.map((r) => (
          <li key={r.infoHash} style={{ borderBottom: "1px solid #ccc", padding: "8px 0" }}>
            <div>
              <strong>{highlightTitle(r.title)}</strong>
            </div>
            <div>
              [team: {r.parsed.team ?? "?"}] [qualité: {r.parsed.quality ?? "?"}] [codec:{" "}
              {r.parsed.codec ?? "?"}] [langue: {r.parsed.language ?? "?"}]
            </div>
            <div>
              {r.category} | {r.size} | S:{r.seeders} L:{r.leechers} DL:{r.downloads}
            </div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>
              <a href={r.magnet}>magnet</a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
