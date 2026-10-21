import { RARITIES, RARITY_LABEL } from "../../core/catalog/rarity";
import { HIRE_PRICE, levelPrice, MAX_LEVEL, STAFF_LABEL } from "../../core/staff/catalog";
import {
  STAFF_IDS,
  type ParcelId,
  type PotagerSave,
  type Rarity,
  type StaffId,
} from "../../core/types";
import { HD_BUTTON } from "../hdButton";
import { levelLine, parcelNumber, statusLabel } from "../staffView";

const PREV_LABEL: Partial<Record<StaffId, string>> = {
  jardinier: "l'arroseur",
  cueilleur: "le jardinier",
  fleuriste: "le cueilleur",
};

function Price({
  label,
  price,
  po,
  onClick,
}: {
  label: string;
  price: number;
  po: number;
  onClick: () => void;
}) {
  const missing = price - po;
  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={onClick} disabled={missing > 0} className={HD_BUTTON}>
        {label} ({price} PO)
      </button>
      {missing > 0 && <span className="text-sm text-[#e09070]">Il te manque {missing} PO</span>}
    </div>
  );
}

// Un métier dans la maison des employés : embauche, niveau, réglages et ce qu'il fait.
export function StaffCard({
  id,
  save,
  onHire,
  onLevel,
  onParcel,
  onRarity,
  onActive,
}: {
  id: StaffId;
  save: PotagerSave;
  onHire: () => void;
  onLevel: () => void;
  onParcel: (parcel: ParcelId, on: boolean) => void;
  onRarity: (r: Rarity) => void;
  onActive: (on: boolean) => void;
}) {
  const h = save.staff[id];
  const prev = STAFF_IDS[STAFF_IDS.indexOf(id) - 1];
  const locked = !h && prev && !save.staff[prev];
  const status = save.crew[id]?.status;
  return (
    <section className={`border border-[#b8975a]/40 p-3 ${locked ? "opacity-50" : ""}`}>
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-xl font-bold italic">{STAFF_LABEL[id]}</h3>
        {h && status && (
          <span className="text-sm text-[#e8c060] italic">{statusLabel(status)}</span>
        )}
      </div>
      {locked && <p className="text-[#c8b890] italic">Embauche d'abord {PREV_LABEL[id]}</p>}
      {!h && !locked && (
        <Price label="Embaucher" price={HIRE_PRICE[id]} po={save.po} onClick={onHire} />
      )}
      {h && (
        <div className="flex flex-col gap-2">
          <p className="text-[#c8b890]">{levelLine(h.level)}</p>
          {h.level < MAX_LEVEL ? (
            <Price
              label="Niveau suivant"
              price={levelPrice(id, h.level)}
              po={save.po}
              onClick={onLevel}
            />
          ) : (
            <p className="text-[#c8b890] italic">Niveau max</p>
          )}
          {id !== "fleuriste" && (
            <div className="flex flex-wrap gap-3">
              {save.parcels.map((p) => (
                <label key={p} className="flex cursor-pointer items-center gap-1">
                  <input
                    type="checkbox"
                    checked={h.parcels.includes(p)}
                    onChange={(e) => onParcel(p, e.target.checked)}
                  />
                  Parcelle {parcelNumber(p)}
                </label>
              ))}
            </div>
          )}
          {id === "jardinier" && (
            <label className="flex items-center gap-2">
              Sème jusqu'à
              <select
                value={h.maxRarity}
                onChange={(e) => onRarity(e.target.value as Rarity)}
                className="border border-[#b8975a] bg-[#2a1c10] px-1"
              >
                {RARITIES.map((r) => (
                  <option key={r} value={r}>
                    {RARITY_LABEL[r]}
                  </option>
                ))}
              </select>
            </label>
          )}
          {id === "fleuriste" && (
            <button type="button" onClick={() => onActive(!h.active)} className={HD_BUTTON}>
              {h.active ? "Au travail" : "En pause"}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
