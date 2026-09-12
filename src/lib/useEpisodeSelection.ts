import { useCallback, useState } from "react";

// Sélection multiple d'épisodes (par lien) pour télécharger ou supprimer en
// lot. Quand fournie, les lignes affichent une case de sélection au lieu de la
// case « vu » et masquent leurs actions.
export interface EpisodeSelection {
  has: (link: string) => boolean;
  toggle: (link: string) => void;
  setMany: (links: string[], selected: boolean) => void;
}

export function useEpisodeSelection() {
  const [active, setActive] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const selection: EpisodeSelection = {
    has: (link) => selected.has(link),
    toggle: (link) =>
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(link)) next.delete(link);
        else next.add(link);
        return next;
      }),
    setMany: (links, on) =>
      setSelected((prev) => {
        const next = new Set(prev);
        links.forEach((l) => (on ? next.add(l) : next.delete(l)));
        return next;
      }),
  };

  const start = useCallback(() => setActive(true), []);
  const exit = useCallback(() => {
    setActive(false);
    setSelected(new Set());
  }, []);

  return { active, selected, selection, start, exit };
}
