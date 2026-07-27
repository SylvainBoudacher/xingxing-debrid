import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { rollSlot, type Reels, type SlotPrize, type SlotResult } from "@/game/slots";
import {
  applyLossPity,
  formatCountdown,
  getSlotState,
  isSlotReady,
  msUntilNext,
  recordPull,
  resetCooldown,
  resetJackpot,
  type SlotState,
} from "@/lib/slotMachine";
import { refreshClaimableRewards } from "@/lib/duckRewardStatus";
import { onSlotOpen, spawnVariant } from "./duckShopBridge";
import { PRIZE_LABEL, prizeToast } from "./slotCopy";
import { SlotDevMenu } from "./SlotDevMenu";
import { SlotPayouts } from "./SlotPayouts";
import { SlotReel } from "./SlotReel";

// Bandit manchot, ouvert par la machine à sous dessinée au sol du bassin. Le
// résultat est tiré au clic sur le levier, les rouleaux ne font que le montrer:
// ils s'arrêtent l'un après l'autre, puis le lot est délivré.

const IDLE_REELS: Reels = ["duckling", "glasses", "wizard"];
const REEL_MS = [1100, 1550, 2000];
const SETTLE_MS = REEL_MS[2] + 120;

export function SlotMachine() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<SlotState>({ lastPull: 0, jackpotWon: false });
  const [now, setNow] = useState(() => Date.now());
  const [spin, setSpin] = useState(0);
  const [result, setResult] = useState<SlotResult | null>(null);
  const [rolling, setRolling] = useState(false);
  const [reveal, setReveal] = useState<SlotResult | null>(null);

  const openRef = useRef(false);
  const timer = useRef(0);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    onSlotOpen(() => {
      if (openRef.current) return setOpen(false);
      getSlotState().then(setState);
      setNow(Date.now());
      setOpen(true);
    });
    return () => onSlotOpen(null);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // compte à rebours du panneau
  useEffect(() => {
    if (!open) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !rolling) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, rolling]);

  function deliver(r: SlotResult) {
    setRolling(false);
    setReveal(r);
    if (r.variant) spawnVariant(r.variant);
    else if (r.jackpotUnlock) refreshClaimableRewards();
    else applyLossPity();
    if (r.prize === "none") toast(prizeToast(r.prize, r.jackpotUnlock));
    else toast.success(prizeToast(r.prize, r.jackpotUnlock));
  }

  async function pull(force?: SlotPrize) {
    if (rolling) return;
    const r = rollSlot(state.jackpotWon, force);
    setResult(r);
    setReveal(null);
    setRolling(true);
    setSpin((s) => s + 1);
    setState(await recordPull(r));
    timer.current = window.setTimeout(() => deliver(r), SETTLE_MS);
  }

  async function devResetCooldown() {
    setState(await resetCooldown());
    setNow(Date.now());
  }

  async function devResetJackpot() {
    setState(await resetJackpot());
  }

  const remaining = msUntilNext(state, now);
  const ready = isSlotReady(state, now);
  const reels = result?.reels ?? IDLE_REELS;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={() => !rolling && setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm overflow-hidden rounded-2xl bg-gradient-to-b from-[#5E0E20] to-[#2A0710] ring-1 ring-white/15 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-white">Bandit manchot</h2>
                <p className="text-xs text-amber-300/70">Un tirage toutes les 10 heures</p>
              </div>
              <div className="flex items-center gap-2">
                {import.meta.env.DEV && (
                  <SlotDevMenu
                    onForce={pull}
                    onResetCooldown={devResetCooldown}
                    onResetJackpot={devResetJackpot}
                  />
                )}
                <button
                  onClick={() => setOpen(false)}
                  disabled={rolling}
                  className="flex h-6 w-6 items-center justify-center rounded-md bg-white/10 hover:bg-white/20 disabled:opacity-40 transition-colors"
                >
                  <X className="h-3.5 w-3.5 text-white/70" />
                </button>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 px-5 py-5">
              <div className="flex gap-2 rounded-xl bg-black/40 p-2 ring-1 ring-amber-400/30">
                {reels.map((s, i) => (
                  <SlotReel key={i} symbol={s} spin={spin} duration={REEL_MS[i] / 1000} />
                ))}
              </div>

              <div className="h-9 text-center">
                <AnimatePresence mode="wait">
                  {reveal && (
                    <motion.div
                      key={spin}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      <p
                        className={`text-sm font-semibold ${
                          reveal.prize === "none" ? "text-zinc-400" : "text-amber-300"
                        }`}
                      >
                        {reveal.prize === "jackpot" && reveal.jackpotUnlock
                          ? "JACKPOT !"
                          : PRIZE_LABEL[reveal.prize]}
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        {reveal.jackpotUnlock
                          ? "Le Canard Croupier est débloqué dans le Canardex."
                          : reveal.variant
                            ? "Attrape-le dans le bassin pour le garder."
                            : "Le pity du bassin avance."}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={() => pull()}
                disabled={!ready || rolling}
                className="w-full rounded-xl bg-gradient-to-b from-[#F0584E] to-[#B3202A] px-4 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-lg ring-1 ring-white/20 transition-transform enabled:hover:brightness-110 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:from-zinc-700 disabled:to-zinc-800 disabled:text-zinc-400 disabled:ring-white/10"
              >
                {rolling
                  ? "Ça tourne..."
                  : ready
                    ? "Tirer le levier"
                    : `Prochain tirage dans ${formatCountdown(remaining)}`}
              </button>

              <SlotPayouts />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
