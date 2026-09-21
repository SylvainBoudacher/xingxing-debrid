import { useState } from "react";
import { nodeById, type NodeId } from "../../core/catalog/tree";
import type { GardenSave, SpeciesId } from "../../core/types";
import { SummaryBar } from "./SummaryBar";
import { NodeDetail } from "./NodeDetail";
import { TreeView } from "./TreeView";

export function ProgressionPage({
  save,
  onClaim,
  onDeposit,
}: {
  save: GardenSave;
  onClaim: (id: NodeId) => void;
  onDeposit: (id: NodeId, species: SpeciesId) => void;
}) {
  const [selected, setSelected] = useState<NodeId>("root");
  const node = nodeById(selected) ?? nodeById("root")!;
  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <SummaryBar save={save} />
      <div className="flex flex-1 gap-4 p-5">
        <div className="flex flex-1 items-center justify-center rounded-xl bg-[radial-gradient(60%_60%_at_50%_60%,rgba(143,207,90,.08),transparent)]">
          <TreeView save={save} selected={selected} onSelect={setSelected} />
        </div>
        <NodeDetail
          save={save}
          node={node}
          onClaim={() => onClaim(node.id)}
          onDeposit={(species) => onDeposit(node.id, species)}
        />
      </div>
    </div>
  );
}
