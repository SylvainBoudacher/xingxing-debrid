import { canvasTex, dot } from "./pixel";

const PAL: Record<string, string> = {
  o: "#2e1c12",
  h: "#e8c060",
  H: "#b88e3a",
  r: "#c8402e",
  y: "#7a4a24",
  s: "#f4c8a0",
  S: "#d49a78",
  e: "#1e120a",
  b: "#3a6ab0",
  B: "#28487e",
  p: "#6a4a30",
  P: "#4a3020",
  k: "#3a2418",
  c: "#4a9ab0",
  C: "#2a6a80",
};

const BODY = [
  "................",
  "......oooo......",
  ".....ohhhho.....",
  ".....ohhhho.....",
  "....orrrrrro....",
  "..oohhhhhhhhoo..",
  "..oHHHHHHHHHHo..",
  "...oyysssssso...",
  "...oyyssssseo...",
  "...oyysssssso...",
  "....oSSSSSSo....",
  "....obbbbbbo....",
  "...oBbbbbbbbo...",
  "...oBbbbbbbssoo.",
  "...oBbbbbbbocCco",
  "....oBbbbbboocco",
  "....oppppppo.oo.",
  "....oPppppPo....",
];
const LEGS_A = [
  "....oppoppo.....",
  "....opo.opo.....",
  "....opo.opo.....",
  "....opo.opo.....",
  "...okko.okko....",
  "...oooo.oooo....",
];
const LEGS_B = [
  "....oppppppo....",
  "...opo....opo...",
  "..opo......opo..",
  "..opo......opo..",
  ".okko......okko.",
  ".oooo......oooo.",
];

const frame = (legs: string[]) =>
  canvasTex(16, 24, (g) => {
    [...BODY, ...legs].forEach((row, y) =>
      [...row].forEach((ch, x) => PAL[ch] && dot(g, x, y, PAL[ch])),
    );
  });

export const avatarFrames = () => [frame(LEGS_A), frame(LEGS_B)] as const;
