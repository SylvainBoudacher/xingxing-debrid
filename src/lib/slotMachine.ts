import { LazyStore } from "@tauri-apps/plugin-store";
import { pityState, savePityState } from "./duckDex";
import type { SlotResult } from "@/game/slots";

// Etat persistant du bandit manchot. Fichier de store dedie, comme ducks.json:
// il survit aux mises a jour de l'app.
const store = new LazyStore("slots.json", { defaults: {}, autoSave: false });

export const COOLDOWN_MS = 10 * 60 * 60 * 1000;

// Une perte fait avancer le pity du bassin de l'equivalent de 15 canards secs.
const LOSS_PITY = 15;

export interface SlotState {
  lastPull: number; // 0 = jamais joue
  jackpotWon: boolean; // le 777 est deja tombe, le Croupier est debloque
}

const EMPTY: SlotState = { lastPull: 0, jackpotWon: false };

// Miroir memoire, pour que la boucle de rendu du canvas puisse savoir si la
// machine doit etre allumee sans faire d'I/O. Rafraichi a chaque lecture/ecriture.
let cache: SlotState = EMPTY;

export async function getSlotState(): Promise<SlotState> {
  cache = (await store.get<SlotState>("state")) ?? EMPTY;
  return cache;
}

async function persist(next: SlotState): Promise<SlotState> {
  cache = next;
  await store.set("state", next);
  await store.save();
  return next;
}

// Temps restant avant le prochain tirage. Une horloge systeme qui recule
// laisserait le joueur bloque des heures: un dernier tirage dans le futur rend
// la machine disponible immediatement.
export function msUntilNext(state: SlotState, now = Date.now()): number {
  if (state.lastPull > now) return 0;
  return Math.max(0, state.lastPull + COOLDOWN_MS - now);
}

export function isSlotReady(state: SlotState, now = Date.now()): boolean {
  return msUntilNext(state, now) === 0;
}

// Vue synchrone pour le canvas: la machine s'allume des que le cooldown est
// passe, sans attendre le store.
export function slotReadyNow(): boolean {
  return isSlotReady(cache);
}

export async function recordPull(result: SlotResult): Promise<SlotState> {
  return persist({
    lastPull: Date.now(),
    jackpotWon: cache.jackpotWon || result.jackpotUnlock,
  });
}

// La malchance au casino nourrit le pity du bassin: les deux compteurs de
// secheresse avancent comme si 15 canards etaient passes sans rien apporter.
export function applyLossPity(): void {
  const p = pityState("pool");
  savePityState("pool", { dryDex: p.dryDex + LOSS_PITY, dryShiny: p.dryShiny + LOSS_PITY });
}

export async function resetCooldown(): Promise<SlotState> {
  return persist({ ...cache, lastPull: 0 });
}

export async function resetJackpot(): Promise<SlotState> {
  return persist({ ...cache, jackpotWon: false });
}

// Formate le compte a rebours du panneau: "7h 12m", puis "4m 30s" sur la fin.
export function formatCountdown(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
