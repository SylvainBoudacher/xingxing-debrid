// Core state of the typhoon minigame: a fixed-length horizontal scroller in
// 3 acts, plus an endless survival mode unlocked after the first win. The game
// renders into a 480x270 offscreen canvas upscaled with nearest-neighbor for
// the retro arcade look, so every coordinate below is in low-res pixels.

export const LW = 480;
export const LH = 270;

// the boat is confined to the left part of the screen
export const PLAY_MAX_X = LW * 0.55;
// everything floats below the horizon line drawn by the background
export const SEA_TOP = 96;

export interface ActDef {
  name: string;
  dur: number; // seconds
}

export const ACTS: ActDef[] = [
  { name: "ACTE 1 - LA MER DES CANARDS", dur: 35 },
  { name: "ACTE 2 - LA TEMPÊTE", dur: 40 },
  { name: "ACTE 3 - LE ROI CANARD", dur: 40 },
];

// ---- difficulty ----

export type Difficulty = "normal" | "tempete" | "ouragan";
export const DIFFICULTIES: Difficulty[] = ["normal", "tempete", "ouragan"];
export const DIFF_LABEL: Record<Difficulty, string> = {
  normal: "NORMAL",
  tempete: "TEMPETE",
  ouragan: "OURAGAN",
};

export interface DiffMods {
  shotSpeed: number; // multiplier on projectile velocity
  density: number; // divider on spawn intervals
  hearts: number;
  boost: number; // extra reward quality (see rewards.ts)
}

export const DIFF_MODS: Record<Difficulty, DiffMods> = {
  normal: { shotSpeed: 1, density: 1, hearts: 3, boost: 0 },
  tempete: { shotSpeed: 1.3, density: 1.5, hearts: 3, boost: 1 },
  ouragan: { shotSpeed: 1.45, density: 1.6, hearts: 1, boost: 2 },
};

export type Phase =
  | "intro" // title screen: pick mode + difficulty
  | "banner" // act name splash
  | "play"
  | "dead" // hearts at 0: retry from act start or quit (course mode only)
  | "finish" // crossing the arrival buoy, short celebration
  | "results"; // score breakdown, then reward overlay (React side)

export interface RunState {
  phase: Phase;
  phaseT: number; // seconds spent in the current phase
  difficulty: Difficulty;
  endless: boolean; // survival mode: no acts, no finish line, ramping danger
  act: number; // 0-based act index (checkpoint); virtual ramp tier in endless
  actT: number; // seconds into the current act
  totalT: number; // chrono: accumulates during play only, survives retries
  hearts: number;
  bananas: number;
  grazes: number;
  hitCount: number; // hearts lost across the whole run (drives the rank)
  snapshot: { bananas: number; grazes: number }; // stats at act start, restored on death
  scroll: number; // world scroll offset for the parallax sea
  shake: number; // screen shake intensity, decays each frame
  finishX: number | null; // arrival buoy position once spawned
}

export function makeRun(difficulty: Difficulty, endless: boolean): RunState {
  return {
    phase: "intro",
    phaseT: 0,
    difficulty,
    endless,
    act: 0,
    actT: 0,
    totalT: 0,
    hearts: DIFF_MODS[difficulty].hearts,
    bananas: 0,
    grazes: 0,
    hitCount: 0,
    snapshot: { bananas: 0, grazes: 0 },
    scroll: 0,
    shake: 0,
    finishX: null,
  };
}

// scroll speed ramps up act by act; in endless it climbs with survival time
export function scrollSpeed(run: RunState): number {
  if (run.endless) return 60 + Math.min(70, run.totalT * 0.55);
  return 60 + run.act * 22;
}

// endless danger tier: acts as a virtual act index for spawn tables
export function endlessTier(run: RunState): number {
  return Math.min(2, Math.floor(run.totalT / 45));
}

export interface ScoreBreakdown {
  bananas: number;
  grazes: number;
  timeBonus: number;
  perfect: number;
  total: number;
}

export function computeScore(run: RunState): ScoreBreakdown {
  const bananas = run.bananas * 100;
  const grazes = run.grazes * 50;
  // course: finishing fast pays; endless: surviving long pays
  const timeBonus = run.endless
    ? Math.round(run.totalT * 15)
    : Math.max(0, Math.round((240 - run.totalT) * 10));
  const perfect = !run.endless && run.hitCount === 0 ? 1000 : 0;
  return { bananas, grazes, timeBonus, perfect, total: bananas + grazes + timeBonus + perfect };
}

// ---- ranks ----

export type Rank = "S" | "A" | "B" | "C";

export function computeRank(run: RunState): Rank {
  if (run.endless) {
    if (run.totalT >= 180) return "S";
    if (run.totalT >= 120) return "A";
    if (run.totalT >= 60) return "B";
    return "C";
  }
  if (run.hitCount === 0 && run.totalT <= 180) return "S";
  if (run.hitCount <= 2) return "A";
  if (run.hitCount <= 5) return "B";
  return "C";
}

export const RANK_BOOST: Record<Rank, number> = { S: 3, A: 2, B: 1, C: 0 };

export function fmtChrono(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const d = Math.floor((s % 1) * 10);
  return `${m}:${String(sec).padStart(2, "0")}.${d}`;
}
