import { useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { herbierProgress } from "../../core/herbier";
import { chanceOf, GAUGES } from "../../core/pity";
import { MAX_PENDING } from "../../core/sachets";
import type { GardenSave, Rarity } from "../../core/types";
import { DEV_BUTTON } from "../devButton";
import type { OpenedLot } from "../gardenReducer";
import { BurstLayer, type BurstHandle } from "./BurstLayer";
import { EmptyPack } from "./EmptyPack";
import { PackStack } from "./PackStack";
import { PackSummary } from "./PackSummary";
import {
  bestRarity,
  initialPhase,
  REVEAL_FX,
  stackOf,
  step,
  type FlowEvent,
  type Phase,
} from "./packFlow";
import { PityGauge } from "./PityGauge";
import { RevealStage } from "./RevealStage";
import { TearablePack } from "./TearablePack";
import { useScreenShake } from "./useScreenShake";

export function SachetsPage({
  save,
  opened,
  seenSeq,
  onSeen,
  onOpen,
  onGoToField,
  onDevSachet,
  onDevNextDay,
  onDevLegendary,
}: {
  save: GardenSave;
  opened: OpenedLot;
  seenSeq: number;
  onSeen: (seq: number) => void;
  onOpen: () => void;
  onGoToField: () => void;
  onDevSachet: () => void;
  onDevNextDay: () => void;
  onDevLegendary: () => void;
}) {
  const [phase, setPhase] = useState<Phase>(() => initialPhase(opened.seq, seenSeq));
  // jauges d'avant l'ouverture, affichées jusqu'au récapitulatif
  const [frozenPity, setFrozenPity] = useState(save.pity);
  const stage = useRef<HTMLDivElement>(null);
  const burst = useRef<BurstHandle>(null);
  const reduced = useReducedMotion();
  const shake = useScreenShake(stage);

  // mise à jour fonctionnelle : onTorn part d'une animation lancée au rendu précédent
  const go = (event: FlowEvent) => setPhase((p) => step(p, event, opened.seeds.length));

  useEffect(() => {
    if (phase.kind === "summary") onSeen(opened.seq);
  }, [phase.kind, opened.seq, onSeen]);

  const startTear = (open: () => void) => {
    if (phase.kind !== "idle") return;
    setFrozenPity(save.pity);
    open();
    go("startTear");
  };

  const onFlip = useCallback(
    (rarity: Rarity, cx: number, cy: number) => {
      const fx = REVEAL_FX[rarity];
      if (fx.burst) burst.current?.fire(fx.burst, cx, cy);
      if (!reduced) shake(fx.shake);
    },
    [reduced, shake],
  );

  const herbier = herbierProgress(save);
  const pending = save.sachets.pending;
  const busy = phase.kind === "tearing" || phase.kind === "revealing";
  const pity = busy ? frozenPity : save.pity;
  const { top, under } = stackOf(phase, pending, opened.type);
  // pendant la déchirure, opened est le lot du sachet tenu en main
  const lot = phase.kind === "tearing" ? opened : null;
  const best = lot ? bestRarity(lot.seeds) : "commune";
  const familyIcon =
    lot?.type === "famille" && lot.seeds[0]
      ? { name: lot.seeds[0].species, color: lot.seeds[0].color }
      : null;
  // même clé au repos et pendant la déchirure du même sachet : opened.seq avance au premier geste
  const packKey = opened.seq + (phase.kind === "idle" ? 1 : 0);

  return (
    <div className="flex flex-1 gap-4 overflow-auto p-5">
      <div
        ref={stage}
        className="relative isolate flex flex-1 flex-col items-center justify-center gap-6 overflow-hidden rounded-xl bg-[radial-gradient(60%_60%_at_50%_40%,rgba(243,195,74,.10),transparent)]"
      >
        <BurstLayer ref={burst} />
        {phase.kind === "revealing" ? (
          <RevealStage
            seeds={opened.seeds}
            fresh={opened.fresh}
            current={phase.current}
            onNext={() => go("next")}
            onRevealAll={() => go("revealAll")}
            onFlip={onFlip}
          />
        ) : phase.kind === "summary" ? (
          <PackSummary
            seeds={opened.seeds}
            fresh={opened.fresh}
            pending={pending.length}
            onNextPack={() => go("reset")}
            onGoToField={onGoToField}
          />
        ) : top ? (
          <div className="flex flex-col items-center gap-4">
            <PackStack under={under}>
              <TearablePack
                key={packKey}
                type={top}
                glow={best === "commune" ? null : best}
                familyIcon={familyIcon}
                onStart={() => startTear(onOpen)}
                onRip={(x, y) => burst.current?.fire("paper", x, y)}
                onTorn={() => go("tear")}
              />
            </PackStack>
            <p className="text-sm text-[#d9c9a8]">
              {phase.kind === "idle"
                ? "Tirer la bande vers la droite, ou cliquer sur le sachet"
                : " "}
            </p>
            <p className="text-[11px] text-[#a99a8a]">
              {pending.length} en attente ({MAX_PENDING} au maximum)
            </p>
          </div>
        ) : (
          <EmptyPack />
        )}
        {import.meta.env.DEV && (
          <div className="flex gap-1">
            <button onClick={onDevSachet} className={DEV_BUTTON}>
              Dev : +1 sachet
            </button>
            <button onClick={onDevNextDay} className={DEV_BUTTON}>
              Dev : jour suivant
            </button>
            <button onClick={() => startTear(onDevLegendary)} className={DEV_BUTTON}>
              Dev : sachet légendaire
            </button>
          </div>
        )}
      </div>
      <aside className="flex w-[240px] flex-col gap-2.5">
        {herbier.found === herbier.total ? (
          <section className="rounded-xl border border-amber-300/30 bg-[#1a1216]/85 px-3 py-2.5 text-[11px] text-[#a99a8a]">
            Toutes les fleurs sont découvertes.
          </section>
        ) : (
          <PityGauge
            title="Chance de nouveauté"
            chance={chanceOf(GAUGES.discovery, pity.dryDiscovery)}
            rule="+2 points par graine sans nouveauté, jusqu'à 75 %. Retour à 25 % dès qu'une fleur inconnue sort."
          />
        )}
        <PityGauge
          title="Chance de rare ou mieux"
          chance={chanceOf(GAUGES.rare, pity.dryRare)}
          rule="+2 points par graine sans rare, jusqu'à 70 %. Retour à 25 % dès qu'une rare sort."
        />
      </aside>
    </div>
  );
}
