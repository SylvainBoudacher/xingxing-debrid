// Raretes du ruban, derivees de la note TMDB. Les seuils CS:GO litteraux (9+
// pour l'or) sont inatteignables avec vote_count.gte=200 : ils sont recalibres
// sur la distribution reelle. Purement descriptif, le tirage reste uniforme.
export type Rarity = "common" | "uncommon" | "rare" | "veryRare" | "exceptional";

const TIERS: Array<{ min: number; rarity: Rarity }> = [
  { min: 8.4, rarity: "exceptional" },
  { min: 7.7, rarity: "veryRare" },
  { min: 7.0, rarity: "rare" },
  { min: 6.0, rarity: "uncommon" },
];

export const RARITY_STYLE: Record<Rarity, { label: string; color: string }> = {
  common: { label: "Commun", color: "#4b69ff" },
  uncommon: { label: "Peu commun", color: "#8847ff" },
  rare: { label: "Rare", color: "#d32ce6" },
  veryRare: { label: "Très rare", color: "#eb4b4b" },
  exceptional: { label: "Exceptionnel", color: "#ffd700" },
};

export function rarityOf(voteAverage: number): Rarity {
  return TIERS.find((t) => voteAverage >= t.min)?.rarity ?? "common";
}
