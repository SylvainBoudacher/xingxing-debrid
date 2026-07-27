import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";

// Le levier de la borne. On peut l'attraper et le tirer vers le bas: la rotation
// suit le doigt, et le tirage ne part que si la course est assez franche. Un
// simple clic (ou Entrée au clavier) joue la même descente automatiquement.
//
// Le geste est câblé sur des pointer events bruts plutôt que sur le pan de
// motion: le pan passe par la boucle d'animation, qui est suspendue quand la
// fenêtre n'est pas au premier plan. Ici, seul le décor dépend de l'animation,
// jamais le déclenchement.

const TRAVEL = 96; // course en pixels pour un tir complet
const TRIGGER = 0.62; // part de la course à partir de laquelle le tirage part
const REST = -6; // le bras repose légèrement relevé
const PULLED = 42;

const clamp = (v: number) => Math.min(1, Math.max(0, v));

export function SlotLever({ disabled, onPull }: { disabled: boolean; onPull: () => void }) {
  const pull = useMotionValue(0);
  const rotate = useTransform(pull, [0, 1], [REST, PULLED]);
  const grabY = useRef<number | null>(null);
  const moved = useRef(false);

  function springBack() {
    animate(pull, 0, { type: "spring", stiffness: 240, damping: 11 });
  }

  // descente franche puis retour élastique, pour un tir qui n'a pas été tiré
  // à la main
  function autoPull() {
    onPull();
    animate(pull, [0, 1, 0], { duration: 0.8, times: [0, 0.18, 1], ease: ["easeIn", "easeOut"] });
  }

  function handleDown(e: ReactPointerEvent<HTMLButtonElement>) {
    if (disabled) return;
    grabY.current = e.clientY;
    moved.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handleMove(e: ReactPointerEvent<HTMLButtonElement>) {
    if (grabY.current === null) return;
    const p = clamp((e.clientY - grabY.current) / TRAVEL);
    if (p > 0.05) moved.current = true;
    pull.set(p);
  }

  function handleUp() {
    if (grabY.current === null) return;
    const fired = pull.get() >= TRIGGER;
    grabY.current = null;
    if (!moved.current) return autoPull(); // simple clic sur le pommeau
    springBack();
    if (fired) onPull();
  }

  return (
    <div className="relative h-[150px] w-12 shrink-0 select-none">
      {/* socle boulonné au flanc de la borne */}
      <div className="absolute bottom-0 left-1/2 h-8 w-8 -translate-x-1/2 rounded-full bg-gradient-to-b from-zinc-500 to-zinc-800 ring-1 ring-black/40" />
      <div className="absolute bottom-3 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-zinc-900/80" />

      <motion.button
        type="button"
        aria-label="Tirer le levier"
        disabled={disabled}
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerCancel={handleUp}
        // les clics souris passent par le geste ci-dessus; celui-ci ne sert
        // qu'aux activations clavier, qui n'émettent aucun pointer event
        onClick={(e) => !disabled && e.detail === 0 && autoPull()}
        style={{ rotate, originX: 0.5, originY: 1 }}
        className="absolute bottom-4 left-1/2 h-[104px] w-[38px] -translate-x-1/2 cursor-grab touch-none active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50"
      >
        {/* tige */}
        <span
          className={`absolute bottom-0 left-1/2 h-full w-[9px] -translate-x-1/2 rounded-full bg-gradient-to-r ${
            disabled
              ? "from-zinc-600 via-zinc-400 to-zinc-600"
              : "from-zinc-500 via-zinc-200 to-zinc-500"
          }`}
        />
        {/* pommeau */}
        <span
          className={`absolute -top-1 left-1/2 h-[30px] w-[30px] -translate-x-1/2 rounded-full ring-2 shadow-lg ${
            disabled
              ? "bg-gradient-to-br from-zinc-500 to-zinc-700 ring-white/10"
              : "bg-gradient-to-br from-[#FF7A6B] to-[#A81B26] ring-white/30"
          }`}
        >
          <span className="absolute left-[7px] top-[5px] h-2 w-3 rounded-full bg-white/40 blur-[1px]" />
        </span>
      </motion.button>
    </div>
  );
}
