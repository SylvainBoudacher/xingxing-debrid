import { useEffect, useRef, useState } from "react";
import { FlaskConical } from "lucide-react";
import type { SlotPrize } from "@/game/slots";
import { PRIZE_LABEL } from "./slotCopy";

// Outils de triche du bandit manchot, réservés au mode dev: attendre 4h entre
// deux tirages, ou 200 tirages pour voir un jackpot, n'est pas testable.
// Menu maison plutôt que Radix, pour les mêmes raisons que DuckDexDevMenu.

const FORCED: SlotPrize[] = ["jackpot", "king", "legendary", "rare", "uncommon", "none"];

export function SlotDevMenu({
  onForce,
  onResetCooldown,
  onResetJackpot,
}: {
  onForce: (prize: SlotPrize) => void;
  onResetCooldown: () => void;
  onResetJackpot: () => void;
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

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-1 text-[10px] font-semibold text-amber-400 hover:bg-amber-500/25 transition-colors"
      >
        <FlaskConical className="h-3 w-3" />
        DEV
      </button>
      {open && (
        <div className="absolute right-0 top-full z-10 mt-1 w-56 overflow-hidden rounded-lg bg-zinc-800 py-1 shadow-xl ring-1 ring-white/10">
          <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Forcer un lot
          </p>
          {FORCED.map((prize) => (
            <button
              key={prize}
              onClick={() => {
                onForce(prize);
                setOpen(false);
              }}
              className="block w-full px-3 py-1.5 text-left text-xs text-zinc-200 hover:bg-white/10 transition-colors"
            >
              {PRIZE_LABEL[prize]}
            </button>
          ))}
          <div className="my-1 h-px bg-white/10" />
          <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Remise à zéro
          </p>
          <button
            onClick={() => {
              onResetCooldown();
              setOpen(false);
            }}
            className="block w-full px-3 py-1.5 text-left text-xs text-zinc-200 hover:bg-white/10 transition-colors"
          >
            Rendre le tirage disponible
          </button>
          <button
            onClick={() => {
              onResetJackpot();
              setOpen(false);
            }}
            className="block w-full px-3 py-1.5 text-left text-xs text-red-400 hover:bg-white/10 transition-colors"
          >
            Oublier le jackpot gagné
          </button>
        </div>
      )}
    </div>
  );
}
