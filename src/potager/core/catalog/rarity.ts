import type { Rarity } from "../types";

export const RARITIES: readonly Rarity[] = ["commune", "rare", "epique", "legendaire"];

// rareté d'une graine trouvée en cueillant une fleur
export const ROLL_HARVEST: Record<Rarity, number> = {
  commune: 0.7,
  rare: 0.22,
  epique: 0.07,
  legendaire: 0.01,
};

export const RARITY_COLOR: Record<Rarity, string> = {
  commune: "#c8b890",
  rare: "#5a9ad8",
  epique: "#b06ad8",
  legendaire: "#e8b040",
};

export const RARITY_LABEL: Record<Rarity, string> = {
  commune: "Commune",
  rare: "Rare",
  epique: "Épique",
  legendaire: "Légendaire",
};
