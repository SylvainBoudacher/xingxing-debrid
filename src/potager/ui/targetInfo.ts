import type { Target } from "../core/actions";
import { maisonSign, MAP, parcelSign, parcelStake } from "../core/catalog/map";
import type { Point, PotagerSave } from "../core/types";
import { parcelNumber } from "./staffView";

export type TargetInfo = { title: string; text: string; at: Point };

const building = (id: string) => MAP.buildings.find((b) => b.id === id)!;

// Nom et rôle de l'objet visé (hors cases, qui ont leur fiche de plante).
export function targetInfo(save: PotagerSave, t: Target): TargetInfo | null {
  switch (t.kind) {
    case "cell":
      return null;
    case "abri":
      return { title: "Abri de jardin", text: "Range tes outils et tes fleurs", at: MAP.abri };
    case "puits":
      return { title: "Puits", text: "Remplis ton arrosoir", at: MAP.puits };
    case "etal":
      return { title: "Étal", text: "Vends tes fleurs aux clients", at: building("etal") };
    case "cabane":
      return { title: "Cabane à graines", text: "Achète des sachets", at: building("cabane") };
    case "maison":
      return { title: "Maison des employés", text: "Embauche de l'aide", at: building("maison") };
    case "chantier":
      return { title: "Chantier", text: "Construis la maison des employés", at: maisonSign() };
    case "panneau":
      return { title: "Parcelle à vendre", text: "Agrandis ton potager", at: parcelSign(t.parcel) };
    case "piquet":
      return {
        title: `Piquet de la parcelle ${parcelNumber(t.parcel)}`,
        text: "Confie la parcelle à tes employés",
        at: parcelStake(t.parcel),
      };
    case "foret": {
      const item = save.forest[t.spot];
      if (!item) return null;
      return {
        title: item === "gland" ? "Gland" : "Champignon",
        text: "Ramasse-le pour une graine",
        at: MAP.forest[t.spot],
      };
    }
  }
}
