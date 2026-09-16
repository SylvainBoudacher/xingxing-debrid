import type { Ramp } from "./raster";

// Palette "Chaleureux" : 4 tons par gamme, du plus sombre au plus clair.
export const PAL = {
  crow: ["#0e0c16", "#1f1c2c", "#343048", "#5a5474"],
  green: ["#243d26", "#3e6b2f", "#5f9a3a", "#9cc75a"],
  darkLeaf: ["#1a3020", "#2c4f2e", "#437438", "#66994a"],
  yellow: ["#8a4a0c", "#d98e14", "#f5c52a", "#fff08a"],
  brown: ["#2e180c", "#5e3418", "#87501f", "#b07a34"],
  pink: ["#7a2350", "#c24a86", "#ec84b4", "#ffc4de"],
  white: ["#6c6a84", "#b4b4c8", "#e6e6ef", "#ffffff"],
  violet: ["#3a2366", "#6a44a8", "#9a76d6", "#c9b0f2"],
  red: ["#5e1024", "#a8243a", "#dc4a4a", "#f79080"],
  orange: ["#6e2a0c", "#b8521c", "#e8862e", "#ffc070"],
  bronze: ["#5a2a14", "#9a4a1e", "#cf7a34", "#f0b060"],
  lilac: ["#5a3a7a", "#9270b8", "#c0a4e0", "#eadcfa"],
  heather: ["#4a1a4a", "#8a3480", "#c05ab0", "#e89ad8"],
  cream: ["#8a8a70", "#c8c6a8", "#ecebd4", "#ffffff"],
  wood: ["#3a2418", "#6a4428", "#9a6a40", "#c69a64"],
  metal: ["#23222c", "#3d3b4a", "#5d5a6c", "#8a879a"],
  hay: ["#6e4e1c", "#a8802e", "#d2b050", "#f0dc8a"],
  glow: ["#c8801c", "#f6c343", "#ffe38a", "#fffbe0"],
  grass: ["#2f5226", "#447230", "#578c38", "#7fb44a"],
  soil: ["#2e1c14", "#4e3222", "#654230", "#7e5a42"],
  wet: ["#1e120e", "#342218", "#452e22", "#583c2e"],
  fall: ["#b8401c", "#e08a2a", "#f2c14a", "#8f2a1a"],
} satisfies Record<string, Ramp>;

export type PaletteKey = keyof typeof PAL;
