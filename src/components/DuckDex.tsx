import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { toast } from "sonner";
import {
  completedFamilies,
  familyProgress,
  debugCompleteDex,
  debugCompleteFamilies,
  debugCompleteShinyDex,
  debugResetDex,
  getShinyDex,
  isClaimed,
  markClaimed,
  syncDexWithCollection,
  type DexEntries,
  type ShinyEntries,
} from "@/lib/duckDex";
import {
  COLLECTION_REWARDS,
  COLOR_REWARDS,
  REWARDS,
  type DexProgress,
  type DuckReward,
} from "@/lib/duckRewards";
import { DuckDexDevMenu } from "./DuckDexDevMenu";
import { DuckRewardSection } from "./DuckRewardSection";
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
  god: "ring-yellow-100/60",
  mythic: "ring-yellow-300/50",
  legendary: "ring-amber-400/40",
  rare: "ring-blue-400/40",
  uncommon: "ring-green-400/30",
  common: "ring-black/10 dark:ring-white/10",
};

// hors du composant: Date.now() ne doit pas être appelé pendant un rendu
function rewardDuck(reward: DuckReward) {
  return {
    id: reward.id,
    name: reward.name,
    variant: reward.variant(),
    scale: reward.scale,
    savedAt: Date.now(),
  };
}

// Canardex overlay, toggled by the pixel-art pokedex drawn on the pool canvas.
// Discoveries are synced from the saved collection every time the panel opens,
// so ducks saved before the dex existed count retroactively.
export function DuckDex() {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<DexEntries>({});
  const [shiny, setShiny] = useState<ShinyEntries>([]);
  const [claimed, setClaimed] = useState<Record<string, boolean>>({});
  const [shinyShown, setShinyShown] = useState<Set<string>>(new Set());

  const openRef = useRef(false);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  async function openDex() {
    const synced = await syncDexWithCollection();
    const flags = await Promise.all(
      REWARDS.map(async (r) => [r.id, await isClaimed(r.storeKey)] as const),
    );
    setEntries(synced);
    setShiny(await getShinyDex());
    setClaimed(Object.fromEntries(flags));
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

  async function claim(reward: DuckReward) {
    const duck = rewardDuck(reward);
    await upsertSavedDuck(duck);
    injectDuck({ id: duck.id, name: duck.name, variant: duck.variant, scale: duck.scale });
    await markClaimed(reward.storeKey);
    setClaimed((prev) => ({ ...prev, [reward.id]: true }));
    toast.success(reward.claimToast);
  }

  function toggleShinyShown(id: string) {
    setShinyShown((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function devComplete() {
    setEntries(await debugCompleteDex());
  }

  async function devCompleteFamilies(rarity: Rarity, count: number) {
    setEntries(await debugCompleteFamilies(rarity, count));
  }

  async function devCompleteShiny() {
    setShiny(await debugCompleteShinyDex());
  }

  async function devReset() {
    await debugResetDex();
    setEntries({});
    setShiny([]);
    setClaimed({});
  }

  const discovered = SPECIES.filter((s) => (entries[s.id]?.length ?? 0) > 0).length;
  const families = completedFamilies(entries);
  const progress: DexProgress = {
    species: discovered,
    shiny: shiny.length,
    ...familyProgress(entries),
  };
  const complete = discovered === SPECIES.length;

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
                    {complete && (
                      <span className="text-fuchsia-500 dark:text-fuchsia-400">
                        {" "}
                        · ✦ {shiny.length}/{SPECIES.length} shiny
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {import.meta.env.DEV && (
                    <DuckDexDevMenu
                      onCompleteDex={devComplete}
                      onCompleteShiny={devCompleteShiny}
                      onCompleteFamilies={devCompleteFamilies}
                      onReset={devReset}
                    />
                  )}
                  <button
                    onClick={() => setOpen(false)}
                    className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                  >
                    <X className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                  </button>
                </div>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-[width] duration-500"
                  style={{ width: `${(discovered / SPECIES.length) * 100}%` }}
                />
              </div>
              {/* extra achievement: the shiny counter only wakes up once the dex is complete */}
              {complete && (
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 via-pink-400 to-amber-400 transition-[width] duration-500"
                    style={{ width: `${(shiny.length / SPECIES.length) * 100}%` }}
                  />
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {SECTIONS.map(({ rarity, label }, sectionIndex) => (
                <motion.div
                  key={rarity}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 + sectionIndex * 0.06, ease: "easeOut" }}
                  className="mb-5 last:mb-0"
                >
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    {label}
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {SPECIES.filter((s) => s.rarity === rarity).map((s, tileIndex) => {
                      const colors = entries[s.id] ?? [];
                      const found = colors.length > 0;
                      const hasShiny = shiny.includes(s.id);
                      const showShiny = hasShiny && shinyShown.has(s.id);
                      return (
                        <motion.div
                          key={s.id}
                          initial={{ opacity: 0, scale: 0.9, y: 6 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{
                            duration: 0.25,
                            delay: 0.15 + sectionIndex * 0.06 + tileIndex * 0.03,
                            ease: "easeOut",
                          }}
                          className={`relative flex flex-col items-center gap-1 rounded-xl bg-white/70 dark:bg-zinc-800/60 px-2 py-3 ring-1 ${found ? RARITY_RING[s.rarity] : "ring-black/5 dark:ring-white/5"}`}
                        >
                          {found &&
                            (hasShiny ? (
                              <button
                                onClick={() => toggleShinyShown(s.id)}
                                title={
                                  showShiny
                                    ? "Afficher la version normale"
                                    : "Afficher la version shiny"
                                }
                                className={`shiny-orb absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 via-pink-400 to-amber-400 text-[8px] leading-none text-white shadow-sm ring-1 ${showShiny ? "ring-fuchsia-300" : "ring-white/40"}`}
                              >
                                <span>✦</span>
                              </button>
                            ) : (
                              <span
                                title="Version shiny non collectionnée"
                                className="absolute right-1.5 top-1.5 h-4 w-4 rounded-full ring-1 ring-inset ring-black/15 dark:ring-white/20 bg-black/5 dark:bg-white/5"
                              />
                            ))}
                          <span className={found ? "" : "brightness-0 opacity-25 dark:invert"}>
                            <DuckPreview
                              variant={showShiny ? { ...s.preview, shiny: true } : s.preview}
                              size={52}
                            />
                          </span>
                          <p className="w-full truncate text-center text-[11px] font-medium text-zinc-800 dark:text-zinc-200">
                            {found ? s.name : "???"}
                          </p>
                          {found && s.maxColors > 1 && (
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                              {colors.length}/{s.maxColors} couleurs
                            </p>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              ))}

              <DuckRewardSection
                title="Récompenses de couleurs"
                hint={`Une famille, c'est toutes les teintes d'une même espèce. Chaque palier compte les familles de sa rareté. ${families} familles complètes.`}
                rewards={COLOR_REWARDS}
                progress={progress}
                claimed={claimed}
                onClaim={claim}
                delay={0.4}
              />

              <DuckRewardSection
                title="Récompenses de collection"
                hint="Pour avoir découvert toutes les espèces, puis toutes leurs versions shiny."
                rewards={COLLECTION_REWARDS}
                progress={progress}
                claimed={claimed}
                onClaim={claim}
                delay={0.46}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
