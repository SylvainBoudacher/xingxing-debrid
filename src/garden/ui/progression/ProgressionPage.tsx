import { useState } from "react";
import { nodeById, type NodeId } from "../../core/catalog/tree";
import type { GardenSave, SpeciesId } from "../../core/types";
import { SummaryBar } from "./SummaryBar";
import { NodeDetail } from "./NodeDetail";
import { TreeView } from "./TreeView";
import { TreeViewport } from "./TreeViewport";

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
  // le nœud qui vient d'être récupéré : son bouton éclot une fois
  const [blooming, setBlooming] = useState<NodeId | null>(null);
  const node = nodeById(selected) ?? nodeById("root")!;
  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <SummaryBar save={save} />
      <div className="flex flex-1 gap-4 p-5">
        <TreeViewport>
          <TreeView save={save} selected={selected} blooming={blooming} onSelect={setSelected} />
        </TreeViewport>
        <NodeDetail
          save={save}
          node={node}
          onClaim={() => {
            onClaim(node.id);
            setBlooming(node.id);
          }}
          onDeposit={(species) => onDeposit(node.id, species)}
        />
      </div>
    </div>
  );
}
