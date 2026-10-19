import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { rollSlot, type Reels, type SlotPrize, type SlotResult } from "@/game/slots";
import {
  applyLossPity,
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
import "@fontsource/jersey-10/latin-400.css";
import { PixelSprite } from "./PixelSprite";
import { prizeToast } from "./slotCopy";
import { SlotCountdown } from "./SlotCountdown";
import { SlotDisplay } from "./SlotDisplay";
import { SlotDevMenu } from "./SlotDevMenu";
import { SlotLever } from "./SlotLever";
import { SlotMarquee } from "./SlotMarquee";
import { SlotPayouts } from "./SlotPayouts";
import { CROSS_PATHS } from "./slotPixelArt";
import { PX, pixelFrame } from "./slotPixel";
import { SlotWindow } from "./SlotWindow";

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
  const won = !rolling && !!reveal && reveal.prize !== "none";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/75 px-4 py-6"
          // Un clic dont la pression et le relâchement n'ont pas la même cible
          // est dispatché sur leur ancêtre commun, donc ici sur le fond: tirer
          // le levier fermerait le panneau. C'est l'origine du geste qui décide.
          onPointerDown={(e) => (downOutside.current = e.target === e.currentTarget)}
          onClick={() => downOutside.current && !rolling && setOpen(false)}
        >
          {/* la borne est centrée seule; le levier est posé hors flux à sa droite */}
          <motion.div
            role="dialog"
            aria-label="Bandit manchot"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-[312px]"
          >
            <div className="mb-3 flex justify-end gap-2">
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
                aria-label="Fermer"
                className="flex h-6 w-6 items-center justify-center disabled:opacity-40"
                style={{ ...pixelFrame(PX.ink, PX.outline), color: PX.ivoryShade }}
              >
                <PixelSprite paths={CROSS_PATHS} w={5} h={5} scale={2} />
              </button>
            </div>

            <SlotMarquee lit={ready && !rolling} rolling={rolling} />

            <div
              className="mt-[3px] px-4 pb-4 pt-4"
              style={pixelFrame(PX.cabinet, PX.outline, 3, {
                light: PX.cabinetLight,
                dark: PX.cabinetDark,
              })}
            >
              <SlotPayouts />
              <div className="mt-5">
                <SlotWindow
                  reels={reels}
                  spin={spin}
                  durations={REEL_MS.map((ms) => ms / 1000)}
                  rolling={rolling}
                  won={won}
                />
              </div>
              <div className="mt-5">
                <SlotDisplay rolling={rolling} reveal={reveal} ready={ready} />
              </div>
              <SlotCountdown ready={ready} remaining={remaining} />
              {/* fente à jetons */}
              <div className="mx-auto mt-4 h-[6px] w-16" style={{ background: PX.outline }} />
            </div>

            <div className="absolute left-full top-[250px] ml-2">
              <SlotLever disabled={!ready || rolling} onPull={pull} />
            </div>

            <p className="mt-4 text-center text-[11px] leading-relaxed text-white/55">
              Un tirage toutes les 4 heures. Deux symboles identiques paient la rareté du symbole,
              trois la donnent en shiny. Aucune paire : la malchance nourrit le pity du bassin.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
