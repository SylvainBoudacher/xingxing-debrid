import { BODY_COLOR_COUNT, kingVariant, type Rarity } from "./duckRandom";
import type { Variant } from "./duckTypes";

// The Canardex catalog: every look randomVariant() can produce, collapsed into
// a "species" (body color and accessory color are cosmetic and don't split a
// species). 42 entries total. speciesOf() maps a concrete Variant back to its
// species id, mirroring the priority order of getRarity().

export interface DuckSpecies {
  id: string;
  name: string;
  rarity: Rarity;
  preview: Variant; // representative skin drawn on the dex card
  maxColors: number; // distinct body colors collectable (1 = fixed-body recipe)
}

const YELLOW = "#FFD21E";
const BEAK = "#F5811F";
const FULL = BODY_COLOR_COUNT;

function sp(
  id: string,
  name: string,
  rarity: Rarity,
  preview: Variant,
  maxColors = FULL,
): DuckSpecies {
  return { id, name, rarity, preview, maxColors };
}

export const SPECIES: DuckSpecies[] = [
  // commons
  sp("classique", "Canard Classique", "common", { body: YELLOW, beak: BEAK, acc: "none" }),
  // charcoal shades reads as the Ninja, so one body color is off the table
  sp("shades", "Canard Cool", "common", { body: YELLOW, beak: BEAK, acc: "shades" }, FULL - 1),
  sp("bowtie", "Canard Chic", "common", {
    body: YELLOW,
    beak: BEAK,
    acc: "bowtie",
    accColor: "#E0457B",
  }),
  sp("sunhat", "Canard Estival", "common", {
    body: YELLOW,
    beak: BEAK,
    acc: "sunhat",
    accColor: "#FFE066",
  }),
  sp("flower", "Canard Fleuri", "common", {
    body: YELLOW,
    beak: BEAK,
    acc: "flower",
    accColor: "#FB7185",
  }),
  sp("scarf", "Canard Douillet", "common", {
    body: YELLOW,
    beak: BEAK,
    acc: "scarf",
    accColor: "#5B8DEF",
  }),
  sp("headphones", "Canard Mélomane", "common", {
    body: YELLOW,
    beak: BEAK,
    acc: "headphones",
    accColor: "#A78BFA",
  }),
  sp("monocle", "Canard Distingué", "common", {
    body: YELLOW,
    beak: BEAK,
    acc: "monocle",
    accColor: "#8B5A2B",
  }),
  // uncommons
  sp("spots", "Canard Tacheté", "uncommon", {
    body: YELLOW,
    beak: BEAK,
    acc: "none",
    pattern: "spots",
  }),
  sp("stripes", "Canard Rayé", "uncommon", {
    body: YELLOW,
    beak: BEAK,
    acc: "none",
    pattern: "stripes",
  }),
  sp("polka", "Canard à Pois", "uncommon", {
    body: YELLOW,
    beak: BEAK,
    acc: "none",
    pattern: "polka",
  }),
  sp("crown", "Canard Prince", "uncommon", {
    body: YELLOW,
    beak: BEAK,
    acc: "crown",
    accColor: "#FFE066",
  }),
  sp("party", "Canard Fêtard", "uncommon", {
    body: YELLOW,
    beak: BEAK,
    acc: "party",
    accColor: "#FB7185",
  }),
  sp("tophat", "Canard Gentleman", "uncommon", {
    body: YELLOW,
    beak: BEAK,
    acc: "tophat",
    accColor: "#5B8DEF",
  }),
  sp("beanie", "Canard Urbain", "uncommon", {
    body: YELLOW,
    beak: BEAK,
    acc: "beanie",
    accColor: "#3FD0C8",
  }),
  sp("cowboy", "Canard Cowboy", "uncommon", {
    body: YELLOW,
    beak: BEAK,
    acc: "cowboy",
    accColor: "#8B5A2B",
  }),
  sp("chef", "Canard Cuistot", "uncommon", { body: YELLOW, beak: BEAK, acc: "chef" }),
  sp("antlers", "Canard des Bois", "uncommon", { body: YELLOW, beak: BEAK, acc: "antlers" }),
  sp("propeller", "Canard Volant", "uncommon", {
    body: YELLOW,
    beak: BEAK,
    acc: "propeller",
    accColor: "#4FB0F0",
  }),
  // rares
  sp("halo", "Canard Céleste", "rare", { body: YELLOW, beak: BEAK, acc: "halo", effect: "glow" }),
  // teal snorkel reads as the Surfer, so one body color is off the table
  sp(
    "snorkel",
    "Canard Plongeur",
    "rare",
    { body: YELLOW, beak: BEAK, acc: "snorkel", effect: "bubbles" },
    FULL - 1,
  ),
  sp("wizard", "Canard Sorcier", "rare", {
    body: YELLOW,
    beak: BEAK,
    acc: "wizard",
    accColor: "#A78BFA",
  }),
  sp("viking", "Canard Viking", "rare", { body: YELLOW, beak: BEAK, acc: "viking" }),
  sp("pirate", "Canard Pirate", "rare", { body: YELLOW, beak: "#2A2A2A", acc: "pirate" }, 1),
  sp("devil", "Canard Diablotin", "rare", { body: "#F0584E", beak: BEAK, acc: "devil" }, 1),
  sp("aura", "Canard Lumineux", "rare", { body: YELLOW, beak: BEAK, acc: "none", effect: "glow" }),
  // legendaries (fixed recipes)
  sp(
    "arcenciel",
    "Canard Arc-en-ciel",
    "legendary",
    { body: YELLOW, beak: BEAK, acc: "none", pattern: "rainbow", effect: "prismatic" },
    1,
  ),
  sp(
    "dore",
    "Canard Doré",
    "legendary",
    {
      body: "#F5C518",
      beak: BEAK,
      acc: "crown",
      accColor: "#FFF0A0",
      pattern: "gold",
      effect: "golden",
    },
    1,
  ),
  sp(
    "galaxie",
    "Canard Galaxie",
    "legendary",
    { body: "#2A2150", beak: "#C9A8FF", acc: "none", pattern: "galaxy", effect: "sparkle" },
    1,
  ),
  sp(
    "fantome",
    "Canard Fantôme",
    "legendary",
    { body: "#A7C7FF", beak: "#E8A0C0", acc: "none", effect: "ghost" },
    1,
  ),
  sp(
    "zombie",
    "Canard Zombie",
    "legendary",
    { body: "#7BB85A", beak: "#5A7A3A", acc: "none", pattern: "zombie", effect: "ooze" },
    1,
  ),
  sp(
    "robot",
    "Canard Robot",
    "legendary",
    { body: "#AEB6BF", beak: "#7A828B", acc: "antenna", pattern: "metal", effect: "electric" },
    1,
  ),
  // mythic
  sp("roi", "Le Roi des Canards", "mythic", kingVariant(), 1),
  // new commons
  sp("mustache", "Canard Moustachu", "common", { body: YELLOW, beak: BEAK, acc: "mustache" }),
  // new uncommons
  sp("ninja", "Canard Ninja", "uncommon", { body: "#4A5568", beak: BEAK, acc: "shades" }, 1),
  sp("superhero", "Canard Super-Heros", "uncommon", {
    body: YELLOW,
    beak: BEAK,
    acc: "cape",
    accColor: "#E0457B",
  }),
  // new rares
  sp(
    "surfer",
    "Canard Surfer",
    "rare",
    {
      body: "#3FD0C8",
      beak: BEAK,
      acc: "snorkel",
      effect: "bubbles",
    },
    1,
  ),
  sp(
    "vampire",
    "Canard Vampire",
    "rare",
    {
      body: "#300010",
      beak: BEAK,
      acc: "cape",
      accColor: "#1A0008",
      effect: "glow",
    },
    1,
  ),
  sp("chamane", "Canard Chamane", "rare", { body: YELLOW, beak: BEAK, acc: "feather" }),
  sp(
    "glacial",
    "Canard Glacial",
    "rare",
    {
      body: "#B8E0FF",
      beak: "#8DB5D0",
      acc: "none",
      effect: "frost",
    },
    1,
  ),
  // new legendaries
  sp(
    "infernal",
    "Canard Infernal",
    "legendary",
    {
      body: "#FF3D00",
      beak: BEAK,
      acc: "devil",
      effect: "fire",
    },
    1,
  ),
  sp(
    "abyssal",
    "Canard Abyssal",
    "legendary",
    {
      body: "#050F1E",
      beak: "#1A3A5A",
      acc: "none",
      pattern: "abyss",
      effect: "bubbles",
    },
    1,
  ),
];

