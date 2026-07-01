import type { Accessory, Effect, Pattern, Variant } from "./duckTypes";

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

// number of distinct body colors a colorable species can roll (used by the dex)
export const BODY_COLOR_COUNT = BODY_COLORS.length;

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
  "cape",
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
  "mustache",
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
  "cape",
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
  () => ({
    body: "#FFD21E",
    beak: ORANGE_BEAK,
    acc: "none",
    pattern: "rainbow",
    effect: "prismatic",
  }),
  () => ({
    body: "#F5C518",
    beak: ORANGE_BEAK,
    acc: "crown",
    accColor: "#FFF0A0",
    pattern: "gold",
    effect: "golden",
  }),
  () => ({ body: "#2A2150", beak: "#C9A8FF", acc: "none", pattern: "galaxy", effect: "sparkle" }),
  () => ({ body: "#A7C7FF", beak: "#E8A0C0", acc: "none", effect: "ghost" }),
  () => ({ body: "#7BB85A", beak: "#5A7A3A", acc: "none", pattern: "zombie", effect: "ooze" }),
  () => ({
    body: "#AEB6BF",
    beak: "#7A828B",
    acc: "antenna",
    pattern: "metal",
    effect: "electric",
  }),
  () => ({ body: "#FF3D00", beak: ORANGE_BEAK, acc: "devil", effect: "fire" }),
  () => ({ body: "#050F1E", beak: "#1A3A5A", acc: "none", pattern: "abyss", effect: "bubbles" }),
];

const RARE: (() => Variant)[] = [
  () => ({ body: bodyColor(), beak: ORANGE_BEAK, acc: "halo", effect: "glow" }),
  () => ({ body: bodyColor(), beak: ORANGE_BEAK, acc: "snorkel", effect: "bubbles" }),
  () => withAcc("wizard"),
  () => ({ body: bodyColor(), beak: ORANGE_BEAK, acc: "viking" }),
  () => ({ body: "#FFD21E", beak: "#2A2A2A", acc: "pirate" }),
  () => ({ body: "#F0584E", beak: ORANGE_BEAK, acc: "devil" }),
  () => ({ body: bodyColor(), beak: ORANGE_BEAK, acc: "none", effect: "glow" }),
  () => ({ body: "#3FD0C8", beak: ORANGE_BEAK, acc: "snorkel", effect: "bubbles" }),
  () => ({ body: "#300010", beak: ORANGE_BEAK, acc: "cape", accColor: "#1A0008", effect: "glow" }),
  () => withAcc("feather"),
  () => ({ body: "#B8E0FF", beak: "#8DB5D0", acc: "none", effect: "frost" }),
];

export type Rarity = "mythic" | "legendary" | "rare" | "uncommon" | "common";

// The king of ducks: a single ultra-legendary skin. Bigger, golden, crowned and
// wrapped in a royal shine. PixelPool spawns it at a larger scale (see spawnDuck).
export function kingVariant(): Variant {
  return {
    body: "#F5C518",
    beak: ORANGE_BEAK,
    acc: "crown",
    accColor: "#FFE96B",
    pattern: "gold",
    effect: "royal",
  };
}

const LEGENDARY_EFFECTS = new Set<Effect>([
  "ghost",
  "sparkle",
  "prismatic",
  "golden",
  "ooze",
  "electric",
  "fire",
]);
const LEGENDARY_PATTERNS = new Set<Pattern>([
  "rainbow",
  "gold",
  "galaxy",
  "zombie",
  "metal",
  "abyss",
]);
const RARE_EFFECTS = new Set<Effect>(["glow", "bubbles", "frost"]);
const RARE_ACC = new Set<Accessory>([
  "wizard",
  "viking",
  "pirate",
  "devil",
  "halo",
  "snorkel",
  "feather",
]);
const UNCOMMON_PATTERNS = new Set<Pattern>(["spots", "stripes", "polka"]);
const UNCOMMON_ACC_SET = new Set<Accessory>([
  "crown",
  "party",
  "tophat",
  "beanie",
  "cowboy",
  "chef",
  "antlers",
  "propeller",
  "cape",
]);

export function getRarity(v: Variant): Rarity {
  if (v.effect === "royal" || v.effect === "nova" || v.effect === "godly") return "mythic";
  if (
    (v.pattern && LEGENDARY_PATTERNS.has(v.pattern)) ||
    (v.effect && LEGENDARY_EFFECTS.has(v.effect))
  )
    return "legendary";
  if ((v.effect && RARE_EFFECTS.has(v.effect)) || RARE_ACC.has(v.acc)) return "rare";
  if ((v.pattern && UNCOMMON_PATTERNS.has(v.pattern)) || UNCOMMON_ACC_SET.has(v.acc))
    return "uncommon";
  if (v.body === "#4A5568" && v.acc === "shades") return "uncommon";
  return "common";
}

export function randomLegendaryVariant(): Variant {
  return randOf(LEGENDARY)();
}

// chance for any spawn to roll shiny, independent of its rarity tier
const SHINY_RATE = 0.07;

export function randomVariant(): Variant {
  const roll = Math.random();
  let v: Variant;
  if (roll < 0.01)
    v = kingVariant(); // 1% ultra-legendary king
  else if (roll < 0.04)
    v = randOf(LEGENDARY)(); // ~3% legendary
  else if (roll < 0.13)
    v = randOf(RARE)(); // ~9% rare
  else if (roll < 0.41) {
    // ~28% uncommon: simple pattern or a fancier accessory
    v =
      Math.random() < 0.4
        ? { body: bodyColor(), beak: ORANGE_BEAK, acc: "none", pattern: randOf(SIMPLE_PATTERNS) }
        : withAcc(randOf(UNCOMMON_ACC));
  } else v = withAcc(randOf(COMMON_ACC)); // ~60% common
  if (Math.random() < SHINY_RATE) v.shiny = true;
  return v;
}
