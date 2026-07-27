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
import { SlotLever } from "./SlotLever";
import { SlotMarquee } from "./SlotMarquee";
import { SlotPayouts } from "./SlotPayouts";
import { SlotReel } from "./SlotReel";

// Bandit manchot, ouvert par la machine à sous dessinée au sol du bassin. Le
// résultat est tiré au clic sur le levier, les rouleaux ne font que le montrer:
// ils s'arrêtent l'un après l'autre, puis le lot est délivré.

const IDLE_REELS: Reels = ["duckling", "glasses", "wizard"];
// Arrêts très espacés: le dernier rouleau fait durer le suspense.
const REEL_MS = [1800, 3200, 5200];
const SETTLE_MS = REEL_MS[2] + 350;

export function SlotMachine() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<SlotState>({ lastPull: 0, jackpotWon: false });
  const [now, setNow] = useState(() => Date.now());
  const [spin, setSpin] = useState(0);
  const [result, setResult] = useState<SlotResult | null>(null);
  const [rolling, setRolling] = useState(false);
  const [reveal, setReveal] = useState<SlotResult | null>(null);

  const openRef = useRef(false);
  const downOutside = useRef(false);
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
          // Un clic dont la pression et le relâchement n'ont pas la même cible
          // est dispatché sur leur ancêtre commun, donc ici sur le fond: tirer
          // le levier fermerait le panneau. C'est l'origine du geste qui décide.
          onPointerDown={(e) => (downOutside.current = e.target === e.currentTarget)}
          onClick={() => downOutside.current && !rolling && setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md overflow-hidden rounded-2xl bg-gradient-to-b from-[#3B0A16] to-[#1C040B] ring-1 ring-white/15 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-white">Bandit manchot</h2>
                <p className="text-xs text-amber-300/70">Un tirage toutes les 4 heures</p>
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

            <div className="px-5 py-5">
              {/* compte à rebours bien visible au-dessus de la borne */}
              {!ready && !rolling && (
                <div className="mb-4 w-full rounded-xl bg-black/50 px-5 py-2.5 text-center ring-1 ring-amber-400/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-300/60">
                    Prochain tirage
                  </p>
                  <p className="mt-0.5 font-mono text-xl font-bold tracking-wider text-amber-300">
                    {formatCountdown(remaining)}
                  </p>
                </div>
              )}
              {/* la borne est centrée seule; le levier est posé hors flux à sa droite */}
              <div className="relative flex items-center justify-center">
                {/* la borne */}
                <div className="w-[268px] overflow-hidden rounded-[26px] bg-gradient-to-b from-[#8E1730] via-[#5E0E20] to-[#2E0511] ring-1 ring-amber-400/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
                  <SlotMarquee lit={ready && !rolling} rolling={rolling} />

                  <div className="px-3 pt-3">
                    <motion.div
                      animate={
                        rolling
                          ? { x: [0, -1.5, 1.5, -1, 1, 0] }
                          : reveal && reveal.prize !== "none"
                            ? { scale: [1, 1.03, 1] }
                            : { x: 0, scale: 1 }
                      }
                      transition={
                        rolling
                          ? { duration: 0.28, repeat: Infinity, ease: "linear" }
                          : { duration: 0.45, ease: "easeOut" }
                      }
                      className={`relative rounded-xl bg-black/70 p-2 ring-2 transition-shadow duration-500 ${
                        rolling
                          ? "ring-amber-300/80 shadow-[0_0_24px_4px_rgba(251,191,36,0.35)]"
                          : reveal && reveal.prize !== "none"
                            ? "ring-amber-300 shadow-[0_0_32px_8px_rgba(251,191,36,0.45)]"
                            : "ring-amber-400/50"
                      }`}
                    >
                      <div className="flex justify-center gap-2">
                        {reels.map((s, i) => (
                          <SlotReel key={i} symbol={s} spin={spin} duration={REEL_MS[i] / 1000} />
                        ))}
                      </div>
                      {/* ligne de paie */}
                      <motion.span
                        animate={
                          rolling
                            ? { opacity: [0.5, 1, 0.5] }
                            : { opacity: reveal && reveal.prize !== "none" ? 1 : 0.5 }
                        }
                        transition={
                          rolling ? { duration: 0.5, repeat: Infinity } : { duration: 0.3 }
                        }
                        className={`pointer-events-none absolute inset-x-1 top-1/2 h-[2px] -translate-y-1/2 rounded-full ${
                          reveal && !rolling && reveal.prize !== "none"
                            ? "bg-amber-300 shadow-[0_0_10px_2px_rgba(251,191,36,0.8)]"
                            : "bg-red-500/50"
                        }`}
                      />
                    </motion.div>

                    {/* afficheur de la borne */}
                    <div className="mt-3 flex h-[46px] flex-col items-center justify-center rounded-lg bg-black/70 px-2 ring-1 ring-white/10">
                      <p
                        className={`font-mono text-[13px] font-bold uppercase tracking-wider ${
                          reveal && !rolling && reveal.prize === "none"
                            ? "text-zinc-400"
                            : "text-amber-300"
                        }`}
                      >
                        {rolling
                          ? "Ça tourne..."
                          : reveal
                            ? reveal.jackpotUnlock
                              ? "Jackpot !"
                              : PRIZE_LABEL[reveal.prize]
                            : ready
                              ? "Tire le levier"
                              : "En charge"}
                      </p>
                      <p className="mt-0.5 text-center text-[10px] leading-tight text-zinc-400">
                        {rolling
                          ? ""
                          : reveal
                            ? reveal.jackpotUnlock
                              ? "Le Canard Croupier est débloqué dans le Canardex."
                              : reveal.variant
                                ? "Attrape-le dans le bassin pour le garder."
                                : "Le pity du bassin avance."
                            : ready
                              ? "Attrape le pommeau et tire vers le bas."
                              : "Reviens quand la borne sera rechargée."}
                      </p>
                    </div>
                  </div>

                  {/* fente à jetons */}
                  <div className="mx-auto my-3 h-1.5 w-20 rounded-full bg-black/60 ring-1 ring-white/10" />
                </div>

                <div className="absolute left-1/2 top-1/2 ml-[134px] -translate-y-1/2">
                  <SlotLever disabled={!ready || rolling} onPull={pull} />
                </div>
              </div>

              <div className="mt-4">
                <SlotPayouts />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
