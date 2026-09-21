import { BRANCHES, type TreeNode } from "../../core/catalog/tree";
import type { NodeState } from "../../core/progression";
import { SpriteIcon } from "../SpriteIcon";

const R = 21;
const CIRCUMFERENCE = 2 * Math.PI * R;

export function NodeButton({
  node,
  state,
  ratio,
  selected,
  onSelect,
}: {
  node: TreeNode;
  state: NodeState;
  ratio: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const color = BRANCHES[node.branch].color;
  const locked = state === "verrouille";
  const done = state === "termine";
  const ready = state === "pret";
  return (
    <button
      onClick={onSelect}
      aria-pressed={selected}
      title={locked ? "Verrouillé" : node.title}
      className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full p-0.5 transition ${
        selected ? "ring-2 ring-amber-200/80" : ""
      } ${ready ? "animate-pulse" : ""}`}
      style={{ left: `${node.x / 10}%`, top: `${node.y / 6.4}%` }}
    >
      <span
        className="relative flex size-12 items-center justify-center rounded-full"
        style={{
          background: done ? `${color}22` : "#1a1216cc",
          boxShadow: `inset 0 0 0 2px ${done || ready ? color : "#5a4a3a"}`,
        }}
      >
        <SpriteIcon
          sprite={locked ? { name: "graine", color: "cream" } : node.icon}
          cropped
          className={`h-8 ${locked ? "opacity-40 grayscale" : ""}`}
        />
        {!locked && !done && (
          <svg viewBox="0 0 48 48" className="absolute inset-0 size-full -rotate-90">
            <circle
              cx="24"
              cy="24"
              r={R}
              fill="none"
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${ratio * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            />
          </svg>
        )}
      </span>
    </button>
  );
}
