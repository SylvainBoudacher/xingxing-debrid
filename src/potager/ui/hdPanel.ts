import { POTAGER_FONT } from "./potagerFont";

const NAIL = "linear-gradient(#c9c3b2, #c9c3b2)";
const NAIL_SHADOW = "linear-gradient(#5b5345, #5b5345)";
const PLANKS =
  "repeating-linear-gradient(180deg, #9a6236 0 34px, #7d4b27 34px 37px, #8e5a30 37px 38px)";

// Habillage partagé : panneau en planches clouées, bordure pixel, police pixel.
export const PANEL_STYLE = {
  ...POTAGER_FONT,
  background: [
    `${NAIL} 8px 8px / 6px 6px no-repeat`,
    `${NAIL} right 8px top 8px / 6px 6px no-repeat`,
    `${NAIL} left 8px bottom 8px / 6px 6px no-repeat`,
    `${NAIL} right 8px bottom 8px / 6px 6px no-repeat`,
    `${NAIL_SHADOW} 10px 10px / 6px 6px no-repeat`,
    `${NAIL_SHADOW} right 6px top 10px / 6px 6px no-repeat`,
    `${NAIL_SHADOW} left 10px bottom 6px / 6px 6px no-repeat`,
    `${NAIL_SHADOW} right 6px bottom 6px / 6px 6px no-repeat`,
    PLANKS,
  ].join(", "),
  border: "4px solid #4a2a14",
  outline: "4px solid #2b170a",
  boxShadow: "10px 12px 0 rgba(0, 0, 0, 0.35)",
  color: "#fff3d6",
  textShadow: "2px 2px 0 #3b200d",
} as const;

// Intertitre d'une section de panneau.
export const PANEL_LABEL =
  "mb-2 flex items-center gap-2 text-xl text-[#ffe39a] before:size-2 before:bg-[#ffe39a] before:shadow-[2px_2px_0_#3b200d] before:content-['']";
