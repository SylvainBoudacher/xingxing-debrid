import { useEffect, useRef, useState } from "react";
import { FlaskConical } from "lucide-react";
import { DEV_SCENARIOS } from "./devScenarios";
import { endHealthSimulation, simulateHealth } from "@/lib/serviceHealth";

// Dev uniquement : force une panne pour voir le label et la page de statut.
export function StatusDevMenu() {
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

  const item =
    "block w-full px-3 py-1.5 text-left text-xs hover:bg-black/5 dark:hover:bg-white/10 transition-colors";

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
        <div className="absolute right-0 top-full z-10 mt-1 w-64 overflow-hidden rounded-lg bg-white dark:bg-zinc-800 py-1 shadow-xl ring-1 ring-black/10 dark:ring-white/10">
          <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Simuler une panne
          </p>
          {DEV_SCENARIOS.map((s) => (
            <button
              key={s.label}
              onClick={() => {
                simulateHealth(s.sim);
                setOpen(false);
              }}
              className={`${item} text-zinc-700 dark:text-zinc-200`}
            >
              {s.label}
            </button>
          ))}
          <div className="my-1 h-px bg-black/10 dark:bg-white/10" />
          <button
            onClick={() => {
              void endHealthSimulation();
              setOpen(false);
            }}
            className={`${item} text-emerald-600 dark:text-emerald-400`}
          >
            Retour à l'état réel
          </button>
        </div>
      )}
    </div>
  );
}
