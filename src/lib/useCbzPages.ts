import { isCbzError, listCbzPages, loadCbzPage, type CbzError } from "@/lib/cbz";
import { useEffect, useMemo, useRef, useState } from "react";

// Pages gardees en memoire de part et d'autre de la page courante. Une page de
// scan pese quelques Mo une fois decompressee : au-dela, l'onglet enfle pour
// rien.
const KEEP_BEFORE = 2;
const KEEP_AFTER = 4;

const NO_NAMES: string[] = [];

export interface CbzPagesState {
  names: string[];
  total: number;
  /** URLs blob pretes, indexees par numero de page (0-based). */
  urls: Record<number, string>;
  listing: boolean;
  error: CbzError | null;
}

interface Listing {
  path: string;
  names: string[];
  error: CbzError | null;
}

/**
 * Charge la liste des pages d'un CBZ, puis la fenetre de pages autour de
 * `index` (celles affichees et les suivantes). Les URLs blob sortant de la
 * fenetre sont revoquees.
 */
export function useCbzPages(path: string | null, index: number, visible: number): CbzPagesState {
  const [listed, setListed] = useState<Listing | null>(null);
  const [urls, setUrls] = useState<Record<number, string>>({});

  // Sources de verite hors rendu : evitent qu'un double rendu relance un
  // chargement en cours ou revoque une URL encore affichee.
  const cache = useRef(new Map<number, string>());
  const pending = useRef(new Set<number>());
  const window_ = useRef<Set<number>>(new Set());

  // Tant que la liste ne correspond pas au fichier demande, on n'expose rien :
  // les pages du tome precedent ne doivent jamais s'afficher.
  const ready = !!path && listed?.path === path;
  const names = ready ? listed.names : NO_NAMES;
  const error = ready ? listed.error : null;

  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    listCbzPages(path)
      .then((list) => {
        if (!cancelled) setListed({ path, names: list, error: null });
      })
      .catch((err) => {
        if (!cancelled) setListed({ path, names: [], error: toCbzError(err) });
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  // Changement de fichier et demontage : les blobs survivraient sinon.
  useEffect(() => {
    const loaded = cache.current;
    const inFlight = pending.current;
    return () => {
      for (const url of loaded.values()) URL.revokeObjectURL(url);
      loaded.clear();
      inFlight.clear();
    };
  }, [path]);

  const wanted = useMemo(() => {
    if (names.length === 0) return NO_PAGES;
    const from = Math.max(0, index - KEEP_BEFORE);
    const to = Math.min(names.length - 1, index + visible - 1 + KEEP_AFTER);
    return Array.from({ length: to - from + 1 }, (_, i) => from + i);
  }, [names.length, index, visible]);

  useEffect(() => {
    window_.current = new Set(wanted);
    if (!path || names.length === 0) return;
    let cancelled = false;
    const loaded = cache.current;
    const inFlight = pending.current;

    const prune = () => {
      for (const [page, url] of loaded) {
        if (window_.current.has(page)) continue;
        URL.revokeObjectURL(url);
        loaded.delete(page);
      }
    };

    // Les pages affichees d'abord : le lecteur ne doit pas attendre le
    // prechargement pour montrer la page courante.
    const ordered = [...wanted].sort((a, b) => Math.abs(a - index) - Math.abs(b - index));
    for (const page of ordered) {
      if (loaded.has(page) || inFlight.has(page)) continue;
      inFlight.add(page);
      loadCbzPage(path, page, names[page])
        .then((url) => {
          inFlight.delete(page);
          if (cancelled || !window_.current.has(page)) {
            URL.revokeObjectURL(url);
            return;
          }
          loaded.set(page, url);
          prune();
          setUrls(Object.fromEntries(loaded));
        })
        .catch((err) => {
          inFlight.delete(page);
          // Une page illisible n'interrompt pas la lecture : le canvas garde
          // son place-tenant et la navigation continue. Seule la page courante
          // remonte l'erreur.
          if (!cancelled && page === index && path) {
            setListed({ path, names, error: toCbzError(err) });
          }
        });
    }

    return () => {
      cancelled = true;
    };
  }, [path, names, wanted, index]);

  return { names, total: names.length, urls, listing: !!path && !ready, error };
}

const NO_PAGES: number[] = [];

function toCbzError(err: unknown): CbzError {
  return isCbzError(err) ? err : { kind: "readFailed", message: String(err) };
}
