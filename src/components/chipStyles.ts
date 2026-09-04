// Styles partages des barres de selection (saisons, tri, filtres) de la fiche
// Decouverte : segmented control moderne plutot que des pilules pleines.

export const CHIP_TRACK =
  "inline-flex w-max items-center gap-0.5 rounded-xl bg-zinc-100/80 p-1 ring-1 ring-black/5 dark:bg-zinc-900/70 dark:ring-white/5";

const CHIP_BASE =
  "shrink-0 whitespace-nowrap rounded-[9px] px-3 py-1.5 text-[11px] font-medium leading-none transition-all duration-150";

const CHIP_ACTIVE =
  "bg-white text-zinc-900 shadow-sm ring-1 ring-black/5 dark:bg-zinc-700/90 dark:text-white dark:ring-white/10";

const CHIP_IDLE =
  "text-zinc-500 hover:bg-black/[0.04] hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-white";

export function chipClass(active: boolean): string {
  return `${CHIP_BASE} ${active ? CHIP_ACTIVE : CHIP_IDLE}`;
}

// Filtres a bascule (resolution, langue) : accent colore quand actifs
export function toggleChipClass(active: boolean, accent: "indigo" | "green"): string {
  if (!active) return `${CHIP_BASE} font-semibold uppercase tracking-wide ${CHIP_IDLE}`;
  const tint =
    accent === "indigo"
      ? "bg-indigo-500/15 text-indigo-600 ring-1 ring-indigo-500/30 dark:text-indigo-300"
      : "bg-emerald-500/15 text-emerald-600 ring-1 ring-emerald-500/30 dark:text-emerald-300";
  return `${CHIP_BASE} font-semibold uppercase tracking-wide ${tint}`;
}
