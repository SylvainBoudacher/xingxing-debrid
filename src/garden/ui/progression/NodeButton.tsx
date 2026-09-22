import { motion } from "motion/react";
import { BRANCHES, type TreeNode } from "../../core/catalog/tree";
import type { NodeState } from "../../core/progression";
import { SpriteIcon } from "../SpriteIcon";
import { GOLD, SILHOUETTE } from "./nodeStyle";

const R = 22;
const CIRCUMFERENCE = 2 * Math.PI * R;

const discStyle = (state: NodeState, color: string) => {
  switch (state) {
    case "verrouille":
      return { background: "#150f12", boxShadow: "0 2px 6px #0008" };
    case "ouvert":
      return {
        background: `radial-gradient(circle at 50% 35%, ${color}40, #1a1216 75%)`,
        boxShadow: "0 3px 8px #0008",
      };
    case "pret":
      return {
        background: `radial-gradient(circle at 50% 35%, ${color}66, #1a1216 80%)`,
        boxShadow: `inset 0 0 0 2px ${color}`,
      };
    case "termine":
      return {
        background: "radial-gradient(circle at 50% 35%, #5a4630, #2a1f1c 80%)",
        boxShadow: `inset 0 0 0 2px ${color}, 0 0 0 3px ${GOLD}, 0 0 16px ${GOLD}55`,
      };
  }
};

export function NodeButton({
  node,
  state,
  ratio,
  selected,
  blooming,
  onSelect,
}: {
  node: TreeNode;
  state: NodeState;
  ratio: number;
  selected: boolean;
  blooming: boolean;
  onSelect: () => void;
}) {
  const color = BRANCHES[node.branch].color;
  const locked = state === "verrouille";
  const ready = state === "pret";
  return (
    <button
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={locked ? "Palier verrouillé" : node.title}
      className={`group absolute -translate-x-1/2 -translate-y-1/2 ${selected ? "z-20" : "z-10 hover:z-20"}`}
      style={{ left: `${node.x / 10}%`, top: `${node.y / 6.4}%` }}
    >
      {ready && (
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{ boxShadow: `0 0 18px 4px ${color}` }}
          animate={{ opacity: [0.35, 0.9, 0.35] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <motion.span
        className={`relative flex items-center justify-center rounded-full transition-transform group-hover:scale-110 ${
          locked ? "size-10 border border-dashed border-[#6a5846]" : "size-12"
        } ${selected ? "outline-2 outline-offset-4 outline-dashed outline-[#f3dca0]" : ""}`}
        style={discStyle(state, color)}
        animate={blooming ? { scale: [0.5, 1.25, 1], rotate: [-14, 6, 0] } : { scale: 1 }}
        transition={{ duration: blooming ? 0.7 : 0.2 }}
      >
        <SpriteIcon
          sprite={node.icon}
          cropped
          className={locked ? `h-6 ${SILHOUETTE}` : "h-8 drop-shadow-[0_2px_1px_#0009]"}
        />
        {state === "ouvert" && (
          <svg viewBox="0 0 48 48" className="absolute inset-0 size-full -rotate-90" aria-hidden>
            <circle
              cx="24"
              cy="24"
              r={R}
              fill="none"
              stroke={color}
              strokeOpacity="0.2"
              strokeWidth="2.5"
            />
            <circle
              cx="24"
              cy="24"
              r={R}
              fill="none"
              stroke={color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={`${ratio * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            />
          </svg>
        )}
        {ready && (
          <span
            className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full text-[10px] font-bold text-[#231a15] ring-2 ring-[#1a1216]"
            style={{ background: color }}
          >
            !
          </span>
        )}
      </motion.span>
      <span
        className={`pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-amber-300/25 bg-[#1a1216]/90 px-2 py-0.5 font-serif text-[13px] text-[#f3dca0] shadow-lg transition-opacity ${
          selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        {locked ? "???" : node.title}
      </span>
    </button>
  );
}
