import type { Demand } from "../../core/types";
import { flowerDataUrl } from "../../textures/flowers";
import { demandLabel } from "../demandLabel";

// Le mot du client, épinglé sur une feuille de papier.
export function ClientNote({ demand }: { demand: Demand }) {
  return (
    <div
      className="relative mb-5 flex items-center gap-3 border-2 border-[#8a7048] px-4 py-2 text-[#3a2814] shadow-[2px_4px_6px_rgba(0,0,0,0.5)]"
      style={{
        background: "linear-gradient(180deg, #f2e2b0, #e0cc92)",
        textShadow: "none",
        transform: "rotate(-0.6deg)",
      }}
    >
      <span className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full border border-[#5a1010] bg-[#c8453a]" />
      <img
        src={flowerDataUrl(demand.species, demand.color)}
        alt=""
        className="h-12 w-12"
        style={{ imageRendering: "pixelated" }}
      />
      <p className="text-lg">
        Un client demande : <span className="font-bold">{demandLabel(demand)}</span>
      </p>
    </div>
  );
}
