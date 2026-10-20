import type { Ramp } from "./raster";

// 4 tons par gamme, du plus sombre au plus clair.
export const PAL = {
  green: ["#243d26", "#3e6b2f", "#5f9a3a", "#9cc75a"],
  yellow: ["#8a4a0c", "#d98e14", "#f5c52a", "#fff08a"],
  brown: ["#2e180c", "#5e3418", "#87501f", "#b07a34"],
  pink: ["#7a2350", "#c24a86", "#ec84b4", "#ffc4de"],
  white: ["#6c6a84", "#b4b4c8", "#e6e6ef", "#ffffff"],
  violet: ["#3a2366", "#6a44a8", "#9a76d6", "#c9b0f2"],
  lilac: ["#5a3a7a", "#9270b8", "#c0a4e0", "#eadcfa"],
  blue: ["#1c2a6e", "#3456b8", "#5a8ae6", "#a8ccff"],
  apricot: ["#7a3a1a", "#c8703c", "#f0a070", "#ffd4b0"],
  cream: ["#8a8a70", "#c8c6a8", "#ecebd4", "#ffffff"],
  hay: ["#6e4e1c", "#a8802e", "#d2b050", "#f0dc8a"],
  glow: ["#c8801c", "#f6c343", "#ffe38a", "#fffbe0"],
} as const satisfies Record<string, Ramp>;
