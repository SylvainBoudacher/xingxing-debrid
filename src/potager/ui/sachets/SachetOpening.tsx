import { useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { SACHETS, type SachetId } from "../../core/economy/catalog";
import type { Rarity, Seed } from "../../core/types";
import { PANEL_STYLE } from "../hdPanel";
import { PanelHeader } from "../PanelHeader";
import { BurstLayer, type BurstHandle } from "./BurstLayer";
import { PackSummary } from "./PackSummary";
import { bestRarity, IDLE, REVEAL_FX, step, type FlowEvent, type Phase } from "./packFlow";
import { RevealStage } from "./RevealStage";
import { TearablePack } from "./TearablePack";
import { useScreenShake } from "./useScreenShake";

// Ouverture d'un sachet déjà payé, aux graines déjà rangées : fermer ne perd rien.
export function SachetOpening({
  sachet,
  seeds,
  onClose,
}: {
  sachet: SachetId;
  seeds: Seed[];
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<Phase>(IDLE);
  const stage = useRef<HTMLDivElement>(null);
  const burst = useRef<BurstHandle>(null);
  const reduced = useReducedMotion();
  const shake = useScreenShake(stage);
  const best = bestRarity(seeds);

  // mise à jour fonctionnelle : onTorn part d'une animation lancée au rendu précédent
  const go = (event: FlowEvent) => setPhase((p) => step(p, event, seeds.length));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.code === "Escape" && onClose();
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [onClose]);

  const onFlip = useCallback(
    (rarity: Rarity, cx: number, cy: number) => {
      const fx = REVEAL_FX[rarity];
      if (fx.burst) burst.current?.fire(fx.burst, cx, cy);
      if (!reduced) shake(fx.shake);
    },
    [reduced, shake],
  );

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/55">
      <div
        className="flex h-[min(860px,92vh)] w-[min(760px,94vw)] flex-col p-5"
        style={PANEL_STYLE}
      >
        <PanelHeader title={SACHETS[sachet].label} onClose={onClose} />
        <div
          ref={stage}
          className="relative isolate flex min-h-0 flex-1 flex-col items-center justify-center gap-6 overflow-hidden"
        >
          <BurstLayer ref={burst} />
          {phase.kind === "revealing" ? (
            <RevealStage
              seeds={seeds}
              current={phase.current}
              flipped={phase.flipped}
              onNext={() => go("next")}
              onRevealAll={() => go("revealAll")}
              onFlip={onFlip}
            />
          ) : phase.kind === "summary" ? (
            <PackSummary seeds={seeds} onContinue={onClose} />
          ) : (
            <div className="flex flex-col items-center gap-6">
              <TearablePack
                type={sachet}
                glow={phase.kind === "tearing" && best !== "commune" ? best : null}
                onStart={() => go("startTear")}
                onRip={(x, y) => burst.current?.fire("paper", x, y)}
                onTorn={() => go("tear")}
              />
              <p className="text-lg text-[#c8b890]">
                {phase.kind === "idle"
                  ? "Tirer la bande vers la droite, ou cliquer sur le sachet"
                  : " "}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
