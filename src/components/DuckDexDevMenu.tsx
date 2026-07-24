import { useEffect, useRef, useState } from "react";
import { FlaskConical } from "lucide-react";
import type { Rarity } from "./duckRandom";

// Outils de triche du Canardex, réservés au mode dev: un seul menu plutôt qu'une
// rangée de boutons qui déborde de l'en-tête. Menu maison plutôt que Radix: le
// popper de Radix est portalisé en z-50 et passerait sous la modale (z-70).

interface DevAction {
  label: string;
  run: () => void;
  danger?: boolean;
}

export function DuckDexDevMenu({
  onCompleteDex,
  onCompleteShiny,
  onCompleteFamilies,
  onReset,
}: {
  onCompleteDex: () => void;
  onCompleteShiny: () => void;
  onCompleteFamilies: (rarity: Rarity, count: number) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const groups: Array<{ title: string; actions: DevAction[] }> = [
    {
      title: "Espèces",
      actions: [
        { label: "Découvrir toutes les espèces", run: onCompleteDex },
        { label: "Collectionner tous les shiny", run: onCompleteShiny },
      ],
    },
    {
      title: "Familles de couleurs",
      actions: [
        { label: "5 familles communes", run: () => onCompleteFamilies("common", 5) },
        { label: "5 familles peu communes", run: () => onCompleteFamilies("uncommon", 5) },
        { label: "5 familles rares", run: () => onCompleteFamilies("rare", 5) },
      ],
    },
    {
      title: "Remise à zéro",
      actions: [{ label: "Tout réinitialiser", run: onReset, danger: true }],
    },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 transition-colors"
      >
        <FlaskConical className="h-3 w-3" />
        DEV
      </button>
      {open && (
        <div className="absolute right-0 top-full z-10 mt-1 w-56 overflow-hidden rounded-lg bg-white dark:bg-zinc-800 py-1 shadow-xl ring-1 ring-black/10 dark:ring-white/10">
          {groups.map((g, i) => (
            <div key={g.title}>
              {i > 0 && <div className="my-1 h-px bg-black/10 dark:bg-white/10" />}
              <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                {g.title}
              </p>
              {g.actions.map((a) => (
                <button
                  key={a.label}
                  onClick={() => {
                    a.run();
                    setOpen(false);
                  }}
                  className={`block w-full px-3 py-1.5 text-left text-xs hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${a.danger ? "text-red-600 dark:text-red-400" : "text-zinc-700 dark:text-zinc-200"}`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
