import { BRANCHES, nodeById, TREE, type NodeId } from "../../core/catalog/tree";
import { progressOf, stateOf } from "../../core/progression";
import type { GardenSave } from "../../core/types";
import { branchLabels } from "./branchLabels";
import { NodeButton } from "./NodeButton";
import { Vine } from "./Vine";

const LABELS = branchLabels(TREE);
const ROOT = nodeById("root")!;

export function TreeView({
  save,
  selected,
  blooming,
  onSelect,
}: {
  save: GardenSave;
  selected: NodeId;
  blooming: NodeId | null;
  onSelect: (id: NodeId) => void;
}) {
  const rootColor = BRANCHES[ROOT.branch].color;
  return (
    <div className="relative size-full">
      <svg viewBox="0 0 1000 640" className="absolute inset-0 size-full" aria-hidden>
        <path
          d={`M${ROOT.x} 640 L${ROOT.x} ${ROOT.y}`}
          stroke={rootColor}
          strokeWidth="10"
          strokeLinecap="round"
        />
        {TREE.map((n) => {
          const parent = n.parent ? nodeById(n.parent) : undefined;
          if (!parent) return null;
          return (
            <Vine
              key={n.id}
              from={parent}
              to={n}
              state={stateOf(save, n)}
              color={BRANCHES[n.branch].color}
            />
          );
        })}
      </svg>
      {LABELS.map(({ branch, x, y }) => (
        <span
          key={branch}
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 font-serif text-[15px] font-bold tracking-wide [text-shadow:0_1px_6px_#000]"
          style={{ left: `${x / 10}%`, top: `${y / 6.4}%`, color: BRANCHES[branch].color }}
        >
          {BRANCHES[branch].name}
        </span>
      ))}
      {TREE.map((n) => {
        const { value, target } = progressOf(save, n);
        return (
          <NodeButton
            key={n.id}
            node={n}
            state={stateOf(save, n)}
            ratio={Math.min(1, value / target)}
            selected={n.id === selected}
            blooming={n.id === blooming}
            onSelect={() => onSelect(n.id)}
          />
        );
      })}
    </div>
  );
}