export const SPECIES_BY_ID = new Map(SPECIES.map((s) => [s.id, s]));

const ACC_SPECIES = new Set([
  "shades",
  "bowtie",
  "sunhat",
  "flower",
  "scarf",
  "headphones",
  "monocle",
  "mustache",
  "crown",
  "party",
  "tophat",
  "beanie",
  "cowboy",
  "chef",
  "antlers",
  "propeller",
  "cape",
  "feather",
]);

export function speciesOf(v: Variant): string {
  if (v.effect === "royal") return "roi";
  if (v.pattern === "rainbow") return "arcenciel";
  if (v.pattern === "gold") return "dore";
  if (v.pattern === "galaxy") return "galaxie";
  if (v.pattern === "zombie") return "zombie";
  if (v.pattern === "metal") return "robot";
  if (v.pattern === "abyss") return "abyssal";
  if (v.effect === "fire") return "infernal";
  if (v.effect === "frost") return "glacial";
  if (v.effect === "ghost") return "fantome";
  switch (v.acc) {
    case "halo":
      return "halo";
    case "snorkel":
      return v.body === "#3FD0C8" ? "surfer" : "snorkel";
    case "wizard":
      return "wizard";
    case "viking":
      return "viking";
    case "pirate":
      return "pirate";
    case "devil":
      return "devil";
    case "feather":
      return "chamane";
    case "cape":
      return v.body === "#300010" ? "vampire" : "superhero";
  }
  if (v.effect === "glow") return "aura";
  if (v.body === "#4A5568" && v.acc === "shades") return "ninja";
  if (v.pattern === "spots") return "spots";
  if (v.pattern === "stripes") return "stripes";
  if (v.pattern === "polka") return "polka";
  if (ACC_SPECIES.has(v.acc)) return v.acc;
  return "classique";
}
