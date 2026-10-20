import { useMemo, useState } from "react";
import { RARITY_COLOR, RARITY_LABEL } from "../core/catalog/rarity";
import type { PotagerSave } from "../core/types";
import { flowerDataUrl } from "../textures/flowers";
import { PANEL_STYLE } from "./hdPanel";
import { herbierView, type HerbierItem } from "./herbierView";

export function HerbierPanel({ save, onClose }: { save: PotagerSave; onClose: () => void }) {
  const view = useMemo(() => herbierView(save), [save]);
  const [picked, setPicked] = useState<Extract<HerbierItem, { found: true }> | null>(null);
  return (
    <div
      className="absolute top-1/2 left-1/2 z-10 flex max-h-[85vh] w-[720px] -translate-x-1/2 -translate-y-1/2 flex-col p-5"
      style={PANEL_STYLE}
    >
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-3xl font-bold italic">
          Herbier : {view.found} / {view.total}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer text-sm text-[#c8b890] hover:text-white"
        >
          Fermer (Échap)
        </button>
      </div>
      <div className="grid grid-cols-10 gap-1.5 overflow-y-auto pr-1">
        {view.entries.map((e, i) => (
          <button
            key={i}
            type="button"
            title={e.found ? e.name : "?"}
            onClick={() => e.found && setPicked(e)}
            className="flex aspect-[2/3] cursor-pointer items-center justify-center border-2 bg-[rgba(20,14,10,0.6)]"
            style={{ borderColor: RARITY_COLOR[e.rarity] }}
          >
            {e.found ? (
              <img
                src={flowerDataUrl(e.species, e.color)}
                alt={e.name}
                className="h-full w-full"
                style={{ imageRendering: "pixelated" }}
              />
            ) : (
              <span className="text-2xl text-[#5a4630]">?</span>
            )}
          </button>
        ))}
      </div>
      <div className="mt-3 min-h-16 text-lg">
        {picked ? (
          <>
            <p className="font-bold">
              {picked.name}{" "}
              <span style={{ color: RARITY_COLOR[picked.rarity] }}>
                ({RARITY_LABEL[picked.rarity]})
              </span>
            </p>
            <p className="text-base text-[#e6d8b8] italic">{picked.note}</p>
          </>
        ) : (
          <p className="text-base text-[#a8977a] italic">
            Choisis une fleur découverte pour lire la note du jardinier.
          </p>
        )}
      </div>
    </div>
  );
}
