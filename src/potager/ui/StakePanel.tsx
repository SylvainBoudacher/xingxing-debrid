import { STAFF_LABEL } from "../core/staff/catalog";
import type { ParcelId, PotagerSave, StaffId } from "../core/types";
import { PANEL_STYLE } from "./hdPanel";
import { PanelHeader } from "./PanelHeader";
import { parcelNumber } from "./staffView";

const FIELD_STAFF: StaffId[] = ["arroseur", "jardinier", "cueilleur"];

// Piquet d'une parcelle : quels employés s'en occupent.
export function StakePanel({
  save,
  parcel,
  onParcel,
  onClose,
}: {
  save: PotagerSave;
  parcel: ParcelId;
  onParcel: (id: StaffId, on: boolean) => void;
  onClose: () => void;
}) {
  const hired = FIELD_STAFF.filter((id) => save.staff[id]);
  return (
    <div
      className="absolute top-1/2 left-1/2 z-10 w-[380px] -translate-x-1/2 -translate-y-1/2 p-5"
      style={PANEL_STYLE}
    >
      <PanelHeader title={`Parcelle ${parcelNumber(parcel)}`} onClose={onClose} />
      {!hired.length && <p className="text-[#c8b890] italic">Aucun employé à qui la confier</p>}
      <div className="flex flex-col gap-2">
        {hired.map((id) => (
          <label key={id} className="flex cursor-pointer items-center gap-2 text-lg">
            <input
              type="checkbox"
              checked={save.staff[id]!.parcels.includes(parcel)}
              onChange={(e) => onParcel(id, e.target.checked)}
            />
            {STAFF_LABEL[id]}
          </label>
        ))}
      </div>
    </div>
  );
}
