import type { Refusal } from "../economy/shop";
import {
  STAFF_IDS,
  type Hired,
  type ParcelId,
  type PotagerSave,
  type Rarity,
  type StaffId,
} from "../types";
import { HIRE_PRICE, levelPrice, MAISON_PRICE, MAX_LEVEL } from "./catalog";

export type StaffRefusal = Refusal | "ordre" | "max" | "maison";
type Bought = PotagerSave | { refused: StaffRefusal };

const pay = (save: PotagerSave, price: number): Bought =>
  save.po < price ? { refused: "po" } : { ...save, po: save.po - price };

const withHired = (save: PotagerSave, id: StaffId, patch: Partial<Hired>): PotagerSave => {
  const h = save.staff[id];
  return h ? { ...save, staff: { ...save.staff, [id]: { ...h, ...patch } } } : save;
};

export function buyMaison(save: PotagerSave): Bought {
  if (save.buildings.includes("maison")) return { refused: "deja" };
  const paid = pay(save, MAISON_PRICE);
  return "refused" in paid ? paid : { ...paid, buildings: [...paid.buildings, "maison"] };
}

export function hire(save: PotagerSave, id: StaffId): Bought {
  if (!save.buildings.includes("maison")) return { refused: "maison" };
  if (save.staff[id]) return { refused: "deja" };
  const prev = STAFF_IDS[STAFF_IDS.indexOf(id) - 1];
  if (prev && !save.staff[prev]) return { refused: "ordre" };
  const paid = pay(save, HIRE_PRICE[id]);
  if ("refused" in paid) return paid;
  const hired: Hired = { level: 1, parcels: [], maxRarity: "commune", active: true };
  return { ...paid, staff: { ...paid.staff, [id]: hired } };
}

export function levelUp(save: PotagerSave, id: StaffId): Bought {
  const h = save.staff[id];
  if (!h) return { refused: "ordre" };
  if (h.level >= MAX_LEVEL) return { refused: "max" };
  const paid = pay(save, levelPrice(id, h.level));
  return "refused" in paid ? paid : withHired(paid, id, { level: (h.level + 1) as Hired["level"] });
}

export function setStaffParcel(
  save: PotagerSave,
  id: StaffId,
  parcel: ParcelId,
  on: boolean,
): PotagerSave {
  const h = save.staff[id];
  if (!h || id === "fleuriste" || !save.parcels.includes(parcel)) return save;
  if (on === h.parcels.includes(parcel)) return save;
  return withHired(save, id, {
    parcels: on ? [...h.parcels, parcel] : h.parcels.filter((p) => p !== parcel),
  });
}

export const setMaxRarity = (save: PotagerSave, maxRarity: Rarity) =>
  withHired(save, "jardinier", { maxRarity });

export const setFloristActive = (save: PotagerSave, active: boolean) =>
  withHired(save, "fleuriste", { active });
