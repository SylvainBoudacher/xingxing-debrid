import { useCallback } from "react";
import {
  buyMaison,
  hire,
  levelUp,
  setFloristActive,
  setMaxRarity,
  setStaffParcel,
  type StaffRefusal,
} from "../core/staff/shop";
import type { ParcelId, PotagerSave, Rarity, StaffId } from "../core/types";
import type { SimHost } from "../sim/simHost";

const REFUSAL: Record<StaffRefusal, string> = {
  po: "Pas assez de PO",
  place: "Plus de place",
  deja: "Déjà acheté",
  ordre: "Embauche d'abord le métier précédent",
  max: "Niveau maximum",
  maison: "Construis d'abord la maison",
};

// Maison, embauches, niveaux et réglages des employés ; chaque refus s'affiche dans la bulle.
export function useStaff(host: SimHost | null, say: (text: string) => void) {
  const buy = useCallback(
    (fn: (s: PotagerSave) => PotagerSave | { refused: StaffRefusal }): boolean => {
      const s = host?.state();
      if (!host || !s) return false;
      const out = fn(s);
      if ("refused" in out) {
        say(REFUSAL[out.refused]);
        return false;
      }
      host.update((cur) => {
        const next = fn(cur);
        return "refused" in next ? cur : next;
      });
      return true;
    },
    [host, say],
  );
  const set = useCallback((fn: (s: PotagerSave) => PotagerSave) => host?.update(fn), [host]);

  return {
    buyMaison: () => buy(buyMaison),
    hire: (id: StaffId) => buy((s) => hire(s, id)),
    levelUp: (id: StaffId) => buy((s) => levelUp(s, id)),
    setParcel: (id: StaffId, parcel: ParcelId, on: boolean) =>
      set((s) => setStaffParcel(s, id, parcel, on)),
    setMaxRarity: (r: Rarity) => set((s) => setMaxRarity(s, r)),
    setFloristActive: (on: boolean) => set((s) => setFloristActive(s, on)),
  };
}
