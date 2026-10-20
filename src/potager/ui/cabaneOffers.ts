import type { PotagerSave, ToolId } from "../core/types";

export const TOOL_OFFERS: { id: ToolId; label: string }[] = [
  { id: "beche", label: "Bêche niv. 2 : bêche 3 cases" },
  { id: "arrosoir", label: "Arrosoir niv. 2 : arrose 3 cases" },
  { id: "serfouette", label: "Serfouette niv. 2 : désherbe 3 cases" },
];

// l'outil est au sac ou au râtelier
export function toolLevel(save: PotagerSave, id: ToolId): 1 | 2 {
  for (const s of save.inventory)
    if (s?.kind === "tool" && s.tool.id === id) return s.tool.level ?? 1;
  return save.rack.find((t) => t.id === id)?.level ?? 1;
}
