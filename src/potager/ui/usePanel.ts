import { useEffect, useState } from "react";
import { REACH } from "../core/actions";
import { maisonSign, MAP, parcelSign, parcelStake, type Rect } from "../core/catalog/map";
import type { ParcelId, Point } from "../core/types";
import type { PotagerScene } from "../render/createPotagerScene";

export type Panel =
  | { kind: "abri" }
  | { kind: "etal" }
  | { kind: "cabane" }
  | { kind: "panneau"; parcel: ParcelId }
  | { kind: "chantier" }
  | { kind: "maison" }
  | { kind: "piquet"; parcel: ParcelId };

const box = (r: { x: number; z: number; w: number; d: number }): Rect => ({
  x0: r.x - r.w / 2,
  x1: r.x + r.w / 2,
  z0: r.z - r.d / 2,
  z1: r.z + r.d / 2,
});

// distance de l'avatar au bord de l'élément dont le panneau est ouvert
function panelGap(panel: Panel, p: Point): number {
  if (panel.kind === "panneau" || panel.kind === "piquet" || panel.kind === "chantier") {
    const s =
      panel.kind === "panneau"
        ? parcelSign(panel.parcel)
        : panel.kind === "piquet"
          ? parcelStake(panel.parcel)
          : maisonSign();
    return Math.hypot(p.x - s.x, p.z - s.z);
  }
  const r = box(panel.kind === "abri" ? MAP.abri : MAP.buildings.find((b) => b.id === panel.kind)!);
  return Math.hypot(Math.max(0, r.x0 - p.x, p.x - r.x1), Math.max(0, r.z0 - p.z, p.z - r.z1));
}

// Panneau ouvert devant un élément : Échap ou s'éloigner le ferme.
export function usePanel(scene: PotagerScene | null) {
  const [panel, setPanel] = useState<Panel | null>(null);

  useEffect(() => {
    if (!scene || !panel) return;
    const id = setInterval(() => {
      if (panelGap(panel, scene.avatar.pose()) > REACH + 1) setPanel(null);
    }, 250);
    return () => clearInterval(id);
  }, [scene, panel]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.code === "Escape" && setPanel(null);
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);

  return { panel, open: setPanel, close: () => setPanel(null) };
}
