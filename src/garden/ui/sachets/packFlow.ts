import type { Rarity, SachetType, Seed } from "../../core/types";
import type { BurstKind } from "./burst";

export type Phase =
  | { kind: "idle" }
  | { kind: "tearing" }
  // current : carte du dessus de la pile ; flipped une fois retournée, le clic suivant la range
  | { kind: "revealing"; current: number; flipped: boolean }
  | { kind: "summary" };

export type FlowEvent = "startTear" | "tear" | "next" | "revealAll" | "reset";

export const IDLE: Phase = { kind: "idle" };

export function step(phase: Phase, event: FlowEvent, count: number): Phase {
  switch (phase.kind) {
    case "idle":
      return event === "startTear" ? { kind: "tearing" } : phase;
    case "tearing":
      return event === "tear" ? { kind: "revealing", current: 0, flipped: false } : phase;
    case "revealing":
      if (event === "revealAll") return { kind: "summary" };
      if (event !== "next") return phase;
      if (!phase.flipped) return { ...phase, flipped: true };
      return phase.current < count - 1
        ? { kind: "revealing", current: phase.current + 1, flipped: false }
        : { kind: "summary" };
    case "summary":
      return event === "reset" ? IDLE : phase;
  }
}

// Un lot ouvert mais pas vu jusqu'au bout (onglet quitté en route) reprend au récapitulatif.
export const initialPhase = (openedSeq: number, seenSeq: number): Phase =>
  openedSeq > seenSeq ? { kind: "summary" } : IDLE;

// Pendant la déchirure, le sachet est déjà consommé mais reste affiché sur la pile.
export function stackOf(
  phase: Phase,
  pending: SachetType[],
  openedType: SachetType,
): { top: SachetType | null; under: SachetType[] } {
  if (phase.kind === "tearing") return { top: openedType, under: pending };
  return { top: pending[0] ?? null, under: pending.slice(1) };
}

const RARITY_ORDER: Rarity[] = ["commune", "rare", "epique", "legendaire"];

export const bestRarity = (seeds: Seed[]): Rarity =>
  seeds.reduce<Rarity>(
    (best, s) => (RARITY_ORDER.indexOf(s.rarity) > RARITY_ORDER.indexOf(best) ? s.rarity : best),
    "commune",
  );

export interface RevealFx {
  // pause avant le retournement, en ms
  hold: number;
  // amplitude de la secousse, en px
  shake: number;
  burst: BurstKind | null;
}

export const REVEAL_FX: Record<Rarity, RevealFx> = {
  commune: { hold: 0, shake: 0, burst: null },
  rare: { hold: 0, shake: 0, burst: "sparks" },
  epique: { hold: 300, shake: 4, burst: "rays" },
  legendaire: { hold: 900, shake: 10, burst: "gold" },
};

export const FLIP_MS = 450;

// Clics ignorés tant que la carte n'est pas retournée : pas de légendaire sautée par un double clic.
export const lockFor = (rarity: Rarity): number => REVEAL_FX[rarity].hold + FLIP_MS;

export const TEAR_THRESHOLD = 0.7;

export const tearProgress = (dx: number, width: number): number =>
  width > 0 ? Math.min(1, Math.max(0, dx / width)) : 0;

// Un pixel du sprite du sachet vaut PACK_SCALE pixels à l'écran.
export const PACK_SCALE = 4;
