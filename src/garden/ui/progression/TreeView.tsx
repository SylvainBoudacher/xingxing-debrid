import { BRANCHES, nodeById, TREE, type NodeId } from "../../core/catalog/tree";
import { progressOf, stateOf } from "../../core/progression";
import type { GardenSave } from "../../core/types";
import { NodeButton } from "./NodeButton";
import { vinePath } from "./vines";

export function TreeView({
  save,
  selected,
  onSelect,
}: {
  save: GardenSave;
  selected: NodeId;
  onSelect: (id: NodeId) => void;
}) {
  return (
    <div className="relative mx-auto aspect-[1000/640] w-full max-w-[860px]">
      <svg viewBox="0 0 1000 640" className="absolute inset-0 size-full" aria-hidden>
        {TREE.map((n) => {
          const parent = n.parent ? nodeById(n.parent) : undefined;
          if (!parent) return null;
          const open = stateOf(save, n) !== "verrouille";
          return (
            <path
              key={n.id}
              d={vinePath(parent, n)}
              fill="none"
              stroke={open ? BRANCHES[n.branch].color : "#4a3c32"}
              strokeOpacity={open ? 0.7 : 0.45}
              strokeWidth={open ? 4 : 3}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      {TREE.map((n) => {
        const { value, target } = progressOf(save, n);
        return (
          <NodeButton
            key={n.id}
            node={n}
            state={stateOf(save, n)}
            ratio={Math.min(1, value / target)}
            selected={n.id === selected}
            onSelect={() => onSelect(n.id)}
          />
        );
      })}
    </div>
  );
}
