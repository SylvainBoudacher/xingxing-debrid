import { flowerName, RARITY_FR } from "../core/labels";
import type { Flower } from "../core/types";
import { RARITY_COLOR } from "./toolMeta";

export function DiscoveryToast({ found }: { found: Flower[] }) {
  return (
    <div className="text-center">
      <div className="text-xs text-[#a99a8a]">
        {found.length > 1 ? "Nouvelles découvertes" : "Nouvelle découverte"}
      </div>
      {found.map((f) => (
        <b key={`${f.species}:${f.color}`} className="block font-serif text-lg">
          {flowerName(f)}{" "}
          <span style={{ color: RARITY_COLOR[f.rarity] }}>
            ({RARITY_FR[f.rarity].toLowerCase()})
          </span>
        </b>
      ))}
    </div>
  );
}
