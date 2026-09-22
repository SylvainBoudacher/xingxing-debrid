import { BRANCHES, type TreeNode } from "../../core/catalog/tree";
import { progressOf, stateOf } from "../../core/progression";
import type { GardenSave, SpeciesId } from "../../core/types";
import { SpriteIcon } from "../SpriteIcon";
import { BasketDeposit } from "./BasketDeposit";
import { SILHOUETTE } from "./nodeStyle";

const STATE_FR = {
  verrouille: "Verrouillé",
  ouvert: "En cours",
  pret: "Prêt",
  termine: "Terminé",
} as const;

export function NodeDetail({
  save,
  node,
  onClaim,
  onDeposit,
}: {
  save: GardenSave;
  node: TreeNode;
  onClaim: () => void;
  onDeposit: (species: SpeciesId) => void;
}) {
  const state = stateOf(save, node);
  const { value, target } = progressOf(save, node);
  const branch = BRANCHES[node.branch];
  const locked = state === "verrouille";
  return (
    <aside className="flex w-[260px] flex-col gap-3 rounded-xl border border-amber-300/30 bg-[#1a1216]/85 p-3.5">
      <div className="flex items-center gap-2.5">
        <SpriteIcon sprite={node.icon} cropped className={`h-10 ${locked ? SILHOUETTE : ""}`} />
        <div>
          <h3 className="font-serif text-lg leading-tight text-[#f3dca0]">
            {locked ? "Palier verrouillé" : node.title}
          </h3>
          <span className="text-[10px] uppercase tracking-wide" style={{ color: branch.color }}>
            {branch.name} - {STATE_FR[state]}
          </span>
        </div>
      </div>

      {locked ? (
        <p className="text-[12px] leading-snug text-[#a99a8a]">
          Termine le palier précédent pour découvrir celui-ci.
        </p>
      ) : (
        <>
          <section>
            <h4 className="text-[10px] uppercase tracking-wide text-[#a99a8a]">Tâche</h4>
            <p className="text-[13px] leading-snug text-[#d8c9b4]">{node.taskLabel}</p>
            {node.task.kind !== "panier" && (
              <p className="mt-1 text-[12px] text-[#f3dca0]">
                {Math.min(value, target)} / {target}
              </p>
            )}
          </section>

          {node.task.kind === "panier" && state !== "termine" && (
            <BasketDeposit
              save={save}
              task={node.task}
              deposits={save.progress.baskets[node.id] ?? {}}
              onDeposit={onDeposit}
            />
          )}

          <section>
            <h4 className="text-[10px] uppercase tracking-wide text-[#a99a8a]">Récompense</h4>
            <p className="text-[13px] leading-snug text-[#f3dca0]">{node.rewardLabel}</p>
            <p className="text-[11px] leading-snug text-[#a99a8a]">{node.rewardNote}</p>
          </section>

          {state === "pret" && (
            <button
              onClick={onClaim}
              className="rounded-lg px-3 py-1.5 font-serif text-[15px] font-semibold text-[#231a15]"
              style={{ background: branch.color }}
            >
              Récupérer
            </button>
          )}
        </>
      )}
    </aside>
  );
}
