import { flowerDataUrl } from "../../textures/flowers";
import type { ChestStack, Slot, Tool, ToolId } from "../../core/types";
import { makeSprite } from "../minigames/pixelKit";
import { CAN, SEED, SPADE } from "../minigames/sprites";

// serfouette, manche en diagonale et lame en bas à gauche
const HOE = makeSprite(
  [
    "......wv",
    ".....wv.",
    "....wv..",
    "...wv...",
    "..wv....",
    ".MwV....",
    "MmM.....",
    "MnmM....",
    "MmmmM...",
    ".MMM....",
  ],
  { w: "#8a5a2a", v: "#b07a3a", V: "#b07a3a", M: "#5e6874", m: "#9aa4b0", n: "#d8e0e8" },
);

const TOOL_SPRITE: Record<ToolId, () => HTMLCanvasElement> = {
  beche: SPADE,
  arrosoir: CAN,
  serfouette: HOE,
};

const urls = new Map<() => HTMLCanvasElement, string>();
function spriteUrl(sprite: () => HTMLCanvasElement) {
  let u = urls.get(sprite);
  if (!u) urls.set(sprite, (u = sprite().toDataURL()));
  return u;
}

export const toolIconUrl = (id: ToolId) => spriteUrl(TOOL_SPRITE[id]);

export function itemIconUrl(s: Slot | ChestStack | { kind: "tool"; tool: Tool }) {
  if (s.kind === "tool") return toolIconUrl(s.tool.id);
  if (s.kind === "seeds") return spriteUrl(SEED);
  return flowerDataUrl(s.species, s.color);
}
