import { useMemo, useState } from "react";
import { RARITY_COLOR, RARITY_LABEL } from "../core/catalog/rarity";
import type { PotagerSave } from "../core/types";
import { CATALOG_ENTRIES } from "../core/catalog/species";
import { flowerDataUrl, silhouetteDataUrl } from "../textures/flowers";
import { PANEL_STYLE } from "./hdPanel";
import { herbierView, type HerbierItem } from "./herbierView";
import { PanelHeader } from "./PanelHeader";

export function HerbierPanel({ save, onClose }: { save: PotagerSave; onClose: () => void }) {
  const view = useMemo(() => herbierView(save), [save]);
  const [picked, setPicked] = useState<Extract<HerbierItem, { found: true }> | null>(null);
  return (
    <div
      className="absolute top-1/2 left-1/2 z-10 flex max-h-[85vh] w-[720px] -translate-x-1/2 -translate-y-1/2 flex-col p-5"
      style={PANEL_STYLE}
    >
      <PanelHeader title={`Herbier : ${view.found} / ${view.total}`} onClose={onClose} />
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
              <span className="relative flex h-full w-full items-center justify-center">
                <img
                  src={silhouetteDataUrl(CATALOG_ENTRIES[i].species)}
                  alt=""
                  className="h-full w-full opacity-80"
                  style={{ imageRendering: "pixelated" }}
                />
                <span className="absolute text-2xl text-[#d8bd88]">?</span>
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="mt-3 min-h-16 text-lg">
        {picked ? (
          <>
            <p>
              {picked.name}{" "}
              <span style={{ color: RARITY_COLOR[picked.rarity] }}>
                ({RARITY_LABEL[picked.rarity]})
              </span>
            </p>
            <p className="text-base text-[#e6d8b8]">{picked.note}</p>
          </>
        ) : (
          <p className="text-base text-[#d8bd88]">
            Choisis une fleur découverte pour lire la note du jardinier.
          </p>
        )}
      </div>
    </div>
  );
}
