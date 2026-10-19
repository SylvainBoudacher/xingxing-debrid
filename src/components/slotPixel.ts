import type { CSSProperties } from "react";

// Palette et cadres de la borne, repris de la borne dessinée au sol du bassin
// (slotIcon.ts): la modale en est la vue rapprochée.

export const PX = {
  outline: "#2A0A14",
  cabinet: "#C0284A",
  cabinetDark: "#8A1A34",
  cabinetLight: "#E0506C",
  gold: "#E8B93C",
  goldDark: "#A87A1C",
  goldLight: "#FFE08A",
  goldOff: "#8A7462",
  ink: "#1C1C22",
  ivory: "#FFF7FA",
  ivoryShade: "#E6D3DA",
  pink: "#FF3B7B",
  yellow: "#FFD24D",
  steel: "#B0B0BC",
  steelDark: "#6E6E7A",
  steelLight: "#E6E6EC",
} as const;

export const PIXEL_FONT = "'Jersey 10', monospace";

// Cadre pixel: une bordure pleine aux coins crantés (quatre ombres décalées,
// les coins restent vides) et, en option, un biseau clair en haut à gauche et
// sombre en bas à droite. Les ombres ne prennent pas de place: prévoir `p` de
// marge autour de l'élément.
export function pixelFrame(
  fill: string,
  border: string,
  p = 3,
  bevel?: { light: string; dark: string },
): CSSProperties {
  const shadows = [
    `0 -${p}px 0 0 ${border}`,
    `0 ${p}px 0 0 ${border}`,
    `-${p}px 0 0 0 ${border}`,
    `${p}px 0 0 0 ${border}`,
  ];
  if (bevel) {
    shadows.push(
      `inset ${p}px ${p}px 0 0 ${bevel.light}`,
      `inset -${p}px -${p}px 0 0 ${bevel.dark}`,
    );
  }
  return { background: fill, boxShadow: shadows.join(", ") };
}
