import { STAFF_IDS, type PotagerSave } from "../core/types";
import { PANEL_STYLE } from "./hdPanel";
import { StaffCard } from "./maison/StaffCard";
import { PanelHeader } from "./PanelHeader";
import type { useStaff } from "./useStaff";

export function MaisonPanel({
  save,
  staff,
  onClose,
}: {
  save: PotagerSave;
  staff: ReturnType<typeof useStaff>;
  onClose: () => void;
}) {
  return (
    <div
      className="absolute top-1/2 left-1/2 z-10 max-h-[96vh] w-[600px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto p-5"
      style={PANEL_STYLE}
    >
      <PanelHeader title="Maison des employés" onClose={onClose} />
      <div className="flex flex-col gap-3">
        {STAFF_IDS.map((id) => (
          <StaffCard
            key={id}
            id={id}
            save={save}
            onHire={() => staff.hire(id)}
            onLevel={() => staff.levelUp(id)}
            onParcel={(p, on) => staff.setParcel(id, p, on)}
            onRarity={staff.setMaxRarity}
            onActive={staff.setFloristActive}
          />
        ))}
      </div>
    </div>
  );
}
