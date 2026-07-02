// Skin model for the rubber ducks: a variant combines a body color, a beak,
// an optional body pattern, an optional head/face accessory, and an optional
// animated effect rendered at draw time by PixelPool.

export type Accessory =
  | "none"
  | "shades"
  | "pirate"
  | "crown"
  | "party"
  | "tophat"
  | "sunhat"
  | "flower"
  | "snorkel"
  | "bowtie"
  | "headphones"
  | "beanie"
  | "wizard"
  | "viking"
  | "chef"
  | "cowboy"
  | "propeller"
  | "halo"
  | "devil"
  | "antlers"
  | "monocle"
  | "mustache"
  | "scarf"
  | "antenna"
  | "cape"
  | "feather"
  | "laurel";

export type Pattern =
  | "spots"
  | "stripes"
  | "polka"
  | "rainbow"
  | "gold"
  | "galaxy"
  | "zombie"
  | "metal"
  | "abyss";

export type Effect =
  | "glow"
  | "ghost"
  | "sparkle"
  | "bubbles"
  | "prismatic"
  | "golden"
  | "ooze"
  | "electric"
  | "royal"
  | "fire"
  | "frost"
  | "nova"
  | "godly";

export interface Variant {
  body: string;
  beak: string;
  acc: Accessory;
  accColor?: string;
  pattern?: Pattern;
  effect?: Effect;
  shiny?: boolean; // rare alternate look: iridescent recolor + twinkles, any species can roll it
}
