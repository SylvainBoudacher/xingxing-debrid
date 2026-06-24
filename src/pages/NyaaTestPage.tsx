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
import { ANY, CODECS, LANGUAGES, QUALITIES, buildNyaaQuery } from "@/lib/nyaaFilters";

interface NyaaTestPageProps {
  onBack: () => void;
}

type Enriched = NyaaResult & { parsed: ParsedRelease };

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
  const [query, setQuery] = useState("");

  function runSearch() {
    setQuery(buildNyaaQuery(term, team, quality, codec, language));
  }

  const { data, isFetching, error } = useQuery({
    queryKey: nyaaKeys.search({ query }),
    queryFn: () => searchNyaa({ query }),
    enabled: query.length > 0,
    placeholderData: keepPreviousData,
  });

  const enriched: Enriched[] = data?.map((r) => ({ ...r, parsed: parseRelease(r.title) })) ?? [];
  // Teams reperees dans les resultats affiches : suggestions pour le champ team
  // (le filtre reste libre et part dans la requete, mais l'utilisateur peut piocher).
  const teamSuggestions = uniq(enriched.map((e) => e.parsed.team));

  return (
    <div style={{ padding: 16, fontFamily: "monospace", fontSize: 13 }}>
      <button onClick={onBack} style={CTRL}>
        ← retour
      </button>
      <h1>Test nyaa.si</h1>

      {query && (
        <p style={{ wordBreak: "break-all", opacity: 0.6 }}>
          request: <code>{nyaaSearchUrl({ query })}</code>
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
              onChange={(e) => {
                setTeam(e.target.value);
                setQuery(buildNyaaQuery(term, e.target.value, quality, codec, language));
              }}
              placeholder="ex. Xspitfire911"
              style={CTRL}
            />
            <datalist id="nyaa-teams">
              {teamSuggestions.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </label>
          <Select
            label="qualité"
            value={quality}
            options={QUALITIES}
            onChange={(v) => {
              setQuality(v);
              setQuery(buildNyaaQuery(term, team, v, codec, language));
            }}
          />
          <Select
            label="codec"
            value={codec}
            options={CODECS}
            onChange={(v) => {
              setCodec(v);
              setQuery(buildNyaaQuery(term, team, quality, v, language));
            }}
          />
          <Select
            label="langue"
            value={language}
            options={LANGUAGES}
            onChange={(v) => {
              setLanguage(v);
              setQuery(buildNyaaQuery(term, team, quality, codec, v));
            }}
          />
        </div>
        <button type="submit" style={CTRL}>
          chercher
        </button>
      </form>

      {isFetching && <p>chargement...</p>}
      {error && <p style={{ color: "red" }}>{String(error)}</p>}

      {data && <div style={{ margin: "8px 0", opacity: 0.6 }}>{enriched.length} résultats</div>}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {enriched.map((r) => (
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
