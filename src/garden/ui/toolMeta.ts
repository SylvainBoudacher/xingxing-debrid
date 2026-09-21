import type { Tool } from "../core/actions";
import type { Rarity } from "../core/types";
import type { SpriteRef } from "../sprites/sprite";

export const TOOL_META: Record<Tool, { label: string; icon: SpriteRef }> = {
  main: { label: "Main", icon: { name: "main" } },
  creuser: { label: "Creuser", icon: { name: "transplantoir" } },
  semer: { label: "Semer", icon: { name: "graine", color: "cream" } },
  arroser: { label: "Arroser", icon: { name: "arrosoir" } },
  secateur: { label: "Sécateur", icon: { name: "secateur" } },
  rateau: { label: "Râteau", icon: { name: "rateau" } },
  decor: { label: "Décor", icon: { name: "lanterne" } },
};

export const RARITY_COLOR: Record<Rarity, string> = {
  commune: "#d6cdbf",
  rare: "#6db6f0",
  epique: "#be8cf0",
  legendaire: "#f3c34a",
};
