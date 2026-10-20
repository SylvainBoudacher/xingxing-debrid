import type { PotagerSave, ToolId } from "../core/types";

export const TOOL_OFFERS: { id: ToolId; name: string; effect: string }[] = [
  { id: "beche", name: "Bêche niv. 2", effect: "bêche 3 cases" },
  { id: "arrosoir", name: "Arrosoir niv. 2", effect: "arrose 3 cases" },
  { id: "serfouette", name: "Serfouette niv. 2", effect: "désherbe 3 cases" },
];

// l'outil est au sac ou au râtelier
export function toolLevel(save: PotagerSave, id: ToolId): 1 | 2 {
  for (const s of save.inventory)
    if (s?.kind === "tool" && s.tool.id === id) return s.tool.level ?? 1;
  return save.rack.find((t) => t.id === id)?.level ?? 1;
}
