import type { LibraryEntry } from "@/lib/library";
import { parseCardKey, resolveTitleSubject } from "@/lib/libraryTitle";
import { preloadTitle, warmTitle } from "@/lib/preloadTitle";
import { useCallback, useMemo, useRef, useState, type PointerEvent } from "react";

// Pointeur posé au moins ce temps sur une carte : le préchargement démarre.
// Les simples passages de la souris sont ignorés.
const HOVER_PREFETCH_MS = 120;

// Ouverture et fermeture de la fiche plein écran : préchargement (au survol,
// puis au clic) et apparition du contenu une fois prêt.
export function useTitleTransition(entries: LibraryEntry[], tmdbKey: string | undefined) {
  const [expandedHash, setExpandedHash] = useState<string | null>(null);
  const [expandedGroupId, setExpandedGroupId] = useState<number | null>(null);
  // Données et images de la fiche chargées (ou délai dépassé) : le contenu
  // apparaît.
  const [ready, setReady] = useState(true);
  // Fiche résolue sur toute la bibliothèque : un filtre ne la ferme pas en
  // cours de route.
  const subject = useMemo(
    () => resolveTitleSubject(entries, expandedHash, expandedGroupId),
    [entries, expandedHash, expandedGroupId],
  );
  // Seule la dernière ouverture ou fermeture l'emporte.
  const seq = useRef(0);

  const open = useCallback(
    (hash: string | null, groupId: number | null) => {
      const id = ++seq.current;
      setExpandedHash(hash);
      setExpandedGroupId(groupId);
      const target = resolveTitleSubject(entries, hash, groupId);
      setReady(!target);
      if (!target) return;
      void preloadTitle(target, tmdbKey).then(() => {
        if (id === seq.current) setReady(true);
      });
    },
    [entries, tmdbKey],
  );

  const close = useCallback(() => {
    seq.current++;
    setReady(true);
    setExpandedHash(null);
    setExpandedGroupId(null);
  }, []);

  const hoverKey = useRef<string | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const hover = useCallback(
    (key: string | null) => {
      if (key === hoverKey.current) return;
      hoverKey.current = key;
      clearTimeout(hoverTimer.current);
      if (!key) return;
      hoverTimer.current = setTimeout(() => {
        const { hash, groupId } = parseCardKey(key);
        const target = resolveTitleSubject(entries, hash, groupId);
        if (target) void warmTitle(target, tmdbKey);
      }, HOVER_PREFETCH_MS);
    },
    [entries, tmdbKey],
  );
  // Délégué au conteneur des cartes : chacune porte son data-title-key.
  const hoverProps = {
    onPointerOver: (e: PointerEvent) =>
      hover(
        (e.target as Element).closest<HTMLElement>("[data-title-key]")?.dataset.titleKey ?? null,
      ),
    onPointerLeave: () => hover(null),
  };

  return {
    subject,
    expandedHash,
    expandedGroupId,
    setExpandedGroupId,
    ready,
    open,
    close,
    hoverProps,
  };
}
