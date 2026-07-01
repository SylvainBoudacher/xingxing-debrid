import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Lock, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  getDex,
  isDexComplete,
  isRewardClaimed,
  markRewardClaimed,
  REWARD_DUCK_ID,
  REWARD_DUCK_NAME,
  rewardVariant,
  syncDexWithCollection,
  type DexEntries,
} from "@/lib/duckDex";
import { upsertSavedDuck } from "@/lib/savedDucks";
import type { Rarity } from "./duckRandom";
import { SPECIES } from "./duckSpecies";
import { DuckPreview } from "./DuckPreview";
import { injectDuck, onDexOpen } from "./duckShopBridge";

const SECTIONS: Array<{ rarity: Rarity; label: string }> = [
  { rarity: "common", label: "Communs" },
  { rarity: "uncommon", label: "Peu communs" },
  { rarity: "rare", label: "Rares" },
  { rarity: "legendary", label: "Légendaires" },
  { rarity: "mythic", label: "Mythique" },
];

const RARITY_RING: Record<Rarity, string> = {
  mythic: "ring-yellow-300/50",
  legendary: "ring-amber-400/40",
  rare: "ring-blue-400/40",
  uncommon: "ring-green-400/30",
  common: "ring-black/10 dark:ring-white/10",
};

// Canardex overlay, toggled by the pixel-art pokedex drawn on the pool canvas.
// Discoveries are synced from the saved collection every time the panel opens,
// so ducks saved before the dex existed count retroactively.
export function DuckDex() {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<DexEntries>({});
  const [claimed, setClaimed] = useState(false);

  const openRef = useRef(false);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  async function openDex() {
    const [synced, rewardClaimed] = await Promise.all([syncDexWithCollection(), isRewardClaimed()]);
    setEntries(synced);
    setClaimed(rewardClaimed);
    setOpen(true);
  }

  useEffect(() => {
    onDexOpen(() => {
      if (openRef.current) setOpen(false);
      else openDex();
    });
    return () => onDexOpen(null);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function claim() {
    const duck = {
      id: REWARD_DUCK_ID,
      name: REWARD_DUCK_NAME,
      variant: rewardVariant(),
      scale: 1,
      savedAt: Date.now(),
    };
    await upsertSavedDuck(duck);
    injectDuck({ id: duck.id, name: duck.name, variant: duck.variant, scale: duck.scale });
    await markRewardClaimed();
    setEntries(await getDex());
    setClaimed(true);
    toast.success(`${REWARD_DUCK_NAME} a rejoint ta collection !`);
  }

  const discovered = SPECIES.filter((s) => (entries[s.id]?.length ?? 0) > 0).length;
  const complete = isDexComplete(entries);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white/95 dark:bg-zinc-900/95 ring-1 ring-black/10 dark:ring-white/10 shadow-2xl backdrop-blur-xl"
          >
            <div className="border-b border-black/10 dark:border-white/10 px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
                    Canardex
                  </h2>
                  <p className="text-xs text-zinc-500">
                    {discovered}/{SPECIES.length} espèces découvertes
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                >
                  <X className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                </button>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-[width] duration-500"
                  style={{ width: `${(discovered / SPECIES.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {SECTIONS.map(({ rarity, label }) => (
                <div key={rarity} className="mb-5 last:mb-0">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    {label}
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {SPECIES.filter((s) => s.rarity === rarity).map((s) => {
                      const colors = entries[s.id] ?? [];
                      const found = colors.length > 0;
                      return (
                        <div
                          key={s.id}
                          className={`flex flex-col items-center gap-1 rounded-xl bg-white/70 dark:bg-zinc-800/60 px-2 py-3 ring-1 ${found ? RARITY_RING[s.rarity] : "ring-black/5 dark:ring-white/5"}`}
                        >
                          <span className={found ? "" : "brightness-0 opacity-25 dark:invert"}>
                            <DuckPreview variant={s.preview} size={52} />
                          </span>
                          <p className="w-full truncate text-center text-[11px] font-medium text-zinc-800 dark:text-zinc-200">
                            {found ? s.name : "???"}
                          </p>
                          {found && s.maxColors > 1 && (
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                              {colors.length}/{s.maxColors} couleurs
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-black/10 dark:border-white/10 px-5 py-4">
              {claimed ? (
                <div className="flex items-center gap-3">
                  <DuckPreview variant={rewardVariant()} size={48} />
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                      {REWARD_DUCK_NAME}
                    </p>
                    <p className="text-xs text-zinc-500">Récompense de complétion obtenue</p>
                  </div>
                </div>
              ) : complete ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                    <p className="text-sm text-zinc-700 dark:text-zinc-200">
                      Canardex complet ! Une récompense t'attend.
                    </p>
                  </div>
                  <Button size="sm" onClick={claim}>
                    Réclamer
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-zinc-500">
                  <Lock className="h-3.5 w-3.5" />
                  <p className="text-xs">
                    Découvre les {SPECIES.length} espèces pour débloquer un canard exclusif.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
