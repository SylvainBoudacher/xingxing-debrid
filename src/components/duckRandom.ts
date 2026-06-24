import type { Accessory, Pattern, Variant } from "./duckTypes";

// Procedural duck skins: instead of picking from a fixed catalog, each spawn
// rolls a rarity tier and then composes a body color + accessory + pattern +
// effect. Rarer tiers stack the flashy combos, so legendaries are genuinely
// uncommon rather than just "not duplicated in a list".

const ORANGE_BEAK = "#F5811F";

// body palette; classic yellow is weighted heaviest so it stays the default look
const BODY_COLORS: [string, number][] = [
  ["#FFD21E", 5], // classic yellow
  ["#F4F7FB", 2], // white
  ["#FB7AA8", 1], // pink
  ["#E0457B", 1], // magenta
  ["#FF6F61", 1], // coral
  ["#F0584E", 1], // red
  ["#FF9A3C", 1], // orange
  ["#5EE6C5", 1], // mint
  ["#3FD0C8", 1], // teal
  ["#7BD850", 1], // lime
  ["#4FB0F0", 1], // sky blue
  ["#5B8DEF", 1], // blue
  ["#A7D8FF", 1], // baby blue
  ["#A78BFA", 1], // purple
  ["#C9A8FF", 1], // lavender
  ["#7C6B8A", 1], // dusk purple
  ["#4A5568", 1], // charcoal
];

// vivid colors handed to accessories that render with v.accColor
const ACC_COLORS = [
  "#E0457B",
  "#FB7185",
  "#5B8DEF",
  "#4FB0F0",
  "#3FD0C8",
  "#FFE066",
  "#FF6F61",
  "#A78BFA",
  "#7BD850",
  "#8B5A2B",
];

// accessories that read v.accColor (the rest hardcode their own colors)
const COLORED_ACC = new Set<Accessory>([
  "crown",
  "party",
  "tophat",
  "sunhat",
  "flower",
  "bowtie",
  "headphones",
  "beanie",
  "wizard",
  "cowboy",
  "propeller",
  "scarf",
  "monocle",
]);

const COMMON_ACC: Accessory[] = [
  "none",
  "none",
  "none",
  "shades",
  "bowtie",
  "sunhat",
  "flower",
  "scarf",
  "headphones",
  "monocle",
];
const UNCOMMON_ACC: Accessory[] = [
  "crown",
  "party",
  "tophat",
  "beanie",
  "cowboy",
  "chef",
  "antlers",
  "propeller",
];
const SIMPLE_PATTERNS: Pattern[] = ["spots", "stripes", "polka"];

function weighted<T>(items: [T, number][]): T {
  let total = 0;
  for (const [, w] of items) total += w;
  let r = Math.random() * total;
  for (const [item, w] of items) if ((r -= w) < 0) return item;
  return items[items.length - 1][0];
}

const randOf = <T>(arr: T[]): T => arr[(Math.random() * arr.length) | 0];

const bodyColor = () => weighted(BODY_COLORS);

// build a plain variant with the given accessory, attaching a random accColor
// only when the accessory actually renders one
function withAcc(acc: Accessory): Variant {
  const v: Variant = { body: bodyColor(), beak: ORANGE_BEAK, acc };
  if (COLORED_ACC.has(acc)) v.accColor = randOf(ACC_COLORS);
  return v;
}

// flashy one-of-a-kind looks; their body/beak are fixed by the pattern/effect
const LEGENDARY: (() => Variant)[] = [
  () => ({ body: "#FFD21E", beak: ORANGE_BEAK, acc: "none", pattern: "rainbow" }),
  () => ({
    body: "#F5C518",
    beak: ORANGE_BEAK,
    acc: "crown",
    accColor: "#FFF0A0",
    pattern: "gold",
  }),
  () => ({ body: "#2A2150", beak: "#C9A8FF", acc: "none", pattern: "galaxy", effect: "sparkle" }),
  () => ({ body: "#A7C7FF", beak: "#E8A0C0", acc: "none", effect: "ghost" }),
  () => ({ body: "#7BB85A", beak: "#5A7A3A", acc: "none", pattern: "zombie" }),
  () => ({ body: "#AEB6BF", beak: "#7A828B", acc: "antenna", pattern: "metal" }),
];

const RARE: (() => Variant)[] = [
  () => ({ body: bodyColor(), beak: ORANGE_BEAK, acc: "halo", effect: "glow" }),
  () => ({ body: bodyColor(), beak: ORANGE_BEAK, acc: "snorkel", effect: "bubbles" }),
  () => withAcc("wizard"),
  () => ({ body: bodyColor(), beak: ORANGE_BEAK, acc: "viking" }),
  () => ({ body: "#FFD21E", beak: "#2A2A2A", acc: "pirate" }),
  () => ({ body: "#F0584E", beak: ORANGE_BEAK, acc: "devil" }),
  () => ({ body: bodyColor(), beak: ORANGE_BEAK, acc: "none", effect: "glow" }),
];

export function randomVariant(): Variant {
  const roll = Math.random();
  if (roll < 0.03) return randOf(LEGENDARY)(); // ~3% legendary
  if (roll < 0.12) return randOf(RARE)(); // ~9% rare
  if (roll < 0.4) {
    // ~28% uncommon: simple pattern or a fancier accessory
    return Math.random() < 0.4
      ? { body: bodyColor(), beak: ORANGE_BEAK, acc: "none", pattern: randOf(SIMPLE_PATTERNS) }
      : withAcc(randOf(UNCOMMON_ACC));
  }
  return withAcc(randOf(COMMON_ACC)); // ~60% common
}
