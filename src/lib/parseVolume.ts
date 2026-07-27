// Analyse des noms de releases manga C411 et des noms de fichiers qu'elles
// contiennent. Formats observes sur le tracker :
//   One.Piece.[T01.T105].1997.2025.FR.[CBZ]-CHROMATIQUE
//   One.Piece.Tome.[1 à 100].3.HS.Eichiro.Oda.FR.[CBZ]-[PRiNTER.PapriKa+]
//   Jujutsu.Kaisen.T30.Akutami.FR.[CBZ]-thor1295
//   Berserk.Kentaro.Miura.[1 à 41].FR.[CBZ]-PRiNTER-Paprika+
//   L'Attaque.des.Titans.(et.series.derivees).[COLLECTION_INTEGRALE].FR.[CBZ]-NoTAG
//   Naruto.[INTEGRALE].+Gaiden.[CBZ].FR-NOTAG

export type VolumeSpan =
  | { kind: "single"; number: number }
  | { kind: "range"; from: number; to: number }
  | { kind: "complete" };

export type ReleaseFormat = "CBZ" | "CBR" | "PDF" | "EPUB";

export interface ParsedManga {
  /** Texte precedant le marqueur de tome. Indicatif : peut inclure l'auteur. */
  seriesTitle: string;
  /** null quand aucun marqueur exploitable n'est trouve. */
  span: VolumeSpan | null;
  format: ReleaseFormat | null;
}

// Les points et underscores servent de separateurs dans les noms de releases.
function flatten(name: string): string {
  return name.replace(/[._]+/g, " ").replace(/\s+/g, " ").trim();
}

const COMPLETE_RE = /\b(?:collection[ _]?)?(?:integrale?|intégrale?|complete?|complet)\b/i;

const SINGLE_RE = /\b(?:t|tome|vol|volume|v)\s*[.:-]?\s*(\d{1,3})\b/i;

const FORMAT_RE = /\b(cbz|cbr|epub|pdf)\b/i;

// Bornes a trois chiffres au plus : une plage d'annees ("1997 2025") ne peut
// pas etre lue comme une plage de tomes.
//
// Deux formes acceptees, car flatten() a deja remplace les points par des
// espaces : les deux bornes portent un marqueur ("T01 T105", separateur
// facultatif), ou des crochets encadrent une plage a separateur explicite
// ("[1 à 100]"). "Berserk 1 41" sans marqueur ni crochets reste ambigu et
// n'est volontairement pas reconnu.
const MARKED_RANGE_RE =
  /\b(?:t|tomes?|vol|volumes?)\s*(\d{1,3})\s*(?:à|a|au|to|et|[-–—])?\s*(?:t|tomes?|vol|volumes?)\s*(\d{1,3})\b/i;
const BRACKET_RANGE_RE =
  /\[\s*(?:t|tomes?|vol|volumes?)?\s*(\d{1,3})\s*(?:à|a|au|to|et|[-–—])\s*(?:t|tomes?|vol|volumes?)?\s*(\d{1,3})\s*\]/i;

function rangeMatch(flat: string): { match: RegExpMatchArray; from: number; to: number } | null {
  const match = flat.match(BRACKET_RANGE_RE) ?? flat.match(MARKED_RANGE_RE);
  if (!match) return null;
  const from = Number(match[1]);
  const to = Number(match[2]);
  if (to <= from) return null;
  return { match, from, to };
}

export function parseMangaName(name: string): ParsedManga {
  const flat = flatten(name);
  const format = (flat.match(FORMAT_RE)?.[1].toUpperCase() as ReleaseFormat | undefined) ?? null;

  const complete = flat.match(COMPLETE_RE);
  if (complete) {
    return {
      seriesTitle: cleanTitle(flat.slice(0, complete.index)),
      span: { kind: "complete" },
      format,
    };
  }

  const range = rangeMatch(flat);
  if (range) {
    return {
      seriesTitle: cleanTitle(flat.slice(0, range.match.index)),
      span: { kind: "range", from: range.from, to: range.to },
      format,
    };
  }

  const single = flat.match(SINGLE_RE);
  if (single) {
    return {
      seriesTitle: cleanTitle(flat.slice(0, single.index)),
      span: { kind: "single", number: Number(single[1]) },
      format,
    };
  }

  return { seriesTitle: cleanTitle(flat), span: null, format };
}

// Retire la ponctuation de bord laissee par la coupe, ainsi qu'un marqueur de
// tome orphelin ("One Piece Tome" quand la plage suivait le mot).
function cleanTitle(s: string): string {
  return s
    .replace(/[[\]()+\-–—.,:;]+$/g, "")
    .replace(/^[[\]()+\-–—.,:;]+/g, "")
    .replace(/\s+(?:t|tomes?|vol|volumes?)\s*$/i, "")
    .trim();
}

/**
 * Numero de tome d'un fichier contenu dans une release ("One Piece - Tome 03.cbz").
 * Ces noms sont plus reguliers que les noms de torrents : un seul tome par
 * fichier, donc seul le cas "single" a du sens.
 */
export function volumeFromFileName(fileName: string): number | null {
  // Les fichiers AllDebrid arrivent prefixes de leur dossier, dont le nom de
  // torrent peut contenir une plage ("(T1 T18)") : seul le nom propre compte.
  const baseName = fileName.slice(fileName.lastIndexOf("/") + 1);
  const withoutExt = baseName.replace(/\.[a-z0-9]{2,5}$/i, "");
  const flat = flatten(withoutExt);
  const marked = flat.match(SINGLE_RE);
  if (marked) return Number(marked[1]);
  // Dernier recours : un nombre isole en fin de nom ("Berserk - 42").
  const trailing = flat.match(/(?:^|\s|[-–—])(\d{1,3})\s*$/);
  return trailing ? Number(trailing[1]) : null;
}

export function spanLabel(span: VolumeSpan | null): string {
  if (!span) return "Tome inconnu";
  if (span.kind === "complete") return "Intégrale";
  if (span.kind === "range") return `Tomes ${span.from} à ${span.to}`;
  return `Tome ${span.number}`;
}

/** Nombre de tomes annonce par une release, pour trier les candidats. */
export function spanSize(span: VolumeSpan | null): number {
  if (!span) return 0;
  if (span.kind === "complete") return Number.MAX_SAFE_INTEGER;
  if (span.kind === "range") return span.to - span.from + 1;
  return 1;
}

/** Premier tome couvert par une release, pour trier les resultats dans l'ordre des tomes. */
export function spanStart(span: VolumeSpan | null): number {
  if (!span) return Number.MAX_SAFE_INTEGER;
  if (span.kind === "complete") return 0;
  if (span.kind === "range") return span.from;
  return span.number;
}
